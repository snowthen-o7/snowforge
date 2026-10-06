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


class AbortedTests(unittest.TestCase):
    RUN = "r1"

    def aborted(self):
        r = self.RUN
        return [
            {"ts": "2026-10-05T22:11:00.200Z", "run": r, "event": "loop_started", "scope": "batch"},
            {"ts": "2026-10-05T22:11:01.000Z", "run": r, "event": "iteration_started", "i": 1, "task_id": "T001", "task": "t", "tier": "sonnet", "stream": "s.jsonl"},
            {"ts": "2026-10-05T22:20:00.000Z", "run": r, "event": "session_finished", "i": 1, "cost_usd": 1.0, "usage_limit": True},
            {"ts": "2026-10-05T22:20:01.000Z", "run": r, "event": "loop_stopped", "scope": "batch", "code": 3, "reason": "usage limit"},
        ]

    def test_batch_stop_closes_open_iteration(self):
        recs = self.aborted()
        self.assertIsNone(events.current_iteration(recs))
        it = events.join_iterations(recs)[0]
        self.assertIs(it["aborted"], True); self.assertIs(it["ok"], False)
        self.assertEqual(it["finished"], "2026-10-05T22:20:01.000Z")

    def test_finished_iteration_is_not_aborted(self):
        recs = self.aborted()
        recs.insert(3, {"ts": "2026-10-05T22:20:00.500Z", "run": self.RUN, "event": "iteration_finished", "i": 1, "ok": False})
        it = events.join_iterations(recs)[0]
        self.assertIs(it["aborted"], False); self.assertEqual(it["finished"], "2026-10-05T22:20:00.500Z")

    def test_stop_of_one_batch_leaves_the_next_running(self):
        recs = self.aborted() + [
            {"ts": "2026-10-05T23:00:00.000Z", "run": self.RUN, "event": "loop_started", "scope": "batch"},
            {"ts": "2026-10-05T23:00:01.000Z", "run": self.RUN, "event": "iteration_started", "i": 1, "task_id": "T002", "stream": "s2.jsonl"}]
        self.assertEqual(events.current_iteration(recs)["task_id"], "T002")
        self.assertIs(events.join_iterations(recs)[0]["aborted"], False)

    def test_page_shows_aborted(self):
        html = (Path(events.__file__).parent / "index.html").read_text(encoding="utf-8")
        self.assertIn("if (it.aborted) return {c: 'bad', t: 'aborted'};", html)
        self.assertLess(html.index("it.aborted) return"), html.index("if (!it.finished)"))


class RobustDataTests(unittest.TestCase):
    def test_non_numeric_cost_counts_as_zero(self):
        recs = [{"ts": "2026-10-05T22:11:01.000Z", "run": "r", "event": "iteration_started", "i": 1},
                {"ts": "2026-10-05T22:12:00.000Z", "run": "r", "event": "session_finished", "i": 1, "cost_usd": "lots"}]
        self.assertEqual(events.join_iterations(recs)[0]["cost"], 0.0)

    def test_totals_skip_unparseable_start(self):
        its = events.join_iterations([{"ts": "bad", "run": "r", "event": "iteration_started", "i": 1}])
        t = events.totals(its, dt.datetime(2026, 10, 5, tzinfo=UTC), "r")
        self.assertEqual(t["run"]["count"], 0)

    def test_long_task_is_clipped_to_200(self):
        recs = [{"ts": "2026-10-05T22:11:01.000Z", "run": "r", "event": "iteration_started", "i": 1, "task": "é" * 300, "stream": "s"}]
        self.assertEqual(len(events.join_iterations(recs)[0]["task"]), 200)
        self.assertEqual(len(events.current_iteration(recs)["task"]), 200)


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

    def test_stopped_survives_trailing_notice_sent(self):
        recs = load() + [{"ts": "2026-10-05T23:19:00.000Z", "event": "loop_stopped", "scope": "run", "code": 0, "reason": "the queue is empty"},
                         {"ts": "2026-10-05T23:19:01.000Z", "event": "notice_sent", "scope": "run"}]
        s = events.derive_state(recs, self.now, self.now)
        self.assertEqual((s["state"], s["reason"]), ("stopped", "the queue is empty"))

    def test_notice_from_older_run_does_not_mask_activity(self):
        recs = [{"ts": "2026-10-05T20:00:00.000Z", "event": "loop_stopped", "scope": "run", "code": 0, "reason": "done"},
                {"ts": "2026-10-05T20:00:01.000Z", "event": "notice_sent"},
                {"ts": "2026-10-05T23:00:00.000Z", "event": "iteration_started", "run": "r2", "i": 1},
                {"ts": "2026-10-05T23:00:01.000Z", "event": "notice_sent"}]
        self.assertEqual(events.derive_state(recs, self.now, self.now)["state"], "running")
        self.assertEqual(events.derive_state(recs, self.now, self.now - dt.timedelta(minutes=30))["state"], "stale")


class BatchTests(unittest.TestCase):
    RUN = "20261005-221100"

    def two_batches(self):
        r = self.RUN
        return [
            {"ts": "2026-10-05T22:11:00.000Z", "run": r, "event": "loop_started", "scope": "run", "max_iter": 30},
            {"ts": "2026-10-05T22:11:00.200Z", "run": r, "event": "loop_started", "scope": "batch", "max_iter": 30},
            {"ts": "2026-10-05T22:11:01.000Z", "run": r, "event": "iteration_started", "i": 1, "task_id": "T001", "task": "first", "tier": "sonnet", "stream": "s1.jsonl"},
            {"ts": "2026-10-05T22:20:00.000Z", "run": r, "event": "session_finished", "i": 1, "cost_usd": 1.0, "turns": 5},
            {"ts": "2026-10-05T22:21:00.000Z", "run": r, "event": "gate_finished", "i": 1, "attempt": 1, "ok": True},
            {"ts": "2026-10-05T22:21:01.000Z", "run": r, "event": "iteration_finished", "i": 1, "ok": True, "minutes": 10, "commit": "abc"},
            {"ts": "2026-10-05T22:22:00.000Z", "run": r, "event": "loop_stopped", "scope": "batch", "code": 3},
            {"ts": "2026-10-05T22:22:01.000Z", "run": r, "event": "usage_limit_sleep", "seconds": 60},
            {"ts": "2026-10-05T23:00:00.000Z", "run": r, "event": "loop_started", "scope": "batch", "max_iter": 30},
            {"ts": "2026-10-05T23:00:01.000Z", "run": r, "event": "iteration_started", "i": 1, "task_id": "T002", "task": "second", "tier": "sonnet", "stream": "s2.jsonl"},
        ]

    def test_batches_do_not_collide(self):
        its = events.join_iterations(self.two_batches())
        self.assertEqual(len(its), 2)
        self.assertEqual([it["batch"] for it in its], [2, 1])
        self.assertEqual((its[0]["task_id"], its[0]["finished"]), ("T002", None))
        self.assertEqual((its[1]["task_id"], its[1]["cost"], its[1]["ok"]), ("T001", 1.0, True))

    def test_current_is_batch_two_with_cumulative_ordinal(self):
        cur = events.current_iteration(self.two_batches())
        self.assertEqual((cur["task_id"], cur["batch"], cur["i"], cur["ordinal"]), ("T002", 2, 1, 2))
        self.assertEqual(cur["stream"], "s2.jsonl")

    def test_totals_count_both(self):
        its = events.join_iterations(self.two_batches())
        t = events.totals(its, dt.datetime(2026, 10, 5, 23, 30, tzinfo=UTC), self.RUN)
        self.assertEqual(t["run"]["count"], 2)
        self.assertAlmostEqual(t["run"]["cost"], 1.0)

    def test_fixture_is_one_batch(self):
        its = events.join_iterations(load())
        self.assertEqual(len(its), 3)
        self.assertEqual({it["batch"] for it in its}, {1})


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


class GateStartedTests(unittest.TestCase):
    def test_current_names_the_running_gate_log(self):
        recs = load()
        started = dict(recs[2], event="gate_started", attempt=1, log="logs/loop/gate-3-x.log", ts="2026-10-05T23:14:00.000Z")
        started.pop("task_id", None)
        cur = events.current_iteration(recs + [{**started, "i": 3}])
        self.assertEqual((cur["gate_log"], cur["gate_started"]), ("logs/loop/gate-3-x.log", "2026-10-05T23:14:00.000Z"))
        finished = {"ts": "2026-10-05T23:16:00.000Z", "loop": "Alpha", "run": "20261005-221100", "event": "gate_finished",
                    "i": 3, "attempt": 1, "ok": False, "log": "logs/loop/gate-3-x.log"}
        cur2 = events.current_iteration(recs + [{**started, "i": 3}, finished])
        self.assertIsNone(cur2["gate_log"]); self.assertEqual(cur2["phase"], "gate retry")
        self.assertIsNone(events.current_iteration(recs)["gate_log"])  # old kits never emit gate_started


if __name__ == "__main__":
    unittest.main()
