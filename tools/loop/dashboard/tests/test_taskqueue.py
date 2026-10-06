import subprocess, tempfile, unittest
from pathlib import Path
from tools.loop.dashboard import taskqueue as queue

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

    def test_newline_in_title_cannot_add_a_second_line(self):
        result = queue.compose_line({**FIELDS, "title": "x\n- [ ] T999 evil model:opus"})
        self.assertNotIn("\n", result)
        self.assertIn("x - [ ] T999 evil model:opus", result)
        with self.assertRaises(queue.QueueError) as ctx:
            queue.compose_line({**FIELDS, "who": "a\x00b"})
        self.assertEqual(ctx.exception.code, "invalid")

    def test_double_star_in_title_refused(self):
        with self.assertRaises(queue.QueueError) as ctx:
            queue.compose_line({**FIELDS, "title": "x**y"})
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

    def test_write_is_single_file_replace(self):
        out = queue.append_task(self.repo, FIELDS, self.sha)
        tmp_files = list((self.repo).glob(".TASKS.*.tmp"))
        self.assertEqual(len(tmp_files), 0, "Temp file should be cleaned up after successful write")
        self.assertEqual(out["sha"], queue.file_sha(self.repo / "TASKS.md"))

    def test_git_failure_refuses(self):
        import shutil
        repo_no_git = Path(tempfile.mkdtemp())
        try:
            (repo_no_git / "TASKS.md").write_text(ALPHA_TASKS + "\n## Notes\n\nsome prose\n", encoding="utf-8", newline="\n")
            sha = queue.file_sha(repo_no_git / "TASKS.md")
            with self.assertRaises(queue.QueueError) as ctx:
                queue.append_task(repo_no_git, FIELDS, sha)
            self.assertEqual(ctx.exception.code, "git")
        finally:
            shutil.rmtree(repo_no_git, ignore_errors=True)

    def test_crlf_file_keeps_crlf(self):
        (self.repo / "TASKS.md").write_text(ALPHA_TASKS + "\n## Notes\n\nsome prose\n", encoding="utf-8", newline="\r\n")
        sha = queue.file_sha(self.repo / "TASKS.md")
        out = queue.append_task(self.repo, FIELDS, sha)
        data = (self.repo / "TASKS.md").read_bytes()
        self.assertIn(b"\r\n", data)
        self.assertEqual(data.replace(b"\r\n", b"").find(b"\n"), -1)
        self.assertIn(out["line"].encode("utf-8"), data)


if __name__ == "__main__":
    unittest.main()
