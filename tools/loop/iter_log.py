"""Turn one loop iteration's `claude -p --output-format json` output into the iteration log,
and print its cost for the batch log.

RiftMind's `scripts/loop.sh` used to tee the text output straight into `logs/iter-N-<ts>.log`, which left
no record of what an iteration cost. With JSON output the cost rides on the result: this writes
`<log>` as the iteration's report text followed by whatever the nested session wrote to stderr,
so everything that read the old text log (the usage-limit grep in loop.sh, a person) reads the
same, and prints one line — `cost: $2.41, 38 turns, 21 min` — that loop.sh echoes into the
batch log. Malformed JSON (a session killed mid-write) is copied through verbatim and the line
says so, so nothing is lost when the interesting case happens.

Usage: python iter_log.py <stdout.json> <stderr.txt> <log>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    out_path, err_path, log_path = (Path(p) for p in argv[1:4])
    raw = out_path.read_text(encoding="utf-8", errors="replace") if out_path.is_file() else ""
    err = err_path.read_text(encoding="utf-8", errors="replace") if err_path.is_file() else ""
    text = raw
    line = "cost: unknown (json unparsed)"
    try:
        data = json.loads(raw)
    except ValueError:
        data = None
    if isinstance(data, dict):
        text = str(data.get("result", "")) or raw
        cost = data.get("total_cost_usd")
        turns = data.get("num_turns")
        ms = data.get("duration_ms")
        parts = []
        if isinstance(cost, (int, float)):
            parts.append(f"${cost:.2f}")
        if isinstance(turns, int):
            parts.append(f"{turns} turns")
        if isinstance(ms, (int, float)):
            parts.append(f"{int(ms) // 60000} min")
        if data.get("is_error"):
            parts.append("is_error")
        line = "cost: " + (", ".join(parts) if parts else "unknown (no cost field)")
    body = text.rstrip("\n") + "\n"
    if err.strip():
        body += "\n--- stderr ---\n" + err.rstrip("\n") + "\n"
    log_path.write_text(body, encoding="utf-8", newline="\n")
    print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
