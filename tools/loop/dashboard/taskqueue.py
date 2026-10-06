"""TASKS.md: the open queue, the next id, and the one write the dashboard makes (append a task)."""

from __future__ import annotations

import hashlib
import os
import re
import subprocess
import tempfile
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
    title = " ".join(str(fields.get("title", "")).split())
    tier = str(fields.get("tier", "")).strip()
    if not _ID.match(ident):
        raise QueueError("invalid", "id must start with a letter and contain only letters, digits, . _ -")
    if not title:
        raise QueueError("invalid", "title is required")
    if "**" in title:
        raise QueueError("invalid", "title may not contain **")
    if tier not in TIERS:
        raise QueueError("invalid", f"tier must be one of {', '.join(TIERS)}")
    who = " ".join(str(fields.get("who", "")).split())
    for part in (ident, title, who):
        if part and any(ord(c) < 32 and c not in (" ", "\t", "\n") for c in part):
            raise QueueError("invalid", "fields must not contain control characters")
    for key in ("exists", "build", "test"):
        value = " ".join(str(fields.get(key, "")).split())
        if value and any(ord(c) < 32 and c not in (" ", "\t", "\n") for c in value):
            raise QueueError("invalid", "fields must not contain control characters")
    parts = [f"- [ ] {ident} **{title}**"]
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
    # Check if this is a git repository by looking for .git
    if not (repo / ".git").exists():
        raise QueueError("git", "TASKS.md is not in a git repository")
    try:
        # Check for staged changes
        out = subprocess.run(["git", "-C", str(repo), "diff", "--cached", "--name-only", "--", "TASKS.md"],
                             capture_output=True, text=True, timeout=10, check=False)
        if out.returncode != 0:
            raise QueueError("git", f"could not check the git index: {out.stderr[:200]}")
        return bool(out.stdout.strip())
    except (OSError, subprocess.TimeoutExpired) as e:
        raise QueueError("git", f"could not check the git index: {str(e)[:200]}")


def append_task(repo: Path, fields: dict, expected_sha: str) -> dict:
    path = repo / "TASKS.md"
    if not path.is_file():
        raise QueueError("missing", "TASKS.md not found in this checkout")

    # Read file once as bytes
    data = path.read_bytes()

    # Compute SHA and compare
    actual_sha = hashlib.sha256(data).hexdigest()
    if actual_sha != expected_sha:
        raise QueueError("changed", "TASKS.md changed since the preview; reload and try again")

    # Check git status
    if is_staged(repo):
        raise QueueError("staged", "TASKS.md has staged changes (a session may be mid-commit); try again shortly")

    # Decode UTF-8
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        raise QueueError("invalid", "TASKS.md is not valid UTF-8")

    # Detect line separator from data
    nl = "\r\n" if b"\r\n" in data else "\n"

    # Split text on actual separator
    lines = text.split(nl)
    if lines and lines[-1] == "":
        lines.pop()

    # Compose and validate the line
    line = compose_line(fields)
    ident = line.split()[3]

    # Check for duplicates in both files
    archive = repo / "TASKS-archive.md"
    archive_text = archive.read_text(encoding="utf-8", errors="replace") if archive.is_file() else ""
    existing = {m.group(1) for l in text.splitlines() + archive_text.splitlines() if (m := _ANY.match(l))}
    if ident in existing:
        raise QueueError("duplicate", f"{ident} is already in TASKS.md or TASKS-archive.md")

    # Find insertion point
    at = max((i for i, l in enumerate(lines) if _OPEN.match(l)), default=-1)
    if at < 0:
        at = max((i for i, l in enumerate(lines) if _ANY.match(l)), default=len(lines) - 1)

    # Insert line
    lines.insert(at + 1, line)

    # Build new content with detected separator
    new_content = nl.join(lines) + nl
    new_bytes = new_content.encode("utf-8")

    # Atomic write via temp file
    tmp_fd = None
    tmp_path = None
    try:
        tmp_fd, tmp_path = tempfile.mkstemp(prefix=".TASKS.", suffix=".tmp", dir=path.parent)
        os.write(tmp_fd, new_bytes)
        os.fsync(tmp_fd)
        os.close(tmp_fd)
        tmp_fd = None
        os.replace(tmp_path, path)
    except Exception:
        if tmp_fd is not None:
            try:
                os.close(tmp_fd)
            except OSError:
                pass
        if tmp_path is not None:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
        raise

    new_sha = hashlib.sha256(new_bytes).hexdigest()
    return {"line": line, "sha": new_sha}
