"""TASKS.md: the open queue, the next id, and the one write the dashboard makes (append a task)."""

from __future__ import annotations

import hashlib
import re
import subprocess
from collections import Counter
from pathlib import Path

TIERS = ("haiku", "sonnet", "opus", "fable")
_OPEN = re.compile(r"^- \[ \] +(\S+)(.*)$")
_ANY = re.compile(r"^- \[[ xX]\] +(\S+)")
_BOLD = re.compile(r"\*\*(.+?)\*\*")
_TAG = re.compile(r"model:(haiku|sonnet|opus|fable)")
_BRACE = re.compile(r"\{model: *([A-Za-z0-9._-]+)\}")
_ID = re.compile(r"^[A-Za-z][A-Za-z0-9._-]*$")
_SPLIT_ID = re.compile(r"^([A-Za-z]+)(\d+)$")


class QueueError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def parse_queue(text: str) -> list[dict]:
    out = []
    for line in text.splitlines():
        m = _OPEN.match(line)
        if not m:
            continue
        rest = m.group(2)
        bold = _BOLD.search(rest)
        title = bold.group(1) if bold else _TAG.sub("", _BRACE.sub("", rest)).strip()
        tag = _TAG.search(rest)
        brace = _BRACE.search(rest)
        out.append({"id": m.group(1), "title": title, "model": tag.group(1) if tag else (brace.group(1) if brace else None), "line": line})
    return out


def suggest_id(tasks_text: str, archive_text: str = "") -> str:
    ids = [m.group(1) for line in (tasks_text + "\n" + archive_text).splitlines() if (m := _ANY.match(line))]
    parsed = [(s.group(1), s.group(2)) for i in ids if (s := _SPLIT_ID.match(i))]
    if not parsed:
        return "T001"
    prefix = Counter(p for p, _ in parsed).most_common(1)[0][0]
    nums = [n for p, n in parsed if p == prefix]
    width = max(len(n) for n in nums)
    return f"{prefix}{max(int(n) for n in nums) + 1:0{width}d}"


def compose_line(fields: dict) -> str:
    ident = str(fields.get("id", "")).strip()
    title = str(fields.get("title", "")).strip()
    tier = str(fields.get("tier", "")).strip()
    if not _ID.match(ident):
        raise QueueError("invalid", "id must start with a letter and contain only letters, digits, . _ -")
    if not title:
        raise QueueError("invalid", "title is required")
    if tier not in TIERS:
        raise QueueError("invalid", f"tier must be one of {', '.join(TIERS)}")
    parts = [f"- [ ] {ident} **{title}**"]
    who = str(fields.get("who", "")).strip()
    if who:
        parts.append(f"({who}).")
    for key in ("exists", "build", "test"):
        value = " ".join(str(fields.get(key, "")).split())
        if value:
            parts.append(value)
    parts.append(f"model:{tier}")
    return " ".join(parts)


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else ""


def is_staged(repo: Path) -> bool:
    try:
        out = subprocess.run(["git", "-C", str(repo), "diff", "--cached", "--name-only", "--", "TASKS.md"],
                             capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return False
    return bool(out.stdout.strip())


def append_task(repo: Path, fields: dict, expected_sha: str) -> dict:
    path = repo / "TASKS.md"
    if not path.is_file():
        raise QueueError("missing", "TASKS.md not found in this checkout")
    line = compose_line(fields)
    if file_sha(path) != expected_sha:
        raise QueueError("changed", "TASKS.md changed since the preview; reload and try again")
    if is_staged(repo):
        raise QueueError("staged", "TASKS.md has staged changes (a session may be mid-commit); try again shortly")
    ident = line.split()[3]
    existing = {m.group(1) for f in (path, repo / "TASKS-archive.md") if f.is_file()
                for l in f.read_text(encoding="utf-8", errors="replace").splitlines() if (m := _ANY.match(l))}
    if ident in existing:
        raise QueueError("duplicate", f"{ident} is already in TASKS.md or TASKS-archive.md")
    lines = path.read_text(encoding="utf-8").split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    at = max((i for i, l in enumerate(lines) if _OPEN.match(l)), default=-1)
    if at < 0:
        at = max((i for i, l in enumerate(lines) if _ANY.match(l)), default=len(lines) - 1)
    lines.insert(at + 1, line)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    return {"line": line, "sha": file_sha(path)}
