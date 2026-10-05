"""Move every checked-off task line of TASKS.md, with its continuation lines, to TASKS-archive.md.

Why (2026-09-20): the loop reads TASKS.md whole at the start of every iteration, and by then the
file was 1.83 MB of which 1.53 MB was 585 checked-off lines and their Done notes — about 450k
tokens of history paid for before any work. The open lines were 4 KB. So the checked lines live in
`TASKS-archive.md`, append-only and grouped under the section header they came from, and
TASKS.md keeps the intro, the section headers, the open lines and the parked `- [A]` lines.
`scripts/loop.sh` runs this before each iteration and commits the two files when a line moved;
`scripts/selfplay_report.py` reads both files when it picks free ids and dedupes its lines.

An entry is a task line (`- [x]`, `- [ ]`, `- [A]`) plus every line under it until the next task
line or header — indented sub-bullets, the unindented lines a note wraps onto, and the blank
lines that follow, which travel with it. Idempotent:
a second run moves nothing and prints `moved 0`.

Usage: python archive_tasks.py (the kit passes --tasks and --archive explicitly) [--tasks TASKS.md] [--archive TASKS-archive.md]
"""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POINTER = (
    "Checked-off lines are not here: `scripts/archive_tasks.py` (run by `scripts/loop.sh` before "
    "each iteration, since 2026-09-20) moves every `- [x]` line with its note to "
    "`TASKS-archive.md`, append-only under the section it came from. A past task's Done note is "
    "found with `grep -n '^- \\[x\\] T0xx' TASKS-archive.md`, never by reading either file whole."
)
ARCHIVE_HEAD = (
    "# Task archive\n\n"
    "Every checked-off line of `TASKS.md`, moved here by `scripts/archive_tasks.py` with its "
    "continuation lines, append-only, under the section header it came from (stamped with the "
    "day it moved). Ids stay unique across both files: `scripts/selfplay_report.py` reads this "
    "file too when it picks a free id. Find a task with `grep -n '^- \\[x\\] T0xx'`.\n"
)


def _is_task(line: str) -> bool:
    return line.startswith("- [")


def _is_header(line: str) -> bool:
    return line.startswith("#")


def _blocks(lines: list[str]) -> list[tuple[str, list[str]]]:
    """(kind, lines) blocks: 'task' (a task line and what hangs under it), 'header', 'other'."""
    blocks: list[tuple[str, list[str]]] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if _is_task(line):
            block = [line]
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if _is_task(nxt) or _is_header(nxt):
                    break
                # everything else under a task line is its note: indented sub-bullets, blank
                # lines, and the unindented lines a note wraps onto (a code span holding a newline)
                block.append(nxt)
                i += 1
            blocks.append(("task", block))
        elif _is_header(line):
            blocks.append(("header", [line]))
            i += 1
        else:
            blocks.append(("other", [line]))
            i += 1
    return blocks


def archive(tasks: Path, archive_path: Path, today: str) -> int:
    text = tasks.read_text(encoding="utf-8")
    lines = text.split("\n")
    blocks = _blocks(lines)
    kept: list[str] = []
    moved: list[str] = []
    moved_count = 0
    section = ""
    section_written = ""
    pointer_present = POINTER in text
    for kind, block in blocks:
        if kind == "header":
            section = block[0]
            if kept and kept[-1] != "":
                kept.append("")  # a header keeps a blank line before it
            kept.extend(block)
            kept.append("")  # and one after, where the moved entries carried it away
            continue
        if kind == "task" and block[0].startswith("- [x]"):
            if section and section != section_written:
                moved.append("")
                moved.append(f"{section} (archived {today})")
                moved.append("")
                section_written = section
            moved.extend(block)
            moved_count += 1
            continue
        kept.extend(block)
    if moved_count == 0:
        return 0
    if not pointer_present:
        # after the intro paragraph that starts "Ordered." — the first prose line of the file
        for idx, line in enumerate(kept):
            if line.startswith("Ordered."):
                kept[idx : idx + 1] = [line, "", POINTER]
                break
    # collapse runs of three or more blank lines the moves leave behind
    out: list[str] = []
    for line in kept:
        if line == "" and len(out) >= 2 and out[-1] == "" and out[-2] == "":
            continue
        out.append(line)
    tasks.write_text("\n".join(out), encoding="utf-8", newline="\n")
    existing = archive_path.read_text(encoding="utf-8") if archive_path.is_file() else ARCHIVE_HEAD
    if not existing.endswith("\n"):
        existing += "\n"
    body = "\n".join(moved).rstrip("\n") + "\n"
    archive_path.write_text(existing + body, encoding="utf-8", newline="\n")
    return moved_count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--tasks", type=Path, default=ROOT / "TASKS.md")
    parser.add_argument("--archive", type=Path, default=ROOT / "TASKS-archive.md")
    parser.add_argument("--today", default=dt.date.today().isoformat())
    args = parser.parse_args()
    print(f"moved {archive(args.tasks, args.archive, args.today)}")


if __name__ == "__main__":
    main()
