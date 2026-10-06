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
