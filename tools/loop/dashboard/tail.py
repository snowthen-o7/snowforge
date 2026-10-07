"""Turn a session's stream-json lines into the entries the live tail shows."""

from __future__ import annotations

import json
from pathlib import Path

_FILE_TOOLS = {"Read", "Edit", "Write", "NotebookEdit"}


def split_complete(chunk: bytes) -> tuple[list[str], int]:
    end = chunk.rfind(b"\n")
    if end < 0:
        return [], 0
    text = chunk[: end + 1].decode("utf-8", errors="replace")
    return [l for l in text.split("\n") if l.strip()], end + 1


def _clip(text: str, n: int) -> str:
    text = text.replace("\r", "")
    return text if len(text) <= n else text[:n] + "…"


def _rel(path: str, repo: Path) -> str:
    try:
        return Path(path).resolve().relative_to(repo.resolve()).as_posix()
    except (ValueError, OSError):
        return path


def summarize_tool(name: str, inp: dict, repo: Path) -> str:
    if name == "Bash":
        return _clip(str(inp.get("command", "")).split("\n", 1)[0], 200)
    if name in _FILE_TOOLS:
        rel = _rel(str(inp.get("file_path", inp.get("notebook_path", ""))), repo)
        if name == "Edit" and "old_string" in inp and "new_string" in inp:
            plus = str(inp["new_string"]).count("\n") + 1
            minus = str(inp["old_string"]).count("\n") + 1
            return f"{rel}  (+{plus} −{minus})"
        return rel
    if name in {"Grep", "Glob"}:
        parts = [str(inp.get("pattern", ""))]
        if inp.get("path"):
            parts.append(_rel(str(inp["path"]), repo))
        return "  ".join(parts)
    return _clip(json.dumps(inp, ensure_ascii=False), 120)


def _entry(t: str, kind: str, text: str, hidden: bool = False) -> dict:
    return {"t": t, "kind": kind, "text": text, "hidden": hidden}


def _result_text(content) -> str:
    if isinstance(content, list):
        content = "\n".join(str(b.get("text", "")) for b in content if isinstance(b, dict))
    first = str(content or "").strip().split("\n", 1)[0].strip()
    return _clip(first, 200) if first else "(empty)"


def render_line(line: str, repo: Path, stamp: str) -> list[dict]:
    try:
        return _render(line, repo, stamp)
    except Exception:  # one odd line must never stall the tail
        return []


def _render(line: str, repo: Path, stamp: str) -> list[dict]:
    try:
        obj = json.loads(line)
    except ValueError:
        return []
    if not isinstance(obj, dict):
        return []
    kind = obj.get("type")
    if kind == "system":
        sub = str(obj.get("subtype", ""))
        if sub.startswith("hook") or sub == "thinking_tokens":
            return [_entry(stamp, "hook", sub.replace("_", " ") + (f": {obj['hook']}" if obj.get("hook") else ""), True)]
        return []
    if kind == "result":
        cost = obj.get("total_cost_usd")
        parts = []
        if isinstance(cost, (int, float)):
            parts.append(f"cost ${cost:.2f}")
        if isinstance(obj.get("num_turns"), int):
            parts.append(f"{obj['num_turns']} turns")
        if isinstance(obj.get("duration_ms"), (int, float)):
            parts.append(f"{int(obj['duration_ms']) // 60000} min")
        if obj.get("is_error"):
            parts.append("error")
        return [_entry(stamp, "end", ", ".join(parts) or "finished")]
    if kind not in {"assistant", "user"}:
        return []
    out: list[dict] = []
    message = obj.get("message")
    content = message.get("content") if isinstance(message, dict) else None
    for block in content if isinstance(content, list) else []:
        if not isinstance(block, dict):
            continue
        b = block.get("type")
        if b == "text" and kind == "assistant" and block.get("text"):
            out.append(_entry(stamp, "said", str(block["text"]).strip()))
        elif b == "tool_use":
            name = str(block.get("name", "tool"))
            out.append(_entry(stamp, name, summarize_tool(name, block["input"] if isinstance(block.get("input"), dict) else {}, repo)))
        elif b == "tool_result":
            out.append(_entry(stamp, "result", _result_text(block.get("content"))))
        elif b == "thinking":
            out.append(_entry(stamp, "hook", "thinking", True))
    return out


def bootstrap_with_offset(path: Path, repo: Path, limit: int = 300) -> tuple[list[dict], int]:
    """The last `limit` entries of a stream and how many bytes were consumed (the offset to resume at)."""
    if not path.is_file():
        return [], 0
    lines, used = split_complete(path.read_bytes())
    entries: list[dict] = []
    for line in lines:
        entries.extend(render_line(line, repo, ""))
    return entries[-limit:], used


def bootstrap(path: Path, repo: Path, limit: int = 300) -> list[dict]:
    return bootstrap_with_offset(path, repo, limit)[0]


# Live spend (2026-10-06, Alex: the dashboard showed $0.00 for an hour-old session). A session's
# cost arrives only in its final `result` line, but every assistant message in the stream carries
# its token usage. Tokens are weighted by Anthropic's price structure relative to a model's base
# input price (cache read 0.1, 5-minute cache write 1.25, 1-hour cache write 2, output 5), and the
# loop's own finished sessions turn weighted tokens into dollars per model (`Spend.rates`), so no
# price list is kept here. The stream's output counts are partial (a message's usage is written as
# it starts), which the calibration absorbs: it measures finished sessions the same way.
def usage_units(usage: dict) -> float:
    creation = usage.get("cache_creation")
    if isinstance(creation, dict):
        written = 1.25 * _n(creation, "ephemeral_5m_input_tokens") + 2.0 * _n(creation, "ephemeral_1h_input_tokens")
    else:
        written = 1.25 * _n(usage, "cache_creation_input_tokens")
    return _n(usage, "input_tokens") + 0.1 * _n(usage, "cache_read_input_tokens") + written + 5.0 * _n(usage, "output_tokens")


def _n(mapping: dict, key: str) -> float:
    value = mapping.get(key)
    return float(value) if isinstance(value, (int, float)) else 0.0


class SessionUsage:
    """One session's turns and weighted tokens so far, read line by line from its stream."""

    def __init__(self) -> None:
        self.by_message: dict[str, float] = {}
        self.model: str | None = None

    def feed(self, line: str) -> None:
        try:
            obj = json.loads(line)
        except ValueError:
            return
        if not isinstance(obj, dict) or obj.get("type") != "assistant":
            return
        message = obj.get("message")
        if not isinstance(message, dict) or not isinstance(message.get("usage"), dict):
            return
        key = str(message.get("id") or len(self.by_message))
        # one message is several lines (a line per content block); keep its largest reading
        self.by_message[key] = max(self.by_message.get(key, 0.0), usage_units(message["usage"]))
        if message.get("model"):
            self.model = str(message["model"])

    @property
    def turns(self) -> int:
        return len(self.by_message)

    @property
    def units(self) -> float:
        return sum(self.by_message.values())


def session_usage(path: Path) -> SessionUsage:
    usage = SessionUsage()
    if path.is_file():
        for line in split_complete(path.read_bytes())[0]:
            usage.feed(line)
    return usage
