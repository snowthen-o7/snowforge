"""SnowForge loop kit: email Alex when an overnight run stops, and why (2026-10-05).

Loops sat idle for hours more than once because nobody knew they had stopped: the supervising
session's background watches get killed when the machine runs short of memory. overnight.sh calls
this once, whatever ended the run (the queue empty, a gate failure, docs/BLOCKED.md, an API error,
the iteration total). It runs outside loop.sh's credential fence and reads the send-only Resend key
from Doppler (`sf-shared`, `prd`) at the moment it sends, so no key is ever written to disk.

Stdlib only. Usage (overnight.sh does this):
  python notify.py --name RiftMind --repo <path> --to <email> --reason "..." --code 0 \
      --iterations 12 --log-dir logs --run-log logs/overnight-<ts>.log [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

import os

# Resend's own sender: it may mail only the Resend account's owner, which is exactly who this is for,
# and needs no verified domain (snowforge.dev is not verified in Resend, 2026-10-05). Set
# LOOP_NOTIFY_FROM to "SnowForge Loops <loops@snowforge.dev>" once the domain is verified there.
FROM = os.environ.get("LOOP_NOTIFY_FROM", "SnowForge Loops <onboarding@resend.dev>")
CODES = {
    0: "finished",
    1: "stopped: the gate failed",
    2: "stopped: blocked on you",
    3: "stopped: usage limit",
    4: "stopped: API error",
    5: "refused to start",
}


def batch_logs(log_dir: Path, run_log: Path) -> list[Path]:
    """This run's batch logs: the ones written since the run log was created."""
    start = run_log.stat().st_mtime - 5 if run_log.exists() else 0
    return sorted(p for p in log_dir.glob("overnight-batch-*.log") if p.stat().st_mtime >= start)


def summary(batches: list[Path]) -> tuple[float, list[str], list[str]]:
    """Total cost, the 'iteration N took M min (commit)' lines, and the last batch's tail."""
    spent = 0.0
    done: list[str] = []
    tail: list[str] = []
    for path in batches:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        for line in lines:
            cost = re.match(r"cost: \$([0-9.]+)", line)
            if cost:
                spent += float(cost.group(1))
            if re.match(r"=== iteration \d+ took", line):
                done.append(line.strip("= ").strip())
        tail = lines[-15:]
    return spent, done, tail


def resend_key() -> str:
    result = subprocess.run(
        ["doppler", "secrets", "get", "RESEND_API_KEY", "--project", "sf-shared", "--config", "prd", "--plain"],
        capture_output=True,
        text=True,
        timeout=60,
    )
    key = result.stdout.strip()
    if result.returncode != 0 or not key:
        raise RuntimeError(f"no Resend key from Doppler: {result.stderr.strip()[:200]}")
    return key


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--to", required=True)
    parser.add_argument("--reason", required=True)
    parser.add_argument("--code", type=int, default=0)
    parser.add_argument("--iterations", type=int, default=0)
    parser.add_argument("--log-dir", default="logs")
    parser.add_argument("--run-log", default="")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    log_dir = Path(args.repo) / args.log_dir
    run_log = Path(args.repo) / args.run_log if args.run_log else log_dir / "missing.log"
    spent, done, tail = summary(batch_logs(log_dir, run_log))
    state = CODES.get(args.code, f"stopped (exit {args.code})")
    subject = f"[loop] {args.name} {state}: {args.iterations} iterations, ${spent:.2f}"
    body = "\n".join(
        [
            f"{args.name} {state}.",
            f"Why: {args.reason}",
            f"Iterations: {args.iterations}    Spent: ${spent:.2f}",
            f"Checkout: {args.repo}",
            "",
            "Tasks this run:",
            *(f"  {line}" for line in done[-25:]),
            *([] if done else ["  (none finished)"]),
            "",
            "Last lines of the last batch:",
            *(f"  {line}" for line in tail),
        ]
    )
    if args.dry_run:
        print(subject)
        print(body)
        return 0
    payload = json.dumps({"from": FROM, "to": [args.to], "subject": subject, "text": body}).encode()
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {resend_key()}",
            "Content-Type": "application/json",
            "User-Agent": "snowforge-loop-notify/1",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            print(f"stop notice sent ({response.status}): {subject}")
    except urllib.error.HTTPError as error:
        print(f"stop notice failed: {error.code} {error.read()[:300]!r}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
