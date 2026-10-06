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
