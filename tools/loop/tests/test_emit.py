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


class ReservedKeyTests(unittest.TestCase):
    def test_reserved_keys_cannot_be_overwritten(self):
        import contextlib, io
        with contextlib.redirect_stderr(io.StringIO()) as err:
            rec = emit.record("x", ["event=hijack", "ts=0", "loop=L2", "run=r9", "i=1"],
                              {"LOOP_NAME": "L", "LOG_DIR": "logs", "LOOP_RUN": "r1"})
        self.assertEqual(err.getvalue().count("ignoring reserved key"), 4)
        self.assertEqual((rec["event"], rec["loop"], rec["run"], rec["i"]), ("x", "L", "r1", 1))
        self.assertNotEqual(rec["ts"], 0)


if __name__ == "__main__":
    unittest.main()
