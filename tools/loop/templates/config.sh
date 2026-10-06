# .loop/config.sh — this repo's settings for the SnowForge loop kit (SnowForge/tools/loop).
# Sourced by loop.sh, overnight.sh and launch.sh; bash, committed with the repo.

LOOP_NAME="MyApp"          # how stop notices and logs name this loop
LOG_DIR="logs/loop"        # gitignored; the kit's copy, iteration logs and gate logs go here
DEFAULT_TIER="sonnet"      # model tier for a task line with no `model:` tag (haiku|sonnet|opus|fable)
REQUIRE_NON_MAIN=1         # 1: refuse to run on main; run from the loop worktree on branch `loop`
ARCHIVE_TASKS=1            # move checked lines to TASKS-archive.md before each iteration (keeps TASKS.md small: every session reads it)
PYTHON="python"            # stdlib Python for the kit's helpers
NOTIFY_TO="you@example.com" # who gets the overnight stop notice (required for a notice; the kit has no default)
LOOP_KEEP_DAYS=14          # launch.sh deletes iteration and gate logs older than this; 0 keeps everything

# The independent gate, run after every iteration in the loop's own shell (never trusted to the
# session). Keep it the same commands CLAUDE.md tells the session to run.
GATE_WORDS="the full gate (pnpm typecheck, pnpm lint, pnpm test)"
gate() {
  pnpm install --frozen-lockfile --reporter=append-only && pnpm typecheck && pnpm lint && pnpm test
}

# Variables blanked for the agent and the gate on top of the kit's own list (production URLs,
# app-specific keys). The kit already fences Doppler, Vercel, GitHub, Neon and AWS logins.
FENCE_EXTRA=()

# NAME=value pairs exported for the agent and the gate (test knobs, report-only hooks).
EXTRA_ENV=("SNOWFORGE_VERIFY_MODE=report")
