import http.client, json, os, shutil, subprocess, tempfile, threading, time, unittest
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
        now = time.time()
        for p in (cls.root / "alpha" / "logs" / "loop").glob("*"):
            os.utime(p, (now, now))
        cls.monitor = srv.Monitor(cls.root, poll_s=0.2, rescan_s=0.5)
        cls.monitor.start()
        cls.httpd = srv.make_server(cls.root, 0, cls.monitor)
        cls.port = cls.httpd.server_address[1]
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()
        time.sleep(0.6)

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown(); cls.httpd.server_close(); cls.monitor.stop(); cls.tmp.cleanup()

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
        alpha = next(l for l in json.loads(self.get("/api/loops")[2])["loops"] if l["name"] == "Alpha")
        self.assertIn("T005", [t["id"] for t in alpha["queue"]])

    def test_sse_delivers_loop_update(self):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        try:
            self._sse_body(c)
        finally:
            c.close()

    def _sse_body(self, c):
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
        self.assertIsNotNone(got); self.assertEqual(got["state"]["reason"], "gate failed after iteration 3")

    def test_poll_survives_bad_event_data(self):
        ev_path = self.root / "alpha" / "logs" / "loop" / "events.jsonl"
        size = ev_path.stat().st_size
        try:
            with ev_path.open("a", encoding="utf-8", newline="\n") as f:
                f.write(json.dumps({"ts": "not-a-timestamp", "loop": "Alpha", "run": "20261005-221100",
                                    "event": "iteration_started", "scope": "iteration", "i": 99}) + "\n")
            self.monitor.poll_once()  # must not raise
            self.assertTrue(self.monitor.is_alive())
            status, _, body = self.get("/api/loops")
            self.assertEqual(status, 200)
            alpha = next(l for l in json.loads(body)["loops"] if l["name"] == "Alpha")
            self.assertTrue(any(w.startswith("poll error:") for w in alpha["warnings"])
                            or (alpha["current"] is not None and alpha["current"]["elapsed_s"] is None))
        finally:
            with ev_path.open("r+b") as f:
                f.truncate(size)
            self.monitor.poll_once()

    def test_bound_to_localhost_only(self):
        self.assertEqual(self.httpd.server_address[0], "127.0.0.1")


class IndexTests(unittest.TestCase):
    def setUp(self):
        self.html = (Path(srv.__file__).parent / "index.html").read_text(encoding="utf-8")

    def test_theme_and_labels(self):
        for needle in ("prefers-color-scheme: dark", '[data-theme="dark"]', '[data-theme="light"]', "loopdash.theme",
                       "API-equivalent", "new EventSource('/api/events')", "id=\"add-task\"", "<title>SnowForge loops</title>"):
            self.assertIn(needle, self.html, needle)

    def test_no_raw_tier_interpolation(self):
        self.assertIn('title="${esc(t)} ', self.html)
        self.assertNotIn('title="${t} ', self.html)

    def test_no_external_scripts(self):
        self.assertNotIn("<script src=", self.html)
        self.assertEqual(self.html.count("<link rel=\"stylesheet\""), 1)  # the one Google Fonts link


if __name__ == "__main__":
    unittest.main()
