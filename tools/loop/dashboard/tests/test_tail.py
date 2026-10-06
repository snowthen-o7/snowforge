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
