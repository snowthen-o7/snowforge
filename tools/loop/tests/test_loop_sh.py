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


_REPOS = []


def tearDownModule():
    for r in _REPOS:
        r.tmp.cleanup()


class LoopRepo:
    def __init__(self, tier_default="sonnet", branch="loop", require_non_main=1, tasks=TASKS):
        self.tmp = tempfile.TemporaryDirectory()
        _REPOS.append(self)
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


if __name__ == "__main__":
    unittest.main()
