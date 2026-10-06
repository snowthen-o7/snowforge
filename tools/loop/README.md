# The SnowForge loop kit

An autonomous build loop for Claude Code: one fresh `claude -p` session per task from a repo's
`TASKS.md`, each checked by an independent test gate, committed, then the next. It is the SnowForge
standard for focused milestone work (Alex, 2026-10-05), merged from the loops RiftMind, riftmind-web
and OnDeck grew separately, so a fix made here reaches all of them.

It is not `snowforge-autobuild`. Autobuild is the maintenance round across every app, one step per app,
pushing `claude-main`. The loop is for one repo with a real queue. Autobuild already skips a repo with
fresh work in progress, so the two do not collide.

## Files

| File | What it does |
|---|---|
| `launch.sh` | Entry point. Copies the kit into `<repo>/<LOG_DIR>/.loop-kit/` and runs the copy (`loop` or `overnight`). |
| `loop.sh` | One batch: per task, pick the model, run the session behind the credential fence, run the gate, stop on failure. |
| `overnight.sh` | Batches until the total is reached; sleeps through usage limits; sends the stop notice. |
| `launch.ps1` | Task Scheduler entry point for an unattended run. |
| `notify.py` | Emails Alex when an overnight run stops, with why, what it did and what it cost. |
| `heartbeat.ps1`, `heartbeat.vbs` | Every 15 minutes: emails Alex about an unattended run that died without its stop notice. |
| `iter_log.py`, `archive_tasks.py` | Per-iteration cost line and log; moves checked task lines to `TASKS-archive.md`. |
| `templates/` | `config.sh`, the CLAUDE.md sections (`CLAUDE-loop.md`) and a `TASKS.md` to start from. |
| `emit.py` | Appends one JSON event to `<LOG_DIR>/events.jsonl` (loop started/stopped, iteration started/finished, session finished, gate started/finished, usage-limit sleep, notice sent). |
| `dashboard/` | The local dashboard: `python tools/loop/dashboard/server.py` → http://127.0.0.1:8787. Reads every loop's events and the live session stream. |
| `tests/` | `python -m unittest discover -s tools/loop -p "test_*.py"`: the kit against a fake `claude`, and the dashboard. No test calls a model. |

## Start a loop in a new project

1. **The loop worktree.** `git worktree add ../<App>-loop -b loop` from the main checkout. The loop works
   on branch `loop`; you review and merge it into `main`. Install dependencies there (`pnpm install`, `uv
   sync`). Ignored files are not copied into a worktree: give it only the non-secret local config it needs
   (a `.env.local` with publishable keys and local URLs, never a secret key).
2. **The config.** Copy `templates/config.sh` to `.loop/config.sh` and set the gate, the default tier and
   the log dir. Gitignore the log dir.
3. **The instructions.** Paste `templates/CLAUDE-loop.md` into the repo's CLAUDE.md (the loop protocol,
   the model policy, how to write a task line) and fill in the gate.
4. **The queue.** `TASKS.md` from `templates/TASKS.md`. Write tasks as the template says: who asked and
   their words, what exists, what to build with paths, the test that proves it, `model:<tier>`.
5. **A shim** so `./scripts/loop.sh` still works in the repo:

   ```bash
   #!/usr/bin/env bash
   KIT="${SNOWFORGE_LOOP_KIT:-/c/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowForge/tools/loop}"
   exec bash "$KIT/launch.sh" "$(cd "$(dirname "$0")/.." && pwd)" loop "$@"
   ```

6. **Run it.** Interactively: `bash <kit>/launch.sh <worktree> loop 5`. Unattended: register a scheduled
   task for `launch.ps1 -Repo <worktree> -Iterations 30` (the header of `launch.ps1` has the commands)
   and `schtasks /Run` it. Never run two loops on one checkout.

## What the kit guarantees

- **An independent gate.** After every session the loop runs the repo's `gate()` itself. A failure is
  retried once after a minute (a busy machine fails timing tests), then, for a Haiku or Sonnet iteration,
  given one Opus attempt, then the loop stops with the tree as it is.
- **The model per task.** The first open line's `model:<tier>` or `{model: ...}` tag picks the model;
  `DEFAULT_TIER` otherwise; `LOOP_MODEL` overrides. Each iteration logs its model and cost, so the tiers
  can be compared.
- **The credential fence.** The session and the gate run with production connection variables blanked
  and the Doppler, Vercel, GitHub, Neon and AWS command-line logins overridden by tokens that fail. A
  session cannot read a secret from Doppler, deploy, push, or reach a production database, whatever is on
  disk. Add app-specific variables with `FENCE_EXTRA`.
- **Branch isolation.** With `REQUIRE_NON_MAIN=1` the loop refuses to run on `main`.
- **No mid-run edits.** The copy in `.loop-kit/` is what runs, so editing the kit, or a task editing its
  repo's shim, never corrupts a run in flight.
- **Stop notices.** When an overnight run ends, for any reason, Alex gets an email: why it stopped, the
  tasks it finished, what it spent, the last lines of the log. Nothing sits idle unnoticed.
  Sent through Resend's own sender (`onboarding@resend.dev`, which may mail only the account's owner)
  because snowforge.dev is not a verified Resend domain; verify it and set `LOOP_NOTIFY_FROM` to send
  from `loops@snowforge.dev`.
- **A heartbeat.** The scheduled task `SnowForgeLoopHeartbeat` runs `heartbeat.ps1` every 15 minutes (through
  `heartbeat.vbs`, so no window flashes). For every loop a scheduled task launches with `launch.ps1`, it reads the ledger:
  a run whose launcher is gone without an exit line, or that exited without its stop notice, gets one email
  (`<LogDir>/.heartbeat-<pid>` marks it sent). RiftMind's run died silently on 2026-10-05 and sat for two hours;
  this is what catches that. A new unattended loop is covered as soon as its scheduled task exists.
- **Stops that matter.** `docs/BLOCKED.md` (needs a person), an API error or expired login, the usage
  limit (slept through overnight), an empty queue.

## Events and the dashboard

Every batch appends one JSON line per event to `<LOG_DIR>/events.jsonl` (`emit.py`), and sessions
run as `--output-format stream-json`, so `iter-N-<ts>.jsonl` grows while the session works. The
batch log, `iter-N-<ts>.log` and the stop notice are unchanged. `LOOP_RUN` groups a run's events
(overnight.sh sets it for the whole run); a batch started by hand gets its own.

Two settings in `.loop/config.sh` matter for an unattended run: `NOTIFY_TO` (optional stop email; the
SnowForge loops leave it empty and watch the dashboard instead, and a run without it logs "no stop
notice sent") and `LOOP_KEEP_DAYS` (default 14:
`launch.sh` deletes iteration and gate logs older than that before each run, never `events.jsonl` or
the overnight run logs; `0` keeps everything).

The dashboard reads those files and nothing else:

    python tools/loop/dashboard/server.py            # http://127.0.0.1:8787, scans ../ for .loop/config.sh
    python tools/loop/dashboard/server.py --root <folder> --port 8790

It binds to 127.0.0.1 only. To keep it up across logins, register it once as a logon task
(`SnowForge Loop Dashboard`, running `pythonw.exe tools/loop/dashboard/server.py --port 8787`). The board shows every loop (running / sleeping / stale / stopped with
the reason / empty), the current iteration and phase, API-equivalent cost (sessions run on the
Claude Max login, so no money changes hands), and the queue. A loop's page shows the live session
tail, this run's iterations with gate results, and an "Add task" form that appends a line in the
kit's task format to `TASKS.md` (refused when the file changed since the preview or has staged
changes; the next session's checkoff commit carries the line). Theme: system / light / dark.

A loop adopts the events kit at its next launch (`launch.sh` copies the kit per run); a loop that
was mid-run when the kit changed shows "no events yet" until then.

## Supervising

The supervising session (or Alex) reviews `loop`, merges it into `main`, deploys from `main`, and queues
the next tasks, each with its model tag. After appending to an idle loop's queue, confirm it is running:
a loop that checked its queue a moment before the append exits on "No unchecked tasks".

## Exceptions in use

- None since 2026-10-06. RiftMind ran on its main checkout until then (its tests and tasks read
  gitignored data: fetched decklists, raw card data, game logs, the nightly self-play review's
  output); it now runs in `RiftMind-loop` on branch `loop`, with that data copied over with
  timestamps (`cp -rp` / robocopy: decklists are dated by file time) and the `RiftMindOvernight` and
  `RiftMindSelfplay` tasks pointed at the worktree. Merge `loop` into `main` to take its work.
