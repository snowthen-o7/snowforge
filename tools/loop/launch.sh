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
if [[ -f "$REPO/.loop/config.sh" ]]; then
  LOG_DIR="$(cd "$REPO" && bash -c 'LOG_DIR=logs; gate() { :; }; source .loop/config.sh >/dev/null 2>&1; echo "$LOG_DIR"')"
fi
SNAP="$REPO/$LOG_DIR/.loop-kit"
rm -rf "$SNAP"
mkdir -p "$SNAP"
cp "$KIT_SRC"/loop.sh "$KIT_SRC"/overnight.sh "$KIT_SRC"/notify.py "$KIT_SRC"/iter_log.py "$KIT_SRC"/archive_tasks.py "$SNAP"/
exec bash "$SNAP/$MODE.sh" "$REPO" "$@"
