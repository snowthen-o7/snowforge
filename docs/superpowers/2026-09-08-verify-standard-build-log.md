# Verify Standard — Build Log (phases 1-3)

Preserved from the subagent-driven execution of
`docs/superpowers/plans/2026-09-08-verify-standard-phases-1-3.md`.
Records every ruling made during the build and every finding deliberately deferred.
Kept because 19 of the defects found were in the plan itself, not the implementations —
the reasoning behind each correction is worth more than the diffs.

# SDD ledger — plan: C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\docs\superpowers\plans\2026-09-08-verify-standard-phases-1-3.md

Spec: C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\docs\superpowers\specs\2026-09-08-verify-standard-design.md
Started: 2026-09-08

## Setup rulings

Ruling: No git worktree for this plan — the skill's isolation step does not map to a
multi-repo plan. Tasks 1-8 and 10 create a greenfield repo (snowforge-verify, `git init`),
so there is no branch to isolate from; Task 9 touches SnowPipe, already on `claude-main`,
which IS the SnowForge isolation branch by convention (main is reached only via Alex's PR);
Task 11 edits ~/.claude/settings.json, which is not repo work at all.
Cost if wrong: SnowPipe gains 2 scoped files on claude-main that are trivially revertible.

Ruling: Task 1's review-package BASE is the empty-tree hash
4b825dc642cb6eb9a060e54bf8d69288fbee4904, since the repo has no prior commit.
Cost if wrong: the Task 1 reviewer sees a slightly larger diff than necessary. Harmless.

## Pre-flight conflict scan

| # | Scope | Produces vs consumes | Finding |
|---|---|---|---|
| 1 | T1 self | repo.mjs exports vs its own tests | Consistent. `findRepoRoot` test uses `URL.pathname` giving `/C:/...`; `toPosix` strips the leading slash. OK |
| 2 | T2 self | changes.mjs vs its tests | Consistent. Fake git takes `(root,args)`, real `runGit` matches |
| 3 | T3 self | manifest.mjs vs its tests | Consistent. Opt-out `{"surfaces":{}}` valid; budgets merged over defaults |
| 4 | T4 self | route.mjs vs its tests | Consistent after the maxTier fix; `deferred` asserted in 3 added tests |
| 5 | T5 self | state.mjs vs its tests | Consistent. memIO stub matches the `{read,write,mkdir}` io contract |
| 6 | T6 self | run.mjs vs its tests | Consistent. `execWith` ignores extra args; timeout maps to blocked |
| 7 | T7 self | report.mjs vs its tests | Consistent. Truncation bound 8000 < asserted 9000 |
| 8 | T8 self | cli.mjs vs its tests | Consistent. All 11 cases reachable through injected deps |
| 9 | T1→T8 | findRepoRoot/isInScope | Signatures match |
| 10 | T2→T5,T8 | runGit, getChangedFiles | Signatures match; T5 imports runGit from changes.mjs |
| 11 | T3→T4,T8 | TIERS, DEFAULT_BUDGETS, loadManifest | Signatures match |
| 12 | T4→T8 | route(manifest, changed, maxTier) | Matches; T8 passes `d.maxTier` defaulting to 'browser' |
| 13 | T6→T8,T10 | runAll; T10 modifies run.mjs | No conflict — T10 appends `preflight`, does not alter `runAll` |
| 14 | T7→T8 | decide/formatPass/formatFailure | Signatures match |
| 15 | T8→T10 | T10 edits cli.mjs | T8's tests omit `preflight` from fakes; real preflight returns ok for fast tier. Noted in T10 Step 5 |
| 16 | T8,T10→T11 | hook command path src/cli.mjs | Matches |
| 17 | T9 self | SnowPipe manifest vs regression test | VERIFIED against the repo: `@` alias resolves (vitest.config.ts), `tests/unit/` and `tests/regression` paths valid, vitest excludes `.claude/**` so the manifest is not collected as a test |
| 18 | T9 ordering | T9 Step 7 runs the CLI before T10's preflight exists | Not a conflict: T9's change set (.claude/verify.json + tests/regression/**) matches no browser surface, so only `always` runs at the fast tier |
| 19 | Global | 540s hook timeout vs 480s budget total | Consistent (T11 Step 2, Global Constraints) |
| 20 | Global | maxTier cap vs spec §5 "full never hook-invoked" | Consistent after the plan's self-review fix |

Scan clean — no conflicts requiring a ruling.

## Progress

Task 1: dispatched (sonnet) — BASE 4b825dc (empty tree, greenfield repo)
  Briefs 1-8 extracted to the workspace.
Task 1: minor (deferred): package.json declares a `lint` script with no eslint dependency
  and no eslint config. Ruling: keep package.json verbatim per the brief, do not run
  `pnpm lint`, add eslint in a later phase. Cost if wrong: `pnpm lint` errors until then;
  nothing in phases 1-3 depends on it.
Task 1: implementer returned DONE_WITH_CONCERNS (commit 3e7a968, 6/6 passing).
  Controller verified independently: commit exists, tree clean, 6/6 on own run.
Task 1: Ruling: accept the implementer's deviation from the brief's verbatim findRepoRoot.
  The brief's code was wrong — controller reproduced it directly:
  path.resolve('/C:/Users/alexi') returns 'C:\C:\Users\alexi', and Node's URL.pathname
  produces exactly that '/C:/...' shape. Fix is toPosix() before resolve as well as after.
  Spec is the binding authority and requires working repo detection; the plan's literal
  code does not deliver it. Cost if wrong: none identified — the fix is one line, covered
  by an existing test, and narrower than the bug it removes.
Task 1: minor (deferred): README.md content was the implementer's own composition; the
  brief named the file but gave no content. Not load-bearing.
Task 1: review clean on both verdicts (spec ✅, quality Approved). Two ⚠️ items resolved by
  controller:
  - ⚠️ drive-letter case sensitivity: CONFIRMED REAL GAP. Controller reproduced:
    isInScope('c:/.../SnowPipe') === false while 'C:/...' === true. Effect is that the Stop
    hook silently skips verification in a real SnowForge repo — precisely the silent-skip
    the spec exists to prevent. Treated as a failed spec review; enters the fix loop.
  - ⚠️ eslint/`pnpm lint`: not a gap. Already ruled deferred earlier in this ledger.
Task 1: Ruling: bundle the reviewer's second Minor (no isolated test pinning the
  leading-slash '/C:/...' path bug) into the already-open fix round rather than opening a
  round for it later. It costs one test and the round is open regardless. Cost if wrong:
  one extra test in a scaffold task.
Task 1: fix round 1/5 (2 addressed, 0 open — isInScope case-insensitivity; isolated
  leading-slash regression test; commits 3e7a968..71cb0e6)
Task 1: minor (deferred): isInScope uses plain string startsWith rather than
  path-segment-aware matching. Re-reviewer judged it not a real bug (the compared prefix
  carries a trailing slash). Recorded for the final whole-branch review to triage.
Task 1: complete (commits 3e7a968..71cb0e6, review clean)
Task 2: dispatched (haiku) — BASE 71cb0e6
Task 2: implementer returned DONE (commit bd13f3c, 19/19). Controller verified: tests pass,
  tree clean, code matches the brief verbatim.
Task 2: Ruling: SPEC DEFECT found by controller smoke test, corrected before review.
  The change-set definition (spec §10, plan Task 2) used `merge-base origin/main HEAD`.
  Measured on SnowPipe: clean tree, yet 180 files returned, because claude-main carries 69
  commits not on origin/main and that set never shrinks. Consequence: src/app/** is
  permanently in the change set, so EVERY code edit routes to the browser tier and runs the
  full Playwright suite on every stop. Alex disables the hook within a day and the standard
  dies. Corrected definition: diff against the branch's own upstream (`@{u}`), falling back
  to merge-base with origin/main only when no upstream exists. Measured on SnowPipe with the
  correction: 0 files, which is right. Spec §10, plan Task 2, and the brief are being
  updated; the change goes back to the Task 2 implementer as a fix round before review.
  Cost if wrong: a branch with no upstream and no origin/main falls back to working tree
  only, i.e. under-verification on an unusual branch. Narrower than the failure it removes.
Task 2: fix round 1/5 (1 addressed, 0 open — upstream-based change set; commits
  bd13f3c..d348626). Controller re-verified against three real repos after the fix:
  SnowPipe 0 files (was 180), snowforge-verify 0, SnowForge exactly its 4 real changes.
Task 2: review clean on both verdicts (spec ✅, quality Approved).
  ⚠️ rev-parse @{u} real-world output: not a gap — controller already confirmed it against
  three real repos, including the no-upstream fallback path.
Task 2: minor (deferred): src/changes.mjs defines a local clean() duplicating toPosix from
  src/repo.mjs. Defect originates in the brief, whose Interfaces section claims it consumes
  toPosix while its code sample never imports it. Follow-up: wire in toPosix, drop clean().
Task 2: minor (deferred): commit d348626 reuses bd13f3c's message ("...merge-base diff"),
  now inaccurate since merge-base is only the fallback. Misleading in git log later.
Task 2: complete (commits bd13f3c..d348626, review clean)
Task 3: dispatched (haiku) — BASE d348626
Task 3: review spec ✅, quality CHANGES REQUESTED (1 Critical, 2 Important, 2 Minor).
Task 3: Ruling: all findings are real and all originate in the plan's own code, which the
  implementer transcribed faithfully. Controller confirmed each by direct execution:
  - null manifest -> uncaught TypeError (JSON 'null' passes a truthiness check). Violates
    the Global Constraint "a broken dispatcher must never wedge a session". CRITICAL.
  - budgets {"fast":"soon"} -> ok:true. That value reaches Task 6 as "soon" * 1000 = NaN,
    which disables the spawn timeout, which lets the run exceed the 540s Stop-hook timeout,
    and a timed-out Stop hook FAILS OPEN. Load-bearing, not cosmetic.
  - unverified "nope" -> ok:true. Task 4 does Object.entries() on it and would iterate
    string characters into disclosure output.
  - ignore ["ok",5] -> ok:true. Non-string reaches picomatch in Task 4.
  Spec is binding authority (Global Constraints + §10 "infrastructure failure is never a
  pass"); the plan's literal code does not deliver either. Plan hardened in b79d3d9 with an
  isPlainObject guard, positive-number budget validation, shape checks, and 11 new tests.
  Cost if wrong: a manifest shape someone intended as valid is now rejected with a readable
  reason, which is a loud, cheap failure rather than a silent one.
Task 3: fix round 1 dispatched to original implementer with the corrected brief.
Task 3: fix round 1/5 (4 addressed, 0 open — null-manifest wedge, non-numeric budget,
  unverified shape, ignore element types; commits 286fad7..50ad188). Re-reviewer confirmed
  bad budgets hard-reject rather than silently defaulting, and that 'missing' is untouched.
Task 3: minor (deferred): tier-validation message reads "unknown tier undefined" when the
  surface definition itself is null, rather than naming the real problem. Cosmetic.
Task 3: complete (commits 286fad7..50ad188, review clean)
Task 4: dispatched (haiku) — BASE 50ad188
Task 4: implementer returned NEEDS_CONTEXT, correctly refusing to edit a test to match a
  failing implementation. It diagnosed a picomatch API defect in the brief's own code.
Task 4: Ruling: the implementer is right; controller confirmed by direct execution.
  picomatch's matcher is (input, returnObject). Passing it to Array.prototype.some feeds
  the array INDEX in as returnObject, and index >= 1 returns a truthy options object
  instead of a boolean. Measured:
    isMatch('packages/db/x.sql')            -> false
    isMatch('packages/db/x.sql', 1)         -> {glob:..., isMatch:false}  (truthy)
    ['a','b'].some(isMatch)                 -> true   (nothing actually matched)
    ['a','b'].some(f => isMatch(f))         -> false
  Index 0 is falsy, so a single-file change set routes correctly and EVERY multi-file one
  matches every surface glob. Practically every real session changes 2+ files, so routing
  would have been wrong almost always: every surface selected, highest tier always firing,
  disclosures printed for unrelated surfaces. Most severe plan defect so far.
  Fixed in 7f17a03 via a matchesAny() helper at both call sites, plus three multi-file
  regression tests (single-file cases are structurally incapable of catching this).
  Cost if wrong: none identified — the helper is strictly narrower than the inline calls.
Task 4: NOT counted as a fix round — no implementation was ever committed. Brief corrected
  and the same implementer resumed.
Task 4: review spec ✅, quality CHANGES REQUESTED (1 Important, 1 Minor).
Task 4: Ruling: the Important is real and is a silent-skip defect. Controller confirmed by
  direct execution — a manifest whose only surface is full-tier, with no `always`, called
  with maxTier 'browser', returns {tier:'fast', runs:[], deferred:['pnpm db:verify']}.
  Two compounding faults: (a) route reports a 'fast' verdict when nothing executed;
  (b) the CLI no-ops on empty runs, so the deferred command is never surfaced. Net effect:
  such a repo verifies nothing on every stop and never says so. That is the exact failure
  the spec forbids, so it outranks its "Important" label.
  Fixed in c1b16c2: route reports 'skip' unless `always` actually contributed a run, and
  Task 8's CLI emits VERIFY DEFERRED instead of exiting silently. Task 8 was not yet
  implemented, so its correction is pre-emptive and costs nothing.
  Cost if wrong: one extra line of output on stops in repos configured this way.
Task 4: minor (deferred): the `ignored` predicate calls picomatch directly rather than via
  matchesAny. Safe as written (single-arg arrow, no index leak) and inherited from the
  brief, but it is the one remaining direct picomatch call a future edit could turn unsafe.
Task 4: fix round 1 dispatched to original implementer with the corrected brief.
Task 4: fix round 1/5 (1 addressed, 0 open — skip-not-fast on empty run set; commits
  7dc9e21..59ecd63). Re-reviewer confirmed the always-present fast floor still works and
  the picomatch discipline is byte-identical. Noted nuance: of the two new tests only the
  skip one pins the regression; the other guards against over-correction. Acceptable.
Task 4: complete (commits 7dc9e21..59ecd63, review clean)
Task 5: Ruling: PRE-EMPTIVE plan fix, found by controller probe before dispatch.
  stateKey hashed only `git rev-parse HEAD` + `git diff HEAD`. Verified in a scratch repo
  that `git diff HEAD` is zero bytes when an untracked file is added, so a brand-new source
  file is invisible to the key. Consequence: an agent that fixes a blocked verification by
  ADDING a file keeps the same key, hits the cached verdict, and the fix is never verified —
  a silent skip inside the very mechanism meant to force re-verification. Hashing the file
  list alone would still miss later edits to that file, so contents are hashed as well.
  Fixed in the plan before dispatch; five new tests. Cost if wrong: stateKey reads untracked
  file contents each stop. Bounded, since ls-files --others --exclude-standard honours
  .gitignore and never descends into node_modules.
Task 5: dispatched (haiku) — BASE 59ecd63
Task 5: review clean (spec ✅, quality Approved).
  ⚠️ dispatcher try/catch: not a gap — Task 8's main() wraps everything and returns exit 0.
  ⚠️ attacker-influenced session ids: not realistic — Claude Code supplies UUIDs.
Task 5: minor (deferred): sessionId is interpolated into a cache path unsanitized.
Task 5: minor (deferred): writeVerdict's mkdir/write are unguarded; relies on the
  dispatcher's top-level try/catch for the never-wedge guarantee.
Task 5: complete (commit d00630d, review clean)
Task 6: probed the brief before dispatch — NO defect found. Verified spawnSync on Windows:
  timeout -> status null + signal SIGTERM (maps to blocked), exit 1 -> fail, exit 0 -> pass,
  1ms exhausted-budget path -> SIGTERM -> blocked. Known limitation, accepted not fixed: a
  missing binary exits 1 and reports as 'fail' rather than 'blocked'. It still blocks, never
  passes, and Task 10's preflight covers the real tooling cases. Adding stderr heuristics to
  distinguish them would be fragile and platform-specific. YAGNI.
Task 8: Ruling: PRE-EMPTIVE plan fix, found by controller probe before dispatch. WORST
  DEFECT OF THE RUN. The entrypoint guard compared import.meta.url to a hand-built
  `file://${argv[1]}` string. Measured on this host:
    import.meta.url : file:///C:/...   (three slashes)
    constructed     : file://C:/...    (two)  -> NO MATCH
  The block would never execute, so `node src/cli.mjs` would load the module, run nothing,
  and exit 0 — which the harness reads as "do not block". Verification would be silently
  dead in every repo on every stop, with the entire unit suite green, because every test
  calls main() directly and never exercises that line. Fixed to pathToFileURL, and Task 8
  Step 5 now states explicitly that a silent exit 0 means the entrypoint is broken.
  Cost if wrong: none identified; pathToFileURL is the documented API for exactly this.
Task 6: implementer DONE (commit 06f81ce, 76/76). Controller verified with REAL
  subprocesses, not the test fakes: all-succeed -> pass; second-command-fails -> fail and
  names the failing command; outlives-budget -> blocked; empty list -> pass.
Task 6: observation for budget tuning (not a defect): spawnSync with shell:true costs ~2s
  per command on this Windows host — two trivial node commands took 5s wall-clock. Real
  suites dwarf it, but it is fixed overhead against the 480s hook budget. Feeds spec §14
  open question 2, which asks for measured browser-tier wall-clock.
Task 6: review clean (spec ✅, quality Approved).
  ⚠️ dispatcher try/catch around runAll: not a gap — Task 8's main() wraps everything.
  ⚠️ exit-124 unconfirmed on Windows: not a gap — 124 is the GNU timeout convention and
     will not arise here; the SIGTERM path is the real one and is verified.
Task 6: minor (deferred): the blocked branch discards partial stdout/stderr, so someone
  acting on a budget overrun sees only "exceeded the Ns budget" with no sign of what was
  in flight. Brief-level gap. Worth revisiting once real browser-tier timings exist.
Task 6: minor (deferred): no test exercises defaultExec (the real spawnSync adapter) —
  every test injects a fake. Controller's real-subprocess run covers it for now.
Task 6: complete (commit 06f81ce, review clean)
Task 7: dispatched (haiku) — BASE 06f81ce
Task 8: Ruling: PRE-EMPTIVE plan fix #2, found by controller reading the control flow
  before dispatch. INFINITE BLOCK LOOP. The missing-manifest branch blocked but never
  recorded a verdict, and it sat BEFORE the state-key cache check. In any SnowForge repo
  without a manifest, every stop would block, forever, with no escape — nothing the agent
  can do to the code causes a manifest to appear, so the state never changes into a passing
  one. The session could never end. Spec §8 explicitly says "blocks once".
  Fixed: state key and cache check moved ahead of every blocking branch; both the missing
  and invalid manifest paths now record a 'blocked' verdict. Three new tests.
  Cost if wrong: a repo with no manifest is nagged once per distinct code state rather than
  once per session, which is the intended fail-loud onboarding behaviour anyway.
Task 7: review spec ✅, quality Approved with 1 Important + 1 Minor, both brief-level.
Task 7: Ruling: the Important is real and worth fixing despite being currently unreachable.
  decide() listed the blocking verdicts and fell through to exit 0 for anything else, i.e.
  it FAILED OPEN. runAll only ever returns pass/fail/blocked today, so nothing reaches the
  fallthrough — but decide is the single chokepoint where a future upstream bug would leak a
  silent "verified" through the very gate built to stop it. Inverted so only an explicit
  'pass' lets a session end. Bundled the Minor (formatPass threw on an omitted disclosures
  argument) since the round was open. Fixed in 0f1032f, four new tests.
  Cost if wrong: an unexpected verdict blocks a session that might have been fine, which is
  the recoverable direction — the user can always disable the hook; a false pass is silent.
Task 7: fix round 1 dispatched to original implementer with the corrected brief.
Task 7: fix round 1/5 (2 addressed, 0 open — fail-closed decide(), formatPass disclosures
  guard; commits 4ba9851..3aa7423). Re-reviewer confirmed report-mode check still precedes
  the pass check (an inversion there would have stalled the autobuild loop), strict ===
  against 'pass', and formatFailure byte-identical.
Task 7: complete (commits 4ba9851..3aa7423, review clean)
Task 8: dispatched (sonnet — integration task, wires all seven modules) — BASE 3aa7423
Task 8: implementer DONE_WITH_CONCERNS (commit a2d00c7, 103/103). It hit the silent-death
  symptom on smoke Step 5, correctly refused to call it a pass, investigated, and traced it
  to an empty change set rather than a dead entrypoint. Exactly the behaviour the dispatch
  asked for.
Task 8: Ruling: the implementer's diagnosis is correct; the defect is in the BRIEF, not the
  code. Controller verified all four paths directly:
    A. SnowForge (has changes, no manifest) -> exit=2 + /verify-init. ENTRYPOINT FIRES,
       so the pathToFileURL fix is proven in the only way available.
    B. same state key again              -> exit=0. Block-once proven; no infinite loop.
    C. SnowPipe (clean, 0 changed files) -> exit=0 silent. Legitimate no-op.
    D. unrelated directory               -> exit=0 silent. Scope guard holds.
  Root cause of the stale step: it targeted SnowPipe expecting exit=2, which held when the
  change set diffed against origin/main (180 files on a clean tree). The Task 2 upstream fix
  made that 0. My own earlier correction invalidated a later step's precondition.
  Plan fixed: the step now confirms the change count first and states how to distinguish an
  empty change set from a dead entrypoint, since both print exit=0 with no output. Added 5b
  for block-once. No code change required. Cost if wrong: none, documentation only.
Task 8: minor (deferred): when blocking, the same reason text is returned on both stdout and
  stderr, so a manual run prints it twice. Harmless under the hook (stdout goes to the debug
  log only) but noisy at a terminal.
Task 8: review spec ✅, quality Approved. Reviewer confirmed the entrypoint uses
  pathToFileURL, the state key precedes every blocking branch, both manifest branches write
  a verdict, maxTier defaults to browser, and the try/catch wraps the whole decision body.
Task 8: Ruling: the reviewer's ⚠️ is a real gap and I am closing it rather than deferring.
  Spec §10 requires dispatcher throws to be logged to verify-cache/errors.log; the plan
  never carried that into any task. The catch exits 0 (correct — a broken dispatcher must
  not wedge every session), but on a Stop hook stdout is debug-only, so a crash would
  disable verification in every repo permanently with NO trace anywhere. That is this
  project's cardinal failure arriving through its own error handler, so it outranks the
  "outside this task's scope" framing. Fixed in 2a6b581: injectable logError defaulting to
  an append to errors.log, inner catch so logging cannot itself wedge a session, two tests,
  and the base test fake now injects a no-op logger so the suite writes no real files.
  Cost if wrong: one append per crash to a file nothing reads unless something is wrong.
Task 8: minor (deferred): a writeVerdict I/O failure after a genuine pass converts that pass
  into "internal error, skipped". Correct under the never-wedge priority, but it can mask a
  real pass under a rare disk-write failure.
Task 8: fix round 1 dispatched to original implementer with the corrected brief.
Task 8: fix round 1/5 (1 addressed, 0 open — errors.log; commits a2d00c7..4cb2296).
  Controller verified end-to-end with the REAL logger: errors.log absent beforehand, a
  thrown dependency wrote a timestamped stack, exit stayed 0, probe entry then removed.
Task 8: complete (commits a2d00c7..4cb2296, review clean)
Task 9: Ruling: PRE-EMPTIVE plan fix #3, found by probing SnowPipe's real source before
  dispatch. filterRecordsStream's parameter is AsyncIterable<Record<string, unknown>>, but
  the brief's regression test passed a plain array. It would have run green under vitest —
  for-await accepts sync iterables — while failing `tsc --noEmit`, which is the exact
  command the SnowPipe manifest runs as its `always` floor. The test written to lock the
  #82 contract would have broken SnowPipe verification on every run from installation.
  Fixed in the plan: async-generator wrapper at all three call sites, RECORDS typed as
  Record<string, unknown>[], plus an explicit tsc --noEmit step since vitest does not
  typecheck. Also caught and fixed my own `async function` -> `async function*` slip while
  editing. Verified from source: FilterConfig.conditions and FilterCondition{field,operator,
  value} match the fixture, 'contains' is a real FilterOperator, and tests/regression is
  created by this task before the manifest references it.
  Cost if wrong: the generator wrapper is strictly more faithful to the real call shape.
Task 9: SnowPipe BASE recorded as 6ce8474 (Task 9 touches SnowPipe, not snowforge-verify).
Task 9: implementer DONE (commit 18af906, 5/5 regression tests, tsc clean, break-and-revert
  experiment confirmed 3/5 fail on the reintroduced #82 symptom, never committed).
  Controller verified: only 2 files in the commit, tree clean, tests pass.
  MEASURED (spec §14 open question 2): dispatcher `always` floor = 15s; full fast tier
  = 31.4s against a 120s budget. Browser tier still unmeasured.
Task 9: Ruling: TWO defects, both mine, both measured not reasoned.
  #13 — the fast tier command ran the whole unit suite, including
  plugin-refresh-access-token.test.ts, which opens a Prisma connection needing DATABASE_URL
  from Doppler. Measured in a plain shell: 1 failed | 260 passed. The tier would have
  returned `fail` on EVERY verification of src/server/streaming/**, src/server/core/** and
  backend-ion/**, blaming correct code with a Prisma stack trace. Alex disables the hook,
  verification ends. Excluded: 260 passed, 4451 tests, 31.4s.
  #14 — the obvious fix was itself nearly broken. The dispatcher shells via
  spawnSync({shell:true}), i.e. cmd.exe on Windows, where single quotes are ordinary
  characters. Measured: single-quoted arg arrives as "'**/foo.test.ts'" with quotes
  embedded, so vitest matches nothing and runs the excluded test anyway — a plausible fix
  that silently does nothing, on Windows only, while working in my Git Bash check. Double
  quotes work under both cmd.exe and POSIX shells.
  The exclusion is a real coverage reduction, so it is declared in `unverified` on all three
  surfaces using that command, carrying the `doppler run --` command to check it properly.
  Cost if wrong: one genuine test is outside the hook-invoked run and is disclosed on every
  pass rather than silently dropped.
Task 9: fix round 1 dispatched to original implementer with the corrected brief.
Task 9: fix round 1/5 (2 addressed, 0 open — Doppler-dependent test excluded from the fast
  tier, double-quoted for cmd.exe; commits 18af906..fde32ac).
  Controller verified the decisive thing directly: read the COMMITTED manifest and ran its
  fast-tier command through the dispatcher's own runAll (spawnSync, shell:true, cmd.exe).
  Result: verdict=pass, 37s against a 120s budget. This proves the double-quoted exclude
  survives cmd.exe, which was the whole risk.
  MEASURED: fast tier 30-37s depending on cache state, budget 120s. Comfortable.
Task 9: review spec ✅, quality CHANGES REQUESTED (1 Critical, 1 Important, 1 Minor).
Task 9: Ruling: the Critical is correct and the error was MINE, asserted to the user as
  measured fact when it was inferred. I claimed a plain array in the regression test would
  fail the manifest's `tsc --noEmit` floor. It would not. SnowPipe's tsconfig carries
  exclude [node_modules, tests, backend-ion, scripts]. Verified with tsc --showConfig:
  489 files compiled, 0 under tests/, 0 under backend-ion/. The async-generator wrapper is
  still right — it matches filterRecordsStream's real AsyncIterable signature — but the
  stated rationale was false and would have been permanently embedded as a comment in
  SnowPipe. Corrected in ea37be7 to say the shape must be right by construction because
  nothing enforces it.
Task 9: Ruling: the Important is real and follows from the same exclusion. backend-ion gets
  NO typecheck anywhere — not from the hook's always floor, not from CI (which runs the
  identical command) — and it has no typecheck script of its own. That is the surface which
  produced #83, the ERR_REQUIRE_ESM production Lambda cold-start crash. Not fixable here:
  TODO.md records backend-ion/tsconfig.json lacking baseUrl/paths and emitting 10
  pre-existing resolution errors, so enabling a typecheck would fail on unrelated debt.
  Declared in `unverified` instead, so every pass touching backend-ion says out loud that
  its types were not checked. Cost if wrong: one more disclosure line per backend-ion pass.
Task 9: minor (deferred): several src/ subtrees (api, middleware, plugins, queue, services,
  utils, lib, hooks, contexts) match no surface glob and get only the always floor. Matches
  the brief's stated phase-1 scope; revisit when extending coverage.
Task 9: fix round 2 dispatched.
Task 9: fix round 2/5 (2 addressed, 0 open — false tsc rationale corrected, backend-ion
  typecheck gap disclosed; commits fde32ac..1e1c1f1). Implementer independently reproduced
  the tsc --showConfig finding rather than taking the controller's word for it.
Task 9: complete (commits 18af906..1e1c1f1, review clean)
Task 10: Ruling: PRE-EMPTIVE plan fix #4, found by probing before dispatch. The preflight
  browser check ran `pnpm exec playwright --version` and treated exit 0 as "browsers
  installed". Measured on this host: it printed Version 1.58.2 and exited 0, proving only
  that the npm package exists — browser binaries download separately. A machine with the
  package but no binaries would pass preflight, fail at launch, and be reported as `fail`,
  blaming the code for a tooling gap. That is precisely the misdiagnosis preflight exists
  to prevent, so the check as written defeated its own purpose.
  Replaced with parsing `install --dry-run` for resolved `Install location:` paths and
  checking them on disk (honours PLAYWRIGHT_BROWSERS_PATH). Unparseable output proceeds
  rather than blocks: a real launch failure still surfaces as `fail`, so no path here can
  become a silent pass. Cost if wrong: a less specific message in an edge case.
  Also confirmed on this host that the browser tier CAN actually run — chromium-1208 and
  friends are present in ms-playwright, and SnowPipe's Clerk storage state exists (44KB).
Task 10: dispatched (haiku) — BASE 4cb2296 (snowforge-verify)
Task 10: implementer DONE (commit 3522559, 109/109). Controller verified with the REAL
  checks rather than injected fakes: fast tier no-ops; browser tier returns ok in 2s on this
  host (chromium binaries genuinely detected via the dry-run location parse); a missing auth
  state blocks with the playwright --project=setup remedy; missing browsers block with the
  playwright install chromium remedy. Both failure paths produce `blocked`, never `fail`.
Task 10: review spec ✅, quality CHANGES REQUESTED (2 Important, 2 Minor). Both Importants
  trace to the brief's own code, not the implementer.
Task 10: Ruling: Important #1 is real and structurally certain. `playwright install
  --dry-run` prints six entries — chromium, chromium-headless-shell, firefox, webkit,
  ffmpeg, winldd — regardless of what is on disk (controller enumerated all six live). So
  `.some(exists)` means a leftover ffmpeg from an interrupted install masks a missing
  chromium: preflight passes, the real run fails at browser launch, and runAll reports
  `fail`. That is precisely the misdiagnosis preflight exists to prevent, so the check
  defeated its own purpose for the second time in this task. `.every()` would be wrong in
  the opposite direction — a chromium-only repo blocked forever over an uninstalled webkit.
  Now matches the chromium entry BY NAME and checks that one location.
  Cost if wrong: a repo driving firefox or webkit instead would need the matcher widened;
  it fails toward a false block, which is loud, not silent.
Task 10: Ruling: Important #2 is real. preflight exempted every tier but `browser`, yet
  `route` puts every surface at or below the cap into ONE run set, so a `full` plan can
  carry a browser-tier Playwright command and would have executed it with no prerequisite
  check at all. Only `skip` and `fast` are exempt now. Not reachable today (no SnowForge
  manifest defines a full-tier surface) but a genuine hole in the general dispatcher.
Task 10: minor (deferred): defaultChecks has no automated coverage; all four tests inject
  fakes. Controller's real-checks run covers it for now.
Task 10: minor (deferred): unparseable dry-run output proceeds rather than blocks. Deliberate
  and documented, but narrowly in tension with "infrastructure failure is never a pass" —
  a genuine missing browser would then surface as `fail` rather than `blocked`.
Task 10: fix round 1 dispatched with the corrected brief (eb6b71e).
Task 10: fix round 1/5 (2 addressed, 0 open — chromium matched by name instead of .some();
  full tier no longer exempt from preflight; commits 3522559..0ebaa88). Re-reviewer checked
  Playwright's own source to confirm the regex pairs each title with its own location,
  handles CRLF, and that "playwright chromium v" does not false-match
  chromium-headless-shell.
Task 10: complete (commits 3522559..0ebaa88, review clean)

ALL TEN BUILD TASKS COMPLETE. 112 tests in snowforge-verify, 5 in SnowPipe.
Controller re-verified the guards with correct exit-code capture (an earlier probe indexed
PIPESTATUS[0], which is echo's status, not node's — probe error, not a code defect):
  unrelated repo outside SnowForgeLLC (with changes) -> exit 0, silent
  C:/Users/alexi (accidental home repo)              -> exit 0, silent
  SnowForge, no manifest, fresh session              -> exit 2, names /verify-init
  same session + same state                          -> exit 0, blocks once
  different session, same state                      -> exit 2, per-session verdicts
Task 11: NOT started. Held for Alex's explicit decision — it is the only step whose effect
  reaches outside this project, writing a blocking Stop hook into ~/.claude/settings.json
  that fires in every Claude Code session on this machine. settings.json currently has no
  hooks key at all.
FINAL WHOLE-BRANCH REVIEW (opus): verdict NOT YET. Three blocking findings, all confirmed
  real by the controller:
  1. Infra blocks re-fire on EVERY edit. Missing manifest, invalid manifest and failed
     preflight block on causes no code change can clear, yet were keyed on the code state.
     The natural response to a block is to edit, which mints a new key and blocks again,
     endlessly. My earlier "blocks once, correct" check only covered the SAME-state case;
     the changed-state case is the live one. Would have fired on registration day.
  2. A writeVerdict I/O failure turned every block into exit 0 via the outer never-wedge
     catch — dispatcher silently stops blocking anywhere, with errors.log in the same
     unwritable directory so no trace. "Infrastructure failure yields pass" through the
     guard meant to prevent exactly that.
  3. Pass disclosures and VERIFY DEFERRED reach nobody. Controller re-read the hooks
     contract: Stop stdout goes to the debug log and Stop is NOT among the events whose
     stdout is shown; stderr on exit 0 likewise; systemMessage is not documented to be
     delivered on Stop. So there is no exit-0 channel at all. Spec §7 claimed the hook
     "prints those lines on every pass" — false, and written by me.
  Alex approved proceeding with all three fixes. Spec §3 and §7 corrected in 7bc2761;
  Task 12 added to the plan with eight tests.
Opt-out batch: 18/18 repos. 17 placeholders, snowforge-verify a real 2-surface manifest,
  SnowPipe untouched at 1e1c1f1. Controller verified all 19 manifests parse, and confirmed
  functionally that an opted-out repo with real changes returns exit 0 silently.
  Note: 6 repos gitignore .claude/, so the agent used a path-scoped `git add -f`. Once
  tracked, git follows them regardless of the ignore rule.

## Post-rollout fix 1 — preflight checked the wrong browser, and demanded SnowPipe's Clerk file of everyone

Ruling: TWO hardcoded SnowPipe assumptions in `preflight`, both measured, both fixed
together on Alex's direction. Task 10's own ruling had already predicted the first one
("a repo driving firefox or webkit instead would need the matcher widened") and accepted it
as failing toward a loud block. It came due immediately.

**#1, the browser check.** `defaultChecks.browsersInstalled` matched the chromium entry by
name and checked that one location. The handoff assumption was that TrueIce — which drives
firefox — would therefore pass preflight and die at launch, getting reported as a code
defect. Measured on this host 2026-09-08, the direction is the **opposite**, and worse:

    TrueIce browser-tier preflight -> {ok:false, "Playwright browsers are missing.
                                       Run: pnpm exec playwright install chromium"}

TrueIce's Playwright resolves chromium to `chromium-1223`, which is not on disk (only
`chromium-1208` is), while the `firefox-1522` it actually drives *is* installed. So preflight
false-blocked a repo whose browsers were fine, over a browser it never launches, with a
remedy that would install something it does not use. Loud rather than silent, as Task 10
predicted, but still a block on every qualifying stop.

**#2, the auth state.** `preflight` also required `tests/playwright/.clerk/user.json` of
*every* browser-tier repo. That is SnowPipe's Clerk storage state. Any other repo standing up
a browser tier gets blocked forever with a remedy that means nothing to it — and SnowCards and
OnDeck, the next two in the rollout, both reach the browser tier through Expo web.

**Why the browser set is a manifest fact and not derived from playwright.config.ts.** Measured
before choosing: `TrueIce/playwright.config.ts` declares `firefox` at line 40 and then carries
commented-out `name: 'chromium'` / `devices['Desktop Chrome']` blocks at lines 46-51. Any text
parse of that file returns "chromium declared" — the wrong answer, on the exact repo that
motivated the fix. Loading the config properly with `playwright test --list` is no better
there: TrueIce's own manifest records that its e2e collection fails in under 5s. So the only
reliable source is the manifest, which is also what the spec's architecture already says
(logic central, facts per repo).

Fix: optional `browsers` (default `["chromium"]`, validated against the four names the
dry-run reports) and optional `authState` (default: no check) in the manifest schema.
`browsersInstalled` becomes `missingBrowsers(repoRoot, browsers)` returning the missing
subset, so the remedy names only what is actually absent. `preflight` takes the manifest.

Measured trap while implementing: the dry-run marker sits MID-LINE inside parentheses —
`Firefox 150.0.2 (playwright firefox v1522)` — so the match must stay unanchored. An
anchored `startsWith` would have matched nothing and silently checked no browser at all,
which is the silent-skip class this function exists to prevent. Caught by measuring the real
output before writing the matcher rather than after.

TDD throughout: 12 tests written first and watched fail. The cli wiring test was verified RED
by reverting the call site to its two-argument form, confirming it genuinely pins the
manifest hand-off rather than passing vacuously.

Verified with REAL checks, not injected fakes:
  TrueIce  browsers=["firefox"]                      -> ok        (was: blocked on chromium)
  SnowPipe browsers=["chromium"] + authState present -> ok
  declares webkit (2287 absent, only 2248 on disk)   -> blocked, names webkit only
  declares firefox+webkit                            -> blocked, names webkit only, not firefox
  declares firefox + a missing authState             -> blocked, names the declared path
  all 19 repo manifests                              -> parse, 0 invalid
  dispatcher against its own changed tree            -> VERIFY PASS snowforge-verify fast (3s)
140 tests (was 128), tsc clean.

Cost if wrong: a repo that adds a browser to its Playwright config and forgets its manifest
fails at launch rather than at preflight, which its `infrastructure` patterns classify — the
same drift any per-repo fact carries, and narrower than false-blocking every non-chromium repo.

Deferred (unchanged from Task 10): `defaultChecks` still has no automated coverage; all
preflight tests inject fakes, and the real-checks run above covers it for now.
