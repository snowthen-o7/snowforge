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
            p.write_text('{"event":"a"}\n{"event":"b', encoding="utf-8")
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
