# Loop Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The loop kit records structured events and streams each session, and a local page shows every loop's state, the live session, costs and the queue, with an "add task" form.

**Architecture:** Piece 1 adds `emit.py` to the kit and makes `loop.sh`/`overnight.sh` append JSON events to `<LOG_DIR>/events.jsonl`, with sessions run as `--output-format stream-json` so the iteration file grows live. Piece 2 is a standard-library Python package `tools/loop/dashboard/` (discovery, events, tail, queue, HTTP+SSE server) serving one static `index.html`; it reads files only, binds to 127.0.0.1, and its single write is appending a task line.

**Tech Stack:** bash (Git Bash on Windows), Python 3.13 standard library only (`json`, `pathlib`, `http.server`, `threading`, `unittest`), one HTML file with inline CSS/JS and `EventSource`. No npm, no pip.

**Spec:** `docs/superpowers/specs/2026-10-05-loop-dashboard-design.md`

## Global Constraints

- Python standard library only; no third-party package anywhere in `tools/loop/`.
- Every `python` invocation in the kit goes through `"$PYTHON"` (default `python`), as the kit does today.
- The batch log's prose lines stay byte-identical: `=== iteration N (ts) ===`, `    task: …`, `    model: …`, `cost: $…`, `=== iteration N took M min (commit) ===`, `Gate FAILED after iteration N (…). Leaving the tree as-is for review.`, `No unchecked tasks. Done.`, `Reached max iterations (N).` (`notify.py` and `overnight.sh` grep them).
- `iter_log.py` keeps writing `iter-N-<ts>.log` as report text, then `--- stderr ---` and the stderr, and keeps printing exactly one `cost: …` line.
- The dashboard binds to `127.0.0.1` only. Nothing in `config.sh` is executed by the dashboard.
- All `$` figures shown by the dashboard are labelled "API-equivalent" (once per view).
- Commits: Alex is the sole author; no `Co-Authored-By` or AI trailer (global CLAUDE.md).
- Files are UTF-8 with LF line endings; `events.jsonl` and task lines are written with `newline="\n"`.
- No test may call the real `claude` or any model; tests use the fake `claude` on `PATH`.

## Review Focus

1. A task line whose text contains double quotes, backslashes or `$` reaches `events.jsonl` intact and parseable (Task 1 tests `test_quotes_and_backslashes`; Task 3 `test_task_text_with_quotes`).
2. A stream file cut off mid-line (session killed) must not break the tail or the cost line: the partial last line is ignored until it is completed (Task 2 `test_partial_last_line_is_ignored` and `test_no_result_line`; Task 6 `test_offset_resumes_and_partial_line_waits`; Task 7 `test_partial_last_line_ignored`).
3. Two iterations with the same number in different runs (`run` differs) must not be merged (Task 6 `test_same_iteration_number_two_runs`).
4. A loop checkout whose `TASKS.md` is missing or whose `git` fails must still appear on the board with warnings, not vanish (Task 5 `test_missing_tasks_file`, `test_git_failure_gives_question_mark_branch`; Task 9 `test_loops_snapshot` checks beta's warnings).
5. Two submits of the same add-task form (double click) must not append the line twice (Task 8 `test_duplicate_id_refused`; Task 9 `test_queue_info_and_post_task` posts the same id twice and expects 409 `duplicate`; the form also disables its button while a submit is in flight).

---

## File structure

```
tools/loop/
  emit.py                      NEW   append one event line (stdlib)
  iter_log.py                  MOD   read stream-json; --kv prints key=value fields
  loop.sh                      MOD   stream-json, emit(), stop(), run_gate(), finish_iter()
  overnight.sh                 MOD   exports LOOP_RUN/LOOP_MODE, run-scope events, sleep override
  launch.sh                    MOD   copies emit.py; writes VERSION into the snapshot
  README.md                    MOD   events + dashboard sections
  tests/
    fake-claude/claude         NEW   bash script replaying a canned stream
    streams/success.jsonl      NEW   fixtures (success, no-result, usage-limit, api-error)
    streams/no-result.jsonl
    streams/usage-limit.jsonl
    streams/api-error.jsonl
    test_emit.py               NEW
    test_iter_log.py           NEW
    test_loop_sh.py            NEW   runs loop.sh and overnight.sh against a temp repo
  dashboard/
    __init__.py                NEW   (empty)
    loops.py                   NEW   discovery + config.sh parsing + branch
    events.py                  NEW   events.jsonl reader, iterations join, state, totals
    tail.py                    NEW   stream-json → tail entries
    queue.py                   NEW   TASKS.md parsing, id suggestion, line composition, append
    server.py                  NEW   HTTP routes, SSE, watcher thread, `main()`
    index.html                 NEW   the page
    tests/
      __init__.py              NEW   (empty)
      fixtures/…               NEW   a fake root with two loop checkouts
      test_loops.py            NEW
      test_events.py           NEW
      test_tail.py             NEW
      test_queue.py            NEW
      test_server.py           NEW
```

Run all Python tests from the repo root with `python -m unittest discover -s tools/loop -p "test_*.py" -v` (both `tools/loop/tests` and `tools/loop/dashboard/tests` are packages, so discovery from `tools/loop` finds both; `tools/loop/tests/__init__.py` is created in Task 1).

---

### Task 1: `emit.py`

**Files:**
- Create: `tools/loop/emit.py`
- Create: `tools/loop/tests/__init__.py` (empty)
- Test: `tools/loop/tests/test_emit.py`

**Interfaces:**
- Produces: CLI `python emit.py <event> [key=value ...]`; env `LOOP_NAME`, `LOG_DIR` (default `logs`), `LOOP_RUN`; appends `{"ts","loop","run","event",...}` to `$LOG_DIR/events.jsonl`. Also importable: `coerce(value: str) -> object`, `record(event: str, pairs: list[str], env: Mapping) -> dict`.

- [ ] **Step 1: Write the failing tests**

```python
# tools/loop/tests/test_emit.py
import json, os, subprocess, sys, tempfile, unittest
from pathlib import Path

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT))
import emit  # noqa: E402


class CoerceTests(unittest.TestCase):
    def test_types(self):
        self.assertIs(emit.coerce("true"), True)
        self.assertIs(emit.coerce("false"), False)
        self.assertIsNone(emit.coerce("null"))
        self.assertEqual(emit.coerce("3"), 3)
        self.assertEqual(emit.coerce("2.41"), 2.41)
        self.assertEqual(emit.coerce("a81f2c0 fix"), "a81f2c0 fix")
        self.assertEqual(emit.coerce("007"), "007")  # leading zero stays text (a task id)


class RecordTests(unittest.TestCase):
    def test_record_fields(self):
        env = {"LOOP_NAME": "RiftMind", "LOG_DIR": "logs", "LOOP_RUN": "20261005-221100"}
        rec = emit.record("iteration_started", ["i=3", "task=T215 Deflect", "model=claude-opus-5-5"], env)
        self.assertEqual(rec["loop"], "RiftMind")
        self.assertEqual(rec["run"], "20261005-221100")
        self.assertEqual(rec["event"], "iteration_started")
        self.assertEqual(rec["i"], 3)
        self.assertEqual(rec["task"], "T215 Deflect")
        self.assertRegex(rec["ts"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")

    def test_value_may_contain_equals(self):
        rec = emit.record("x", ["reason=a=b"], {})
        self.assertEqual(rec["reason"], "a=b")


class CliTests(unittest.TestCase):
    def test_appends_one_line_and_creates_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            env = dict(os.environ, LOOP_NAME="L", LOG_DIR=str(Path(tmp) / "logs" / "loop"), LOOP_RUN="r1")
            for args in (["loop_started", "scope=batch", "max_iter=20"], ["loop_stopped", "code=0", "reason=done"]):
                subprocess.run([sys.executable, str(KIT / "emit.py"), *args], env=env, check=True)
            lines = (Path(tmp) / "logs" / "loop" / "events.jsonl").read_text(encoding="utf-8").splitlines()
            self.assertEqual(len(lines), 2)
            self.assertEqual(json.loads(lines[0])["max_iter"], 20)
            self.assertEqual(json.loads(lines[1])["reason"], "done")

    def test_quotes_and_backslashes(self):
        with tempfile.TemporaryDirectory() as tmp:
            env = dict(os.environ, LOOP_NAME="L", LOG_DIR=tmp, LOOP_RUN="r1")
            task = 'T1 say "hi" C:\\path $HOME 100%'
            subprocess.run([sys.executable, str(KIT / "emit.py"), "iteration_started", "i=1", f"task={task}"], env=env, check=True)
            rec = json.loads((Path(tmp) / "events.jsonl").read_text(encoding="utf-8"))
            self.assertEqual(rec["task"], task)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python -m unittest tools.loop.tests.test_emit -v` from the repo root (or `python -m unittest discover -s tools/loop -p "test_emit.py" -v`)
Expected: FAIL with `ModuleNotFoundError: No module named 'emit'`

- [ ] **Step 3: Write `emit.py`**

```python
"""SnowForge loop kit: append one event to <LOG_DIR>/events.jsonl (2026-10-05).

loop.sh and overnight.sh call this instead of printing JSON from bash, which breaks on task
text with quotes. Usage:

    python emit.py <event> [key=value ...]

Environment: LOOP_NAME (the loop), LOG_DIR (default "logs"), LOOP_RUN (the run id; see loop.sh).
Values: "true"/"false" become booleans, "null" becomes null, an integer or decimal literal
without a leading zero becomes a number, anything else stays a string. A value may contain "=".
Stdlib only. The dashboard (tools/loop/dashboard) reads what this writes.
"""

from __future__ import annotations

import datetime as _dt
import json
import os
import re
import sys
from pathlib import Path
from typing import Mapping

_NUMBER = re.compile(r"^-?(0|[1-9]\d*)(\.\d+)?$")


def coerce(value: str) -> object:
    if value == "true":
        return True
    if value == "false":
        return False
    if value == "null":
        return None
    if _NUMBER.match(value):
        return float(value) if "." in value else int(value)
    return value


def record(event: str, pairs: list[str], env: Mapping[str, str]) -> dict:
    now = _dt.datetime.now(_dt.timezone.utc)
    rec: dict = {
        "ts": now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z",
        "loop": env.get("LOOP_NAME", "?"),
        "run": env.get("LOOP_RUN", ""),
        "event": event,
    }
    for pair in pairs:
        key, _, value = pair.partition("=")
        rec[key] = coerce(value)
    return rec


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: emit.py <event> [key=value ...]", file=sys.stderr)
        return 2
    rec = record(argv[1], argv[2:], os.environ)
    path = Path(os.environ.get("LOG_DIR", "logs")) / "events.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
```

Create the empty `tools/loop/tests/__init__.py`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python -m unittest discover -s tools/loop -p "test_emit.py" -v`
Expected: 5 tests, OK

- [ ] **Step 5: Commit**

```bash
git add tools/loop/emit.py tools/loop/tests/__init__.py tools/loop/tests/test_emit.py
git commit -m "loop kit: emit.py appends structured events to events.jsonl"
```

---

### Task 2: `iter_log.py` reads stream-json

**Files:**
- Modify: `tools/loop/iter_log.py` (whole file; current content is 56 lines, `main(argv)` only)
- Create: `tools/loop/tests/streams/success.jsonl`, `no-result.jsonl`, `usage-limit.jsonl`, `api-error.jsonl`
- Test: `tools/loop/tests/test_iter_log.py`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `parse_stream(raw: str) -> tuple[dict | None, list[str]]` returning the last `result` record (or `None`) and the assistant text blocks seen; `fields(result, text) -> dict` with keys `cost_usd`, `turns`, `duration_ms`, `is_error`, `usage_limit`; CLI `iter_log.py <stream> <stderr> <log>` (unchanged behaviour, prints one `cost: …` line) and `iter_log.py --kv <stream>` printing `cost_usd=… turns=… duration_ms=… is_error=… usage_limit=…` on one line (values never contain spaces). Old single-object JSON output is still accepted.

- [ ] **Step 1: Write the fixtures**

`tools/loop/tests/streams/success.jsonl` (one JSON object per line; the shape Claude Code printed on 2026-10-05):

```json
{"type":"system","subtype":"init","model":"claude-opus-5-5","cwd":"/repo"}
{"type":"system","subtype":"hook_started","hook":"PreToolUse"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Reading the task."}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"t1","name":"Read","input":{"file_path":"/repo/src/riftmind/engine/cost.py"}}]}}
{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"1\tline one\n2\tline two"}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"t2","name":"Bash","input":{"command":"uv run pytest -q tests/engine/test_cost.py\necho done","description":"Run cost tests"}}]}}
{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t2","content":[{"type":"text","text":"42 passed"}]}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Done: T215 checked off and committed."}]}}
{"type":"result","subtype":"success","is_error":false,"num_turns":4,"duration_ms":83000,"total_cost_usd":2.41,"result":"Done: T215 checked off and committed."}
```

`no-result.jsonl`: the first 6 lines of `success.jsonl` (no `result` line, last line complete).

`usage-limit.jsonl`:

```json
{"type":"system","subtype":"init","model":"claude-opus-5-5","cwd":"/repo"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"You've hit your session limit · resets 3am (America/Los_Angeles)"}]}}
{"type":"result","subtype":"success","is_error":false,"num_turns":1,"duration_ms":900,"total_cost_usd":0.0,"result":"You've hit your session limit · resets 3am (America/Los_Angeles)"}
```

`api-error.jsonl`:

```json
{"type":"system","subtype":"init","model":"claude-opus-5-5","cwd":"/repo"}
{"type":"result","subtype":"error_during_execution","is_error":true,"num_turns":0,"duration_ms":400,"total_cost_usd":0.0,"result":"API Error: 401 invalid x-api-key"}
```

- [ ] **Step 2: Write the failing tests**

```python
# tools/loop/tests/test_iter_log.py
import json, subprocess, sys, tempfile, unittest
from pathlib import Path

KIT = Path(__file__).resolve().parents[1]
STREAMS = KIT / "tests" / "streams"
sys.path.insert(0, str(KIT))
import iter_log  # noqa: E402


class ParseStreamTests(unittest.TestCase):
    def test_success_result_and_text(self):
        result, text = iter_log.parse_stream((STREAMS / "success.jsonl").read_text(encoding="utf-8"))
        self.assertEqual(result["total_cost_usd"], 2.41)
        self.assertEqual(text, ["Reading the task.", "Done: T215 checked off and committed."])

    def test_no_result_line(self):
        result, text = iter_log.parse_stream((STREAMS / "no-result.jsonl").read_text(encoding="utf-8"))
        self.assertIsNone(result)
        self.assertEqual(text, ["Reading the task."])

    def test_partial_last_line_is_ignored(self):
        raw = (STREAMS / "success.jsonl").read_text(encoding="utf-8").rstrip("\n")
        raw = raw[: raw.rfind("\n") + 1] + '{"type":"result","total_cost_usd":9'  # cut mid-object
        result, _ = iter_log.parse_stream(raw)
        self.assertIsNone(result)

    def test_old_single_object_format(self):
        raw = json.dumps({"type": "result", "total_cost_usd": 1.5, "num_turns": 3, "duration_ms": 60000, "result": "ok"})
        result, text = iter_log.parse_stream(raw)
        self.assertEqual(result["num_turns"], 3)
        self.assertEqual(text, [])


class FieldsTests(unittest.TestCase):
    def test_fields_success(self):
        result, text = iter_log.parse_stream((STREAMS / "success.jsonl").read_text(encoding="utf-8"))
        self.assertEqual(iter_log.fields(result, text),
                         {"cost_usd": 2.41, "turns": 4, "duration_ms": 83000, "is_error": False, "usage_limit": False})

    def test_fields_usage_limit(self):
        result, text = iter_log.parse_stream((STREAMS / "usage-limit.jsonl").read_text(encoding="utf-8"))
        self.assertTrue(iter_log.fields(result, text)["usage_limit"])

    def test_fields_none(self):
        self.assertEqual(iter_log.fields(None, []),
                         {"cost_usd": None, "turns": None, "duration_ms": None, "is_error": False, "usage_limit": False})


class CliTests(unittest.TestCase):
    def run_cli(self, stream: str, stderr_text: str = "") -> tuple[str, str]:
        with tempfile.TemporaryDirectory() as tmp:
            err = Path(tmp) / "x.err"; err.write_text(stderr_text, encoding="utf-8")
            log = Path(tmp) / "x.log"
            out = subprocess.run([sys.executable, str(KIT / "iter_log.py"), str(STREAMS / stream), str(err), str(log)],
                                 capture_output=True, text=True, check=True).stdout.strip()
            return out, log.read_text(encoding="utf-8")

    def test_cost_line_and_log(self):
        out, log = self.run_cli("success.jsonl", "warn: x\n")
        self.assertEqual(out, "cost: $2.41, 4 turns, 1 min")
        self.assertEqual(log, "Done: T215 checked off and committed.\n\n--- stderr ---\nwarn: x\n")

    def test_no_result(self):
        out, log = self.run_cli("no-result.jsonl")
        self.assertEqual(out, "cost: unknown (no result line)")
        self.assertEqual(log, "Reading the task.\n")

    def test_api_error_line(self):
        out, log = self.run_cli("api-error.jsonl")
        self.assertEqual(out, "cost: $0.00, 0 turns, 0 min, is_error")
        self.assertIn("API Error: 401", log)

    def test_kv(self):
        out = subprocess.run([sys.executable, str(KIT / "iter_log.py"), "--kv", str(STREAMS / "usage-limit.jsonl")],
                             capture_output=True, text=True, check=True).stdout.strip()
        self.assertEqual(out, "cost_usd=0.0 turns=1 duration_ms=900 is_error=false usage_limit=true")

    def test_kv_no_result(self):
        out = subprocess.run([sys.executable, str(KIT / "iter_log.py"), "--kv", str(STREAMS / "no-result.jsonl")],
                             capture_output=True, text=True, check=True).stdout.strip()
        self.assertEqual(out, "cost_usd=null turns=null duration_ms=null is_error=false usage_limit=false")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python -m unittest discover -s tools/loop -p "test_iter_log.py" -v`
Expected: FAIL with `AttributeError: module 'iter_log' has no attribute 'parse_stream'`

- [ ] **Step 4: Rewrite `iter_log.py`**

```python
"""Turn one loop iteration's `claude -p --output-format stream-json` output into the iteration log,
and print its cost for the batch log (2026-10-05: stream-json; before, a single JSON object).

The stream is one JSON object per line: system events, assistant and user messages, and a final
`result` line carrying the cost. This writes `<log>` as the report text (the result's `result`,
or, with no result line, the assistant's text blocks) followed by whatever the nested session
wrote to stderr, so everything that read the old text log (the usage-limit grep in loop.sh, a
person) reads the same, and prints one line, `cost: $2.41, 38 turns, 21 min`, that loop.sh
echoes into the batch log. A stream without a result line (a session killed mid-run) says
`cost: unknown (no result line)`. A partial last line (still being written) is ignored.

Usage:
  python iter_log.py <stream.jsonl> <stderr.txt> <log>     write the log, print the cost line
  python iter_log.py --kv <stream.jsonl>                   print key=value fields for emit.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

_LIMIT = re.compile(r"hit your (session|weekly) limit")


def parse_stream(raw: str) -> tuple[dict | None, list[str]]:
    """The last `result` record (or None) and the assistant text blocks, in order."""
    result = None
    text: list[str] = []
    lines = raw.split("\n")
    if raw and not raw.endswith("\n"):
        lines = lines[:-1]  # a partial last line is not finished being written
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if not isinstance(obj, dict):
            continue
        kind = obj.get("type")
        if kind == "result":
            result = obj
        elif kind == "assistant":
            for block in (obj.get("message") or {}).get("content") or []:
                if isinstance(block, dict) and block.get("type") == "text" and block.get("text"):
                    text.append(str(block["text"]))
    if result is None and raw.strip().startswith("{") and "\n" not in raw.strip():
        try:  # the old single-object format
            obj = json.loads(raw)
            if isinstance(obj, dict) and ("total_cost_usd" in obj or "result" in obj):
                result = obj
        except ValueError:
            pass
    return result, text


def fields(result: dict | None, text: list[str]) -> dict:
    report = str((result or {}).get("result") or "") + "\n".join(text)
    cost = (result or {}).get("total_cost_usd")
    turns = (result or {}).get("num_turns")
    ms = (result or {}).get("duration_ms")
    return {
        "cost_usd": float(cost) if isinstance(cost, (int, float)) else None,
        "turns": turns if isinstance(turns, int) else None,
        "duration_ms": int(ms) if isinstance(ms, (int, float)) else None,
        "is_error": bool((result or {}).get("is_error")),
        "usage_limit": bool(_LIMIT.search(report)),
    }


def cost_line(result: dict | None, f: dict) -> str:
    if result is None:
        return "cost: unknown (no result line)"
    parts = []
    if f["cost_usd"] is not None:
        parts.append(f"${f['cost_usd']:.2f}")
    if f["turns"] is not None:
        parts.append(f"{f['turns']} turns")
    if f["duration_ms"] is not None:
        parts.append(f"{f['duration_ms'] // 60000} min")
    if f["is_error"]:
        parts.append("is_error")
    return "cost: " + (", ".join(parts) if parts else "unknown (no cost field)")


def _kv(value: object) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def main(argv: list[str]) -> int:
    if len(argv) >= 3 and argv[1] == "--kv":
        path = Path(argv[2])
        raw = path.read_text(encoding="utf-8", errors="replace") if path.is_file() else ""
        result, text = parse_stream(raw)
        f = fields(result, text)
        print(" ".join(f"{k}={_kv(v)}" for k, v in f.items()))
        return 0
    out_path, err_path, log_path = (Path(p) for p in argv[1:4])
    raw = out_path.read_text(encoding="utf-8", errors="replace") if out_path.is_file() else ""
    err = err_path.read_text(encoding="utf-8", errors="replace") if err_path.is_file() else ""
    result, text = parse_stream(raw)
    report = str(result.get("result") or "") if result is not None else ""
    if not report:
        report = "\n".join(text) if text else raw
    body = report.rstrip("\n") + "\n"
    if err.strip():
        body += "\n--- stderr ---\n" + err.rstrip("\n") + "\n"
    log_path.write_text(body, encoding="utf-8", newline="\n")
    print(cost_line(result, fields(result, text)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python -m unittest discover -s tools/loop -p "test_iter_log.py" -v`
Expected: 12 tests, OK

- [ ] **Step 6: Commit**

```bash
git add tools/loop/iter_log.py tools/loop/tests/streams tools/loop/tests/test_iter_log.py
git commit -m "loop kit: iter_log.py reads stream-json and prints --kv fields"
```

---

### Task 3: `loop.sh` streams sessions and emits events; the fake-claude harness

**Files:**
- Modify: `tools/loop/loop.sh` (lines 37, 39-41, 87-155)
- Modify: `tools/loop/launch.sh:24`
- Create: `tools/loop/tests/fake-claude/claude`
- Test: `tools/loop/tests/test_loop_sh.py`

**Interfaces:**
- Consumes: `emit.py` CLI (Task 1); `iter_log.py --kv` (Task 2).
- Produces: `events.jsonl` with `loop_started{scope=batch}`, `iteration_started`, `session_finished` (`attempt=opus` on the Opus retry only), `gate_finished{attempt=1|retry|opus}`, `iteration_finished`, `loop_stopped{scope=batch}`; the stream file `iter-N-<ts>.jsonl` (and `iter-N-<ts>-opus.jsonl`); env `LOOP_RUN`, `LOOP_MODE` honoured when set by overnight.sh; test-only env `LOOP_GATE_RETRY_SECONDS` (default 60).

- [ ] **Step 1: Write the fake `claude`**

`tools/loop/tests/fake-claude/claude` (no extension; tests copy it to a temp `bin` dir and `chmod 755`):

```bash
#!/usr/bin/env bash
# Fake `claude` for the loop kit's tests: replays a canned stream-json file instead of running a
# session. It never calls a model. Driven by environment variables:
#   FAKE_CLAUDE_STREAM  the stream file to print on stdout
#   FAKE_CLAUDE_SEQ     optional: a file listing stream paths, one per line; each call consumes
#                       the first line (and falls back to FAKE_CLAUDE_STREAM when it is empty)
#   FAKE_CLAUDE_LOG     optional: a file this appends its argv to, so a test can assert the flags
# A stream whose file name contains "success" also does what a real session does: marks the
# first open task in TASKS.md done and commits. A stream named "blocked" writes docs/BLOCKED.md.
set -e
stream="${FAKE_CLAUDE_STREAM:-}"
if [[ -n "${FAKE_CLAUDE_SEQ:-}" && -s "$FAKE_CLAUDE_SEQ" ]]; then
  stream="$(head -n 1 "$FAKE_CLAUDE_SEQ")"
  tail -n +2 "$FAKE_CLAUDE_SEQ" > "$FAKE_CLAUDE_SEQ.tmp" && mv "$FAKE_CLAUDE_SEQ.tmp" "$FAKE_CLAUDE_SEQ"
fi
[[ -n "${FAKE_CLAUDE_LOG:-}" ]] && printf '%s\n' "$*" >> "$FAKE_CLAUDE_LOG"
case "$stream" in
  *success*)
    python - <<'EOF'
import pathlib
p = pathlib.Path("TASKS.md"); s = p.read_text(encoding="utf-8")
p.write_text(s.replace("- [ ]", "- [x]", 1), encoding="utf-8", newline="\n")
EOF
    git add TASKS.md && git commit -q -m "fake session: task done" ;;
  *blocked*)
    mkdir -p docs && echo "need a key from Alex" > docs/BLOCKED.md && git add docs/BLOCKED.md && git commit -q -m "blocked" ;;
esac
cat "$stream"
```

Also create `tools/loop/tests/streams/blocked.jsonl` as a copy of `success.jsonl` (the content does not matter; the name drives the fake).

- [ ] **Step 2: Write the failing tests**

```python
# tools/loop/tests/test_loop_sh.py
"""Runs loop.sh (and, in Task 4, overnight.sh) against a throwaway git repo with a fake `claude`
on PATH. No model is ever called."""
import json, os, shutil, stat, subprocess, sys, tempfile, unittest
from pathlib import Path

KIT = Path(__file__).resolve().parents[1]
STREAMS = KIT / "tests" / "streams"
BASH = shutil.which("bash") or r"C:\Program Files\Git\bin\bash.exe"


def posix(p) -> str:
    return str(p).replace("\\", "/")


TASKS = """# TASKS — Fake

## M1

- [ ] T001 **first task** (Alex, 2026-10-05, "do it"). Exists: nothing. Build: x. Test: y. model:haiku
- [ ] T002 **second "quoted" task** (Alex). Path C:\\\\repo\\\\x. Build: z. model:sonnet
"""


class LoopRepo:
    def __init__(self, tier_default="sonnet", branch="loop", require_non_main=1, tasks=TASKS):
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name) / "repo"
        self.repo.mkdir()
        self.bin = Path(self.tmp.name) / "bin"
        self.bin.mkdir()
        fake = self.bin / "claude"
        shutil.copy(KIT / "tests" / "fake-claude" / "claude", fake)
        fake.chmod(fake.stat().st_mode | stat.S_IEXEC)
        self.git("init", "-q", "-b", branch)
        self.git("config", "user.email", "t@example.com")
        self.git("config", "user.name", "Test")
        (self.repo / "TASKS.md").write_text(tasks, encoding="utf-8", newline="\n")
        (self.repo / ".gitignore").write_text("logs/\n", encoding="utf-8")
        loop = self.repo / ".loop"
        loop.mkdir()
        (loop / "config.sh").write_text(
            f'LOOP_NAME="Fake"\nLOG_DIR="logs"\nDEFAULT_TIER="{tier_default}"\nREQUIRE_NON_MAIN={require_non_main}\n'
            f'PYTHON="{posix(sys.executable)}"\nGATE_WORDS="the gate"\ngate() {{ bash .loop/gate.sh; }}\n',
            encoding="utf-8", newline="\n")
        (loop / "gate.sh").write_text(
            'if [[ -f .loop/gate-fail ]]; then n=$(cat .loop/gate-fail); if (( n > 0 )); then '
            'echo $((n-1)) > .loop/gate-fail; echo "gate failing"; exit 1; fi; fi\necho "gate ok"\n',
            encoding="utf-8", newline="\n")
        self.git("add", "-A")
        self.git("commit", "-q", "-m", "init")
        self.argv_log = Path(self.tmp.name) / "argv.log"

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.repo, check=True, capture_output=True, text=True).stdout

    def gate_fails(self, n: int):
        (self.repo / ".loop" / "gate-fail").write_text(str(n), encoding="utf-8")

    def run(self, script="loop.sh", args=("2", "25"), stream="success.jsonl", seq=None, extra_env=None):
        env = dict(os.environ)
        env["PATH"] = str(self.bin) + os.pathsep + env["PATH"]
        env["FAKE_CLAUDE_STREAM"] = posix(STREAMS / stream)
        env["FAKE_CLAUDE_LOG"] = posix(self.argv_log)
        env["LOOP_GATE_RETRY_SECONDS"] = "0"
        env["LOOP_TEST_SLEEP_SECONDS"] = "0"
        env["LOOP_NOTIFY_DRY_RUN"] = "1"
        if seq:
            seq_file = Path(self.tmp.name) / "seq.txt"
            seq_file.write_text("\n".join(posix(STREAMS / s) for s in seq) + "\n", encoding="utf-8")
            env["FAKE_CLAUDE_SEQ"] = posix(seq_file)
        env.update(extra_env or {})
        return subprocess.run([BASH, posix(KIT / script), posix(self.repo), *args],
                              cwd=self.repo, env=env, capture_output=True, text=True)

    def events(self):
        path = self.repo / "logs" / "events.jsonl"
        return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]

    def argv_calls(self):
        return self.argv_log.read_text(encoding="utf-8").splitlines() if self.argv_log.exists() else []


class LoopShTests(unittest.TestCase):
    def test_success_two_iterations(self):
        r = LoopRepo()
        p = r.run()
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        kinds = [e["event"] for e in r.events()]
        self.assertEqual(kinds, ["loop_started", "iteration_started", "session_finished", "gate_finished", "iteration_finished",
                                 "iteration_started", "session_finished", "gate_finished", "iteration_finished", "loop_stopped"])
        ev = r.events()
        self.assertEqual(ev[0]["scope"], "batch"); self.assertEqual(ev[0]["mode"], "loop"); self.assertEqual(ev[0]["max_iter"], 2)
        self.assertEqual(ev[0]["branch"], "loop")
        self.assertEqual(ev[1]["task_id"], "T001"); self.assertEqual(ev[1]["tier"], "haiku")
        self.assertEqual(ev[1]["model"], "claude-haiku-4-5-20251001"); self.assertEqual(ev[1]["i"], 1)
        self.assertTrue(ev[1]["stream"].startswith("logs/iter-1-"))
        self.assertEqual(ev[2]["cost_usd"], 2.41); self.assertEqual(ev[2]["turns"], 4); self.assertFalse(ev[2]["usage_limit"])
        self.assertEqual(ev[3]["attempt"], 1); self.assertTrue(ev[3]["ok"]); self.assertTrue(ev[3]["log"].startswith("logs/gate-1-"))
        self.assertTrue(ev[4]["ok"]); self.assertIn("fake session: task done", ev[4]["commit"])
        self.assertEqual(ev[5]["tier"], "sonnet"); self.assertEqual(ev[5]["model"], "claude-sonnet-5")
        self.assertEqual(ev[-1]["code"], 0); self.assertEqual(ev[-1]["scope"], "batch")
        self.assertTrue(all(e["run"] == ev[0]["run"] for e in ev))
        self.assertIn("=== iteration 1 (", p.stdout); self.assertIn("cost: $2.41, 4 turns, 1 min", p.stdout)
        self.assertIn("=== iteration 1 took 0 min (", p.stdout); self.assertIn("Reached max iterations (2).", p.stdout)
        self.assertIn("--output-format stream-json --verbose", r.argv_calls()[0])
        logs = sorted((r.repo / "logs").glob("iter-1-*"))
        self.assertEqual([x.suffix for x in logs], [".err", ".jsonl", ".log"])
        self.assertEqual(logs[2].read_text(encoding="utf-8"), "Done: T215 checked off and committed.\n")

    def test_task_text_with_quotes(self):
        r = LoopRepo()
        p = r.run(args=("2", "25"))
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        second = [e for e in r.events() if e["event"] == "iteration_started"][1]
        self.assertEqual(second["task_id"], "T002")
        self.assertEqual(second["task"], 'T002 second "quoted" task (Alex). Path C:\\\\repo\\\\x. Build: z. model:sonnet')

    def test_queue_empty(self):
        r = LoopRepo(tasks=TASKS.splitlines(keepends=True)[0] + "\n- [ ] T001 **only** (Alex). model:haiku\n")
        p = r.run(args=("3", "25"))
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertIn("No unchecked tasks. Done.", p.stdout)
        last = r.events()[-1]
        self.assertEqual((last["event"], last["code"], last["reason"]), ("loop_stopped", 0, "No unchecked tasks. Done."))

    def test_gate_fails_twice_on_sonnet_then_opus_passes(self):
        r = LoopRepo(tasks=TASKS.replace("model:haiku", "model:sonnet"))
        r.gate_fails(2)
        p = r.run(args=("1", "25"))
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        gates = [(e["attempt"], e["ok"]) for e in r.events() if e["event"] == "gate_finished"]
        self.assertEqual(gates, [(1, False), ("retry", False), ("opus", True)])
        sessions = [e.get("attempt") for e in r.events() if e["event"] == "session_finished"]
        self.assertEqual(sessions, [None, "opus"])
        self.assertTrue([e for e in r.events() if e["event"] == "iteration_finished"][0]["ok"])
        self.assertIn("--model claude-opus-5-5", r.argv_calls()[1])
        self.assertIn("Gate passed after the Opus attempt on iteration 1", p.stdout)
        self.assertTrue(list((r.repo / "logs").glob("iter-1-*-opus.jsonl")))

    def test_gate_fails_on_opus_stops(self):
        r = LoopRepo(tasks=TASKS.replace("model:haiku", "model:opus"))
        r.gate_fails(2)
        p = r.run(args=("2", "25"))
        self.assertEqual(p.returncode, 1, p.stdout + p.stderr)
        self.assertIn("Gate FAILED after iteration 1 (", p.stdout)
        ev = r.events()
        self.assertFalse([e for e in ev if e["event"] == "iteration_finished"][0]["ok"])
        self.assertEqual((ev[-1]["event"], ev[-1]["code"]), ("loop_stopped", 1))

    def test_usage_limit(self):
        r = LoopRepo()
        p = r.run(stream="usage-limit.jsonl")
        self.assertEqual(p.returncode, 3, p.stdout + p.stderr)
        self.assertIn("USAGE LIMIT", p.stdout)
        ev = r.events()
        self.assertTrue([e for e in ev if e["event"] == "session_finished"][0]["usage_limit"])
        self.assertEqual((ev[-1]["event"], ev[-1]["code"]), ("loop_stopped", 3))

    def test_api_error(self):
        r = LoopRepo()
        p = r.run(stream="api-error.jsonl")
        self.assertEqual(p.returncode, 4, p.stdout + p.stderr)
        self.assertEqual(r.events()[-1]["code"], 4)

    def test_blocked(self):
        r = LoopRepo()
        p = r.run(stream="blocked.jsonl", args=("2", "25"))
        self.assertEqual(p.returncode, 2, p.stdout + p.stderr)
        self.assertIn("BLOCKED", p.stdout)
        self.assertEqual(r.events()[-1]["code"], 2)

    def test_refuses_on_main(self):
        r = LoopRepo(branch="main")
        p = r.run()
        self.assertEqual(p.returncode, 5, p.stdout + p.stderr)
        self.assertEqual(r.events()[-1]["code"], 5)

    def test_no_result_stream(self):
        r = LoopRepo()
        p = r.run(stream="no-result.jsonl", args=("1", "25"))
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertIn("cost: unknown (no result line)", p.stdout)
        self.assertIsNone([e for e in r.events() if e["event"] == "session_finished"][0]["cost_usd"])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python -m unittest discover -s tools/loop -p "test_loop_sh.py" -v`
Expected: every test FAILS (no `logs/events.jsonl`: `FileNotFoundError`), and `test_success_two_iterations` also fails on the argv assertion.

- [ ] **Step 4: Edit `loop.sh`**

(a) Replace line 37 (`mkdir -p "$LOG_DIR"`) with:

```bash
mkdir -p "$LOG_DIR"

# --- events for the dashboard (tools/loop/dashboard) --------------------------------------------
# One JSON line per event in $LOG_DIR/events.jsonl, written by emit.py (bash cannot quote task
# text safely). LOOP_RUN groups a run's iterations: overnight.sh sets it for the whole run and
# LOOP_MODE=overnight; a batch run by hand gets its own. stop() records why a batch ended.
LOOP_MODE="${LOOP_MODE:-loop}"
LOOP_RUN="${LOOP_RUN:-$(date +%Y%m%d-%H%M%S)}"
export LOOP_NAME LOG_DIR LOOP_RUN
emit() { "$PYTHON" "$KIT/emit.py" "$@" || echo "emit failed: $*" >&2; }
stop() { emit loop_stopped scope=batch "code=$1" "reason=$2"; exit "$1"; }
emit loop_started scope=batch "mode=$LOOP_MODE" "max_iter=$MAX_ITER" "max_usd=$MAX_USD" \
  "branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')" \
  "kit_version=$(cat "$KIT/VERSION" 2>/dev/null || echo unknown)"
```

(b) Line 40: `echo "Refusing to run on main. Run from the loop worktree (see README.md, 'Branch')."; exit 5` → same echo, then `stop 5 "Refusing to run on main"`.

(c) After the `PROMPT="…"` line (87), add the two helpers:

```bash
run_gate() {  # <attempt> <log>: runs the repo's gate and records the result
  local attempt="$1" log="$2"
  if gate >"$log" 2>&1; then
    emit gate_finished "i=$i" "attempt=$attempt" ok=true "log=$log"; return 0
  fi
  emit gate_finished "i=$i" "attempt=$attempt" ok=false "log=$log"; return 1
}
finish_iter() {  # <ok>: records the iteration; on ok prints the batch log's closing line
  local mins=$(( ($(date +%s) - t0) / 60 )) commit=null
  [[ "$(git rev-parse HEAD)" != "$head0" ]] && commit="$(git log --oneline -1)"
  emit iteration_finished "i=$i" "ok=$1" "minutes=$mins" "commit=$commit"
  [[ "$1" == true ]] && echo "=== iteration $i took $mins min ($(git log --oneline -1)) ==="
}
```

(d) Line 91: `exit 2` → `stop 2 "blocked: docs/BLOCKED.md"`. Line 94: `exit 0` → `stop 0 "No unchecked tasks. Done."`.

(e) After `echo "    model: $MODEL"` (line 106) add:

```bash
  head0=$(git rev-parse HEAD)
  task_line=$(grep -m1 '^- \[ \]' TASKS.md)
  tier=$(task_tag); tier="${tier:-$DEFAULT_TIER}"
  emit iteration_started "i=$i" "task_id=$(printf '%s' "$task_line" | sed -E 's/^- \[ \] *([^ ]+).*/\1/')" \
    "task=$(printf '%s' "$task_line" | sed -E 's/^- \[ \] *//; s/\*\*//g' | cut -c1-200)" \
    "model=$MODEL" "tier=$tier" "stream=$LOG_DIR/iter-$i-$ts.jsonl"
```

(f) The session call (lines 109-116) becomes:

```bash
  claude -p "$PROMPT" \
    --model "$MODEL" \
    --dangerously-skip-permissions \
    --max-budget-usd "$MAX_USD" \
    --output-format stream-json --verbose \
    > "$LOG_DIR/iter-$i-$ts.jsonl" 2> "$LOG_DIR/iter-$i-$ts.err"
  cost=$("$PYTHON" "$KIT/iter_log.py" "$LOG_DIR/iter-$i-$ts.jsonl" "$LOG_DIR/iter-$i-$ts.err" "$LOG_DIR/iter-$i-$ts.log")
  echo "$cost"
  # shellcheck disable=SC2046  # --kv prints space-separated key=value pairs whose values hold no spaces
  emit session_finished "i=$i" $("$PYTHON" "$KIT/iter_log.py" --kv "$LOG_DIR/iter-$i-$ts.jsonl")
```

(g) Line 120: `exit 4` → `stop 4 "API error"`. Line 123: `exit 3` → `stop 3 "usage limit"`.

(h) Replace the gate block from `gate_log="$LOG_DIR/gate-$i-…"` (line 129) through the end of `main` (line 155, `echo "Reached max iterations ($MAX_ITER)."`) with:

```bash
  gate_log="$LOG_DIR/gate-$i-$(date +%Y%m%d-%H%M%S).log"
  if ! run_gate 1 "$gate_log"; then
    echo "Gate failed once after iteration $i ($gate_log); retrying in 60 s"
    sleep "${LOOP_GATE_RETRY_SECONDS:-60}"
    if ! run_gate retry "$gate_log.retry"; then
      if [[ "$MODEL" == *haiku* || "$MODEL" == *sonnet* ]]; then
        echo "Gate failed twice on $MODEL; one Opus attempt at the same task"
        claude -p "The independent gate failed twice after the last iteration on the first unchecked task in TASKS.md; its output is in $gate_log.retry. Read CLAUDE.md, fix the failure, run $GATE_WORDS in the foreground until green, check the task off if it is now done, commit, and stop." \
          --model "$(tier_model opus)" --dangerously-skip-permissions --max-budget-usd "$MAX_USD" \
          --output-format stream-json --verbose > "$LOG_DIR/iter-$i-$ts-opus.jsonl" 2> "$LOG_DIR/iter-$i-$ts-opus.err"
        "$PYTHON" "$KIT/iter_log.py" "$LOG_DIR/iter-$i-$ts-opus.jsonl" "$LOG_DIR/iter-$i-$ts-opus.err" "$LOG_DIR/iter-$i-$ts-opus.log"
        # shellcheck disable=SC2046
        emit session_finished "i=$i" attempt=opus $("$PYTHON" "$KIT/iter_log.py" --kv "$LOG_DIR/iter-$i-$ts-opus.jsonl")
        if run_gate opus "$gate_log.opus"; then
          echo "Gate passed after the Opus attempt on iteration $i"
          finish_iter true
          continue
        fi
      fi
      finish_iter false
      echo "Gate FAILED after iteration $i ($gate_log.retry). Leaving the tree as-is for review."
      stop 1 "gate failed after iteration $i"
    fi
    echo "Gate passed on retry after iteration $i; the first run's output is in $gate_log"
  fi
  if [[ -n "$(git status --porcelain -- . ":!$LOG_DIR")" ]]; then
    echo "Iteration $i left uncommitted changes; the next iteration continues them."
  fi
  finish_iter true
done
echo "Reached max iterations ($MAX_ITER)."
stop 0 "Reached max iterations ($MAX_ITER)"
```

Also update the header comment (line 11 area) to mention `events.jsonl` and `stream-json`:
`# Every batch also appends events to $LOG_DIR/events.jsonl (emit.py) and runs sessions as stream-json, so tools/loop/dashboard can watch it live.`

(i) `launch.sh` line 24: add `"$KIT_SRC"/emit.py` to the `cp` list, and after it:

```bash
git -C "$KIT_SRC" rev-parse --short HEAD > "$SNAP/VERSION" 2>/dev/null || echo unknown > "$SNAP/VERSION"
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python -m unittest discover -s tools/loop -p "test_loop_sh.py" -v`
Expected: 10 tests, OK. If `test_success_two_iterations` fails on `.err/.jsonl/.log` ordering, check that no `.json` file is still written (the old name).

- [ ] **Step 6: Run the whole kit suite and shellcheck**

Run: `python -m unittest discover -s tools/loop -p "test_*.py" -v` → all OK.
Run: `shellcheck tools/loop/loop.sh tools/loop/launch.sh` if shellcheck is installed (`where shellcheck`); otherwise `bash -n tools/loop/loop.sh tools/loop/launch.sh` → no output.

- [ ] **Step 7: Commit**

```bash
git add tools/loop/loop.sh tools/loop/launch.sh tools/loop/tests/fake-claude/claude tools/loop/tests/streams/blocked.jsonl tools/loop/tests/test_loop_sh.py
git update-index --chmod=+x tools/loop/tests/fake-claude/claude
git commit -m "loop kit: sessions stream, loop.sh records events; fake-claude test harness"
```

---

### Task 4: `overnight.sh` run-scope events

**Files:**
- Modify: `tools/loop/overnight.sh` (lines 22-25, 66-72, 81-84)
- Test: `tools/loop/tests/test_loop_sh.py` (add `OvernightTests`)

**Interfaces:**
- Consumes: `emit.py`; `loop.sh` honours `LOOP_RUN`/`LOOP_MODE` (Task 3).
- Produces: `loop_started{scope=run}`, `usage_limit_sleep{seconds, until, message}`, `loop_stopped{scope=run}`, `notice_sent{ok}`; test-only env `LOOP_TEST_SLEEP_SECONDS` (overrides the usage-limit sleep) and `LOOP_NOTIFY_DRY_RUN=1` (passes `--dry-run` to notify.py so no Doppler call).

- [ ] **Step 1: Add the failing tests** (append to `test_loop_sh.py`, before `if __name__`)

```python
class OvernightTests(unittest.TestCase):
    def test_run_events_and_dry_notice(self):
        r = LoopRepo()
        p = r.run(script="overnight.sh", args=("2", "25"))
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        ev = r.events()
        self.assertEqual((ev[0]["event"], ev[0]["scope"], ev[0]["mode"], ev[0]["max_iter"]), ("loop_started", "run", "overnight", 2))
        self.assertEqual((ev[1]["event"], ev[1]["scope"], ev[1]["mode"]), ("loop_started", "batch", "overnight"))
        self.assertEqual(len({e["run"] for e in ev}), 1)
        run_stop = [e for e in ev if e["event"] == "loop_stopped" and e["scope"] == "run"]
        self.assertEqual((run_stop[0]["code"], run_stop[0]["reason"]), (0, "reached 2 iterations"))
        self.assertEqual(ev[-1]["event"], "notice_sent"); self.assertTrue(ev[-1]["ok"])
        self.assertIn("[loop] Fake finished: 2 iterations", p.stdout)  # notify.py --dry-run prints the subject

    def test_usage_limit_sleeps_then_relaunches(self):
        r = LoopRepo()
        p = r.run(script="overnight.sh", args=("1", "25"), seq=["usage-limit.jsonl", "success.jsonl"])
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        ev = r.events()
        kinds = [e["event"] + ("/" + e["scope"] if "scope" in e else "") for e in ev]
        self.assertEqual(kinds, ["loop_started/run", "loop_started/batch", "iteration_started", "session_finished",
                                 "loop_stopped/batch", "usage_limit_sleep", "loop_started/batch", "iteration_started",
                                 "session_finished", "gate_finished", "iteration_finished", "loop_stopped/batch",
                                 "loop_stopped/run", "notice_sent"])
        sleep = ev[5]
        self.assertGreater(sleep["seconds"], 0)
        self.assertRegex(sleep["until"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
        self.assertIn("session limit", sleep["message"])
```

- [ ] **Step 2: Run them to verify they fail**

Run: `python -m unittest discover -s tools/loop -p "test_loop_sh.py" -k Overnight -v`
Expected: FAIL (`ev[0]["scope"]` is `batch`, not `run`; no `usage_limit_sleep` event).

- [ ] **Step 3: Edit `overnight.sh`**

(a) Replace lines 22-25 (`[[ -f .loop/config.sh ]] && source …` through `log() {…}`) with:

```bash
# shellcheck source=/dev/null
[[ -f .loop/config.sh ]] && source .loop/config.sh
mkdir -p "$LOG_DIR"
RUN_LOG="$LOG_DIR/overnight-$(date +%Y%m%d-%H%M%S).log"
log() { echo "[$(date '+%F %T')] $*" | tee -a "$RUN_LOG"; }
# Events for the dashboard: the run id is this log's timestamp; loop.sh inherits it and the mode.
LOOP_RUN="${RUN_LOG##*/overnight-}"; LOOP_RUN="${LOOP_RUN%.log}"
export LOOP_NAME LOG_DIR LOOP_RUN LOOP_MODE=overnight
emit() { "$PYTHON" "$KIT/emit.py" "$@" || log "emit failed: $*"; }
emit loop_started scope=run mode=overnight "max_iter=$TOTAL" "max_usd=$MAX_USD" \
  "branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')" \
  "kit_version=$(cat "$KIT/VERSION" 2>/dev/null || echo unknown)"
```

(b) In the `3)` case (lines 66-72), after the `if wait=… else … fi` block and before `sleep "$wait"`:

```bash
      emit usage_limit_sleep "seconds=$wait" "until=$(date -u -d "@$(( $(date +%s) + wait ))" +%FT%TZ)" "message=$msg"
      sleep "${LOOP_TEST_SLEEP_SECONDS:-$wait}"
```
(replacing the existing `sleep "$wait"`).

(c) Replace lines 81-84 (`(( done_iters >= TOTAL …` through `|| log "the stop notice could not be sent (see above)"`) with:

```bash
(( done_iters >= TOTAL && rc == 0 )) && log "reached $TOTAL iterations."
emit loop_stopped scope=run "code=$rc" "reason=$reason"
notify_args=()
[[ -n "${LOOP_NOTIFY_DRY_RUN:-}" ]] && notify_args+=(--dry-run)
if "$PYTHON" "$KIT/notify.py" --name "$LOOP_NAME" --repo "$REPO" --to "$NOTIFY_TO" \
  --reason "$reason" --code "$rc" --iterations "$done_iters" --log-dir "$LOG_DIR" --run-log "$RUN_LOG" "${notify_args[@]}"; then
  emit notice_sent ok=true
else
  log "the stop notice could not be sent (see above)"; emit notice_sent ok=false
fi
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python -m unittest discover -s tools/loop -p "test_loop_sh.py" -v`
Expected: 12 tests, OK. (`seconds_until_reset` parses "resets 3am" with `date -d`, present in Git Bash's coreutils; if `until` comes out empty the test tells you.)

- [ ] **Step 5: Commit**

```bash
git add tools/loop/overnight.sh tools/loop/tests/test_loop_sh.py
git commit -m "loop kit: overnight.sh records run-scope events and the stop notice"
```

---

### Task 5: dashboard discovery (`loops.py`)

**Files:**
- Create: `tools/loop/dashboard/__init__.py` (empty), `tools/loop/dashboard/tests/__init__.py` (empty)
- Create: `tools/loop/dashboard/loops.py`
- Create: fixtures `tools/loop/dashboard/tests/fixtures/root/alpha/.loop/config.sh`, `…/alpha/TASKS.md`, `…/root/beta/.loop/config.sh` (beta has no `TASKS.md`), `…/root/notaloop/README.md`
- Test: `tools/loop/dashboard/tests/test_loops.py`

**Interfaces:**
- Produces: `parse_config(text: str) -> dict` (keys `LOOP_NAME`, `LOG_DIR` when present); `branch_of(path: Path) -> str` (`"?"` on any failure); `@dataclass Loop(name: str, path: Path, log_dir: Path, branch: str, warnings: list[str])`; `discover(root: Path) -> list[Loop]` sorted by name, duplicate names suffixed `-2`, `-3`.

- [ ] **Step 1: Write the fixtures**

`fixtures/root/alpha/.loop/config.sh`:
```bash
# fixture
LOOP_NAME="Alpha"
LOG_DIR="logs/loop"
DEFAULT_TIER="sonnet"
gate() { pnpm test; }
```
`fixtures/root/alpha/TASKS.md`:
```markdown
# TASKS — Alpha

## M1 — first milestone

- [x] T001 **done one** (Alex). model:haiku
- [ ] T002 **open two** (Alex, 2026-10-05, "please"). Exists: x. Build: y. Test: z. model:opus
- [ ] T003 **open three** (Alex). model:sonnet
- [ ] T004 no bold title here model:haiku
```
`fixtures/root/beta/.loop/config.sh`:
```bash
LOG_DIR="logs"
gate() { true; }
```
`fixtures/root/notaloop/README.md`: one line, `not a loop`.

- [ ] **Step 2: Write the failing tests**

```python
# tools/loop/dashboard/tests/test_loops.py
import unittest
from pathlib import Path
from tools.loop.dashboard import loops

ROOT = Path(__file__).resolve().parent / "fixtures" / "root"


class ParseConfigTests(unittest.TestCase):
    def test_reads_quoted_values_only(self):
        cfg = loops.parse_config('LOOP_NAME="Alpha"\n  LOG_DIR="logs/loop"\ngate() { echo "LOG_DIR=\\"x\\""; }\n')
        self.assertEqual(cfg, {"LOOP_NAME": "Alpha", "LOG_DIR": "logs/loop"})

    def test_missing_keys(self):
        self.assertEqual(loops.parse_config("gate() { true; }\n"), {})


class DiscoverTests(unittest.TestCase):
    def test_finds_loops_and_defaults(self):
        found = loops.discover(ROOT)
        self.assertEqual([l.name for l in found], ["Alpha", "beta"])
        alpha, beta = found
        self.assertEqual(alpha.log_dir, ROOT / "alpha" / "logs" / "loop")
        self.assertEqual(beta.log_dir, ROOT / "beta" / "logs")
        self.assertEqual(beta.name, "beta")  # folder name when LOOP_NAME is absent

    def test_git_failure_gives_question_mark_branch(self):
        # The fixtures sit inside the SnowForge checkout, so git would answer there; copy them out.
        import shutil, tempfile
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "root"
            shutil.copytree(ROOT, root)
            self.assertEqual(loops.branch_of(root / "alpha"), "?")
            self.assertIn("git: not a repository", loops.discover(root)[0].warnings[0])

    def test_missing_tasks_file(self):
        beta = loops.discover(ROOT)[1]
        self.assertIn("TASKS.md missing", beta.warnings)

    def test_duplicate_names(self):
        import tempfile, shutil
        with tempfile.TemporaryDirectory() as tmp:
            for folder in ("one", "two"):
                d = Path(tmp) / folder / ".loop"; d.mkdir(parents=True)
                (d / "config.sh").write_text('LOOP_NAME="Same"\n', encoding="utf-8")
            self.assertEqual([l.name for l in loops.discover(Path(tmp))], ["Same", "Same-2"])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python -m unittest tools.loop.dashboard.tests.test_loops -v` from the repo root
Expected: FAIL with `ModuleNotFoundError: No module named 'tools.loop.dashboard'` (create the two empty `__init__.py` files first if the error names `tools.loop.dashboard.tests`; `tools/` and `tools/loop/` need no `__init__.py`, Python 3 treats them as namespace packages).

- [ ] **Step 4: Write `loops.py`**

```python
"""Find the loops: every checkout under the root with .loop/config.sh.

Nothing in config.sh is executed; LOOP_NAME and LOG_DIR are read by a regex over lines of the
form NAME="value", with the kit's defaults (the folder name, "logs") when absent.
"""

from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

_ASSIGN = re.compile(r'^\s*(LOOP_NAME|LOG_DIR)="([^"]*)"\s*(#.*)?$')


def parse_config(text: str) -> dict:
    found: dict = {}
    for line in text.splitlines():
        match = _ASSIGN.match(line)
        if match:
            found[match.group(1)] = match.group(2)
    return found


def branch_of(path: Path) -> str:
    try:
        out = subprocess.run(["git", "-C", str(path), "rev-parse", "--abbrev-ref", "HEAD"],
                             capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return "?"
    return out.stdout.strip() if out.returncode == 0 and out.stdout.strip() else "?"


@dataclass
class Loop:
    name: str
    path: Path
    log_dir: Path
    branch: str
    warnings: list[str] = field(default_factory=list)


def discover(root: Path) -> list[Loop]:
    loops: list[Loop] = []
    for config in sorted(root.glob("*/.loop/config.sh")):
        checkout = config.parent.parent
        cfg = parse_config(config.read_text(encoding="utf-8", errors="replace"))
        warnings: list[str] = []
        branch = branch_of(checkout)
        if branch == "?":
            warnings.append("git: not a repository or git failed; branch unknown")
        if not (checkout / "TASKS.md").is_file():
            warnings.append("TASKS.md missing")
        loops.append(Loop(name=cfg.get("LOOP_NAME") or checkout.name, path=checkout,
                          log_dir=checkout / cfg.get("LOG_DIR", "logs"), branch=branch, warnings=warnings))
    loops.sort(key=lambda l: l.name.lower())
    seen: dict[str, int] = {}
    for loop in loops:
        n = seen.get(loop.name, 0) + 1
        seen[loop.name] = n
        if n > 1:
            loop.warnings.append(f"another loop is also named {loop.name}; shown as {loop.name}-{n}")
            loop.name = f"{loop.name}-{n}"
    return loops
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python -m unittest tools.loop.dashboard.tests.test_loops -v` → 6 tests, OK

- [ ] **Step 6: Commit**

```bash
git add tools/loop/dashboard/__init__.py tools/loop/dashboard/loops.py tools/loop/dashboard/tests
git commit -m "dashboard: discover loops from .loop/config.sh"
```

---

### Task 6: events, iterations, state and totals (`events.py`)

**Files:**
- Create: `tools/loop/dashboard/events.py`
- Create: fixture `tools/loop/dashboard/tests/fixtures/root/alpha/logs/loop/events.jsonl`
- Test: `tools/loop/dashboard/tests/test_events.py`

**Interfaces:**
- Consumes: the event schema from Tasks 3-4.
- Produces:
  - `read_events(path: Path, offset: int = 0) -> tuple[list[dict], int, int]`: new complete records since `offset`, the new offset, the count of malformed lines skipped. A partial last line (no trailing newline) is not consumed.
  - `parse_ts(ts: str) -> datetime` (aware, UTC).
  - `join_iterations(events) -> list[dict]`: newest first; each `{run, i, task_id, task, model, tier, started, stream, cost_usd, opus_cost_usd, turns, duration_ms, is_error, usage_limit, gates: [{attempt, ok, log}], ok, minutes, commit, finished}` (`None` where unknown; `cost_usd` sums both sessions in `cost`).
  - `current_iteration(events) -> dict | None`: the latest `iteration_started` with no `iteration_finished` for the same `(run, i)`, plus `phase` in `session`, `gate 1`, `gate retry`, `opus session`, `gate opus`, and `started`.
  - `run_summary(events) -> dict | None`: from the latest `loop_started` (`scope=run` preferred over `batch` for the same run): `{run, mode, max_iter, max_usd, started, branch, kit_version}`.
  - `derive_state(events, now: datetime, last_activity: datetime | None, stale_after_s: int = 600) -> dict`: `{state: running|sleeping|stale|stopped|empty, reason, until}`.
  - `totals(iterations, now: datetime, run: str | None) -> dict`: `{run: T, today: T, week: T}` where `T = {cost, count, by_tier: {tier: {cost, count}}}`; `today` is the local calendar day of `now`; `week` is the last 7×24 h.

- [ ] **Step 1: Write the fixture** `fixtures/root/alpha/logs/loop/events.jsonl`

```json
{"ts":"2026-10-05T22:11:00.000Z","loop":"Alpha","run":"20261005-221100","event":"loop_started","scope":"run","mode":"overnight","max_iter":30,"max_usd":25,"branch":"main","kit_version":"9e0e588"}
{"ts":"2026-10-05T22:11:00.200Z","loop":"Alpha","run":"20261005-221100","event":"loop_started","scope":"batch","mode":"overnight","max_iter":30,"max_usd":25,"branch":"main","kit_version":"9e0e588"}
{"ts":"2026-10-05T22:11:01.000Z","loop":"Alpha","run":"20261005-221100","event":"iteration_started","i":1,"task_id":"T213","task":"T213 Reveal action (Alex). model:opus","model":"claude-opus-5-5","tier":"opus","stream":"logs/loop/iter-1-20261005-221101.jsonl"}
{"ts":"2026-10-05T22:27:00.000Z","loop":"Alpha","run":"20261005-221100","event":"session_finished","i":1,"cost_usd":2.02,"turns":29,"duration_ms":959000,"is_error":false,"usage_limit":false}
{"ts":"2026-10-05T22:31:00.000Z","loop":"Alpha","run":"20261005-221100","event":"gate_finished","i":1,"attempt":1,"ok":true,"log":"logs/loop/gate-1-20261005-222700.log"}
{"ts":"2026-10-05T22:31:01.000Z","loop":"Alpha","run":"20261005-221100","event":"iteration_finished","i":1,"ok":true,"minutes":20,"commit":"e03b9a4 T213: Reveal action"}
{"ts":"2026-10-05T22:36:00.000Z","loop":"Alpha","run":"20261005-221100","event":"iteration_started","i":2,"task_id":"T214","task":"T214 Record every Reveal (Alex). model:sonnet","model":"claude-sonnet-5","tier":"sonnet","stream":"logs/loop/iter-2-20261005-223600.jsonl"}
{"ts":"2026-10-05T22:55:00.000Z","loop":"Alpha","run":"20261005-221100","event":"session_finished","i":2,"cost_usd":1.10,"turns":30,"duration_ms":1140000,"is_error":false,"usage_limit":false}
{"ts":"2026-10-05T22:58:00.000Z","loop":"Alpha","run":"20261005-221100","event":"gate_finished","i":2,"attempt":1,"ok":false,"log":"logs/loop/gate-2-20261005-225500.log"}
{"ts":"2026-10-05T23:00:00.000Z","loop":"Alpha","run":"20261005-221100","event":"gate_finished","i":2,"attempt":"retry","ok":false,"log":"logs/loop/gate-2-20261005-225500.log.retry"}
{"ts":"2026-10-05T23:09:00.000Z","loop":"Alpha","run":"20261005-221100","event":"session_finished","i":2,"attempt":"opus","cost_usd":2.31,"turns":17,"duration_ms":540000,"is_error":false,"usage_limit":false}
{"ts":"2026-10-05T23:12:00.000Z","loop":"Alpha","run":"20261005-221100","event":"gate_finished","i":2,"attempt":"opus","ok":true,"log":"logs/loop/gate-2-20261005-225500.log.opus"}
{"ts":"2026-10-05T23:12:01.000Z","loop":"Alpha","run":"20261005-221100","event":"iteration_finished","i":2,"ok":true,"minutes":36,"commit":"a81f2c0 T214: reveals"}
{"ts":"2026-10-05T23:13:00.000Z","loop":"Alpha","run":"20261005-221100","event":"iteration_started","i":3,"task_id":"T215","task":"T215 Deflect cost (Alex). model:opus","model":"claude-opus-5-5","tier":"opus","stream":"logs/loop/iter-3-20261005-231300.jsonl"}
this line is not json
```

(The last line is deliberately malformed and has no trailing newline after it? No: give the file a trailing newline after `this line is not json`; the partial-line case is tested by writing a temp file.)

- [ ] **Step 2: Write the failing tests**

```python
# tools/loop/dashboard/tests/test_events.py
import datetime as dt, json, tempfile, unittest
from pathlib import Path
from tools.loop.dashboard import events

FIX = Path(__file__).resolve().parent / "fixtures" / "root" / "alpha" / "logs" / "loop" / "events.jsonl"
UTC = dt.timezone.utc


def load():
    recs, _, _ = events.read_events(FIX)
    return recs


class ReadTests(unittest.TestCase):
    def test_reads_and_counts_bad_lines(self):
        recs, offset, bad = events.read_events(FIX)
        self.assertEqual(len(recs), 14)
        self.assertEqual(bad, 1)
        self.assertEqual(offset, FIX.stat().st_size)

    def test_offset_resumes_and_partial_line_waits(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "events.jsonl"
            p.write_text('{"event":"a"}\n{"event":"b"', encoding="utf-8")
            recs, off, bad = events.read_events(p)
            self.assertEqual([r["event"] for r in recs], ["a"]); self.assertEqual(bad, 0)
            with p.open("a", encoding="utf-8") as f: f.write('"}\n')
            recs2, off2, _ = events.read_events(p, off)
            self.assertEqual([r["event"] for r in recs2], ["b"]); self.assertEqual(off2, p.stat().st_size)


class IterationTests(unittest.TestCase):
    def test_join(self):
        its = events.join_iterations(load())
        self.assertEqual([i["i"] for i in its], [3, 2, 1])
        two = its[1]
        self.assertEqual(two["task_id"], "T214"); self.assertEqual(two["tier"], "sonnet")
        self.assertEqual(two["cost_usd"], 1.10); self.assertEqual(two["opus_cost_usd"], 2.31)
        self.assertAlmostEqual(two["cost"], 3.41)
        self.assertEqual([(g["attempt"], g["ok"]) for g in two["gates"]], [(1, False), ("retry", False), ("opus", True)])
        self.assertTrue(two["ok"]); self.assertEqual(two["minutes"], 36); self.assertEqual(two["commit"], "a81f2c0 T214: reveals")
        three = its[0]
        self.assertIsNone(three["finished"]); self.assertIsNone(three["cost_usd"]); self.assertEqual(three["cost"], 0.0)

    def test_same_iteration_number_two_runs(self):
        recs = load()
        extra = dict(recs[2], run="20261006-010000", task_id="T299", ts="2026-10-06T01:00:00.000Z")
        its = events.join_iterations(recs + [extra])
        self.assertEqual(len(its), 4)
        self.assertEqual(its[0]["task_id"], "T299")

    def test_current_and_phase(self):
        recs = load()
        cur = events.current_iteration(recs)
        self.assertEqual((cur["i"], cur["task_id"], cur["phase"]), (3, "T215", "session"))
        self.assertEqual(events.current_iteration(recs[:4])["phase"], "gate 1")
        self.assertEqual(events.current_iteration(recs[:10])["phase"], "opus session")
        self.assertEqual(events.current_iteration(recs[:12])["phase"], "gate opus")
        self.assertIsNone(events.current_iteration(recs[:6]))

    def test_run_summary(self):
        s = events.run_summary(load())
        self.assertEqual((s["run"], s["mode"], s["max_iter"], s["branch"]), ("20261005-221100", "overnight", 30, "main"))


class StateTests(unittest.TestCase):
    now = dt.datetime(2026, 10, 5, 23, 20, tzinfo=UTC)

    def test_running_when_recent_activity(self):
        s = events.derive_state(load(), self.now, self.now - dt.timedelta(minutes=2))
        self.assertEqual(s["state"], "running")

    def test_stale_when_quiet(self):
        s = events.derive_state(load(), self.now, self.now - dt.timedelta(minutes=11))
        self.assertEqual(s["state"], "stale")

    def test_stopped(self):
        recs = load() + [{"ts": "2026-10-05T23:19:00.000Z", "event": "loop_stopped", "scope": "run", "code": 1, "reason": "gate failed after iteration 3"}]
        s = events.derive_state(recs, self.now, self.now)
        self.assertEqual((s["state"], s["reason"]), ("stopped", "gate failed after iteration 3"))

    def test_sleeping(self):
        recs = load() + [{"ts": "2026-10-05T23:19:00.000Z", "event": "usage_limit_sleep", "seconds": 7200, "until": "2026-10-06T01:19:00Z", "message": "limit"}]
        s = events.derive_state(recs, self.now, None)
        self.assertEqual((s["state"], s["until"]), ("sleeping", "2026-10-06T01:19:00Z"))
        s2 = events.derive_state(recs, dt.datetime(2026, 10, 6, 2, 0, tzinfo=UTC), None)
        self.assertEqual(s2["state"], "stale")

    def test_empty(self):
        self.assertEqual(events.derive_state([], self.now, None)["state"], "empty")


class TotalsTests(unittest.TestCase):
    def test_totals_by_tier(self):
        its = events.join_iterations(load())
        t = events.totals(its, dt.datetime(2026, 10, 5, 23, 30, tzinfo=UTC), "20261005-221100")
        self.assertEqual(t["run"]["count"], 3)
        self.assertAlmostEqual(t["run"]["cost"], 5.43)
        self.assertAlmostEqual(t["run"]["by_tier"]["opus"]["cost"], 2.02)   # the Opus retry is charged to the sonnet task's tier
        self.assertAlmostEqual(t["run"]["by_tier"]["sonnet"]["cost"], 3.41)
        self.assertEqual(t["week"]["count"], 3)
        far = events.totals(its, dt.datetime(2026, 10, 20, tzinfo=UTC), "x")
        self.assertEqual((far["run"]["count"], far["today"]["count"], far["week"]["count"]), (0, 0, 0))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python -m unittest tools.loop.dashboard.tests.test_events -v` → `ModuleNotFoundError: No module named 'tools.loop.dashboard.events'`

- [ ] **Step 4: Write `events.py`**

```python
"""Read a loop's events.jsonl and derive what the dashboard shows: iterations, the current one,
the run, the state, and cost totals. Pure functions over lists of event dicts; the server owns
file offsets and timing."""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

UTC = dt.timezone.utc


def read_events(path: Path, offset: int = 0) -> tuple[list[dict], int, int]:
    if not path.is_file():
        return [], 0, 0
    with path.open("rb") as handle:
        handle.seek(offset)
        chunk = handle.read()
    end = chunk.rfind(b"\n")
    if end < 0:
        return [], offset, 0
    records: list[dict] = []
    bad = 0
    for raw in chunk[: end + 1].split(b"\n"):
        if not raw.strip():
            continue
        try:
            obj = json.loads(raw.decode("utf-8", errors="replace"))
        except ValueError:
            bad += 1
            continue
        if isinstance(obj, dict) and "event" in obj:
            records.append(obj)
        else:
            bad += 1
    return records, offset + end + 1, bad


def parse_ts(ts: str) -> dt.datetime:
    text = ts.replace("Z", "+00:00")
    return dt.datetime.fromisoformat(text).astimezone(UTC)


def _key(e: dict) -> tuple:
    return (e.get("run", ""), e.get("i"))


def join_iterations(events: list[dict]) -> list[dict]:
    its: dict[tuple, dict] = {}
    order: list[tuple] = []
    for e in events:
        kind = e.get("event")
        if kind not in {"iteration_started", "session_finished", "gate_finished", "iteration_finished"}:
            continue
        k = _key(e)
        if k not in its:
            its[k] = {"run": e.get("run", ""), "i": e.get("i"), "task_id": None, "task": None, "model": None, "tier": None,
                      "started": None, "stream": None, "cost_usd": None, "opus_cost_usd": None, "turns": None,
                      "duration_ms": None, "is_error": False, "usage_limit": False, "gates": [], "ok": None,
                      "minutes": None, "commit": None, "finished": None}
            order.append(k)
        it = its[k]
        if kind == "iteration_started":
            it.update(task_id=e.get("task_id"), task=e.get("task"), model=e.get("model"), tier=e.get("tier"),
                      started=e.get("ts"), stream=e.get("stream"))
        elif kind == "session_finished":
            if e.get("attempt") == "opus":
                it["opus_cost_usd"] = e.get("cost_usd")
            else:
                it.update(cost_usd=e.get("cost_usd"), turns=e.get("turns"), duration_ms=e.get("duration_ms"),
                          is_error=bool(e.get("is_error")), usage_limit=bool(e.get("usage_limit")))
        elif kind == "gate_finished":
            it["gates"].append({"attempt": e.get("attempt"), "ok": bool(e.get("ok")), "log": e.get("log")})
        elif kind == "iteration_finished":
            it.update(ok=bool(e.get("ok")), minutes=e.get("minutes"), commit=e.get("commit"), finished=e.get("ts"))
    out = []
    for k in reversed(order):
        it = its[k]
        it["cost"] = float(it["cost_usd"] or 0.0) + float(it["opus_cost_usd"] or 0.0)
        out.append(it)
    return out


def current_iteration(events: list[dict]) -> dict | None:
    started = [e for e in events if e.get("event") == "iteration_started"]
    if not started:
        return None
    last = started[-1]
    k = _key(last)
    phase = "session"
    for e in events:
        if _key(e) != k:
            continue
        kind = e.get("event")
        if kind == "iteration_finished":
            return None
        if kind == "session_finished":
            phase = "gate opus" if e.get("attempt") == "opus" else "gate 1"
        elif kind == "gate_finished" and not e.get("ok"):
            phase = "gate retry" if e.get("attempt") == 1 else ("opus session" if e.get("attempt") == "retry" else phase)
    return {"run": last.get("run", ""), "i": last.get("i"), "task_id": last.get("task_id"), "task": last.get("task"),
            "model": last.get("model"), "tier": last.get("tier"), "started": last.get("ts"),
            "stream": last.get("stream"), "phase": phase}


def run_summary(events: list[dict]) -> dict | None:
    starts = [e for e in events if e.get("event") == "loop_started"]
    if not starts:
        return None
    run = starts[-1].get("run", "")
    same = [e for e in starts if e.get("run", "") == run]
    best = next((e for e in same if e.get("scope") == "run"), same[0])
    return {"run": run, "mode": best.get("mode"), "max_iter": best.get("max_iter"), "max_usd": best.get("max_usd"),
            "started": best.get("ts"), "branch": best.get("branch"), "kit_version": best.get("kit_version")}


def derive_state(events: list[dict], now: dt.datetime, last_activity: dt.datetime | None,
                 stale_after_s: int = 600) -> dict:
    if not events:
        return {"state": "empty", "reason": "no events yet: starts at this loop's next launch", "until": None}
    last = events[-1]
    kind = last.get("event")
    if kind == "loop_stopped":
        return {"state": "stopped", "reason": str(last.get("reason") or f"exit {last.get('code')}"), "until": None}
    if kind == "usage_limit_sleep":
        until = last.get("until")
        try:
            if until and parse_ts(until) > now:
                return {"state": "sleeping", "reason": str(last.get("message") or "usage limit"), "until": until}
        except ValueError:
            pass
    if last_activity is not None and (now - last_activity).total_seconds() <= stale_after_s:
        return {"state": "running", "reason": None, "until": None}
    return {"state": "stale", "reason": f"no file activity for {stale_after_s // 60} min", "until": None}


def _bucket() -> dict:
    return {"cost": 0.0, "count": 0, "by_tier": {}}


def _add(bucket: dict, it: dict) -> None:
    bucket["cost"] += it["cost"]
    bucket["count"] += 1
    tier = it.get("tier") or "?"
    t = bucket["by_tier"].setdefault(tier, {"cost": 0.0, "count": 0})
    t["cost"] += it["cost"]
    t["count"] += 1


def totals(iterations: list[dict], now: dt.datetime, run: str | None) -> dict:
    out = {"run": _bucket(), "today": _bucket(), "week": _bucket()}
    local_day = now.astimezone().date()
    for it in iterations:
        if not it.get("started"):
            continue
        started = parse_ts(it["started"])
        if run and it["run"] == run:
            _add(out["run"], it)
        if started.astimezone().date() == local_day:
            _add(out["today"], it)
        if (now - started).total_seconds() <= 7 * 86400 and started <= now:
            _add(out["week"], it)
    return out
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python -m unittest tools.loop.dashboard.tests.test_events -v` → 13 tests, OK. (`test_totals_by_tier`'s `today` count depends on the machine's local day; the assertion only checks `run` and `week`, which is intended.)

- [ ] **Step 6: Commit**

```bash
git add tools/loop/dashboard/events.py tools/loop/dashboard/tests/test_events.py tools/loop/dashboard/tests/fixtures
git commit -m "dashboard: events reader, iterations, state and totals"
```

---

### Task 7: session tail rendering (`tail.py`)

**Files:**
- Create: `tools/loop/dashboard/tail.py`
- Create: fixture `tools/loop/dashboard/tests/fixtures/root/alpha/logs/loop/iter-3-20261005-231300.jsonl` (a copy of `tools/loop/tests/streams/success.jsonl` with one extra `system` line: `{"type":"system","subtype":"thinking_tokens","tokens":120}` inserted after the init line)
- Test: `tools/loop/dashboard/tests/test_tail.py`

**Interfaces:**
- Produces:
  - `split_complete(chunk: bytes) -> tuple[list[str], int]`: the complete lines in `chunk` and the bytes consumed (a trailing partial line is left for next time).
  - `summarize_tool(name: str, inp: dict, repo: Path) -> str`.
  - `render_line(line: str, repo: Path, stamp: str) -> list[dict]`: zero or more entries `{t, kind, text, hidden}` for one stream line.
  - `bootstrap(path: Path, repo: Path, limit: int = 300) -> list[dict]`: the last `limit` entries of a whole stream file, `t=""`.

- [ ] **Step 1: Write the failing tests**

```python
# tools/loop/dashboard/tests/test_tail.py
import json, unittest
from pathlib import Path
from tools.loop.dashboard import tail

ALPHA = Path(__file__).resolve().parent / "fixtures" / "root" / "alpha"
STREAM = ALPHA / "logs" / "loop" / "iter-3-20261005-231300.jsonl"


def line(obj) -> str:
    return json.dumps(obj)


class SplitTests(unittest.TestCase):
    def test_partial_last_line_ignored(self):
        lines, used = tail.split_complete(b'{"a":1}\n{"b":2')
        self.assertEqual(lines, ['{"a":1}']); self.assertEqual(used, 8)
        lines, used = tail.split_complete(b'{"b":2}\n')
        self.assertEqual(lines, ['{"b":2}']); self.assertEqual(used, 8)


class SummarizeTests(unittest.TestCase):
    def test_bash_first_line_truncated(self):
        self.assertEqual(tail.summarize_tool("Bash", {"command": "uv run pytest -q\necho x"}, ALPHA), "uv run pytest -q")
        self.assertEqual(len(tail.summarize_tool("Bash", {"command": "x" * 500}, ALPHA)), 201)  # 200 + ellipsis

    def test_file_tools_relative_path(self):
        p = str(ALPHA / "src" / "a.py")
        self.assertEqual(tail.summarize_tool("Read", {"file_path": p}, ALPHA), "src/a.py")
        self.assertEqual(tail.summarize_tool("Edit", {"file_path": p, "old_string": "a\nb", "new_string": "c"}, ALPHA), "src/a.py  (+1 −2)")
        self.assertEqual(tail.summarize_tool("Write", {"file_path": "/elsewhere/x.md"}, ALPHA), "/elsewhere/x.md")

    def test_grep_glob_and_other(self):
        self.assertEqual(tail.summarize_tool("Grep", {"pattern": "foo", "path": "src"}, ALPHA), "foo  src")
        self.assertEqual(tail.summarize_tool("Glob", {"pattern": "**/*.ts"}, ALPHA), "**/*.ts")
        self.assertEqual(tail.summarize_tool("WebFetch", {"url": "https://x", "prompt": "y"}, ALPHA), '{"url": "https://x", "prompt": "y"}')


class RenderTests(unittest.TestCase):
    def test_kinds(self):
        said = tail.render_line(line({"type": "assistant", "message": {"content": [{"type": "text", "text": "Hi"}]}}), ALPHA, "23:02")
        self.assertEqual(said, [{"t": "23:02", "kind": "said", "text": "Hi", "hidden": False}])
        tool = tail.render_line(line({"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Bash", "input": {"command": "ls"}}]}}), ALPHA, "23:02")
        self.assertEqual(tool[0]["kind"], "Bash"); self.assertEqual(tool[0]["text"], "ls")
        res = tail.render_line(line({"type": "user", "message": {"content": [{"type": "tool_result", "content": "42 passed\nmore"}]}}), ALPHA, "23:03")
        self.assertEqual(res[0], {"t": "23:03", "kind": "result", "text": "42 passed", "hidden": False})
        res2 = tail.render_line(line({"type": "user", "message": {"content": [{"type": "tool_result", "content": [{"type": "text", "text": "ok"}]}]}}), ALPHA, "")
        self.assertEqual(res2[0]["text"], "ok")
        empty = tail.render_line(line({"type": "user", "message": {"content": [{"type": "tool_result", "content": ""}]}}), ALPHA, "")
        self.assertEqual(empty[0]["text"], "(empty)")
        end = tail.render_line(line({"type": "result", "total_cost_usd": 2.41, "num_turns": 4, "duration_ms": 83000}), ALPHA, "23:10")
        self.assertEqual(end[0], {"t": "23:10", "kind": "end", "text": "cost $2.41, 4 turns, 1 min", "hidden": False})
        hook = tail.render_line(line({"type": "system", "subtype": "hook_started", "hook": "PreToolUse"}), ALPHA, "")
        self.assertEqual((hook[0]["kind"], hook[0]["hidden"]), ("hook", True))
        self.assertEqual(tail.render_line(line({"type": "rate_limit_event"}), ALPHA, ""), [])
        self.assertEqual(tail.render_line(line({"type": "system", "subtype": "init"}), ALPHA, ""), [])
        self.assertEqual(tail.render_line("not json", ALPHA, ""), [])
        thinking = tail.render_line(line({"type": "assistant", "message": {"content": [{"type": "thinking", "thinking": "hmm"}]}}), ALPHA, "")
        self.assertEqual((thinking[0]["kind"], thinking[0]["hidden"]), ("hook", True))

    def test_bootstrap(self):
        entries = tail.bootstrap(STREAM, ALPHA)
        self.assertEqual([e["kind"] for e in entries if not e["hidden"]], ["said", "Read", "result", "Bash", "result", "said", "end"])
        self.assertEqual(entries[0]["t"], "")
        self.assertEqual(len(tail.bootstrap(STREAM, ALPHA, limit=2)), 2)
        self.assertEqual(tail.bootstrap(ALPHA / "nope.jsonl", ALPHA), [])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python -m unittest tools.loop.dashboard.tests.test_tail -v` → `ModuleNotFoundError`

- [ ] **Step 3: Write `tail.py`**

```python
"""Turn a session's stream-json lines into the entries the live tail shows."""

from __future__ import annotations

import json
from pathlib import Path

_FILE_TOOLS = {"Read", "Edit", "Write", "NotebookEdit"}


def split_complete(chunk: bytes) -> tuple[list[str], int]:
    end = chunk.rfind(b"\n")
    if end < 0:
        return [], 0
    text = chunk[: end + 1].decode("utf-8", errors="replace")
    return [l for l in text.split("\n") if l.strip()], end + 1


def _clip(text: str, n: int) -> str:
    text = text.replace("\r", "")
    return text if len(text) <= n else text[:n] + "…"


def _rel(path: str, repo: Path) -> str:
    try:
        return Path(path).resolve().relative_to(repo.resolve()).as_posix()
    except (ValueError, OSError):
        return path


def summarize_tool(name: str, inp: dict, repo: Path) -> str:
    if name == "Bash":
        return _clip(str(inp.get("command", "")).split("\n", 1)[0], 200)
    if name in _FILE_TOOLS:
        rel = _rel(str(inp.get("file_path", inp.get("notebook_path", ""))), repo)
        if name == "Edit" and "old_string" in inp and "new_string" in inp:
            plus = str(inp["new_string"]).count("\n") + 1
            minus = str(inp["old_string"]).count("\n") + 1
            return f"{rel}  (+{plus} −{minus})"
        return rel
    if name in {"Grep", "Glob"}:
        parts = [str(inp.get("pattern", ""))]
        if inp.get("path"):
            parts.append(_rel(str(inp["path"]), repo))
        return "  ".join(parts)
    return _clip(json.dumps(inp, ensure_ascii=False), 120)


def _entry(t: str, kind: str, text: str, hidden: bool = False) -> dict:
    return {"t": t, "kind": kind, "text": text, "hidden": hidden}


def _result_text(content) -> str:
    if isinstance(content, list):
        content = "\n".join(str(b.get("text", "")) for b in content if isinstance(b, dict))
    first = str(content or "").strip().split("\n", 1)[0].strip()
    return _clip(first, 200) if first else "(empty)"


def render_line(line: str, repo: Path, stamp: str) -> list[dict]:
    try:
        obj = json.loads(line)
    except ValueError:
        return []
    if not isinstance(obj, dict):
        return []
    kind = obj.get("type")
    if kind == "system":
        sub = str(obj.get("subtype", ""))
        if sub.startswith("hook") or sub == "thinking_tokens":
            return [_entry(stamp, "hook", sub.replace("_", " ") + (f": {obj['hook']}" if obj.get("hook") else ""), True)]
        return []
    if kind == "result":
        cost = obj.get("total_cost_usd")
        parts = []
        if isinstance(cost, (int, float)):
            parts.append(f"cost ${cost:.2f}")
        if isinstance(obj.get("num_turns"), int):
            parts.append(f"{obj['num_turns']} turns")
        if isinstance(obj.get("duration_ms"), (int, float)):
            parts.append(f"{int(obj['duration_ms']) // 60000} min")
        if obj.get("is_error"):
            parts.append("error")
        return [_entry(stamp, "end", ", ".join(parts) or "finished")]
    if kind not in {"assistant", "user"}:
        return []
    out: list[dict] = []
    for block in (obj.get("message") or {}).get("content") or []:
        if not isinstance(block, dict):
            continue
        b = block.get("type")
        if b == "text" and kind == "assistant" and block.get("text"):
            out.append(_entry(stamp, "said", str(block["text"]).strip()))
        elif b == "tool_use":
            name = str(block.get("name", "tool"))
            out.append(_entry(stamp, name, summarize_tool(name, block.get("input") or {}, repo)))
        elif b == "tool_result":
            out.append(_entry(stamp, "result", _result_text(block.get("content"))))
        elif b == "thinking":
            out.append(_entry(stamp, "hook", "thinking", True))
    return out


def bootstrap(path: Path, repo: Path, limit: int = 300) -> list[dict]:
    if not path.is_file():
        return []
    lines, _ = split_complete(path.read_bytes())
    entries: list[dict] = []
    for line in lines:
        entries.extend(render_line(line, repo, ""))
    return entries[-limit:]
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python -m unittest tools.loop.dashboard.tests.test_tail -v` → 7 tests, OK

- [ ] **Step 5: Commit**

```bash
git add tools/loop/dashboard/tail.py tools/loop/dashboard/tests/test_tail.py tools/loop/dashboard/tests/fixtures/root/alpha/logs/loop/iter-3-20261005-231300.jsonl
git commit -m "dashboard: render a session stream into tail entries"
```

---

### Task 8: the queue and "add task" (`queue.py`)

**Files:**
- Create: `tools/loop/dashboard/queue.py`
- Test: `tools/loop/dashboard/tests/test_queue.py`

**Interfaces:**
- Produces:
  - `class QueueError(Exception)` with `.code` in `invalid`, `duplicate`, `changed`, `staged`, `missing` and `.message`.
  - `parse_queue(text: str) -> list[dict]`: open lines → `{id, title, model, line}` (`title` is the `**…**` text or the line after the id when there is no bold; `model` from `model:<tier>` or `{model: …}`, else `None`).
  - `suggest_id(tasks_text: str, archive_text: str = "") -> str`: the most common letter prefix among ids, highest number + 1, zero-padded to the width in use (`T004` → `T005`; no ids → `T001`).
  - `compose_line(fields: dict) -> str`: fields `id`, `title`, `who`, `exists`, `build`, `test`, `tier`; raises `QueueError("invalid", …)` when `id` is not `^[A-Za-z][A-Za-z0-9._-]*$`, `title` is empty, or `tier` not in `haiku/sonnet/opus/fable`.
  - `file_sha(path: Path) -> str` (sha256 hex of the bytes, `""` if missing).
  - `is_staged(repo: Path) -> bool` (`git diff --cached --name-only -- TASKS.md` non-empty).
  - `append_task(repo: Path, fields: dict, expected_sha: str) -> dict` → `{"line": str, "sha": new sha}`; raises `QueueError` with `missing` (no `TASKS.md`), `changed` (sha mismatch), `staged`, `duplicate` (id already in `TASKS.md` or `TASKS-archive.md`), `invalid`.

- [ ] **Step 1: Write the failing tests**

```python
# tools/loop/dashboard/tests/test_queue.py
import subprocess, tempfile, unittest
from pathlib import Path
from tools.loop.dashboard import queue

ALPHA_TASKS = (Path(__file__).resolve().parent / "fixtures" / "root" / "alpha" / "TASKS.md").read_text(encoding="utf-8")
FIELDS = {"id": "T005", "title": "fifth", "who": "Alex, 2026-10-05, \"go\"", "exists": "Exists: nothing.",
          "build": "Build: the thing.", "test": "Test: test_thing.", "tier": "sonnet"}


class ParseTests(unittest.TestCase):
    def test_open_lines(self):
        q = queue.parse_queue(ALPHA_TASKS)
        self.assertEqual([t["id"] for t in q], ["T002", "T003", "T004"])
        self.assertEqual(q[0]["title"], "open two"); self.assertEqual(q[0]["model"], "opus")
        self.assertEqual(q[2]["title"], "no bold title here"); self.assertEqual(q[2]["model"], "haiku")
        self.assertTrue(q[0]["line"].startswith("- [ ] T002"))

    def test_brace_model_and_no_model(self):
        q = queue.parse_queue("- [ ] W010 **x** {model: claude-opus-5-5}\n- [ ] W011 **y**\n")
        self.assertEqual([t["model"] for t in q], ["claude-opus-5-5", None])


class SuggestTests(unittest.TestCase):
    def test_next_id(self):
        self.assertEqual(queue.suggest_id(ALPHA_TASKS), "T005")
        self.assertEqual(queue.suggest_id(ALPHA_TASKS, "- [x] T017 **old** model:haiku\n"), "T018")
        self.assertEqual(queue.suggest_id("- [ ] W054 **a**\n- [ ] T001 **b**\n- [ ] W055 **c**\n"), "W056")
        self.assertEqual(queue.suggest_id("# empty\n"), "T001")


class ComposeTests(unittest.TestCase):
    def test_compose(self):
        self.assertEqual(queue.compose_line(FIELDS),
                         '- [ ] T005 **fifth** (Alex, 2026-10-05, "go"). Exists: nothing. Build: the thing. Test: test_thing. model:sonnet')

    def test_compose_minimal(self):
        self.assertEqual(queue.compose_line({"id": "T9", "title": "t", "tier": "haiku"}), "- [ ] T9 **t** model:haiku")

    def test_invalid(self):
        for bad in ({**FIELDS, "title": " "}, {**FIELDS, "tier": "gpt"}, {**FIELDS, "id": "bad id"}):
            with self.assertRaises(queue.QueueError) as ctx:
                queue.compose_line(bad)
            self.assertEqual(ctx.exception.code, "invalid")


class AppendTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name)
        subprocess.run(["git", "init", "-q"], cwd=self.repo, check=True)
        (self.repo / "TASKS.md").write_text(ALPHA_TASKS + "\n## Notes\n\nsome prose\n", encoding="utf-8", newline="\n")
        self.sha = queue.file_sha(self.repo / "TASKS.md")

    def tearDown(self):
        self.tmp.cleanup()

    def test_appends_after_last_open_line(self):
        out = queue.append_task(self.repo, FIELDS, self.sha)
        lines = (self.repo / "TASKS.md").read_text(encoding="utf-8").splitlines()
        i = lines.index("- [ ] T004 no bold title here model:haiku")
        self.assertEqual(lines[i + 1], out["line"])
        self.assertEqual(lines[-1], "some prose")
        self.assertEqual(out["sha"], queue.file_sha(self.repo / "TASKS.md"))
        self.assertTrue((self.repo / "TASKS.md").read_bytes().endswith(b"\n"))
        self.assertNotIn(b"\r\n", (self.repo / "TASKS.md").read_bytes())

    def test_duplicate_id_refused(self):
        queue.append_task(self.repo, FIELDS, self.sha)
        with self.assertRaises(queue.QueueError) as ctx:
            queue.append_task(self.repo, FIELDS, queue.file_sha(self.repo / "TASKS.md"))
        self.assertEqual(ctx.exception.code, "duplicate")
        (self.repo / "TASKS-archive.md").write_text("- [x] T050 **gone** model:haiku\n", encoding="utf-8")
        with self.assertRaises(queue.QueueError) as ctx2:
            queue.append_task(self.repo, {**FIELDS, "id": "T050"}, queue.file_sha(self.repo / "TASKS.md"))
        self.assertEqual(ctx2.exception.code, "duplicate")

    def test_changed_file_refused(self):
        with self.assertRaises(queue.QueueError) as ctx:
            queue.append_task(self.repo, FIELDS, "0000")
        self.assertEqual(ctx.exception.code, "changed")

    def test_staged_refused(self):
        subprocess.run(["git", "add", "TASKS.md"], cwd=self.repo, check=True)
        with self.assertRaises(queue.QueueError) as ctx:
            queue.append_task(self.repo, FIELDS, self.sha)
        self.assertEqual(ctx.exception.code, "staged")

    def test_missing_file(self):
        (self.repo / "TASKS.md").unlink()
        with self.assertRaises(queue.QueueError) as ctx:
            queue.append_task(self.repo, FIELDS, "")
        self.assertEqual(ctx.exception.code, "missing")

    def test_no_open_lines_goes_after_last_checked(self):
        (self.repo / "TASKS.md").write_text("# T\n\n- [x] T001 **done** model:haiku\n\n## Notes\nprose\n", encoding="utf-8", newline="\n")
        queue.append_task(self.repo, FIELDS, queue.file_sha(self.repo / "TASKS.md"))
        lines = (self.repo / "TASKS.md").read_text(encoding="utf-8").splitlines()
        self.assertEqual(lines[3][:11], "- [ ] T005 ")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python -m unittest tools.loop.dashboard.tests.test_queue -v` → `ModuleNotFoundError`

- [ ] **Step 3: Write `queue.py`**

```python
"""TASKS.md: the open queue, the next id, and the one write the dashboard makes (append a task)."""

from __future__ import annotations

import hashlib
import re
import subprocess
from collections import Counter
from pathlib import Path

TIERS = ("haiku", "sonnet", "opus", "fable")
_OPEN = re.compile(r"^- \[ \] +(\S+)(.*)$")
_ANY = re.compile(r"^- \[[ xX]\] +(\S+)")
_BOLD = re.compile(r"\*\*(.+?)\*\*")
_TAG = re.compile(r"model:(haiku|sonnet|opus|fable)")
_BRACE = re.compile(r"\{model: *([A-Za-z0-9._-]+)\}")
_ID = re.compile(r"^[A-Za-z][A-Za-z0-9._-]*$")
_SPLIT_ID = re.compile(r"^([A-Za-z]+)(\d+)$")


class QueueError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def parse_queue(text: str) -> list[dict]:
    out = []
    for line in text.splitlines():
        m = _OPEN.match(line)
        if not m:
            continue
        rest = m.group(2)
        bold = _BOLD.search(rest)
        title = bold.group(1) if bold else _TAG.sub("", _BRACE.sub("", rest)).strip()
        tag = _TAG.search(rest)
        brace = _BRACE.search(rest)
        out.append({"id": m.group(1), "title": title, "model": tag.group(1) if tag else (brace.group(1) if brace else None), "line": line})
    return out


def suggest_id(tasks_text: str, archive_text: str = "") -> str:
    ids = [m.group(1) for line in (tasks_text + "\n" + archive_text).splitlines() if (m := _ANY.match(line))]
    parsed = [(s.group(1), s.group(2)) for i in ids if (s := _SPLIT_ID.match(i))]
    if not parsed:
        return "T001"
    prefix = Counter(p for p, _ in parsed).most_common(1)[0][0]
    nums = [n for p, n in parsed if p == prefix]
    width = max(len(n) for n in nums)
    return f"{prefix}{max(int(n) for n in nums) + 1:0{width}d}"


def compose_line(fields: dict) -> str:
    ident = str(fields.get("id", "")).strip()
    title = str(fields.get("title", "")).strip()
    tier = str(fields.get("tier", "")).strip()
    if not _ID.match(ident):
        raise QueueError("invalid", "id must start with a letter and contain only letters, digits, . _ -")
    if not title:
        raise QueueError("invalid", "title is required")
    if tier not in TIERS:
        raise QueueError("invalid", f"tier must be one of {', '.join(TIERS)}")
    parts = [f"- [ ] {ident} **{title}**"]
    who = str(fields.get("who", "")).strip()
    if who:
        parts.append(f"({who}).")
    for key in ("exists", "build", "test"):
        value = " ".join(str(fields.get(key, "")).split())
        if value:
            parts.append(value)
    parts.append(f"model:{tier}")
    return " ".join(parts)


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else ""


def is_staged(repo: Path) -> bool:
    try:
        out = subprocess.run(["git", "-C", str(repo), "diff", "--cached", "--name-only", "--", "TASKS.md"],
                             capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return False
    return bool(out.stdout.strip())


def append_task(repo: Path, fields: dict, expected_sha: str) -> dict:
    path = repo / "TASKS.md"
    if not path.is_file():
        raise QueueError("missing", "TASKS.md not found in this checkout")
    line = compose_line(fields)
    if file_sha(path) != expected_sha:
        raise QueueError("changed", "TASKS.md changed since the preview; reload and try again")
    if is_staged(repo):
        raise QueueError("staged", "TASKS.md has staged changes (a session may be mid-commit); try again shortly")
    ident = line.split()[3]
    existing = {m.group(1) for f in (path, repo / "TASKS-archive.md") if f.is_file()
                for l in f.read_text(encoding="utf-8", errors="replace").splitlines() if (m := _ANY.match(l))}
    if ident in existing:
        raise QueueError("duplicate", f"{ident} is already in TASKS.md or TASKS-archive.md")
    lines = path.read_text(encoding="utf-8").split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    at = max((i for i, l in enumerate(lines) if _OPEN.match(l)), default=-1)
    if at < 0:
        at = max((i for i, l in enumerate(lines) if _ANY.match(l)), default=len(lines) - 1)
    lines.insert(at + 1, line)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    return {"line": line, "sha": file_sha(path)}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python -m unittest tools.loop.dashboard.tests.test_queue -v` → 12 tests, OK

- [ ] **Step 5: Commit**

```bash
git add tools/loop/dashboard/queue.py tools/loop/dashboard/tests/test_queue.py
git commit -m "dashboard: queue parsing, id suggestion and guarded add-task append"
```

---

### Task 9: the server (`server.py`): watcher, routes, SSE

**Files:**
- Create: `tools/loop/dashboard/server.py`
- Create: a placeholder `tools/loop/dashboard/index.html` containing only `<!doctype html><title>SnowForge loops</title><p>SnowForge loops</p>` (Task 10 replaces it)
- Test: `tools/loop/dashboard/tests/test_server.py`

**Interfaces:**
- Consumes: `loops.discover`, `events.*`, `tail.*`, `queue.*` as defined in Tasks 5-8.
- Produces:
  - `class Monitor(threading.Thread)`: `Monitor(root: Path, poll_s=1.0, rescan_s=30.0)`; `.snapshot(name) -> dict | None`; `.snapshots() -> list[dict]`; `.session(name) -> list[dict] | None`; `.iterations(name) -> list[dict] | None`; `.queue_info(name) -> dict | None` (`{queue, suggested_id, sha, path}`); `.subscribe() -> queue.Queue`; `.unsubscribe(q)`; `.stop()`; `.poll_once()` (one pass, used by tests).
  - A snapshot: `{name, path, branch, warnings, parse_errors, state: {state, reason, until}, run, current, totals, queue, last_activity, iterations_count}`.
  - `make_server(root: Path, port: int, monitor: Monitor | None = None) -> ThreadingHTTPServer` bound to `127.0.0.1`.
  - Routes: `GET /`, `GET /api/loops`, `GET /api/loops/<name>/session`, `GET /api/loops/<name>/iterations`, `GET /api/loops/<name>/queue`, `POST /api/loops/<name>/tasks` (JSON body `{sha, id, title, who, exists, build, test, tier}`; 201 `{line, sha}`; 400 on `invalid`; 409 on `changed`/`staged`/`duplicate`; 404 on `missing` or unknown loop), `GET /api/events` (SSE; event names `loop`, `session`, `discovery`; data is JSON; a `: keepalive` comment every 15 s).
  - `main(argv)` with `--port` (default 8787) and `--root` (default: the folder four levels above this file, i.e. the SnowForgeLLC folder).

- [ ] **Step 1: Write the failing tests**

```python
# tools/loop/dashboard/tests/test_server.py
import http.client, json, shutil, subprocess, tempfile, threading, time, unittest
from pathlib import Path
from tools.loop.dashboard import server as srv

FIXTURE_ROOT = Path(__file__).resolve().parent / "fixtures" / "root"


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.tmp.name) / "root"
        shutil.copytree(FIXTURE_ROOT, cls.root)
        subprocess.run(["git", "init", "-q"], cwd=cls.root / "alpha", check=True)
        cls.monitor = srv.Monitor(cls.root, poll_s=0.2, rescan_s=0.5)
        cls.monitor.start()
        cls.httpd = srv.make_server(cls.root, 0, cls.monitor)
        cls.port = cls.httpd.server_address[1]
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()
        time.sleep(0.6)

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown(); cls.monitor.stop(); cls.tmp.cleanup()

    def get(self, path):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        c.request("GET", path); r = c.getresponse(); body = r.read(); c.close()
        return r.status, r.getheader("Content-Type", ""), body

    def post(self, path, obj):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        c.request("POST", path, body=json.dumps(obj), headers={"Content-Type": "application/json"})
        r = c.getresponse(); body = r.read(); c.close()
        return r.status, json.loads(body)

    def test_index(self):
        status, ctype, body = self.get("/")
        self.assertEqual(status, 200); self.assertIn("text/html", ctype); self.assertIn(b"SnowForge loops", body)

    def test_loops_snapshot(self):
        status, _, body = self.get("/api/loops")
        self.assertEqual(status, 200)
        loops = {l["name"]: l for l in json.loads(body)["loops"]}
        self.assertEqual(set(loops), {"Alpha", "beta"})
        a = loops["Alpha"]
        self.assertEqual(a["state"]["state"], "running")  # the copied files are fresh
        self.assertEqual((a["current"]["i"], a["current"]["task_id"], a["current"]["phase"]), (3, "T215", "session"))
        self.assertEqual(a["run"]["max_iter"], 30); self.assertEqual(a["iterations_count"], 3)
        self.assertEqual([t["id"] for t in a["queue"]], ["T002", "T003", "T004"])
        self.assertEqual(a["parse_errors"], 1)
        self.assertAlmostEqual(a["totals"]["run"]["cost"], 5.43)
        b = loops["beta"]
        self.assertEqual(b["state"]["state"], "empty"); self.assertIn("TASKS.md missing", b["warnings"])

    def test_session_and_iterations(self):
        status, _, body = self.get("/api/loops/Alpha/session")
        self.assertEqual(status, 200)
        kinds = [e["kind"] for e in json.loads(body)["entries"] if not e["hidden"]]
        self.assertEqual(kinds[:3], ["said", "Read", "result"])
        status, _, body = self.get("/api/loops/Alpha/iterations")
        self.assertEqual(len(json.loads(body)["iterations"]), 3)
        self.assertEqual(self.get("/api/loops/Nope/session")[0], 404)
        self.assertEqual(self.get("/api/loops/beta/session")[0], 200)
        self.assertEqual(json.loads(self.get("/api/loops/beta/session")[2])["entries"], [])

    def test_queue_info_and_post_task(self):
        status, _, body = self.get("/api/loops/Alpha/queue")
        info = json.loads(body)
        self.assertEqual(info["suggested_id"], "T005"); self.assertEqual(len(info["sha"]), 64)
        fields = {"sha": info["sha"], "id": "T005", "title": "from the form", "who": "Alex", "exists": "", "build": "Build it.", "test": "", "tier": "sonnet"}
        status, out = self.post("/api/loops/Alpha/tasks", fields)
        self.assertEqual(status, 201, out); self.assertEqual(out["line"], "- [ ] T005 **from the form** (Alex). Build it. model:sonnet")
        self.assertIn(out["line"], (self.root / "alpha" / "TASKS.md").read_text(encoding="utf-8"))
        status2, out2 = self.post("/api/loops/Alpha/tasks", {**fields, "sha": out["sha"]})
        self.assertEqual((status2, out2["code"]), (409, "duplicate"))
        status3, out3 = self.post("/api/loops/Alpha/tasks", {**fields, "id": "T006", "sha": "stale"})
        self.assertEqual((status3, out3["code"]), (409, "changed"))
        status4, out4 = self.post("/api/loops/Alpha/tasks", {**fields, "id": "T006", "sha": out["sha"], "tier": "gpt"})
        self.assertEqual((status4, out4["code"]), (400, "invalid"))
        self.assertEqual(self.post("/api/loops/beta/tasks", fields)[0], 404)
        time.sleep(0.5)
        self.assertIn("T005", [t["id"] for t in json.loads(self.get("/api/loops")[2])["loops"][0]["queue"]])

    def test_sse_delivers_loop_update(self):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        c.request("GET", "/api/events"); r = c.getresponse()
        self.assertEqual(r.getheader("Content-Type"), "text/event-stream")
        ev_path = self.root / "alpha" / "logs" / "loop" / "events.jsonl"
        with ev_path.open("a", encoding="utf-8", newline="\n") as f:
            f.write(json.dumps({"ts": "2026-10-05T23:30:00.000Z", "loop": "Alpha", "run": "20261005-221100",
                                "event": "loop_stopped", "scope": "run", "code": 1, "reason": "gate failed after iteration 3"}) + "\n")
        deadline = time.time() + 5; got = None
        while time.time() < deadline:
            line = r.fp.readline().decode("utf-8")
            if line.startswith("event: loop"):
                data = r.fp.readline().decode("utf-8")
                payload = json.loads(data[len("data: "):])
                if payload["name"] == "Alpha" and payload["state"]["state"] == "stopped":
                    got = payload; break
        c.close()
        self.assertIsNotNone(got); self.assertEqual(got["state"]["reason"], "gate failed after iteration 3")

    def test_bound_to_localhost_only(self):
        self.assertEqual(self.httpd.server_address[0], "127.0.0.1")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python -m unittest tools.loop.dashboard.tests.test_server -v` → `ModuleNotFoundError`

- [ ] **Step 3: Write `server.py`**

```python
"""The loop dashboard: a local page over the loops' events (tools/loop/dashboard/README section).

    python tools/loop/dashboard/server.py [--port 8787] [--root <folder with the loop checkouts>]

Binds to 127.0.0.1 only. Reads files; its one write is appending a task line (queue.py).
A Monitor thread polls every loop's events.jsonl and the current session's stream once a
second, keeps a snapshot per loop, and pushes changes to /api/events subscribers (SSE).
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import queue as queue_mod
import re
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from tools.loop.dashboard import events as ev
from tools.loop.dashboard import loops as discovery
from tools.loop.dashboard import queue as tasks
from tools.loop.dashboard import tail as tailing

HERE = Path(__file__).resolve().parent
TAIL_LIMIT = 300
_ROUTE = re.compile(r"^/api/loops/([^/]+)/(session|iterations|queue|tasks)$")


class Watch:
    def __init__(self, loop: discovery.Loop):
        self.loop = loop
        self.events: list[dict] = []
        self.offset = 0
        self.parse_errors = 0
        self.stream: Path | None = None
        self.stream_offset = 0
        self.tail: list[dict] = []
        self.snapshot: dict | None = None
        self.snapshot_json = ""

    def events_path(self) -> Path:
        return self.loop.log_dir / "events.jsonl"

    def last_activity(self) -> dt.datetime | None:
        candidates = [self.events_path(), self.stream]
        gates = sorted(self.loop.log_dir.glob("gate-*.log*"), key=lambda p: p.stat().st_mtime if p.exists() else 0)
        if gates:
            candidates.append(gates[-1])
        times = [p.stat().st_mtime for p in candidates if p is not None and p.exists()]
        return dt.datetime.fromtimestamp(max(times), ev.UTC) if times else None


class Monitor(threading.Thread):
    def __init__(self, root: Path, poll_s: float = 1.0, rescan_s: float = 30.0):
        super().__init__(daemon=True)
        self.root = root
        self.poll_s = poll_s
        self.rescan_s = rescan_s
        self.watches: dict[str, Watch] = {}
        self.lock = threading.Lock()
        self.subscribers: list[queue_mod.Queue] = []
        self._stop = threading.Event()
        self._last_scan = 0.0
        self.rescan()

    # --- discovery ---------------------------------------------------------------------------
    def rescan(self) -> None:
        found = {l.name: l for l in discovery.discover(self.root)}
        with self.lock:
            for name in list(self.watches):
                if name not in found:
                    del self.watches[name]
                    self.publish("discovery", {"removed": name})
            for name, loop in found.items():
                if name in self.watches:
                    self.watches[name].loop = loop  # refreshed branch and warnings
                else:
                    self.watches[name] = Watch(loop)
                    self.publish("discovery", {"added": name})
        self._last_scan = time.monotonic()

    # --- polling -----------------------------------------------------------------------------
    def poll_once(self) -> None:
        if time.monotonic() - self._last_scan >= self.rescan_s:
            self.rescan()
        with self.lock:
            watches = list(self.watches.values())
        for w in watches:
            try:
                self._poll_watch(w)
            except OSError as error:
                w.loop.warnings = [x for x in w.loop.warnings if not x.startswith("read error")] + [f"read error: {error}"]

    def _poll_watch(self, w: Watch) -> None:
        path = w.events_path()
        size = path.stat().st_size if path.exists() else 0
        if size < w.offset:  # truncated or rotated
            w.events, w.offset, w.parse_errors = [], 0, 0
        new, w.offset, bad = ev.read_events(path, w.offset)
        w.events.extend(new)
        w.parse_errors += bad
        current = ev.current_iteration(w.events)
        wanted = self._stream_for(w, current)
        if wanted != w.stream:
            w.stream, w.stream_offset = wanted, 0
            w.tail = tailing.bootstrap(wanted, w.loop.path) if wanted else []
            if wanted and wanted.exists():
                w.stream_offset = wanted.stat().st_size
            self.publish("session", {"name": w.loop.name, "reset": True, "entries": w.tail})
        elif w.stream and w.stream.exists():
            with w.stream.open("rb") as handle:
                handle.seek(w.stream_offset)
                chunk = handle.read()
            lines, used = tailing.split_complete(chunk)
            if used:
                w.stream_offset += used
                stamp = dt.datetime.now().strftime("%H:%M")
                entries = [e for line in lines for e in tailing.render_line(line, w.loop.path, stamp)]
                if entries:
                    w.tail = (w.tail + entries)[-TAIL_LIMIT:]
                    self.publish("session", {"name": w.loop.name, "reset": False, "entries": entries})
        snap = self._snapshot(w, current)
        text = json.dumps(snap, sort_keys=True, default=str)
        if text != w.snapshot_json:
            w.snapshot, w.snapshot_json = snap, text
            self.publish("loop", snap)

    def _stream_for(self, w: Watch, current: dict | None) -> Path | None:
        if not current or not current.get("stream"):
            return None
        base = w.loop.path / current["stream"]
        opus = base.with_name(base.stem + "-opus.jsonl")
        if opus.exists() and (not base.exists() or opus.stat().st_mtime >= base.stat().st_mtime):
            return opus
        return base

    def _snapshot(self, w: Watch, current: dict | None) -> dict:
        now = dt.datetime.now(ev.UTC)
        its = ev.join_iterations(w.events)
        run = ev.run_summary(w.events)
        activity = w.last_activity()
        tasks_path = w.loop.path / "TASKS.md"
        q = tasks.parse_queue(tasks_path.read_text(encoding="utf-8", errors="replace")) if tasks_path.is_file() else []
        if current:
            current = dict(current, elapsed_s=int((now - ev.parse_ts(current["started"])).total_seconds()) if current.get("started") else None,
                           turns=sum(1 for e in w.tail if e["kind"] == "said"))
        return {"name": w.loop.name, "path": str(w.loop.path), "branch": w.loop.branch, "warnings": w.loop.warnings,
                "parse_errors": w.parse_errors, "state": ev.derive_state(w.events, now, activity), "run": run,
                "current": current, "totals": ev.totals(its, now, run["run"] if run else None), "queue": q,
                "last_activity": activity.isoformat() if activity else None, "iterations_count": len(its),
                "recent": its[:8]}

    def run(self) -> None:
        while not self._stop.is_set():
            self.poll_once()
            self._stop.wait(self.poll_s)

    def stop(self) -> None:
        self._stop.set()

    # --- reads used by the handler -----------------------------------------------------------
    def _watch(self, name: str) -> Watch | None:
        with self.lock:
            return self.watches.get(name)

    def snapshots(self) -> list[dict]:
        with self.lock:
            return [w.snapshot or self._snapshot(w, ev.current_iteration(w.events)) for w in self.watches.values()]

    def snapshot(self, name: str) -> dict | None:
        w = self._watch(name)
        return None if w is None else (w.snapshot or self._snapshot(w, ev.current_iteration(w.events)))

    def session(self, name: str) -> list[dict] | None:
        w = self._watch(name)
        return None if w is None else list(w.tail)

    def iterations(self, name: str) -> list[dict] | None:
        w = self._watch(name)
        return None if w is None else ev.join_iterations(w.events)

    def queue_info(self, name: str) -> dict | None:
        w = self._watch(name)
        if w is None:
            return None
        path = w.loop.path / "TASKS.md"
        text = path.read_text(encoding="utf-8", errors="replace") if path.is_file() else ""
        archive = w.loop.path / "TASKS-archive.md"
        archive_text = archive.read_text(encoding="utf-8", errors="replace") if archive.is_file() else ""
        return {"queue": tasks.parse_queue(text), "suggested_id": tasks.suggest_id(text, archive_text),
                "sha": tasks.file_sha(path), "path": str(path), "exists": path.is_file()}

    def add_task(self, name: str, body: dict) -> tuple[int, dict]:
        w = self._watch(name)
        if w is None:
            return 404, {"code": "unknown", "message": "no such loop"}
        try:
            out = tasks.append_task(w.loop.path, body, str(body.get("sha", "")))
        except tasks.QueueError as error:
            status = {"invalid": 400, "missing": 404}.get(error.code, 409)
            return status, {"code": error.code, "message": error.message}
        return 201, out

    # --- SSE ---------------------------------------------------------------------------------
    def subscribe(self) -> queue_mod.Queue:
        q: queue_mod.Queue = queue_mod.Queue(maxsize=1000)
        with self.lock:
            self.subscribers.append(q)
        return q

    def unsubscribe(self, q: queue_mod.Queue) -> None:
        with self.lock:
            if q in self.subscribers:
                self.subscribers.remove(q)

    def publish(self, kind: str, data: dict) -> None:
        payload = json.dumps(data, default=str)
        for q in list(self.subscribers):
            try:
                q.put_nowait((kind, payload))
            except queue_mod.Full:
                pass


class Handler(BaseHTTPRequestHandler):
    monitor: Monitor  # set by make_server
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # quiet
        pass

    def _send(self, status: int, body: bytes, ctype: str = "application/json") -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, obj) -> None:
        self._send(status, json.dumps(obj, default=str).encode("utf-8"))

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path == "/":
            self._send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
        elif path == "/api/loops":
            self._json(200, {"loops": self.monitor.snapshots(), "root": str(self.monitor.root)})
        elif path == "/api/events":
            self._sse()
        elif (m := _ROUTE.match(path)) and m.group(2) != "tasks":
            name, what = m.group(1), m.group(2)
            data = {"session": lambda: self.monitor.session(name), "iterations": lambda: self.monitor.iterations(name),
                    "queue": lambda: self.monitor.queue_info(name)}[what]()
            if data is None:
                self._json(404, {"code": "unknown", "message": "no such loop"})
            else:
                key = {"session": "entries", "iterations": "iterations", "queue": None}[what]
                self._json(200, data if key is None else {key: data})
        else:
            self._json(404, {"code": "not_found", "message": "no such route"})

    def do_POST(self) -> None:
        m = _ROUTE.match(self.path.split("?", 1)[0])
        if not m or m.group(2) != "tasks":
            self._json(404, {"code": "not_found", "message": "no such route"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            self._json(400, {"code": "invalid", "message": "body must be JSON"})
            return
        status, out = self.monitor.add_task(m.group(1), body if isinstance(body, dict) else {})
        self._json(status, out)

    def _sse(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.end_headers()
        q = self.monitor.subscribe()
        try:
            self.wfile.write(b": connected\n\n")
            self.wfile.flush()
            while True:
                try:
                    kind, payload = q.get(timeout=15)
                except queue_mod.Empty:
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
                    continue
                self.wfile.write(f"event: {kind}\ndata: {payload}\n\n".encode("utf-8"))
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            pass
        finally:
            self.monitor.unsubscribe(q)


def make_server(root: Path, port: int, monitor: Monitor | None = None) -> ThreadingHTTPServer:
    mon = monitor or Monitor(root)
    handler = type("BoundHandler", (Handler,), {"monitor": mon})
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    httpd.daemon_threads = True
    httpd.monitor = mon  # type: ignore[attr-defined]
    return httpd


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="SnowForge loop dashboard (local)")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--root", type=Path, default=HERE.parents[4], help="folder holding the loop checkouts (default: the parent of this SnowForge checkout)")
    args = parser.parse_args(argv)
    monitor = Monitor(args.root)
    monitor.start()
    httpd = make_server(args.root, args.port, monitor)
    names = ", ".join(sorted(monitor.watches)) or "none yet"
    print(f"loop dashboard: http://127.0.0.1:{httpd.server_address[1]}  root={args.root}  loops: {names}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        monitor.stop()
        httpd.server_close()
    return 0


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(HERE.parents[3]))  # so `python tools/loop/dashboard/server.py` finds the `tools` package
    raise SystemExit(main())
```

Paths: `HERE.parents[3]` is the SnowForge checkout (`dashboard` → `loop` → `tools` → `SnowForge`), which is what `sys.path` needs for the `tools.loop.dashboard` imports; `HERE.parents[4]` is the SnowForgeLLC folder, the default discovery root.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python -m unittest tools.loop.dashboard.tests.test_server -v` → 6 tests, OK. If `test_sse_delivers_loop_update` times out, check that `poll_s=0.2` is honoured (the monitor's `run` loop waits `poll_s`) and that `read_events` sees the appended line (it ends with `\n`).

- [ ] **Step 5: Start it for real, once**

Run: `python tools/loop/dashboard/server.py --port 8787` from the SnowForge checkout. Expected first line: `loop dashboard: http://127.0.0.1:8787  root=C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC  loops: OnDeck, RiftMind, riftmind-web` (the names come from each `.loop/config.sh`; any checkout with one appears). `curl -s http://127.0.0.1:8787/api/loops | python -m json.tool | head -40` shows them with `state.state` = `empty` until a loop is relaunched on the new kit. Stop with Ctrl-C.

- [ ] **Step 6: Commit**

```bash
git add tools/loop/dashboard/server.py tools/loop/dashboard/index.html tools/loop/dashboard/tests/test_server.py
git commit -m "dashboard: monitor thread, JSON routes, SSE and add-task endpoint"
```

---

### Task 10: the page (`index.html`)

**Files:**
- Replace: `tools/loop/dashboard/index.html`
- Test: `tools/loop/dashboard/tests/test_server.py` (add `IndexTests`: structural checks on the served HTML), plus a manual check with screenshots.

**Interfaces:**
- Consumes: `/api/loops`, `/api/loops/<name>/session|iterations|queue`, `POST /api/loops/<name>/tasks`, SSE `/api/events` with `loop`, `session` (`{name, reset, entries}`), `discovery`.
- Produces: one static page; `localStorage` key `loopdash.theme` in `system|light|dark`; the URL hash `#loop=<name>` selects the detail view.

Mockup to match: https://claude.ai/artifact/7hntQ2RwQqFACXem9avM7k (board and detail artboards). Fonts: IBM Plex Sans / IBM Plex Mono from Google Fonts with `system-ui` / `ui-monospace` fallbacks (the page works offline without them).

- [ ] **Step 1: Add the failing structural tests** (append to `test_server.py`)

```python
class IndexTests(unittest.TestCase):
    def setUp(self):
        self.html = (Path(srv.__file__).parent / "index.html").read_text(encoding="utf-8")

    def test_theme_and_labels(self):
        for needle in ("prefers-color-scheme: dark", '[data-theme="dark"]', '[data-theme="light"]', "loopdash.theme",
                       "API-equivalent", "new EventSource('/api/events')", "id=\"add-task\"", "<title>SnowForge loops</title>"):
            self.assertIn(needle, self.html, needle)

    def test_no_external_scripts(self):
        self.assertNotIn("<script src=", self.html)
        self.assertEqual(self.html.count("<link rel=\"stylesheet\""), 1)  # the one Google Fonts link
```

- [ ] **Step 2: Run them to verify they fail**

Run: `python -m unittest tools.loop.dashboard.tests.test_server.IndexTests -v` → FAIL (placeholder page has none of the needles)

- [ ] **Step 3: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SnowForge loops</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--bg:#F4F4F1;--surface:#FFFFFF;--ink:#1C1C1A;--dim:#5A5955;--line:#D9D8D2;--line-soft:#ECEBE6;--chip:#EFEEE9;
  --accent:#2458C8;--run-bg:#E4ECFB;--run-fg:#1F4DB0;--ok-bg:#E3F3EA;--ok-fg:#0F6A3F;--warn-bg:#FBEFD9;--warn-fg:#8A4B06;
  --bad-bg:#FBE4E4;--bad-fg:#9B1C1C;--term-bg:#1C1C1A;--term-fg:#E8E6DF;--term-dim:#8A8984;--term-tool:#7FA4F0;--term-edit:#F0B35C;--term-gate:#7BD39A}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#161614;--surface:#1F1F1C;--ink:#ECEAE3;--dim:#A3A19A;--line:#34332F;--line-soft:#2A2926;--chip:#2A2926;
  --run-bg:#1C2A4A;--run-fg:#9DB8F2;--ok-bg:#15301F;--ok-fg:#8FD4A8;--warn-bg:#3A2A10;--warn-fg:#F0C27A;--bad-bg:#3C1A1A;--bad-fg:#F2A3A3;--term-bg:#0E0E0D}}
:root[data-theme="dark"]{--bg:#161614;--surface:#1F1F1C;--ink:#ECEAE3;--dim:#A3A19A;--line:#34332F;--line-soft:#2A2926;--chip:#2A2926;
  --run-bg:#1C2A4A;--run-fg:#9DB8F2;--ok-bg:#15301F;--ok-fg:#8FD4A8;--warn-bg:#3A2A10;--warn-fg:#F0C27A;--bad-bg:#3C1A1A;--bad-fg:#F2A3A3;--term-bg:#0E0E0D}
:root[data-theme="light"]{--bg:#F4F4F1;--surface:#FFFFFF;--ink:#1C1C1A;--dim:#5A5955;--line:#D9D8D2;--line-soft:#ECEBE6;--chip:#EFEEE9;--term-bg:#1C1C1A}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 "IBM Plex Sans",system-ui,sans-serif}
a{color:var(--accent)}
.mono{font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace}
button,select,input,textarea{font:inherit;color:inherit}
header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 16px;padding:14px 16px;background:var(--surface);border-bottom:1px solid var(--line)}
header h1{margin:0;font-size:18px;font-weight:600}
.sub{font-size:13px;color:var(--dim)}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);margin-right:6px;vertical-align:1px}
.dot.off{background:var(--dim)}
.btn{border:1px solid var(--line);border-radius:6px;padding:6px 12px;background:var(--surface);cursor:pointer}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
main{max-width:1440px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:20px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.tile .k{font-size:12px;color:var(--dim)}.tile .v{font-size:26px;font-weight:600;line-height:1.1}.tile .v small{font-size:13px;font-weight:400;color:var(--dim)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.card{display:flex;flex-direction:column;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px;color:inherit;text-decoration:none}
.card:hover{border-color:var(--dim)}
.row{display:flex;align-items:center;justify-content:space-between;gap:10px}.wrap{display:flex;flex-wrap:wrap;gap:6px}
.name{font-size:16px;font-weight:600}
.pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:2px 10px;border-radius:999px;white-space:nowrap}
.pill i{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
.pill.running{background:var(--run-bg);color:var(--run-fg)}.pill.sleeping,.pill.stale{background:var(--warn-bg);color:var(--warn-fg)}
.pill.stopped{background:var(--bad-bg);color:var(--bad-fg)}.pill.empty{background:var(--chip);color:var(--dim)}
.pill.ok{background:var(--ok-bg);color:var(--ok-fg)}.pill.warn{background:var(--warn-bg);color:var(--warn-fg)}.pill.bad{background:var(--bad-bg);color:var(--bad-fg)}
.chip{font-size:12px;color:var(--dim);border:1px solid var(--line);border-radius:5px;padding:1px 7px}
.marks{display:flex;gap:4px}.marks span{width:22px;height:10px;border-radius:3px;background:var(--chip)}
.marks .ok{background:var(--ok-fg)}.marks .bad{background:var(--bad-fg)}.marks .run{background:var(--accent)}.marks .warn{background:var(--warn-fg)}
.foot{font-size:12px;color:var(--dim);border-top:1px solid var(--line-soft);padding-top:8px}
h2{margin:0;font-size:15px;font-weight:600}
.box{background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow-x:auto}
table{border-collapse:collapse;width:100%}th{text-align:left;font-weight:500;color:var(--dim);font-size:12px;padding:8px 12px;border-bottom:1px solid var(--line)}
td{padding:8px 12px;border-bottom:1px solid var(--line-soft);vertical-align:top}tr:last-child td{border-bottom:0}
.detail{display:flex;flex-wrap:wrap;gap:20px}.detail .main{flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:10px}.detail aside{flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:20px}
.term{background:var(--term-bg);color:var(--term-fg);border-radius:10px;padding:14px 16px;font-size:12.5px;line-height:1.6;height:520px;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
.term .l{display:flex;gap:12px;align-items:flex-start}.term .t{color:var(--term-dim);flex:0 0 44px}.term .k{flex:0 0 72px}.term .x{min-width:0;white-space:pre-wrap;word-break:break-word}
.term .k.said{color:var(--term-fg)}.term .k.result,.term .k.hook{color:var(--term-dim)}.term .k.Edit,.term .k.Write{color:var(--term-edit)}.term .k.end{color:var(--term-gate)}.term .k.tool{color:var(--term-tool)}
.term .x.dim{color:#B8B6AE}
.q{padding:8px 14px;border-bottom:1px solid var(--line-soft);display:flex;gap:10px;align-items:flex-start;font-size:13px}.q:last-child{border-bottom:0}.q .id{flex:0 0 48px;color:var(--dim)}.q .ti{flex:1 1 auto;min-width:0}
.spend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px 14px}.spend .k{font-size:12px;color:var(--dim)}.spend .v{font-size:20px;font-weight:600}
.bar{display:flex;height:10px;border-radius:4px;overflow:hidden;background:var(--chip)}.bar span{display:block}
form.task{display:grid;gap:8px;padding:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}form.task label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--dim)}
form.task input,form.task select,form.task textarea{border:1px solid var(--line);border-radius:6px;padding:7px 9px;background:var(--bg)}form.task .full{grid-column:1/-1}
.preview{grid-column:1/-1;font-size:12.5px;padding:8px 10px;background:var(--chip);border-radius:6px;white-space:pre-wrap;word-break:break-word}
.msg{font-size:13px}.msg.bad{color:var(--bad-fg)}.msg.ok{color:var(--ok-fg)}
.hidden{display:none}
@media (max-width:640px){header{padding:12px}main{padding:12px}.term{height:380px}}
</style>
</head>
<body>
<header>
  <div><h1 id="title">SnowForge loops</h1> <span class="sub" id="root"></span></div>
  <div class="wrap" style="align-items:center">
    <span class="sub"><span class="dot off" id="dot"></span><span id="live">connecting…</span></span>
    <a class="btn" id="back" href="#" style="text-decoration:none">← All loops</a>
    <button class="btn" id="theme" type="button" aria-label="Theme">Theme: system</button>
  </div>
</header>
<main>
  <section id="board">
    <div class="tiles" id="tiles"></div>
    <div class="cards" id="cards" style="margin-top:16px"></div>
    <div style="margin-top:20px;display:flex;flex-direction:column;gap:8px">
      <div class="row"><h2>Recent iterations, all loops</h2><span class="sub" id="recent-sub"></span></div>
      <div class="box"><table><thead><tr><th>When</th><th>Loop</th><th>Iter</th><th>Task</th><th>Tier</th><th>API-equivalent</th><th>Turns</th><th>Min</th><th>Gate</th><th>Commit</th></tr></thead><tbody id="recent"></tbody></table></div>
    </div>
  </section>
  <section id="detail" class="hidden">
    <div class="row" style="flex-wrap:wrap"><div class="wrap" style="align-items:center"><span class="name" id="d-name"></span><span class="pill" id="d-state"></span><span class="chip mono" id="d-branch"></span><span class="chip" id="d-mode"></span></div><span class="sub" id="d-run"></span></div>
    <div class="detail" style="margin-top:14px">
      <div class="main">
        <div class="row" style="flex-wrap:wrap"><div><h2 id="d-iter">Live session</h2><span class="sub" id="d-task"></span></div>
          <div class="wrap"><button class="btn" id="pause" type="button">Pause</button><button class="btn" id="hooks" type="button">Show hooks</button></div></div>
        <div class="term mono" id="term"></div>
        <div class="row" style="margin-top:10px"><h2>Iterations, this run</h2><span class="sub" id="d-iters-sub"></span></div>
        <div class="box"><table><thead><tr><th>Iter</th><th>Started</th><th>Task</th><th>Tier</th><th>API-equivalent</th><th>Turns</th><th>Min</th><th>Gate</th><th>Commit</th></tr></thead><tbody id="d-iters"></tbody></table></div>
      </div>
      <aside>
        <div><div class="row"><h2 id="q-head">Queue</h2><button class="btn" id="add-toggle" type="button">Add task</button></div>
          <div class="box" style="margin-top:8px" id="queue"></div>
          <form class="task box hidden" id="add-task" style="margin-top:8px">
            <label>Id <input name="id" required></label>
            <label>Tier <select name="tier"><option>haiku</option><option selected>sonnet</option><option>opus</option><option>fable</option></select></label>
            <label class="full">Title <input name="title" required placeholder="what, in a few words"></label>
            <label class="full">Who asked, when, their words <input name="who" placeholder='Alex, 2026-10-05, "…"'></label>
            <label class="full">What exists now and why it is wrong <textarea name="exists" rows="2"></textarea></label>
            <label class="full">What to build, with paths <textarea name="build" rows="2"></textarea></label>
            <label class="full">The test that proves it <input name="test"></label>
            <div class="preview mono" id="preview"></div>
            <div class="full row"><span class="msg" id="add-msg"></span><span class="wrap"><button class="btn" type="button" id="add-cancel">Cancel</button><button class="btn primary" type="submit">Append to TASKS.md</button></span></div>
            <input type="hidden" name="sha">
          </form></div>
        <div><h2>Spend (API-equivalent)</h2><div class="box" style="margin-top:8px"><div class="spend" id="spend"></div></div></div>
        <div id="warnings" class="sub"></div>
      </aside>
    </div>
  </section>
</main>
<script>
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const money = (n) => '$' + (Number(n) || 0).toFixed(2);
  const hhmm = (iso) => iso ? new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '';
  const mins = (s) => s == null ? '' : (s < 3600 ? Math.floor(s / 60) + ' min' : Math.floor(s / 3600) + ' h ' + Math.floor((s % 3600) / 60) + ' min');

  // theme: system | light | dark, remembered per browser
  const THEMES = ['system', 'light', 'dark'];
  let theme = 'system';
  try { theme = localStorage.getItem('loopdash.theme') || 'system'; } catch (e) {}
  const applyTheme = () => { if (theme === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', theme); $('theme').textContent = 'Theme: ' + theme; };
  $('theme').onclick = () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; try { localStorage.setItem('loopdash.theme', theme); } catch (e) {} applyTheme(); };
  applyTheme();

  const loops = new Map();      // name -> snapshot
  let selected = null;          // loop name in the detail view
  let tail = [];                // entries for the selected loop
  let paused = false, pending = [], showHooks = false;

  const stateLabel = (st) => st.state === 'stopped' ? 'stopped: ' + st.reason : st.state === 'sleeping' ? 'sleeping until ' + hhmm(st.until) : st.state;
  const gateOf = (it) => {
    const g = it.gates || [];
    if (!it.finished) return it.cost_usd == null ? {c: 'run', t: 'session running'} : {c: 'run', t: 'gate running'};
    if (!it.ok) return {c: 'bad', t: 'failed'};
    const last = g[g.length - 1];
    if (!last || last.attempt === 1) return {c: 'ok', t: 'passed'};
    return {c: 'warn', t: last.attempt === 'retry' ? 'passed on retry' : 'passed after Opus'};
  };

  function renderBoard() {
    const all = [...loops.values()].sort((a, b) => a.name.localeCompare(b.name));
    const running = all.filter((l) => l.state.state === 'running').length;
    const today = all.reduce((acc, l) => { acc.cost += l.totals.today.cost; acc.n += l.totals.today.count; return acc; }, {cost: 0, n: 0});
    const recent = all.flatMap((l) => (l.recent || []).map((it) => ({...it, loop: l.name}))).sort((a, b) => (b.started || '').localeCompare(a.started || '')).slice(0, 12);
    const passed = recent.filter((it) => it.finished && it.ok).length, done = recent.filter((it) => it.finished).length;
    $('tiles').innerHTML = [
      ['Running', `${running} <small>of ${all.length}</small>`], ['Spent today (API-equivalent)', money(today.cost)],
      ['Iterations today', String(today.n)], ['Gate passed, recent', `${passed} <small>of ${done}</small>`]
    ].map(([k, v]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
    $('cards').innerHTML = all.map((l) => {
      const cur = l.current, run = l.run || {};
      const marks = (l.recent || []).slice(0, 6).reverse().map((it) => `<span class="${gateOf(it).c}" title="iteration ${it.i}"></span>`).join('');
      return `<a class="card" href="#loop=${encodeURIComponent(l.name)}">
        <div class="row"><span class="name">${esc(l.name)}</span><span class="pill ${l.state.state}"><i></i>${esc(stateLabel(l.state))}</span></div>
        <div class="wrap"><span class="chip mono">${esc(l.branch)}</span>${run.mode ? `<span class="chip">${esc(run.mode)} ${run.max_iter ?? ''}</span>` : ''}${cur ? `<span class="chip">${esc(cur.tier)}</span>` : ''}</div>
        <div><div class="sub">${cur ? `Iteration ${cur.i} of ${run.max_iter ?? '?'} · ${esc(cur.phase)} ${mins(cur.elapsed_s)}` : (l.iterations_count ? `${l.iterations_count} iterations recorded` : esc(l.state.reason || ''))}</div>
          <div style="font-weight:500">${esc(cur ? cur.task : (l.recent && l.recent[0] ? l.recent[0].task : ''))}</div></div>
        <div class="row sub"><span>${run.started ? 'started ' + hhmm(run.started) : ''}</span><span>run <b>${money(l.totals.run.cost)}</b></span></div>
        <div class="marks">${marks}</div>
        <div class="foot">${l.warnings.length ? esc(l.warnings.join(' · ')) : (l.last_activity ? 'last activity ' + hhmm(l.last_activity) : '')}</div></a>`;
    }).join('');
    $('recent').innerHTML = recent.map((it) => { const g = gateOf(it); return `<tr><td class="sub">${hhmm(it.started)}</td><td><b>${esc(it.loop)}</b></td><td class="mono">${it.i}</td><td>${esc(it.task)}</td><td>${esc(it.tier)}</td><td class="mono">${money(it.cost)}</td><td class="mono">${it.turns ?? ''}</td><td class="mono">${it.minutes ?? ''}</td><td><span class="pill ${g.c}">${g.t}</span></td><td class="mono sub">${esc(it.commit || '—')}</td></tr>`; }).join('');
    const byTier = {};
    all.forEach((l) => Object.entries(l.totals.week.by_tier).forEach(([t, v]) => { byTier[t] = (byTier[t] || 0) + v.cost; }));
    $('recent-sub').textContent = 'last 7 days · ' + Object.entries(byTier).map(([t, c]) => `${t} ${money(c)}`).join(' · ');
  }

  function renderTail() {
    const term = $('term');
    const atBottom = term.scrollTop + term.clientHeight >= term.scrollHeight - 8;
    term.innerHTML = tail.filter((e) => showHooks || !e.hidden).map((e) => {
      const kind = ['said', 'result', 'hook', 'end', 'Edit', 'Write'].includes(e.kind) ? e.kind : 'tool';
      return `<div class="l"><span class="t">${esc(e.t)}</span><span class="k ${kind}">${esc(e.kind)}</span><span class="x${e.kind === 'result' || e.hidden ? ' dim' : ''}">${esc(e.text)}</span></div>`;
    }).join('') + `<div class="l"><span class="t"></span><span class="k tool">live</span><span class="x dim">${paused ? `paused · ${pending.length} new` : (tail.length ? 'waiting for the next event…' : 'no lines yet (stream not found or empty)')}</span></div>`;
    if (atBottom && !paused) term.scrollTop = term.scrollHeight;
  }

  function renderDetail() {
    const l = loops.get(selected);
    if (!l) { $('d-name').textContent = selected; return; }
    const cur = l.current, run = l.run || {};
    $('d-name').textContent = l.name; $('d-state').className = 'pill ' + l.state.state; $('d-state').innerHTML = '<i></i>' + esc(stateLabel(l.state));
    $('d-branch').textContent = l.branch; $('d-mode').textContent = run.mode ? `${run.mode} ${run.max_iter ?? ''}` : '';
    $('d-run').textContent = `${cur ? `Iteration ${cur.i} of ${run.max_iter ?? '?'} · ` : ''}run ${money(l.totals.run.cost)}${run.started ? ' · started ' + hhmm(run.started) : ''}`;
    $('d-iter').textContent = cur ? `Live session · iteration ${cur.i} · ${cur.phase}` : 'Last session';
    $('d-task').textContent = cur ? `${cur.task} · ${cur.tier} · ${mins(cur.elapsed_s)} · ${cur.turns} messages so far` : (l.state.reason || '');
    $('queue').innerHTML = l.queue.length ? l.queue.map((t) => `<div class="q"><span class="id mono">${esc(t.id)}</span><span class="ti">${esc(t.title)}</span><span class="pill empty">${esc(t.model || '—')}</span></div>`).join('') : '<div class="q sub">queue empty</div>';
    $('q-head').textContent = `Queue · ${l.queue.length} open`;
    const T = l.totals, week = T.week, tiers = Object.entries(week.by_tier), per = week.count ? week.cost / week.count : 0;
    const shades = ['var(--accent)', '#7FA4F0', '#C9D7F6', '#9AB0D8'];
    $('spend').innerHTML = [['This run', money(T.run.cost)], ['Today', money(T.today.cost)], ['Last 7 days', money(week.cost)], ['Per iteration, 7 d', money(per)]]
      .map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')
      + `<div style="grid-column:1/-1"><div class="k">By tier, 7 days</div><div class="bar">${tiers.map(([t, v], i) => `<span title="${t} ${money(v.cost)}" style="flex:0 0 ${week.cost ? (100 * v.cost / week.cost).toFixed(1) : 0}%;background:${shades[i % 4]}"></span>`).join('')}</div><div class="sub" style="margin-top:4px">${tiers.map(([t, v]) => `${t} ${money(v.cost)}`).join(' · ')}</div></div>`;
    $('warnings').textContent = l.warnings.join(' · ') + (l.parse_errors ? ` · ${l.parse_errors} unreadable event line(s) skipped` : '');
    fetch(`/api/loops/${encodeURIComponent(selected)}/iterations`).then((r) => r.json()).then((d) => {
      const its = d.iterations.filter((it) => !run.run || it.run === run.run);
      $('d-iters-sub').textContent = `${its.filter((it) => it.finished).length} finished, ${its.filter((it) => !it.finished).length} running`;
      $('d-iters').innerHTML = its.map((it) => { const g = gateOf(it); return `<tr><td class="mono">${it.i}</td><td class="sub">${hhmm(it.started)}</td><td>${esc(it.task)}</td><td>${esc(it.tier)}</td><td class="mono">${money(it.cost)}${it.finished ? '' : ' so far'}</td><td class="mono">${it.turns ?? ''}</td><td class="mono">${it.minutes ?? ''}</td><td><span class="pill ${g.c}">${g.t}</span></td><td class="mono sub">${esc(it.commit || '—')}</td></tr>`; }).join('');
    });
  }

  function route() {
    const m = location.hash.match(/#loop=([^&]+)/);
    selected = m ? decodeURIComponent(m[1]) : null;
    $('board').classList.toggle('hidden', !!selected); $('detail').classList.toggle('hidden', !selected); $('back').classList.toggle('hidden', !selected);
    $('title').textContent = selected ? 'SnowForge loops / ' + selected : 'SnowForge loops';
    if (selected) {
      tail = []; pending = []; renderDetail();
      fetch(`/api/loops/${encodeURIComponent(selected)}/session`).then((r) => r.json()).then((d) => { tail = d.entries; renderTail(); });
      closeForm();
    } else renderBoard();
  }

  // add task
  const form = $('add-task');
  const fields = () => Object.fromEntries(new FormData(form).entries());
  const preview = () => { const f = fields(); const parts = [`- [ ] ${f.id} **${f.title}**`]; if (f.who.trim()) parts.push(`(${f.who.trim()}).`); ['exists', 'build', 'test'].forEach((k) => { const v = f[k].replace(/\s+/g, ' ').trim(); if (v) parts.push(v); }); parts.push(`model:${f.tier}`); $('preview').textContent = parts.join(' '); };
  const closeForm = () => { form.classList.add('hidden'); $('add-msg').textContent = ''; };
  $('add-toggle').onclick = () => {
    fetch(`/api/loops/${encodeURIComponent(selected)}/queue`).then((r) => r.json()).then((d) => {
      form.reset(); form.id.value = d.suggested_id; form.sha.value = d.sha; form.classList.remove('hidden'); preview(); form.title.focus();
      if (!d.exists) $('add-msg').textContent = 'TASKS.md is missing in this checkout';
    });
  };
  $('add-cancel').onclick = closeForm;
  form.addEventListener('input', preview);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); const btn = form.querySelector('[type=submit]'); btn.disabled = true;
    fetch(`/api/loops/${encodeURIComponent(selected)}/tasks`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(fields())})
      .then(async (r) => { const d = await r.json(); const m = $('add-msg'); if (r.status === 201) { m.className = 'msg ok'; m.textContent = 'Appended: ' + d.line; form.sha.value = d.sha; setTimeout(closeForm, 2500); } else { m.className = 'msg bad'; m.textContent = d.message || r.statusText; if (d.code === 'changed') fetch(`/api/loops/${encodeURIComponent(selected)}/queue`).then((x) => x.json()).then((x) => { form.sha.value = x.sha; }); } })
      .finally(() => { btn.disabled = false; });
  });

  // tail controls
  $('pause').onclick = () => { paused = !paused; $('pause').textContent = paused ? 'Resume' : 'Pause'; if (!paused) { tail = (tail.concat(pending)).slice(-300); pending = []; } renderTail(); };
  $('hooks').onclick = () => { showHooks = !showHooks; $('hooks').textContent = showHooks ? 'Hide hooks' : 'Show hooks'; renderTail(); };

  // data
  const load = () => fetch('/api/loops').then((r) => r.json()).then((d) => { loops.clear(); d.loops.forEach((l) => loops.set(l.name, l)); $('root').textContent = 'local · ' + d.root; route(); });
  const connect = () => {
    const es = new EventSource('/api/events');
    es.onopen = () => { $('dot').className = 'dot'; $('live').textContent = 'live'; load(); };
    es.onerror = () => { $('dot').className = 'dot off'; $('live').textContent = 'reconnecting…'; };
    es.addEventListener('loop', (e) => { const snap = JSON.parse(e.data); loops.set(snap.name, snap); $('live').textContent = 'live · updated ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}); if (selected === snap.name) renderDetail(); else if (!selected) renderBoard(); });
    es.addEventListener('session', (e) => { const d = JSON.parse(e.data); if (d.name !== selected) return; if (d.reset) { tail = d.entries; pending = []; } else if (paused) pending.push(...d.entries); else tail = tail.concat(d.entries).slice(-300); renderTail(); });
    es.addEventListener('discovery', () => load());
  };
  window.addEventListener('hashchange', route);
  load(); connect();
})();
</script>
</body>
</html>
```

- [ ] **Step 4: Run the structural tests**

Run: `python -m unittest tools.loop.dashboard.tests.test_server -v` → all OK (8 tests).

- [ ] **Step 5: Manual check with screenshots**

Start the server against the test fixture root, so the page has data without a live loop: `python tools/loop/dashboard/server.py --port 8790 --root tools/loop/dashboard/tests/fixtures/root`. Open `http://127.0.0.1:8790`, then `#loop=Alpha`. Check, at desktop width and at 390 px (DevTools device toolbar): the board shows Alpha running with iteration 3 and beta empty; the detail shows the tail from the fixture stream, the three iterations with `passed`, `passed after Opus`, `session running`, the queue with T002-T004, and Add task suggests `T005` with a live preview; the theme button cycles and the dark theme recolours everything including the pills; nothing scrolls sideways at 390 px. Take screenshots with the Playwright from OnDeck's `node_modules` (as in `C:\Users\alexi\AppData\Local\Temp\…\scratchpad\shots.cjs` earlier in this session: `chromium.launch()`, `page.goto`, `page.screenshot`) into the scratchpad, not the repo. Fix what the screenshots show. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add tools/loop/dashboard/index.html tools/loop/dashboard/tests/test_server.py
git commit -m "dashboard: the page (board, loop detail, live tail, add task, themes)"
```

---

### Task 11: README, rollout, relaunch

**Files:**
- Modify: `tools/loop/README.md` (the Files table at lines 13-23; add two sections before "## Supervising")
- No code. The test is the full suite plus one real relaunch.

- [ ] **Step 1: Update the README**

In the Files table add rows:

```markdown
| `emit.py` | Appends one JSON event to `<LOG_DIR>/events.jsonl` (loop started/stopped, iteration started/finished, session finished, gate finished, usage-limit sleep, notice sent). |
| `dashboard/` | The local dashboard: `python tools/loop/dashboard/server.py` → http://127.0.0.1:8787. Reads every loop's events and the live session stream. |
| `tests/` | `python -m unittest discover -s tools/loop -p "test_*.py"`: the kit against a fake `claude`, and the dashboard. No test calls a model. |
```

Add before "## Supervising":

```markdown
## Events and the dashboard

Every batch appends one JSON line per event to `<LOG_DIR>/events.jsonl` (`emit.py`), and sessions
run as `--output-format stream-json`, so `iter-N-<ts>.jsonl` grows while the session works. The
batch log, `iter-N-<ts>.log` and the stop notice are unchanged. `LOOP_RUN` groups a run's events
(overnight.sh sets it for the whole run); a batch started by hand gets its own.

The dashboard reads those files and nothing else:

    python tools/loop/dashboard/server.py            # http://127.0.0.1:8787, scans ../ for .loop/config.sh
    python tools/loop/dashboard/server.py --root <folder> --port 8790

It binds to 127.0.0.1 only. The board shows every loop (running / sleeping / stale / stopped with
the reason / empty), the current iteration and phase, API-equivalent cost (sessions run on the
Claude Max login, so no money changes hands), and the queue. A loop's page shows the live session
tail, this run's iterations with gate results, and an "Add task" form that appends a line in the
kit's task format to `TASKS.md` (refused when the file changed since the preview or has staged
changes; the next session's checkoff commit carries the line). Theme: system / light / dark.

A loop adopts the events kit at its next launch (`launch.sh` copies the kit per run); a loop that
was mid-run when the kit changed shows "no events yet" until then.
```

- [ ] **Step 2: Run everything**

Run: `python -m unittest discover -s tools/loop -p "test_*.py" -v` → all OK (expect 60+ tests). Run `bash -n tools/loop/loop.sh tools/loop/overnight.sh tools/loop/launch.sh` → no output.

- [ ] **Step 3: Commit**

```bash
git add tools/loop/README.md
git commit -m "loop kit: document events and the dashboard"
```

- [ ] **Step 4: Relaunch one loop on the new kit and watch it (Alex's call which)**

Loops in flight keep their old kit copy. When one has stopped (check the board: `stopped` or `stale`), relaunch it the normal way, for example riftmind-web from its worktree: `bash tools/loop/launch.sh <worktree> loop 5`, or `schtasks /Run /TN RiftMindWeb`. Within a minute the board should show it `running`, iteration 1, phase `session`, and the detail page should stream the session's tool calls. Confirm the batch log and the stop email still read as before. Only then relaunch the others.

---

## Self-review notes

- Spec coverage: discovery, state (incl. `sleeping`), current iteration and phase, run summary, iterations, totals by day and tier, queue, all routes (plus `GET …/queue`, which the add-task form needs for the suggested id and the file hash), tail rendering rules, UI views, theme, SSE with reconnect refetch, phone width, add-task with every refusal, errors, tests on both layers, rollout. The only deviation from the spec's file list: `server.py` is split into `loops.py`, `events.py`, `tail.py`, `queue.py`, `server.py` (one responsibility each); the command to run is the one the spec names.
- Known limitation: the tail of an Opus retry session is followed by switching to the `-opus.jsonl` sibling once it exists; the first lines written before the next poll are shown via bootstrap with no timestamp.
