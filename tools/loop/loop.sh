#!/usr/bin/env bash
# SnowForge loop kit: one batch of autonomous iterations on a repo's TASKS.md (2026-10-05).
# Merged from RiftMind's, riftmind-web's and OnDeck's loops; see README.md beside this file.
#
#   launch.sh <repo> loop [max_iterations] [max_usd_per_iteration]
#
# Always run through launch.sh, which copies this kit into <repo>/<LOG_DIR>/.loop-kit/ first: bash
# reads a script by byte offset while it runs, so the copy is what keeps an edit to the kit (or a
# task that edits it) from corrupting a run in flight. Per-repo settings: <repo>/.loop/config.sh.
# Every batch also appends events to $LOG_DIR/events.jsonl (emit.py) and runs sessions as stream-json, so tools/loop/dashboard can watch it live.
#
# Exit codes: 0 done (queue empty or max iterations), 1 gate failed, 2 blocked (docs/BLOCKED.md),
# 3 usage limit, 4 API error, 5 refused (on main, or no config), 9 bad repo path.
main() {
set -uo pipefail
REPO="${1:?repo path}"; shift
cd "$REPO" || exit 9
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITER="${1:-20}"
MAX_USD="${2:-25}"

# --- configuration: defaults, then the repo's .loop/config.sh ----------------------------------
LOOP_NAME="$(basename "$REPO")"
LOG_DIR="logs"
DEFAULT_TIER="opus"          # the model tier of a task line with no tag
REQUIRE_NON_MAIN=1           # refuse to run on branch main (the loop belongs in its own worktree)
ARCHIVE_TASKS=0              # move checked lines to TASKS-archive.md before each iteration
PYTHON="python"              # runs iter_log.py and archive_tasks.py (stdlib only)
GATE_WORDS="the full gate"   # how the prompt names the gate the session must run
FENCE_EXTRA=()               # more variables to blank for the agent and the gate
EXTRA_ENV=()                 # NAME=value pairs exported for the agent and the gate
gate() { echo "no gate() in .loop/config.sh" >&2; return 1; }
if [[ ! -f .loop/config.sh ]]; then
  echo "No .loop/config.sh in $REPO; copy templates/config.sh from the kit."; exit 5
fi
# shellcheck source=/dev/null
source .loop/config.sh
mkdir -p "$LOG_DIR"

# --- events for the dashboard (tools/loop/dashboard) --------------------------------------------
# One JSON line per event in $LOG_DIR/events.jsonl, written by emit.py (bash cannot quote task
# text safely). LOOP_RUN groups a run's iterations: overnight.sh sets it for the whole run and
# LOOP_MODE=overnight; a batch run by hand gets its own. stop() records why a batch ended.
LOOP_MODE="${LOOP_MODE:-loop}"
LOOP_RUN="${LOOP_RUN:-$(date +%Y%m%d-%H%M%S)}"
export LOOP_NAME LOG_DIR LOOP_RUN
emit() { "$PYTHON" "$KIT/emit.py" "$@" || echo "emit failed: $*" >&2; }
stop() { emit loop_stopped scope=batch "code=$1" "reason=$2"; exit "$1"; }
emit loop_started scope=batch "mode=$LOOP_MODE" "max_iter=$MAX_ITER" "max_usd=$MAX_USD" \
  "branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')" \
  "kit_version=$(cat "$KIT/VERSION" 2>/dev/null || echo unknown)"

if [[ "$REQUIRE_NON_MAIN" == 1 && "$(git rev-parse --abbrev-ref HEAD)" == "main" ]]; then
  echo "Refusing to run on main. Run from the loop worktree (see README.md, 'Branch')."; stop 5 "Refusing to run on main"
fi

# --- the credential fence ----------------------------------------------------------------------
# The agent and the gate never get production credentials, whatever is on disk or in the parent
# environment. Connection variables are blanked (empty, not unset, so dotenv and @next/env treat
# them as already set and do not fill them from a file), and every CLI that keeps its own login
# is handed an override token that fails, so `doppler secrets get`, `vercel deploy`, `gh` and
# `aws` cannot reach an account from inside a session. The wrapper (overnight.sh) and its stop
# notice run outside the fence.
for var in DATABASE_URL DIRECT_DATABASE_URL REDIS_URL KV_URL CLERK_SECRET_KEY ANTHROPIC_API_KEY \
  OPENAI_API_KEY RESEND_API_KEY STRIPE_SECRET_KEY BLOB_READ_WRITE_TOKEN ENCRYPTION_KEY \
  GOOGLE_CLIENT_SECRET DISCORD_CLIENT_SECRET TWILIO_AUTH_TOKEN UPSTASH_REDIS_REST_TOKEN \
  SENTRY_AUTH_TOKEN EXPO_TOKEN AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN \
  "${FENCE_EXTRA[@]}"; do
  export "$var="
done
export DOPPLER_TOKEN="loop-fenced" VERCEL_TOKEN="loop-fenced" GH_TOKEN="loop-fenced" \
  GITHUB_TOKEN="loop-fenced" NEON_API_KEY="loop-fenced" AWS_PROFILE="loop-fenced"
for pair in "${EXTRA_ENV[@]}"; do export "$pair"; done

# --- the model per task ------------------------------------------------------------------------
# The first open line's tag picks the model: `model:<tier>` or `{model: <tier or full id>}`;
# no tag means DEFAULT_TIER; LOOP_MODEL (a full id) overrides everything.
tier_model() {
  case "$1" in
    haiku) echo claude-haiku-4-5-20251001 ;;
    sonnet) echo claude-sonnet-5 ;;
    opus) echo claude-opus-5-5 ;;
    fable) echo claude-fable-5-1 ;;
    "") tier_model "$DEFAULT_TIER" ;;
    *) echo "$1" ;;
  esac
}
task_tag() {
  local line tag
  line=$(grep -m1 '^- \[ \]' TASKS.md)
  tag=$(printf '%s' "$line" | grep -oE 'model:(haiku|sonnet|opus|fable)' | head -1 | cut -d: -f2)
  if [[ -z "$tag" ]]; then
    tag=$(printf '%s' "$line" | sed -n 's/.*{model: *\([A-Za-z0-9._-]*\)}.*/\1/p')
  fi
  printf '%s' "$tag"
}
pick_model() {
  if [[ -n "${LOOP_MODEL:-}" ]]; then echo "$LOOP_MODEL"; else tier_model "$(task_tag)"; fi
}

PROMPT="Read CLAUDE.md, then TASKS.md. Take the first unchecked task and complete it exactly per the loop protocol in CLAUDE.md. If git status shows uncommitted changes, they are a previous iteration's partial progress on that same task (it was cut off): read them and continue from there instead of starting over. Run $GATE_WORDS in the foreground and wait for it; never background it, because this session ends when your turn ends. Check the task off in TASKS.md, commit, and stop. If blocked on something only a person can provide, write docs/BLOCKED.md, commit, and stop."

run_gate() {  # <attempt> <log>: runs the repo's gate and records the result
  local attempt="$1" log="$2"
  if gate >"$log" 2>&1; then
    emit gate_finished "i=$i" "attempt=$attempt" ok=true "log=$log"; return 0
  fi
  emit gate_finished "i=$i" "attempt=$attempt" ok=false "log=$log"; return 1
}
finish_iter() {  # <ok>: records the iteration; on ok prints the batch log's closing line
  local mins=$(( ($(date +%s) - t0) / 60 )) commit=null
  [[ "$(git rev-parse HEAD)" != "$head0" ]] && commit="$(git log --oneline -1)"
  emit iteration_finished "i=$i" "ok=$1" "minutes=$mins" "commit=$commit"
  [[ "$1" == true ]] && echo "=== iteration $i took $mins min ($(git log --oneline -1)) ==="
}

for i in $(seq 1 "$MAX_ITER"); do
  if [[ -f docs/BLOCKED.md ]]; then
    echo "BLOCKED — see docs/BLOCKED.md"; stop 2 "blocked: docs/BLOCKED.md"
  fi
  if ! grep -q '^- \[ \]' TASKS.md; then
    echo "No unchecked tasks. Done."; stop 0 "No unchecked tasks. Done."
  fi
  ts=$(date +%Y%m%d-%H%M%S); t0=$(date +%s)
  echo "=== iteration $i ($ts) ==="
  echo "    task: $(grep -m1 '^- \[ \]' TASKS.md | cut -c1-110)"

  if [[ "$ARCHIVE_TASKS" == 1 && -z "$(git status --short TASKS.md)" ]]; then
    if "$PYTHON" "$KIT/archive_tasks.py" --tasks TASKS.md --archive TASKS-archive.md | grep -q '^moved [1-9]'; then
      git add TASKS.md TASKS-archive.md \
        && git commit -q -m "TASKS: checked lines archived" -- TASKS.md TASKS-archive.md
    fi
  fi

  MODEL=$(pick_model)
  echo "    model: $MODEL"
  head0=$(git rev-parse HEAD)
  task_line=$(grep -m1 '^- \[ \]' TASKS.md)
  tier=$(task_tag); tier="${tier:-$DEFAULT_TIER}"
  emit iteration_started "i=$i" "task_id=$(printf '%s' "$task_line" | sed -E 's/^- \[ \] *([^ ]+).*/\1/')" \
    "task=$(printf '%s' "$task_line" | sed -E 's/^- \[ \] *//; s/\*\*//g')" \
    "model=$MODEL" "tier=$tier" "stream=$LOG_DIR/iter-$i-$ts.jsonl"
  claude -p "$PROMPT" \
    --model "$MODEL" \
    --dangerously-skip-permissions \
    --max-budget-usd "$MAX_USD" \
    --output-format stream-json --verbose \
    > "$LOG_DIR/iter-$i-$ts.jsonl" 2> "$LOG_DIR/iter-$i-$ts.err"
  cost=$("$PYTHON" "$KIT/iter_log.py" "$LOG_DIR/iter-$i-$ts.jsonl" "$LOG_DIR/iter-$i-$ts.err" "$LOG_DIR/iter-$i-$ts.log")
  echo "$cost"
  # shellcheck disable=SC2046  # --kv prints space-separated key=value pairs whose values hold no spaces
  emit session_finished "i=$i" $("$PYTHON" "$KIT/iter_log.py" --kv "$LOG_DIR/iter-$i-$ts.jsonl")

  # An API error or an expired login does no work (RiftMind burned 25 iterations on one, 2026-09-20).
  if [[ "$cost" == *is_error* ]]; then
    echo "API ERROR — $(head -c 300 "$LOG_DIR/iter-$i-$ts.log")"; finish_iter false; stop 4 "API error"
  fi
  if grep -qE "hit your (session|weekly) limit" "$LOG_DIR/iter-$i-$ts.log"; then
    echo "USAGE LIMIT — $(grep -m1 -E 'hit your (session|weekly) limit' "$LOG_DIR/iter-$i-$ts.log")"; finish_iter false; stop 3 "usage limit"
  fi

  # The independent gate: never trust the session's own "all green". Retried once after a minute
  # (a loaded machine fails timing tests), output kept. A cheaper tier that fails it twice gets one
  # Opus attempt at the same task before the loop stops for review.
  gate_log="$LOG_DIR/gate-$i-$(date +%Y%m%d-%H%M%S).log"
  if ! run_gate 1 "$gate_log"; then
    echo "Gate failed once after iteration $i ($gate_log); retrying in 60 s"
    sleep "${LOOP_GATE_RETRY_SECONDS:-60}"
    if ! run_gate retry "$gate_log.retry"; then
      if [[ "$MODEL" == *haiku* || "$MODEL" == *sonnet* ]]; then
        echo "Gate failed twice on $MODEL; one Opus attempt at the same task"
        claude -p "The independent gate failed twice after the last iteration on the first unchecked task in TASKS.md; its output is in $gate_log.retry. Read CLAUDE.md, fix the failure, run $GATE_WORDS in the foreground until green, check the task off if it is now done, commit, and stop." \
          --model "$(tier_model opus)" --dangerously-skip-permissions --max-budget-usd "$MAX_USD" \
          --output-format stream-json --verbose > "$LOG_DIR/iter-$i-$ts-opus.jsonl" 2> "$LOG_DIR/iter-$i-$ts-opus.err"
        "$PYTHON" "$KIT/iter_log.py" "$LOG_DIR/iter-$i-$ts-opus.jsonl" "$LOG_DIR/iter-$i-$ts-opus.err" "$LOG_DIR/iter-$i-$ts-opus.log"
        # shellcheck disable=SC2046
        emit session_finished "i=$i" attempt=opus $("$PYTHON" "$KIT/iter_log.py" --kv "$LOG_DIR/iter-$i-$ts-opus.jsonl")
        if run_gate opus "$gate_log.opus"; then
          echo "Gate passed after the Opus attempt on iteration $i"
          finish_iter true
          continue
        fi
      fi
      finish_iter false
      echo "Gate FAILED after iteration $i ($gate_log.retry). Leaving the tree as-is for review."
      stop 1 "gate failed after iteration $i"
    fi
    echo "Gate passed on retry after iteration $i; the first run's output is in $gate_log"
  fi
  if [[ -n "$(git status --porcelain -- . ":!$LOG_DIR")" ]]; then
    echo "Iteration $i left uncommitted changes; the next iteration continues them."
  fi
  finish_iter true
done
echo "Reached max iterations ($MAX_ITER)."
stop 0 "Reached max iterations ($MAX_ITER)"
}
# `exit` shares the line with the call on purpose: bash parses the two together and never reads
# the file again after `main` returns.
main "$@"; exit $?
