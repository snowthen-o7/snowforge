"""SnowForge loop kit: append one event to <LOG_DIR>/events.jsonl (2026-10-05).

loop.sh and overnight.sh call this instead of printing JSON from bash, which breaks on task
text with quotes. Usage:

    python emit.py <event> [key=value ...]

Environment: LOOP_NAME (the loop), LOG_DIR (default "logs"), LOOP_RUN (the run id; see loop.sh).
Values: "true"/"false" become booleans, "null" becomes null, an integer or decimal literal
without a leading zero becomes a number, anything else stays a string. A value may contain "=".
Stdlib only. The dashboard (tools/loop/dashboard) reads what this writes.
"""

from __future__ import annotations

import datetime as _dt
import json
import os
import re
import sys
from pathlib import Path
from typing import Mapping

_NUMBER = re.compile(r"^-?(0|[1-9]\d*)(\.\d+)?$")
RESERVED = {"ts", "loop", "run", "event"}  # set by record(); a caller's key=value cannot overwrite them


def coerce(value: str) -> object:
    if value == "true":
        return True
    if value == "false":
        return False
    if value == "null":
        return None
    if _NUMBER.match(value):
        return float(value) if "." in value else int(value)
    return value


def record(event: str, pairs: list[str], env: Mapping[str, str]) -> dict:
    now = _dt.datetime.now(_dt.timezone.utc)
    rec: dict = {
        "ts": now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z",
        "loop": env.get("LOOP_NAME", "?"),
        "run": env.get("LOOP_RUN", ""),
        "event": event,
    }
    for pair in pairs:
        key, _, value = pair.partition("=")
        if key in RESERVED:
            print(f"emit.py: ignoring reserved key {key!r} in {event}", file=sys.stderr)
            continue
        rec[key] = coerce(value)
    return rec


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: emit.py <event> [key=value ...]", file=sys.stderr)
        return 2
    rec = record(argv[1], argv[2:], os.environ)
    path = Path(os.environ.get("LOG_DIR", "logs")) / "events.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
