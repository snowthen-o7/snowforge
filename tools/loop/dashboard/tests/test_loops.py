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
            found = loops.discover(Path(tmp))
            self.assertEqual([l.name for l in found], ["Same (one)", "Same (two)"])
            for l in found:
                self.assertIn("another loop is also named Same; shown with its folder", l.warnings)


if __name__ == "__main__":
    unittest.main()
