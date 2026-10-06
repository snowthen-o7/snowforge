# Loop dashboard: design

**Date:** 2026-10-05
**Scope:** pieces 1 and 2 of four. Piece 1 makes the loop kit record structured events and stream
sessions; piece 2 is a local dashboard that reads them. Piece 3 (start/stop, queue editing) and
piece 4 (a hosted, phone-readable copy in SnowGlobe) get their own specs.
**Mockup:** https://claude.ai/artifact/7hntQ2RwQqFACXem9avM7k (board and loop-detail artboards; sample data).

## Why

Three loops (RiftMind, riftmind-web, OnDeck) run unattended on this PC through the shared kit at
`tools/loop`. Today the only ways to know what they are doing are the batch logs, the per-iteration
`iter-N-<ts>.json` files, and the stop-notice email. There is no live view: a session writes its
output only when it ends (`--output-format json`), and the batch log is prose that parses by luck.
Alex wants one page that shows every loop's state, what the current session is doing right now,
what each iteration cost, and the queue, and later the same from a phone.

## Decisions already made

- Local first, hosted later. Piece 2 binds to `127.0.0.1` only; that is its whole security model.
- The dashboard is Python standard library plus one static HTML file: nothing to install, no build.
- Loops are discovered, not configured: any checkout under the SnowForgeLLC folder with
  `.loop/config.sh` is a loop.
- Sessions use the Claude Max login on this PC (the fence blanks `ANTHROPIC_API_KEY`), so every
  dollar figure is the API-equivalent value reported by `claude`, not money charged. The UI says so.
- Piece 2 includes one write: appending a task line to a loop's `TASKS.md`. Everything else is read-only.

## Piece 1: the kit records events

### `events.jsonl`

`loop.sh` and `overnight.sh` append one JSON object per line to `<repo>/<LOG_DIR>/events.jsonl`.
Common fields: `ts` (ISO 8601 UTC, milliseconds), `loop` (`LOOP_NAME`), `run` (the overnight run's
log timestamp, or the batch's first iteration timestamp when run by `loop` mode), `event`.

| `event` | Written by | Extra fields |
|---|---|---|
| `loop_started` | loop.sh (each batch) and overnight.sh (once) | `scope` (`batch`/`run`), `mode` (`loop`/`overnight`), `max_iter`, `max_usd`, `branch`, `kit_version` (git short sha of the kit copy, or `unknown`) |
| `iteration_started` | loop.sh | `i`, `task_id` (first token after `- [ ]`, e.g. `T215`), `task` (the line, first 200 chars, markup stripped), `model`, `tier`, `stream` (path of the iteration's stream file, relative to the repo) |
| `session_finished` | loop.sh, after iter_log.py | `i`, `cost_usd`, `turns`, `duration_ms`, `is_error`, `usage_limit` (bool) |
| `gate_finished` | loop.sh, after each gate call | `i`, `attempt` (`1`, `retry`, `opus`), `ok` (bool), `log` (path) |
| `iteration_finished` | loop.sh | `i`, `ok` (bool), `minutes`, `commit` (short sha + subject of HEAD, or `null` when HEAD did not move) |
| `usage_limit_sleep` | overnight.sh | `seconds`, `until` (ISO 8601 UTC), `message` |
| `loop_stopped` | loop.sh (exit of a batch) and overnight.sh (end of the run) | `code`, `reason` (the same text the batch log prints), `scope` (`batch`/`run`) |
| `notice_sent` | overnight.sh | `ok` (bool) |

Writing JSON from bash by hand breaks on task text with quotes, so a new `emit.py` (stdlib) does it:
`"$PYTHON" "$KIT/emit.py" <event> key=value ...` reads `LOOP_NAME`, `LOG_DIR` and `LOOP_RUN` from
the environment, types numeric and boolean values (`i=3`, `ok=true`, `cost_usd=2.41`), and appends.
`launch.sh` copies `emit.py` into the kit snapshot with the other helpers. A loop whose Python is
missing fails loudly at the first emit, the same as it would at `iter_log.py`.

### Streaming sessions

Sessions switch from `--output-format json` to `--output-format stream-json --verbose`. The
iteration's output file becomes `iter-N-<ts>.jsonl` and grows while the session runs. Observed
shape (Claude Code, 2026-10-05): one JSON object per line with `type` in `system` (init, hook
events, thinking tokens), `assistant` and `user` (messages whose `content` blocks are `text`,
`tool_use`, `tool_result`, `thinking`), `rate_limit_event`, and a final `result` carrying
`total_cost_usd`, `num_turns`, `duration_ms`, `is_error`, `result` text.

`iter_log.py` reads the stream: the last `result` line gives the cost line and the report text; the
`.log` file it writes (report text plus stderr) is unchanged, so the usage-limit grep in `loop.sh`
and the stop notice in `notify.py` keep working untouched. A stream with no `result` line (a session
killed mid-run) yields `cost: unknown (no result line)` and the log holds whatever text arrived.

The batch log's prose lines (`=== iteration N (ts) ===`, `cost: $…`, `=== iteration N took M min
(commit) ===`, `Gate FAILED…`) stay exactly as they are; `notify.py` and old habits read them.

### Rollout

The kit copies itself per launch, so running loops keep their old copy and each loop adopts this on
its next launch. Old batch logs are not backfilled; history starts at adoption. (A `backfill.py`
that parses old batch logs into events is possible later; not in scope.)

## Piece 2: the local dashboard

### Files

`tools/loop/dashboard/server.py` (stdlib: `http.server`, `threading`, `json`, `pathlib`),
`tools/loop/dashboard/index.html` (one file, inline CSS and JS, no framework), and
`tools/loop/dashboard/tests/`. Run: `python tools/loop/dashboard/server.py [--port 8787]
[--root <folder to scan>]`; the root defaults to the parent of the SnowForge checkout (the
SnowForgeLLC folder). Open `http://127.0.0.1:8787`.

### Discovery

At startup and every 30 s the server scans `<root>/*/.loop/config.sh`. Each hit is a loop: `path`
(the checkout), `name` (`LOOP_NAME`), `log_dir` (`LOG_DIR`), `branch` (`git rev-parse
--abbrev-ref HEAD` in that checkout, refreshed with the scan). `LOOP_NAME` and `LOG_DIR` are read by
a regex over lines of the form `NAME="value"`; defaults are the folder name and `logs`, matching the
kit. Nothing in `config.sh` is executed.

### Reading state

For each loop the server tails `<log_dir>/events.jsonl` (by file offset, polled every second) and,
when the latest `iteration_started` has no matching `iteration_finished`, that iteration's stream
file the same way. Malformed lines are skipped and counted (`parse_errors` on the loop).

Derived per loop:

- `state`, from the last event: `stopped` (with its `reason`) when it is `loop_stopped`; in an
  overnight run a batch-scope stop is followed within a second by `usage_limit_sleep` or the
  run-scope stop, so the UI shows the batch stop only for that moment. `sleeping` (with `until`)
  when it is `usage_limit_sleep` and `until` is in the future. Otherwise `running` when any
  watched file (events, the current stream, the newest `gate-*.log`) changed in the last 10
  minutes, else `stale` (the honest label for a loop that died without writing its stop event).
- `current`: iteration number, task id and text, model, tier, elapsed since `iteration_started`,
  turns so far (count of `assistant` lines in the stream), phase (`session`, `gate attempt N`,
  `between iterations`) from the latest event.
- `run`: `max_iter`, iterations finished, cost so far, started at.
- `iterations`: the list, newest first, joined from `iteration_started`, `session_finished`,
  `gate_finished` (all attempts) and `iteration_finished` by `(run, i)`.
- `totals`: cost and count for this run, today (local day), last 7 days, each split by tier.
- `queue`: open lines of `TASKS.md` (`- [ ] …`), each with id, the bold title if present, the
  `model:` tag, and the raw line.

### HTTP

| Route | Returns |
|---|---|
| `GET /` | `index.html` |
| `GET /api/loops` | every loop's derived state, without the session tail |
| `GET /api/loops/<name>/session` | the current session's rendered tail (last 300 entries) |
| `GET /api/loops/<name>/iterations` | all iterations known from events |
| `GET /api/events` | server-sent events: `loop` (a loop's derived state changed), `session` (new tail entries for a loop), `discovery` (loop added or removed). One connection serves all loops. |
| `POST /api/loops/<name>/tasks` | appends a task line (below); JSON body; 201 with the line written, 400 on a bad line |

`<name>` is the loop's `LOOP_NAME`; two loops with the same name get `name-2` and a warning in the
UI.

### Session tail rendering

The server turns stream lines into tail entries `{t, kind, text}`:

- `assistant` text block: kind `said`, the text.
- `assistant` `tool_use`: kind = tool name; text = a one-line summary: `Bash` its `command` (first
  line, 200 chars), `Read`/`Edit`/`Write` the `file_path` relative to the repo (`Edit` adds a +/−
  line count when `old_string`/`new_string` are present), `Grep`/`Glob` the `pattern` and `path`,
  anything else the first 120 chars of the input JSON.
- `user` `tool_result`: kind `result`, the first line of the result (200 chars), or `(empty)`.
- `result`: kind `end`, `cost $X, N turns, M min`.
- `system` hook and thinking events: kind `hook`, hidden unless the viewer turns them on.
- `rate_limit_event` and everything else: dropped.

### UI (per the mockup)

Board: header (live dot, loops watched, last update), four tiles (running of N, API-equivalent spend
today, iterations today, gate passed of N), one card per loop (state pill, branch and mode chips,
model, iteration N of M, task, elapsed, run cost, a strip of the last six iterations coloured by
gate result, the gate command), and a recent-iterations table across loops. Cards open the detail.

Detail: header (name, state, branch, mode, iteration, run cost, started), the live tail (dark
panel, Pause and Show hooks buttons, auto-scroll while not paused, newest at the bottom), the queue
with an "Add task" button, a spend box (this run, today, 7 days, per iteration, by-tier bar), and
this run's iterations table.

Every spend figure is labelled "API-equivalent" once per view (the tile label on the board, the
spend box heading on the detail).

Theme: CSS variables on `:root`, dark values under `prefers-color-scheme: dark` and under
`[data-theme="dark"]`, light forced under `[data-theme="light"]`; a header toggle cycles
system/light/dark and stores the choice in `localStorage`. The tail panel is dark in both themes.

Updates: the page loads `/api/loops` once, then listens on `/api/events`; `EventSource` reconnects
on its own, and a reconnect refetches `/api/loops`. No polling from the browser.

Phone width: the card grid and tiles stack; tables scroll in their box; the tail panel keeps its
height. (Nobody opens this from a phone until piece 4, but it costs nothing to do now.)

### Add task

A form on the detail page with the template's fields: id (suggested: the file's usual prefix, `T` or `W`, with the highest
number in `TASKS.md` and its archive plus one; editable), title, who asked and when, what exists and why it
is wrong, what to build, the test that proves it, tier (`haiku`/`sonnet`/`opus`/`fable`). The
preview shows the composed line in the kit's format:

`- [ ] <id> **<title>** (<who asked>). <what exists> <what to build> <the test> model:<tier>`

Submit appends the line after the last open task line under the last milestone heading (or at the
end of the file). Rules: id must be unique in `TASKS.md` and `TASKS-archive.md`; title and tier are
required; the line is written with a trailing newline, UTF-8, LF. The server refuses when the loop's
checkout has `TASKS.md` staged or when the file changed between preview and submit (compare a
hash sent with the form), so a session mid-edit is not overwritten. The append is not committed;
the next session's checkoff commit carries it, the same as a hand edit. The loop reads `TASKS.md`
at each iteration start, so an added line is picked up without a restart; a loop that already
exited on "No unchecked tasks" needs relaunching (piece 3).

### Errors

A loop with no `events.jsonl` yet shows "no events yet: starts at this loop's next launch". A
missing stream file for the current iteration shows the tail header with "stream not found". A
checkout whose `git` call fails shows branch `?`. The server never raises on a bad file: log and
continue; `/api/loops` carries `warnings` per loop.

## Testing

Both layers get tests; the kit has none today.

- `tools/loop/dashboard/tests/` (`unittest`, run by `python -m unittest discover
  tools/loop/dashboard/tests`): fixtures with a fake root containing two loop checkouts;
  config parsing; event joining into iterations; state derivation (running, stale, stopped, mid-gate);
  totals by day and tier; stream rendering for every entry kind, including a stream without a
  `result` line and a malformed line; queue parsing; add-task id suggestion, line composition, the
  uniqueness and changed-file refusals; the HTTP handlers through `http.client` against a server on
  an ephemeral port.
- `tools/loop/tests/` (bash + Python): a fake `claude` on `PATH` that prints a canned stream-json
  file (one per scenario: success, gate failure, usage limit, no result line) and exits. `loop.sh`
  runs against a temporary git repo with a `.loop/config.sh` whose `gate()` is a script that passes
  or fails on command. Assertions: `events.jsonl` holds the expected sequence with the right fields,
  `iter-N-<ts>.log` has the report text, the batch log keeps its prose lines, exit codes match.
  `overnight.sh` is covered for `loop_stopped` with `scope=run` and `usage_limit_sleep` (with the
  sleep shortened by an env var honoured only under test).
- No test spends a model call.

## Out of scope (later pieces)

- Start/stop a loop, edit or reorder the queue, remove a task: piece 3.
- Pushing events to SnowGlobe; phone access; any authentication: piece 4.
- Backfilling history from old batch logs.
- Token-level streaming of the session (`--include-partial-messages`); message-level is enough.
