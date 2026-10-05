## Loop protocol

(Paste into the repo's CLAUDE.md and adapt the gate line. The SnowForge loop kit runs one session per
task: `SnowForge/tools/loop/README.md`.)

1. Read `TASKS.md`, the open lines only (checked lines move to `TASKS-archive.md`; `grep` it for an id
   a line cites, never read it whole). Take the **first unchecked** task and do exactly that task. If it
   is too big for one session, split it in place (`T012a`, `T012b`) and do the first part.
2. A task that builds or changes a screen opens the reference image the line names and matches it, and
   ends with a screenshot test (Playwright) at the stated viewport; describing layout in words was not
   enough (riftmind-web, 2026-10-03).
3. If the task is blocked on something only Alex can give (an account, a key, a decision, a rule the
   docs do not settle), write `docs/BLOCKED.md` saying precisely what is needed, commit, and exit.
4. Before finishing, run the gate in the foreground: `<the same commands as .loop/config.sh gate()>`.
   All green or you are not done. A dependency change commits its lockfile.
5. Check the task off with a note of at most about 100 words (what shipped, the number that decided it,
   what was left). Commit `<id>: <summary>`, at most twelve lines. **Alex is the sole author of every
   commit: no `Co-Authored-By` or other AI-attribution trailer.** Never push, never deploy. Exit.

## Model per task

Every task line carries a `model:<tier>` tag (or `{model: <tier or full id>}`), and the loop runs that
iteration on it. An untagged line runs on the repo's `DEFAULT_TIER`. Tiers, cheapest first:

- `model:haiku` — mechanical: a docs-only edit, bookkeeping, a rename, a one-line config change,
  re-running a generator and committing what it writes.
- `model:sonnet` — routine implementation against a clear spec: a component or page from a reference
  image and stated behaviour, a port of a known behaviour from a named file, tests for behaviour that
  exists, a change that only composes existing building blocks.
- `model:opus` — judgment: a new primitive, a rules or domain question, a performance or strength
  change that needs measuring, diagnosing a fault from logs or a replay, changes across several modules,
  security, data migrations, concurrency.
- `model:fable` — the hardest: cross-cutting design, a large port, a task a lower tier failed at.

When unsure, take the next tier up. Every line you write (a split, a successor, a follow-up) carries its
own tag. If the gate fails twice after a haiku or sonnet iteration, the loop gives the same task one Opus
attempt before it stops.

## Writing a task line

`- [ ] <id> **<what, in a few words>** (<who asked, the date, their words in quotes>). <What exists now
and why it is wrong, with the file, route or replay step that shows it.> <What to build, concretely:
files, names, behaviour, the reference image or the old code to port from by path>. <The test that
proves it, named.> model:<tier>`

One task is one session's worth: about 5 to 40 minutes. Name every reference by its full path. A task
whose result a person sees names its screenshot test; a task that changes measured behaviour names its
measurement and the bar it must meet.
