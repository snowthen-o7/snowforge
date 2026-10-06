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

    def test_unterminated_result_line_is_parsed(self):
        raw = (STREAMS / "success.jsonl").read_text(encoding="utf-8").rstrip("\n")
        result, _ = iter_log.parse_stream(raw)
        self.assertEqual(result["total_cost_usd"], 2.41)

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
