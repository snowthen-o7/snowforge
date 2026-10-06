#!/usr/bin/env bash
# SnowForge loop kit entry point (2026-10-05).
#
#   launch.sh <repo> loop      [max_iterations] [max_usd_per_iteration]   one batch
#   launch.sh <repo> overnight [total_iterations] [max_usd_per_iteration] batches + stop notice
#
# Copies the kit into <repo>/<LOG_DIR>/.loop-kit/ and runs that copy. bash reads a script by byte
# offset while it runs, so a run must never execute a file someone may edit: RiftMind lost a batch
# to that on 2026-09-08, and once the kit is shared every repo's edit would hit every other repo's
# run. The copy is per repo and refreshed at each launch, so the kit can change at any time.
set -euo pipefail
REPO="$(cd "${1:?repo path}" && pwd)"
MODE="${2:?loop or overnight}"
shift 2
case "$MODE" in loop|overnight) ;; *) echo "mode must be loop or overnight" >&2; exit 2 ;; esac
KIT_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="logs"
KEEP_DAYS="14"
if [[ -f "$REPO/.loop/config.sh" ]]; then
  LOG_DIR="$(cd "$REPO" && bash -c 'LOG_DIR=logs; gate() { :; }; source .loop/config.sh >/dev/null 2>&1; echo "$LOG_DIR"')"
  KEEP_DAYS="$(cd "$REPO" && bash -c 'LOOP_KEEP_DAYS=14; gate() { :; }; source .loop/config.sh >/dev/null 2>&1; echo "$LOOP_KEEP_DAYS"')"
fi
# Per-iteration and gate logs pile up (RiftMind reached 2,000 files / 350 MB in a month); drop the
# ones older than LOOP_KEEP_DAYS before each run. events.jsonl and the overnight run logs are kept.
if [[ "$KEEP_DAYS" =~ ^[0-9]+$ && "$KEEP_DAYS" -gt 0 && -d "$REPO/$LOG_DIR" ]]; then
  find "$REPO/$LOG_DIR" -maxdepth 1 -type f -mtime "+$KEEP_DAYS" \
    \( -name 'iter-*' -o -name 'gate-*' -o -name 'overnight-batch-*' -o -name 'batch-*' \) -delete
fi
SNAP="$REPO/$LOG_DIR/.loop-kit"
rm -rf "$SNAP"
mkdir -p "$SNAP"
cp "$KIT_SRC"/loop.sh "$KIT_SRC"/overnight.sh "$KIT_SRC"/notify.py "$KIT_SRC"/iter_log.py "$KIT_SRC"/archive_tasks.py "$KIT_SRC"/emit.py "$SNAP"/
git -C "$KIT_SRC" rev-parse --short HEAD > "$SNAP/VERSION" 2>/dev/null || echo unknown > "$SNAP/VERSION"
exec bash "$SNAP/$MODE.sh" "$REPO" "$@"
