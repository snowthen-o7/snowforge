#!/usr/bin/env bash
# SnowForge loop kit: an unattended run of loop.sh batches (2026-10-05; from RiftMind's overnight.sh).
#
#   launch.sh <repo> overnight [total_iterations] [max_usd_per_iteration]
#
# loop.sh stops itself on the account's usage limit (exit 3); this sleeps past the reset and
# relaunches it with the iterations still owed, until the total is reached or the loop stops for
# a real reason (0 queue empty, 1 gate failed, 2 blocked, 4 API error, 5 refused). Whatever ends
# the run, notify.py then emails why (README.md, "Stop notices"): a loop that stops is never left
# idle without anyone knowing. This wrapper runs outside loop.sh's credential fence, which is
# what lets the notice reach Doppler for the mail key.
main() {
set -uo pipefail
REPO="${1:?repo path}"; shift
cd "$REPO" || exit 9
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOTAL="${1:-25}"
MAX_USD="${2:-25}"
LOOP_NAME="$(basename "$REPO")"; LOG_DIR="logs"; PYTHON="python"
NOTIFY_TO="alexitofrancis@gmail.com"
# shellcheck source=/dev/null
[[ -f .loop/config.sh ]] && source .loop/config.sh
mkdir -p "$LOG_DIR"
RUN_LOG="$LOG_DIR/overnight-$(date +%Y%m%d-%H%M%S).log"
log() { echo "[$(date '+%F %T')] $*" | tee -a "$RUN_LOG"; }
# Events for the dashboard: the run id is this log's timestamp; loop.sh inherits it and the mode.
LOOP_RUN="${RUN_LOG##*/overnight-}"; LOOP_RUN="${LOOP_RUN%.log}"
export LOOP_NAME LOG_DIR LOOP_RUN LOOP_MODE=overnight
emit() { "$PYTHON" "$KIT/emit.py" "$@" || log "emit failed: $*"; }
emit loop_started scope=run mode=overnight "max_iter=$TOTAL" "max_usd=$MAX_USD" \
  "branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')" \
  "kit_version=$(cat "$KIT/VERSION" 2>/dev/null || echo unknown)"
trap 'log "SIGINT received; ignoring"' INT
trap 'log "SIGHUP received; ignoring"' HUP

# "You've hit your session limit · resets 3am (America/Los_Angeles)": seconds until a minute past.
seconds_until_reset() {
  local msg="$1" hh mm ampm target now
  if [[ "$msg" =~ resets\ ([0-9]{1,2})(:([0-9]{2}))?(am|pm) ]]; then
    hh="${BASH_REMATCH[1]}"; mm="${BASH_REMATCH[3]:-00}"; ampm="${BASH_REMATCH[4]}"
    if [[ "$ampm" == "pm" && "$hh" != "12" ]]; then hh=$((10#$hh + 12)); fi
    if [[ "$ampm" == "am" && "$hh" == "12" ]]; then hh=0; fi
    now=$(date +%s)
    target=$(date -d "today $(printf '%02d:%02d' "$hh" "$((10#$mm))")" +%s 2>/dev/null) || return 1
    if (( target <= now )); then target=$(( target + 86400 )); fi
    echo $(( target - now + 60 ))
    return 0
  fi
  return 1
}

done_iters=0
rc=0
reason="reached $TOTAL iterations"
while (( done_iters < TOTAL )); do
  remaining=$(( TOTAL - done_iters ))
  log "launching loop.sh for $remaining iteration(s) ($done_iters of $TOTAL done)"
  batch_log="$LOG_DIR/overnight-batch-$(date +%Y%m%d-%H%M%S).log"
  bash "$KIT/loop.sh" "$REPO" "$remaining" "$MAX_USD" 2>&1 | tee "$batch_log"
  rc=${PIPESTATUS[0]}
  # An iteration that hit the usage limit did no work, so it is not counted.
  started=$(grep -cE '^=== iteration [0-9]+ \(' "$batch_log" || true)
  if (( rc == 3 )); then started=$(( started - 1 )); fi
  (( started < 0 )) && started=0
  done_iters=$(( done_iters + started ))
  case "$rc" in
    0)
      log "loop.sh finished ($done_iters of $TOTAL done): $(tail -n 1 "$batch_log")"
      if grep -q 'No unchecked tasks' "$batch_log"; then reason="the queue is empty"; break; fi
      ;;
    3)
      msg=$(grep -m1 -E 'hit your (session|weekly) limit' "$batch_log" || true)
      if wait=$(seconds_until_reset "$msg"); then
        log "usage limit ($msg); sleeping $(( wait / 60 )) min until the reset"
      else
        wait=1800
        log "usage limit, reset time unparsed ($msg); sleeping 30 min and retrying"
      fi
      emit usage_limit_sleep "seconds=$wait" "until=$(date -u -d "@$(( $(date +%s) + wait ))" +%FT%TZ)" "message=$msg"
      sleep "${LOOP_TEST_SLEEP_SECONDS:-$wait}"
      ;;
    *)
      reason="loop.sh exited $rc: $(tail -n 1 "$batch_log")"
      log "loop.sh exited $rc after $done_iters iteration(s); stopping for review: $(tail -n 1 "$batch_log")"
      break
      ;;
  esac
done
(( done_iters >= TOTAL && rc == 0 )) && log "reached $TOTAL iterations."
emit loop_stopped scope=run "code=$rc" "reason=$reason"
notify_args=()
[[ -n "${LOOP_NOTIFY_DRY_RUN:-}" ]] && notify_args+=(--dry-run)
if "$PYTHON" "$KIT/notify.py" --name "$LOOP_NAME" --repo "$REPO" --to "$NOTIFY_TO" \
  --reason "$reason" --code "$rc" --iterations "$done_iters" --log-dir "$LOG_DIR" --run-log "$RUN_LOG" "${notify_args[@]}"; then
  emit notice_sent ok=true
else
  log "the stop notice could not be sent (see above)"; emit notice_sent ok=false
fi
return "$rc"
}
main "$@"; exit $?
