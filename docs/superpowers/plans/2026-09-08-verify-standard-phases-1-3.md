# Cross-Repo `verify` Standard — Phases 1–3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested verification dispatcher, prove it against the SnowPipe #82 regression, and register it as a blocking `Stop` hook so runtime proof becomes a precondition of finishing work.

**Architecture:** A single Node ESM dispatcher reads a per-repo `.claude/verify.json` manifest, computes which files changed, routes those paths to verification tiers, runs the matched commands within per-tier time budgets, and returns a pass/fail/blocked verdict to the Claude Code `Stop` hook. All logic is centralized; repos contribute only facts.

**Tech Stack:** Node 20+ ESM, vitest, picomatch, git CLI. No TypeScript build step — plain `.mjs` so the hook can invoke it with zero compilation.

**Spec:** `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\docs\superpowers\specs\2026-09-08-verify-standard-design.md`

## Global Constraints

- **Package manager is pnpm.** Never npm or yarn.
- **No AI co-author trailers in commit messages.** Alex is sole author.
- **Dispatcher home is a new repo**, `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\snowforge-verify`, named `@snowforge/verify`, `"type": "module"`. This resolves a spec gap: §3 placed the dispatcher in untracked `~/.claude/scripts\`, but §11 requires tests written first, which an untracked directory cannot hold. The repo follows the existing `snowforge-notify` convention exactly: `src/`, `tests/`, `vitest.config.ts`, `tsconfig.json`, scripts `test` (`vitest run`), `test:watch`, `type-check`, `lint`.
- **A broken dispatcher must never wedge a session.** Any unexpected throw exits 0.
- **Infrastructure failure is never a pass.** Missing tooling yields `blocked`, which blocks.
- **Tier order is `skip < fast < browser < full`.**
- **Hook-invoked budgets total 480s**, under the `Stop` hook's 600s default timeout. `full` (900s) is never hook-invoked.
- **Never verify in `C:\Users\alexi`**, which is an accidental git repo containing the entire home directory.
- Windows host; all internal path matching uses repo-relative POSIX paths.

---

## Task 1: Repo scaffold and scope guard

**Files:**
- Create: `snowforge-verify/package.json`, `snowforge-verify/vitest.config.ts`, `snowforge-verify/tsconfig.json`, `snowforge-verify/.gitignore`, `snowforge-verify/README.md`
- Create: `snowforge-verify/src/repo.mjs`
- Test: `snowforge-verify/tests/repo.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `findRepoRoot(cwd: string): string | null` — nearest ancestor containing `.git`, POSIX-normalized, or `null`. `isInScope(repoRoot: string): boolean` — true only for repos under the SnowForgeLLC directory, excluding the home directory itself.

- [ ] **Step 1: Create the repo and scaffold files**

```bash
mkdir -p "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/snowforge-verify/src" \
         "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/snowforge-verify/tests"
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/snowforge-verify"
git init
```

`package.json`:

```json
{
  "name": "@snowforge/verify",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "bin": { "snowforge-verify": "./src/cli.mjs" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/ tests/"
  },
  "dependencies": { "picomatch": "^4.0.2" },
  "devDependencies": { "vitest": "^2.1.0", "typescript": "^5.6.0" }
}
```

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.mjs'] },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

`.gitignore`:

```
node_modules/
```

- [ ] **Step 2: Install dependencies**

Run: `pnpm install`
Expected: `picomatch`, `vitest`, `typescript` installed; `pnpm-lock.yaml` created.

- [ ] **Step 3: Write the failing test**

`tests/repo.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { findRepoRoot, isInScope } from '../src/repo.mjs';

const SF = 'C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC';

describe('isInScope', () => {
  it('accepts a repo under SnowForgeLLC', () => {
    expect(isInScope(`${SF}/SnowPipe`)).toBe(true);
  });

  it('rejects the home directory itself', () => {
    expect(isInScope('C:/Users/alexi')).toBe(false);
  });

  it('rejects an unrelated repo', () => {
    expect(isInScope('C:/Users/alexi/Documents/other/thing')).toBe(false);
  });

  it('rejects the SnowForgeLLC directory itself, which is not a repo', () => {
    expect(isInScope(SF)).toBe(false);
  });
});

describe('findRepoRoot', () => {
  it('returns null when no .git ancestor exists', () => {
    expect(findRepoRoot('C:/nonexistent/path/xyz')).toBe(null);
  });

  it('finds this repo from its own tests directory', () => {
    const root = findRepoRoot(new URL('.', import.meta.url).pathname);
    expect(root).not.toBe(null);
    expect(root.endsWith('snowforge-verify')).toBe(true);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `../src/repo.mjs`.

- [ ] **Step 5: Implement**

`src/repo.mjs`:

```javascript
import { existsSync } from 'node:fs';
import path from 'node:path';

const SNOWFORGE_ROOT =
  'C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC';

/** Normalize a Windows or POSIX path to forward slashes, no trailing slash. */
export function toPosix(p) {
  const s = String(p).replace(/\\/g, '/').replace(/\/+$/, '');
  // Strip a leading slash that Node's URL.pathname adds to Windows drive paths.
  return /^\/[A-Za-z]:/.test(s) ? s.slice(1) : s;
}

/** Nearest ancestor of `cwd` containing a .git entry, or null. */
export function findRepoRoot(cwd) {
  let dir = toPosix(path.resolve(cwd));
  for (;;) {
    if (existsSync(path.join(dir, '.git'))) return dir;
    const parent = toPosix(path.dirname(dir));
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * True only for repos that live directly under the SnowForgeLLC directory.
 * Excludes the home directory, which is itself an accidental git repo
 * containing everything, and excludes SnowForgeLLC itself.
 */
export function isInScope(repoRoot) {
  if (!repoRoot) return false;
  const root = toPosix(repoRoot);
  if (root === toPosix(SNOWFORGE_ROOT)) return false;
  return root.startsWith(`${toPosix(SNOWFORGE_ROOT)}/`);
}

export { SNOWFORGE_ROOT };
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS, 6 tests.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold @snowforge/verify with repo detection and scope guard"
```

---

## Task 2: Change-set computation

**Files:**
- Create: `snowforge-verify/src/changes.mjs`
- Test: `snowforge-verify/tests/changes.test.mjs`

**Interfaces:**
- Consumes: `toPosix` from `src/repo.mjs`.
- Produces: `getChangedFiles(repoRoot: string, git = runGit): string[]` — repo-relative POSIX paths, deduped and sorted. Union of the working tree and the commits this branch carries beyond its own **upstream** (`@{u}`), falling back to the merge-base with `origin/main` only when the branch has no upstream. `runGit(repoRoot: string, args: string[]): string` — thin `execFileSync` wrapper returning stdout, or `''` on non-zero exit.

**Why upstream and not `origin/main`:** measured on SnowPipe 2026-09-08, a merge-base-with-`origin/main` definition returned 180 files on a completely clean tree, because `claude-main` carries 69 commits not yet on `main` and that set never shrinks. It would pin `src/app/**` in the change set permanently, routing every edit to the browser tier and running the full Playwright suite on every stop. Against the branch's upstream the same repo returned 0 files, which is the correct answer for "nothing new in this line of work."

- [ ] **Step 1: Write the failing test**

`tests/changes.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { getChangedFiles } from '../src/changes.mjs';

/** Fake git: returns canned stdout per subcommand. Records the args it saw. */
function fakeGit(responses, calls = []) {
  const fn = (_root, args) => {
    calls.push(args);
    return responses[args[0]] ?? '';
  };
  fn.calls = calls;
  return fn;
}

describe('getChangedFiles', () => {
  it('unions working tree and committed changes, deduped and sorted', () => {
    const git = fakeGit({
      status: ' M src/b.ts\n?? src/a.ts\n',
      'rev-parse': 'origin/claude-main\n',
      diff: 'src/b.ts\nsrc/c.ts\n',
    });
    expect(getChangedFiles('/repo', git)).toEqual([
      'src/a.ts',
      'src/b.ts',
      'src/c.ts',
    ]);
  });

  it('diffs against the branch upstream, not origin/main, when an upstream exists', () => {
    const git = fakeGit({
      status: '',
      'rev-parse': 'origin/claude-main\n',
      diff: 'src/x.ts\n',
    });
    getChangedFiles('/repo', git);
    const diffCall = git.calls.find((a) => a[0] === 'diff');
    expect(diffCall).toEqual(['diff', '--name-only', 'origin/claude-main...HEAD']);
    expect(git.calls.some((a) => a[0] === 'merge-base')).toBe(false);
  });

  it('falls back to merge-base with origin/main when the branch has no upstream', () => {
    const git = fakeGit({
      status: '',
      'rev-parse': '',
      'merge-base': 'abc123\n',
      diff: 'src/y.ts\n',
    });
    expect(getChangedFiles('/repo', git)).toEqual(['src/y.ts']);
    const diffCall = git.calls.find((a) => a[0] === 'diff');
    expect(diffCall).toEqual(['diff', '--name-only', 'abc123...HEAD']);
  });

  it('normalizes backslashes to forward slashes', () => {
    const git = fakeGit({ status: ' M src\\win\\file.ts\n', 'rev-parse': '', 'merge-base': '', diff: '' });
    expect(getChangedFiles('/repo', git)).toEqual(['src/win/file.ts']);
  });

  it('handles renames in porcelain output by taking the destination', () => {
    const git = fakeGit({ status: 'R  old/x.ts -> new/x.ts\n', 'rev-parse': '', 'merge-base': '', diff: '' });
    expect(getChangedFiles('/repo', git)).toEqual(['new/x.ts']);
  });

  it('returns only working-tree changes when neither upstream nor merge-base resolves', () => {
    const git = fakeGit({ status: ' M only.ts\n', 'rev-parse': '', 'merge-base': '', diff: 'ignored.ts\n' });
    expect(getChangedFiles('/repo', git)).toEqual(['only.ts']);
  });

  it('returns an empty array when nothing changed', () => {
    const git = fakeGit({ status: '', 'rev-parse': 'origin/claude-main\n', diff: '' });
    expect(getChangedFiles('/repo', git)).toEqual([]);
  });

  it('strips quotes git adds around paths containing spaces', () => {
    const git = fakeGit({ status: ' M "src/a b.ts"\n', 'rev-parse': '', 'merge-base': '', diff: '' });
    expect(getChangedFiles('/repo', git)).toEqual(['src/a b.ts']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/changes.test.mjs`
Expected: FAIL — cannot resolve `../src/changes.mjs`.

- [ ] **Step 3: Implement**

`src/changes.mjs`:

```javascript
import { execFileSync } from 'node:child_process';

/** Run git in `repoRoot`, returning stdout or '' if the command fails. */
export function runGit(repoRoot, args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    return '';
  }
}

function clean(p) {
  let s = p.trim().replace(/\\/g, '/');
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  return s;
}

/** Parse `git status --porcelain`, taking rename destinations. */
function parseStatus(stdout) {
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const rest = line.slice(3);
      const arrow = rest.indexOf(' -> ');
      return clean(arrow === -1 ? rest : rest.slice(arrow + 4));
    })
    .filter(Boolean);
}

/**
 * Repo-relative POSIX paths changed in this line of work: the working tree
 * plus the commits this branch carries beyond its own upstream.
 *
 * Upstream, not origin/main, and the distinction is load-bearing. SnowForge
 * agent branches like `claude-main` live for months and accumulate dozens of
 * commits that main has never seen. Diffing against origin/main on such a
 * branch returns every file touched since it was cut — measured at 180 files
 * on a clean SnowPipe tree — and that set never shrinks, so the browser tier
 * would fire on every stop forever. Diffing against the upstream collapses to
 * the unpushed work, which is what "this line of work" means. Only a branch
 * with no upstream at all falls back to the merge-base.
 */
export function getChangedFiles(repoRoot, git = runGit) {
  const files = new Set(parseStatus(git(repoRoot, ['status', '--porcelain'])));

  let base = git(repoRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim();
  if (!base) {
    base = git(repoRoot, ['merge-base', 'origin/main', 'HEAD']).trim();
  }

  if (base) {
    const committed = git(repoRoot, ['diff', '--name-only', `${base}...HEAD`]);
    for (const line of committed.split('\n')) {
      const f = clean(line);
      if (f) files.add(f);
    }
  }

  return [...files].sort();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/changes.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: compute change set from working tree and merge-base diff"
```

---

## Task 3: Manifest loading and validation

**Files:**
- Create: `snowforge-verify/src/manifest.mjs`
- Test: `snowforge-verify/tests/manifest.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `DEFAULT_BUDGETS = { fast: 120, browser: 360, full: 900 }`. `loadManifest(repoRoot: string, readFile?): {ok: true, manifest} | {ok: false, reason: string}` — `reason` is `'missing'` when `.claude/verify.json` is absent, otherwise a validation message. A manifest with an empty `surfaces` object is valid and means an explicit opt-out.

- [ ] **Step 1: Write the failing test**

`tests/manifest.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { loadManifest, DEFAULT_BUDGETS } from '../src/manifest.mjs';

const read = (content) => () => content;
const missing = () => { const e = new Error('no'); e.code = 'ENOENT'; throw e; };

describe('loadManifest', () => {
  it('reports missing when the file does not exist', () => {
    expect(loadManifest('/repo', missing)).toEqual({ ok: false, reason: 'missing' });
  });

  it('accepts an explicit opt-out', () => {
    const r = loadManifest('/repo', read('{"surfaces":{}}'));
    expect(r.ok).toBe(true);
    expect(r.manifest.surfaces).toEqual({});
  });

  it('fills in default budgets', () => {
    const r = loadManifest('/repo', read('{"surfaces":{}}'));
    expect(r.manifest.budgets).toEqual(DEFAULT_BUDGETS);
  });

  it('keeps explicit budgets over defaults', () => {
    const r = loadManifest('/repo', read('{"surfaces":{},"budgets":{"fast":30}}'));
    expect(r.manifest.budgets.fast).toBe(30);
    expect(r.manifest.budgets.browser).toBe(DEFAULT_BUDGETS.browser);
  });

  it('rejects malformed JSON with a readable reason', () => {
    const r = loadManifest('/repo', read('{nope'));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/parse/i);
  });

  it('rejects a missing surfaces key', () => {
    const r = loadManifest('/repo', read('{}'));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/surfaces/);
  });

  it('rejects an unknown tier', () => {
    const r = loadManifest('/repo', read('{"surfaces":{"a/**":{"tier":"turbo","run":"x"}}}'));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/turbo/);
  });

  it('rejects a surface with no run command', () => {
    const r = loadManifest('/repo', read('{"surfaces":{"a/**":{"tier":"fast"}}}'));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/run/);
  });

  it('defaults ignore and unverified to empty', () => {
    const r = loadManifest('/repo', read('{"surfaces":{}}'));
    expect(r.manifest.ignore).toEqual([]);
    expect(r.manifest.unverified).toEqual({});
  });

  // `null` is valid JSON. A truthiness check lets it through to a property
  // read, which throws — and a throw here wedges the Stop hook.
  it('rejects a null manifest without throwing', () => {
    expect(() => loadManifest('/repo', read('null'))).not.toThrow();
    expect(loadManifest('/repo', read('null'))).toEqual({
      ok: false,
      reason: 'verify.json must be a JSON object',
    });
  });

  it('rejects a non-object manifest without throwing', () => {
    for (const raw of ['"hello"', '[]', '42', 'true']) {
      expect(() => loadManifest('/repo', read(raw))).not.toThrow();
      expect(loadManifest('/repo', read(raw)).ok).toBe(false);
    }
  });

  it('rejects a null surface definition', () => {
    const r = loadManifest('/repo', read('{"surfaces":{"a/**":null}}'));
    expect(r.ok).toBe(false);
  });

  // A non-numeric budget reaches the runner as NaN, which disables the
  // timeout, which lets the Stop hook time out, which fails open.
  it('rejects a non-numeric budget', () => {
    const r = loadManifest('/repo', read('{"surfaces":{},"budgets":{"fast":"soon"}}'));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/budget "fast"/);
  });

  it('rejects a zero or negative budget', () => {
    expect(loadManifest('/repo', read('{"surfaces":{},"budgets":{"fast":0}}')).ok).toBe(false);
    expect(loadManifest('/repo', read('{"surfaces":{},"budgets":{"fast":-5}}')).ok).toBe(false);
  });

  it('rejects a non-object budgets value', () => {
    expect(loadManifest('/repo', read('{"surfaces":{},"budgets":[]}')).ok).toBe(false);
  });

  it('rejects unverified that is not an object', () => {
    const r = loadManifest('/repo', read('{"surfaces":{},"unverified":"nope"}'));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/unverified/);
  });

  it('rejects unverified entries that are not arrays of strings', () => {
    expect(loadManifest('/repo', read('{"surfaces":{},"unverified":{"a/**":"x"}}')).ok).toBe(false);
    expect(loadManifest('/repo', read('{"surfaces":{},"unverified":{"a/**":[1]}}')).ok).toBe(false);
  });

  it('rejects ignore entries that are not strings', () => {
    const r = loadManifest('/repo', read('{"surfaces":{},"ignore":["ok",5]}'));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/ignore/);
  });

  it('rejects a non-array ignore', () => {
    expect(loadManifest('/repo', read('{"surfaces":{},"ignore":"docs/**"}')).ok).toBe(false);
  });

  it('accepts a fully populated valid manifest', () => {
    const raw = JSON.stringify({
      repo: 'OnDeck',
      surfaces: { 'apps/api/**': { tier: 'fast', run: 'pnpm test' } },
      always: 'pnpm typecheck',
      unverified: { 'apps/mobile/**': ['expo-share-extension'] },
      budgets: { fast: 90 },
      ignore: ['**/*.md'],
    });
    const r = loadManifest('/repo', read(raw));
    expect(r.ok).toBe(true);
    expect(r.manifest.repo).toBe('OnDeck');
    expect(r.manifest.budgets).toEqual({ fast: 90, browser: 360, full: 900 });
    expect(r.manifest.ignore).toEqual(['**/*.md']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/manifest.test.mjs`
Expected: FAIL — cannot resolve `../src/manifest.mjs`.

- [ ] **Step 3: Implement**

`src/manifest.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const TIERS = ['skip', 'fast', 'browser', 'full'];
export const DEFAULT_BUDGETS = { fast: 120, browser: 360, full: 900 };

const defaultRead = (p) => readFileSync(p, 'utf8');

/** True for a non-null, non-array object. `typeof null === 'object'` is the trap. */
function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function manifestPath(repoRoot) {
  return path.join(repoRoot, '.claude', 'verify.json');
}

export function loadManifest(repoRoot, read = defaultRead) {
  let raw;
  try {
    raw = read(manifestPath(repoRoot));
  } catch (err) {
    if (err && err.code === 'ENOENT') return { ok: false, reason: 'missing' };
    return { ok: false, reason: `could not read manifest: ${err.message}` };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, reason: `could not parse verify.json: ${err.message}` };
  }

  // `null` is valid JSON and would sail past a truthiness check straight into a
  // property read. This module must never throw: a throw here wedges the hook.
  if (!isPlainObject(parsed)) {
    return { ok: false, reason: 'verify.json must be a JSON object' };
  }

  if (!isPlainObject(parsed.surfaces)) {
    return { ok: false, reason: 'verify.json must have a "surfaces" object' };
  }

  for (const [glob, def] of Object.entries(parsed.surfaces)) {
    if (!isPlainObject(def) || !TIERS.includes(def.tier)) {
      return { ok: false, reason: `surface "${glob}" has unknown tier "${def?.tier}"` };
    }
    if (def.tier !== 'skip' && typeof def.run !== 'string') {
      return { ok: false, reason: `surface "${glob}" needs a "run" command` };
    }
  }

  // Budgets are safety-critical: they are the only thing keeping a run inside
  // the Stop hook's own timeout, and a timed-out Stop hook FAILS OPEN. A
  // non-numeric budget would reach the runner as NaN and disable the timeout
  // entirely, so it is rejected rather than defaulted.
  if (parsed.budgets !== undefined) {
    if (!isPlainObject(parsed.budgets)) {
      return { ok: false, reason: '"budgets" must be an object' };
    }
    for (const [tier, seconds] of Object.entries(parsed.budgets)) {
      if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
        return { ok: false, reason: `budget "${tier}" must be a positive number, got ${JSON.stringify(seconds)}` };
      }
    }
  }

  if (parsed.unverified !== undefined) {
    if (!isPlainObject(parsed.unverified)) {
      return { ok: false, reason: '"unverified" must be an object' };
    }
    for (const [glob, notes] of Object.entries(parsed.unverified)) {
      if (!Array.isArray(notes) || notes.some((n) => typeof n !== 'string')) {
        return { ok: false, reason: `"unverified" entry "${glob}" must be an array of strings` };
      }
    }
  }

  if (parsed.ignore !== undefined) {
    if (!Array.isArray(parsed.ignore) || parsed.ignore.some((p) => typeof p !== 'string')) {
      return { ok: false, reason: '"ignore" must be an array of strings' };
    }
  }

  return {
    ok: true,
    manifest: {
      repo: typeof parsed.repo === 'string' ? parsed.repo : path.basename(repoRoot),
      surfaces: parsed.surfaces,
      always: typeof parsed.always === 'string' ? parsed.always : null,
      unverified: parsed.unverified ?? {},
      budgets: { ...DEFAULT_BUDGETS, ...(parsed.budgets ?? {}) },
      ignore: parsed.ignore ?? [],
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/manifest.test.mjs`
Expected: PASS, all tests in the file green with no failures.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: load and validate per-repo verify manifests"
```

---

## Task 4: Tier routing

**Files:**
- Create: `snowforge-verify/src/route.mjs`
- Test: `snowforge-verify/tests/route.test.mjs`

**Interfaces:**
- Consumes: `TIERS` from `src/manifest.mjs`.
- Produces: `route(manifest, changedFiles, maxTier = 'full'): {tier: string, runs: string[], disclosures: string[], considered: string[], deferred: string[]}`. `runs` is deduped and ordered by ascending tier so cheap checks fail first. `disclosures` collects `unverified` entries whose glob matched a considered file. `tier` is `'skip'` when nothing matched. Surfaces above `maxTier` are excluded from `runs` and listed in `deferred` — this is how spec §5's "`full` is never hook-invoked" is enforced, since a 900s tier under a 540s hook timeout would fail open.

- [ ] **Step 1: Write the failing test**

`tests/route.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { route } from '../src/route.mjs';

const manifest = {
  surfaces: {
    'apps/api/**': { tier: 'fast', run: 'pnpm test:api' },
    'apps/mobile/**': { tier: 'browser', run: 'pnpm verify:web' },
    'packages/db/**': { tier: 'full', run: 'pnpm db:verify' },
  },
  always: 'pnpm typecheck',
  unverified: { 'apps/mobile/**': ['expo-share-extension', 'the EAS build'] },
  ignore: ['**/*.md', 'docs/**'],
  budgets: { fast: 120, browser: 360, full: 900 },
};

describe('route', () => {
  it('skips when only ignored files changed', () => {
    const r = route(manifest, ['README.md', 'docs/guide.md']);
    expect(r.tier).toBe('skip');
    expect(r.runs).toEqual([]);
  });

  it('runs always plus the matched fast surface', () => {
    const r = route(manifest, ['apps/api/src/index.ts']);
    expect(r.tier).toBe('fast');
    expect(r.runs).toEqual(['pnpm typecheck', 'pnpm test:api']);
  });

  it('reports the highest matched tier and orders runs cheapest first', () => {
    const r = route(manifest, ['apps/api/a.ts', 'apps/mobile/b.tsx']);
    expect(r.tier).toBe('browser');
    expect(r.runs).toEqual(['pnpm typecheck', 'pnpm test:api', 'pnpm verify:web']);
  });

  it('collects disclosures for matched unverified globs', () => {
    const r = route(manifest, ['apps/mobile/b.tsx']);
    expect(r.disclosures).toEqual(['expo-share-extension', 'the EAS build']);
  });

  it('omits disclosures when the glob did not match', () => {
    const r = route(manifest, ['apps/api/a.ts']);
    expect(r.disclosures).toEqual([]);
  });

  it('runs always alone when a changed file matches no surface', () => {
    const r = route(manifest, ['scripts/tool.ts']);
    expect(r.tier).toBe('fast');
    expect(r.runs).toEqual(['pnpm typecheck']);
  });

  it('skips entirely for an explicit opt-out manifest', () => {
    const r = route({ surfaces: {}, always: null, unverified: {}, ignore: [] }, ['a.ts']);
    expect(r.tier).toBe('skip');
    expect(r.runs).toEqual([]);
  });

  it('deduplicates a run shared by two matched surfaces', () => {
    const m = {
      surfaces: {
        'a/**': { tier: 'fast', run: 'pnpm test' },
        'b/**': { tier: 'fast', run: 'pnpm test' },
      },
      always: null, unverified: {}, ignore: [],
    };
    expect(route(m, ['a/x.ts', 'b/y.ts']).runs).toEqual(['pnpm test']);
  });

  it('excludes tiers above maxTier and reports them as deferred', () => {
    const r = route(manifest, ['packages/db/schema.sql'], 'browser');
    expect(r.runs).not.toContain('pnpm db:verify');
    expect(r.deferred).toEqual(['pnpm db:verify']);
  });

  it('caps the reported tier at maxTier', () => {
    const r = route(manifest, ['packages/db/schema.sql', 'apps/mobile/b.tsx'], 'browser');
    expect(r.tier).toBe('browser');
    expect(r.runs).toContain('pnpm verify:web');
  });

  it('defers nothing when maxTier allows everything', () => {
    expect(route(manifest, ['packages/db/schema.sql']).deferred).toEqual([]);
  });

  // Regression: picomatch's matcher is (input, returnObject). Passing it
  // straight to `.some()` feeds the array index in as `returnObject`, and
  // every index >= 1 returns a truthy object, so every glob appears to match.
  // Single-file change sets hide it (index 0 is falsy); multi-file ones do not.
  // These cases must therefore use two or more files.
  it('does not match unrelated surfaces on a multi-file change set', () => {
    const r = route(manifest, ['apps/api/a.ts', 'apps/api/b.ts', 'apps/api/c.ts']);
    expect(r.tier).toBe('fast');
    expect(r.runs).toEqual(['pnpm typecheck', 'pnpm test:api']);
    expect(r.runs).not.toContain('pnpm verify:web');
    expect(r.runs).not.toContain('pnpm db:verify');
  });

  it('does not emit disclosures for unrelated globs on a multi-file change set', () => {
    const r = route(manifest, ['apps/api/a.ts', 'apps/api/b.ts']);
    expect(r.disclosures).toEqual([]);
  });

  it('still skips correctly when several ignored files change together', () => {
    const r = route(manifest, ['README.md', 'docs/a.md', 'docs/b.md']);
    expect(r.tier).toBe('skip');
    expect(r.runs).toEqual([]);
  });

  // A 'fast' verdict with an empty run set would claim verification happened
  // when nothing executed. The deferred command must still be reported.
  it('reports skip, not fast, when the cap excludes everything and there is no always', () => {
    const m = {
      surfaces: { 'packages/db/**': { tier: 'full', run: 'pnpm db:verify' } },
      always: null, unverified: {}, ignore: [],
    };
    const r = route(m, ['packages/db/a.sql', 'packages/db/b.sql'], 'browser');
    expect(r.runs).toEqual([]);
    expect(r.tier).toBe('skip');
    expect(r.deferred).toEqual(['pnpm db:verify']);
  });

  it('reports fast when always runs even though the cap excluded every surface', () => {
    const m = {
      surfaces: { 'packages/db/**': { tier: 'full', run: 'pnpm db:verify' } },
      always: 'pnpm typecheck', unverified: {}, ignore: [],
    };
    const r = route(m, ['packages/db/a.sql', 'packages/db/b.sql'], 'browser');
    expect(r.runs).toEqual(['pnpm typecheck']);
    expect(r.tier).toBe('fast');
    expect(r.deferred).toEqual(['pnpm db:verify']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/route.test.mjs`
Expected: FAIL — cannot resolve `../src/route.mjs`.

- [ ] **Step 3: Implement**

`src/route.mjs`:

```javascript
import picomatch from 'picomatch';
import { TIERS } from './manifest.mjs';

const rank = (tier) => TIERS.indexOf(tier);

/**
 * True when any file matches the glob.
 *
 * The arrow wrapper is load-bearing, not style. picomatch's matcher has the
 * signature (input, returnObject), so handing it straight to
 * Array.prototype.some passes the array INDEX in as `returnObject`. For index
 * 0 that is falsy and the matcher returns a boolean, but for every index >= 1
 * it returns a truthy options object — so `files.some(isMatch)` reports a
 * match for any glob whenever the array has two or more entries. The bug is
 * invisible on a single-file change set and silently wrong on every real one.
 * Route through this helper rather than calling picomatch inline.
 */
function matchesAny(files, glob) {
  const isMatch = picomatch(glob);
  return files.some((f) => isMatch(f));
}

/**
 * Decide what to run for a change set.
 * Every matched surface contributes its run; the reported tier is the
 * highest matched, ordered skip < fast < browser < full.
 *
 * `maxTier` caps what may run in this context. The Stop hook passes
 * 'browser', because the 900s `full` tier cannot complete inside the hook's
 * timeout and a timed-out Stop hook fails open (spec §5).
 */
export function route(manifest, changedFiles, maxTier = 'full') {
  const empty = (considered) => ({
    tier: 'skip', runs: [], disclosures: [], considered, deferred: [],
  });

  const ignored = manifest.ignore.length ? picomatch(manifest.ignore) : () => false;
  const considered = changedFiles.filter((f) => !ignored(f));
  if (considered.length === 0) return empty(considered);

  const matched = [];
  for (const [glob, def] of Object.entries(manifest.surfaces)) {
    if (matchesAny(considered, glob)) matched.push(def);
  }
  if (matched.length === 0 && !manifest.always) return empty(considered);

  matched.sort((a, b) => rank(a.tier) - rank(b.tier));

  const cap = rank(maxTier);
  const runnable = matched.filter((d) => rank(d.tier) <= cap);
  const deferred = [];
  for (const def of matched) {
    if (rank(def.tier) > cap && !deferred.includes(def.run)) deferred.push(def.run);
  }

  const runs = [];
  if (manifest.always) runs.push(manifest.always);
  for (const def of runnable) {
    if (def.tier !== 'skip' && !runs.includes(def.run)) runs.push(def.run);
  }

  const disclosures = [];
  for (const [glob, notes] of Object.entries(manifest.unverified)) {
    if (matchesAny(considered, glob)) disclosures.push(...notes);
  }

  // `always` alone is a fast-tier floor — but only when `always` actually
  // exists. Reporting 'fast' with an empty run set would tell a caller that
  // fast verification happened when nothing ran at all.
  const highest = runnable.length
    ? runnable[runnable.length - 1].tier
    : (manifest.always ? 'fast' : 'skip');

  return { tier: highest, runs, disclosures, considered, deferred };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/route.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: route changed paths to verification tiers"
```

---

## Task 5: State key and verdict cache

**Files:**
- Create: `snowforge-verify/src/state.mjs`
- Test: `snowforge-verify/tests/state.test.mjs`

**Interfaces:**
- Consumes: `runGit` from `src/changes.mjs`.
- Produces: `stateKey(repoRoot, git?, read?): string` — sha1 over `HEAD`, the tracked working-tree diff, and the sorted paths **and contents** of every untracked file. `readVerdict(sessionId, key, io?): string | null`. `writeVerdict(sessionId, key, verdict, io?): void`. Cache lives at `C:\Users\alexi\.claude\verify-cache\{session_id}.json`.

**Why untracked files are hashed:** verified directly — adding an untracked file leaves `git diff HEAD` at zero bytes, so a diff-only key cannot see a brand-new source file. An agent that responds to a blocked verification by adding a file would produce an identical key, hit the cached verdict, and have its fix skipped without ever re-running. Both the file list and the file contents matter: hashing only the list would miss subsequent edits to a new file.

This is the loop protection required by spec §3: the `Stop` hook input carries no `stop_hook_active` field, so the dispatcher must decide for itself whether it has already judged this exact code state.

- [ ] **Step 1: Write the failing test**

`tests/state.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { stateKey, readVerdict, writeVerdict } from '../src/state.mjs';

/** Fake git covering the three subcommands stateKey issues. */
const gitWith = (head, diff, untracked = '') => (_root, args) => {
  if (args[0] === 'rev-parse') return head;
  if (args[0] === 'ls-files') return untracked;
  return diff;
};

/** Fake file reader: returns canned contents per path suffix. */
const readWith = (contents = {}) => (p) => {
  const key = Object.keys(contents).find((k) => String(p).endsWith(k));
  if (!key) throw new Error(`no such file: ${p}`);
  return Buffer.from(contents[key]);
};

/** In-memory stand-in for the cache file. */
function memIO() {
  const files = new Map();
  return {
    files,
    read: (p) => {
      if (!files.has(p)) { const e = new Error('no'); e.code = 'ENOENT'; throw e; }
      return files.get(p);
    },
    write: (p, c) => files.set(p, c),
    mkdir: () => {},
  };
}

describe('stateKey', () => {
  const read = readWith({ 'new.ts': 'hello', 'other.ts': 'world' });

  it('is stable for an identical tree', () => {
    const git = gitWith('abc123\n', 'diff body');
    expect(stateKey('/repo', git, read)).toBe(stateKey('/repo', git, read));
  });

  it('changes when the working tree changes', () => {
    const a = stateKey('/repo', gitWith('abc123\n', 'one'), read);
    const b = stateKey('/repo', gitWith('abc123\n', 'two'), read);
    expect(a).not.toBe(b);
  });

  it('changes when HEAD moves even with an identical diff', () => {
    const a = stateKey('/repo', gitWith('abc123\n', 'same'), read);
    const b = stateKey('/repo', gitWith('def456\n', 'same'), read);
    expect(a).not.toBe(b);
  });

  // `git diff HEAD` is blind to untracked files. Without these, an agent that
  // fixes a blocked verification by ADDING a file keeps the same key, hits the
  // cached verdict, and has its fix silently skipped.
  it('changes when an untracked file appears, with no tracked diff at all', () => {
    const clean = stateKey('/repo', gitWith('abc123\n', '', ''), read);
    const added = stateKey('/repo', gitWith('abc123\n', '', 'new.ts\n'), read);
    expect(added).not.toBe(clean);
  });

  it('changes when an untracked file\'s contents change', () => {
    const git = gitWith('abc123\n', '', 'new.ts\n');
    const before = stateKey('/repo', git, readWith({ 'new.ts': 'hello' }));
    const after = stateKey('/repo', git, readWith({ 'new.ts': 'goodbye' }));
    expect(before).not.toBe(after);
  });

  it('changes when a second untracked file appears', () => {
    const one = stateKey('/repo', gitWith('abc123\n', '', 'new.ts\n'), read);
    const two = stateKey('/repo', gitWith('abc123\n', '', 'new.ts\nother.ts\n'), read);
    expect(one).not.toBe(two);
  });

  it('is order-independent for the untracked listing', () => {
    const a = stateKey('/repo', gitWith('abc123\n', '', 'new.ts\nother.ts\n'), read);
    const b = stateKey('/repo', gitWith('abc123\n', '', 'other.ts\nnew.ts\n'), read);
    expect(a).toBe(b);
  });

  it('does not throw when an untracked file cannot be read', () => {
    const git = gitWith('abc123\n', '', 'vanished.ts\n');
    expect(() => stateKey('/repo', git, readWith({}))).not.toThrow();
  });
});

describe('verdict cache', () => {
  it('returns null for an unseen key', () => {
    expect(readVerdict('s1', 'k1', memIO())).toBe(null);
  });

  it('round-trips a verdict', () => {
    const io = memIO();
    writeVerdict('s1', 'k1', 'fail', io);
    expect(readVerdict('s1', 'k1', io)).toBe('fail');
  });

  it('keeps verdicts for different keys apart', () => {
    const io = memIO();
    writeVerdict('s1', 'k1', 'fail', io);
    writeVerdict('s1', 'k2', 'pass', io);
    expect(readVerdict('s1', 'k1', io)).toBe('fail');
    expect(readVerdict('s1', 'k2', io)).toBe('pass');
  });

  it('keeps sessions apart', () => {
    const io = memIO();
    writeVerdict('s1', 'k1', 'fail', io);
    expect(readVerdict('s2', 'k1', io)).toBe(null);
  });

  it('treats a corrupt cache file as empty rather than throwing', () => {
    const io = memIO();
    writeVerdict('s1', 'k1', 'pass', io);
    for (const p of io.files.keys()) io.files.set(p, '{corrupt');
    expect(readVerdict('s1', 'k1', io)).toBe(null);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/state.test.mjs`
Expected: FAIL — cannot resolve `../src/state.mjs`.

- [ ] **Step 3: Implement**

`src/state.mjs`:

```javascript
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { runGit } from './changes.mjs';

const CACHE_DIR = 'C:/Users/alexi/.claude/verify-cache';

const defaultIO = {
  read: (p) => readFileSync(p, 'utf8'),
  write: (p, c) => writeFileSync(p, c, 'utf8'),
  mkdir: (d) => mkdirSync(d, { recursive: true }),
};

const defaultReadFile = (p) => readFileSync(p);

/**
 * Identity of the exact code state: HEAD, the tracked working-tree diff, and
 * every untracked file's path and contents.
 *
 * The untracked half is load-bearing. `git diff HEAD` reports tracked changes
 * only — a brand-new source file is completely invisible to it (verified
 * directly: adding an untracked file leaves `git diff HEAD` at zero bytes).
 * Without this, an agent that responds to a blocked verification by ADDING a
 * file produces an unchanged key, hits the cached verdict, and has its fix
 * silently skipped. `ls-files --others --exclude-standard` honours .gitignore,
 * so this walks genuinely new files only and never descends into node_modules.
 */
export function stateKey(repoRoot, git = runGit, read = defaultReadFile) {
  const head = git(repoRoot, ['rev-parse', 'HEAD']).trim();
  const diff = git(repoRoot, ['diff', 'HEAD']);
  const untracked = git(repoRoot, ['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .sort();

  const h = createHash('sha1').update(`${head}\n${diff}\n`);
  for (const rel of untracked) {
    h.update(`\n--- ${rel}\n`);
    try {
      h.update(read(path.join(repoRoot, rel)));
    } catch {
      // A file that vanished mid-run still contributes its path above.
      h.update('<unreadable>');
    }
  }
  return h.digest('hex');
}

function cachePath(sessionId) {
  return path.join(CACHE_DIR, `${sessionId}.json`);
}

function readAll(sessionId, io) {
  try {
    return JSON.parse(io.read(cachePath(sessionId)));
  } catch {
    return {};
  }
}

export function readVerdict(sessionId, key, io = defaultIO) {
  return readAll(sessionId, io)[key] ?? null;
}

export function writeVerdict(sessionId, key, verdict, io = defaultIO) {
  const all = readAll(sessionId, io);
  all[key] = verdict;
  io.mkdir(CACHE_DIR);
  io.write(cachePath(sessionId), JSON.stringify(all, null, 2));
}

export { CACHE_DIR };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/state.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: state-keyed verdict cache for stop-hook loop protection"
```

---

## Task 6: Command runner with budgets

**Files:**
- Create: `snowforge-verify/src/run.mjs`
- Test: `snowforge-verify/tests/run.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `runAll(repoRoot, runs, budgetSeconds, exec?): {verdict: 'pass'|'fail'|'blocked', failed: string|null, output: string, seconds: number}`. Stops at the first non-zero exit. Exit code 124 or a timeout signal maps to `blocked`, never `fail`, because a budget overrun is an inability to verify rather than proof of a defect.

- [ ] **Step 1: Write the failing test**

`tests/run.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { runAll } from '../src/run.mjs';

/** Fake exec: maps a command string to {status, stdout, signal}. */
const execWith = (table) => (cmd) =>
  table[cmd] ?? { status: 0, stdout: 'ok', signal: null };

describe('runAll', () => {
  it('passes when every command exits zero', () => {
    const r = runAll('/repo', ['a', 'b'], 120, execWith({}));
    expect(r.verdict).toBe('pass');
    expect(r.failed).toBe(null);
  });

  it('passes trivially with no commands', () => {
    expect(runAll('/repo', [], 120, execWith({})).verdict).toBe('pass');
  });

  it('fails on a non-zero exit and names the command', () => {
    const r = runAll('/repo', ['a', 'b'], 120, execWith({ b: { status: 1, stdout: 'boom', signal: null } }));
    expect(r.verdict).toBe('fail');
    expect(r.failed).toBe('b');
    expect(r.output).toContain('boom');
  });

  it('stops at the first failure', () => {
    const seen = [];
    const exec = (cmd) => {
      seen.push(cmd);
      return cmd === 'a' ? { status: 1, stdout: 'x', signal: null } : { status: 0, stdout: '', signal: null };
    };
    runAll('/repo', ['a', 'b', 'c'], 120, exec);
    expect(seen).toEqual(['a']);
  });

  it('maps a timeout signal to blocked, not fail', () => {
    const r = runAll('/repo', ['slow'], 1, execWith({ slow: { status: null, stdout: '', signal: 'SIGTERM' } }));
    expect(r.verdict).toBe('blocked');
    expect(r.output).toMatch(/budget/i);
  });

  it('maps exit code 124 to blocked', () => {
    const r = runAll('/repo', ['slow'], 1, execWith({ slow: { status: 124, stdout: '', signal: null } }));
    expect(r.verdict).toBe('blocked');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/run.test.mjs`
Expected: FAIL — cannot resolve `../src/run.mjs`.

- [ ] **Step 3: Implement**

`src/run.mjs`:

```javascript
import { spawnSync } from 'node:child_process';

const defaultExec = (cmd, repoRoot, timeoutMs) => {
  const r = spawnSync(cmd, {
    cwd: repoRoot,
    shell: true,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    status: r.status,
    signal: r.signal,
    stdout: `${r.stdout ?? ''}${r.stderr ?? ''}`,
  };
};

/** Run commands in order, stopping at the first failure. */
export function runAll(repoRoot, runs, budgetSeconds, exec = defaultExec) {
  const started = Date.now();
  const budgetMs = budgetSeconds * 1000;

  for (const cmd of runs) {
    const remaining = budgetMs - (Date.now() - started);
    const res = exec(cmd, repoRoot, Math.max(remaining, 1));
    const timedOut = res.signal != null || res.status === 124;

    if (timedOut) {
      return {
        verdict: 'blocked',
        failed: cmd,
        output: `"${cmd}" exceeded the ${budgetSeconds}s budget for this tier.`,
        seconds: Math.round((Date.now() - started) / 1000),
      };
    }
    if (res.status !== 0) {
      return {
        verdict: 'fail',
        failed: cmd,
        output: res.stdout,
        seconds: Math.round((Date.now() - started) / 1000),
      };
    }
  }

  return {
    verdict: 'pass',
    failed: null,
    output: '',
    seconds: Math.round((Date.now() - started) / 1000),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/run.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: budgeted command runner mapping timeouts to blocked"
```

---

## Task 7: Verdict-to-hook protocol and report formatting

**Files:**
- Create: `snowforge-verify/src/report.mjs`
- Test: `snowforge-verify/tests/report.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `formatPass(repo, tier, seconds, disclosures): string`. `formatFailure(repo, tier, failedCmd, output): string`. `decide(verdict, mode): {exitCode: 0|2, blocking: boolean}` — in `report` mode nothing ever blocks; in `block` mode `fail` and `blocked` return exit code 2.

Per the hooks contract, exit code 2 blocks the stop and the blocking reason is read from stderr. Output on stdout is not shown, so all human-facing text goes to stderr when blocking.

- [ ] **Step 1: Write the failing test**

`tests/report.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { formatPass, formatFailure, decide } from '../src/report.mjs';

describe('decide', () => {
  it('blocks on fail in block mode', () => {
    expect(decide('fail', 'block')).toEqual({ exitCode: 2, blocking: true });
  });

  it('blocks on blocked in block mode', () => {
    expect(decide('blocked', 'block')).toEqual({ exitCode: 2, blocking: true });
  });

  it('does not block on pass', () => {
    expect(decide('pass', 'block')).toEqual({ exitCode: 0, blocking: false });
  });

  it('never blocks in report mode', () => {
    expect(decide('fail', 'report')).toEqual({ exitCode: 0, blocking: false });
    expect(decide('blocked', 'report')).toEqual({ exitCode: 0, blocking: false });
  });

  // Fail closed: only an explicit pass may let a session end. A garbled
  // verdict from an upstream bug must not become a silent "verified".
  it('blocks an unrecognized verdict in block mode', () => {
    for (const bad of ['garbage', '', undefined, null, 'PASS', 0]) {
      expect(decide(bad, 'block')).toEqual({ exitCode: 2, blocking: true });
    }
  });

  it('still never blocks an unrecognized verdict in report mode', () => {
    expect(decide('garbage', 'report')).toEqual({ exitCode: 0, blocking: false });
  });
});

describe('formatPass', () => {
  it('states repo, tier, and duration', () => {
    expect(formatPass('SnowPipe', 'fast', 12, [])).toContain('VERIFY PASS  SnowPipe  fast (12s)');
  });

  it('omits the disclosure block when there is nothing undisclosed', () => {
    expect(formatPass('SnowPipe', 'fast', 12, [])).not.toContain('NOT covered');
  });

  it('lists every disclosure when the run set touched a proxy surface', () => {
    const out = formatPass('OnDeck', 'browser', 38, ['expo-share-extension', 'the EAS build']);
    expect(out).toContain('NOT covered by this run:');
    expect(out).toContain('- expo-share-extension');
    expect(out).toContain('- the EAS build');
  });

  it('does not throw when disclosures is omitted', () => {
    expect(() => formatPass('SnowPipe', 'fast', 12, undefined)).not.toThrow();
    expect(formatPass('SnowPipe', 'fast', 12, undefined)).not.toContain('NOT covered');
  });
});

describe('formatFailure', () => {
  it('names the failing command and includes its output', () => {
    const out = formatFailure('SnowPipe', 'browser', 'pnpm test:e2e', 'AssertionError: 47 !== 50');
    expect(out).toContain('pnpm test:e2e');
    expect(out).toContain('AssertionError: 47 !== 50');
  });

  it('truncates very long output but says that it did', () => {
    const out = formatFailure('SnowPipe', 'fast', 'x', 'y'.repeat(20000));
    expect(out.length).toBeLessThan(9000);
    expect(out).toMatch(/truncated/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/report.test.mjs`
Expected: FAIL — cannot resolve `../src/report.mjs`.

- [ ] **Step 3: Implement**

`src/report.mjs`:

```javascript
const MAX_OUTPUT = 8000;

export function decide(verdict, mode) {
  if (mode === 'report') return { exitCode: 0, blocking: false };
  // Fail closed. ONLY an explicit pass may let the session end; every other
  // value blocks, including one this function does not recognise. Listing the
  // blocking verdicts instead would mean a garbled or undefined verdict from
  // an upstream bug silently produced a "verified" session — the exact false
  // claim this tool exists to prevent, arriving through its own gate.
  if (verdict === 'pass') return { exitCode: 0, blocking: false };
  return { exitCode: 2, blocking: true };
}

export function formatPass(repo, tier, seconds, disclosures) {
  const notes = disclosures ?? [];
  const lines = [`VERIFY PASS  ${repo}  ${tier} (${seconds}s)`];
  if (notes.length) {
    lines.push('  NOT covered by this run:');
    for (const d of notes) lines.push(`    - ${d}`);
  }
  return lines.join('\n');
}

export function formatFailure(repo, tier, failedCmd, output) {
  let body = output ?? '';
  if (body.length > MAX_OUTPUT) {
    body = `${body.slice(0, MAX_OUTPUT)}\n... (truncated)`;
  }
  return [
    `VERIFY FAILED  ${repo}  ${tier}`,
    `  command: ${failedCmd}`,
    '',
    body,
    '',
    'This change is not verified. Fix the failure and try again.',
    'Do not claim the work is complete until this passes.',
  ].join('\n');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/report.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: hook verdict protocol and report formatting"
```

---

## Task 8: CLI entrypoint — phase 1 complete

**Files:**
- Create: `snowforge-verify/src/cli.mjs`
- Test: `snowforge-verify/tests/cli.test.mjs`

**Interfaces:**
- Consumes: every module above.
- Produces: `main(hookInput, deps): {exitCode: number, stderr: string, stdout: string}` — pure and fully injectable, so the whole decision path is testable without touching git, the filesystem, or a shell. `src/cli.mjs` run directly reads the hook JSON from stdin and exits with `exitCode`.

- [ ] **Step 1: Write the failing test**

`tests/cli.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { main } from '../src/cli.mjs';

const SF = 'C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC';

function deps(over = {}) {
  return {
    findRepoRoot: () => `${SF}/SnowPipe`,
    isInScope: () => true,
    getChangedFiles: () => ['src/a.ts'],
    loadManifest: () => ({
      ok: true,
      manifest: {
        repo: 'SnowPipe',
        surfaces: { 'src/**': { tier: 'fast', run: 'pnpm test' } },
        always: null, unverified: {}, ignore: ['**/*.md'],
        budgets: { fast: 120, browser: 360, full: 900 },
      },
    }),
    stateKey: () => 'key1',
    readVerdict: () => null,
    writeVerdict: () => {},
    runAll: () => ({ verdict: 'pass', failed: null, output: '', seconds: 3 }),
    logError: () => {},
    mode: 'block',
    ...over,
  };
}

const input = { session_id: 's1', cwd: `${SF}/SnowPipe` };

describe('main', () => {
  it('no-ops outside a git repo', () => {
    const r = main(input, deps({ findRepoRoot: () => null }));
    expect(r.exitCode).toBe(0);
  });

  it('no-ops for a repo outside SnowForge', () => {
    const r = main(input, deps({ isInScope: () => false }));
    expect(r.exitCode).toBe(0);
  });

  it('no-ops when nothing changed', () => {
    const r = main(input, deps({ getChangedFiles: () => [] }));
    expect(r.exitCode).toBe(0);
  });

  it('no-ops when only ignored files changed', () => {
    const r = main(input, deps({ getChangedFiles: () => ['README.md'] }));
    expect(r.exitCode).toBe(0);
  });

  it('blocks and names /verify-init when the manifest is missing', () => {
    const r = main(input, deps({ loadManifest: () => ({ ok: false, reason: 'missing' }) }));
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain('/verify-init');
  });

  // Nothing the agent does to the code makes a manifest appear, so without a
  // recorded verdict this branch would block on every stop, forever, and the
  // session could never end. Spec §8 says block once.
  it('records a verdict when blocking on a missing manifest', () => {
    const written = [];
    const r = main(input, deps({
      loadManifest: () => ({ ok: false, reason: 'missing' }),
      writeVerdict: (_session, k, v) => written.push([k, v]),
    }));
    expect(r.exitCode).toBe(2);
    expect(written).toEqual([['key1', 'blocked']]);
  });

  it('does not block a missing manifest twice for the same state', () => {
    const r = main(input, deps({
      loadManifest: () => ({ ok: false, reason: 'missing' }),
      readVerdict: () => 'blocked',
    }));
    expect(r.exitCode).toBe(0);
  });

  it('records a verdict when blocking on an invalid manifest', () => {
    const written = [];
    main(input, deps({
      loadManifest: () => ({ ok: false, reason: 'bad tier "turbo"' }),
      writeVerdict: (_session, k, v) => written.push([k, v]),
    }));
    expect(written).toEqual([['key1', 'blocked']]);
  });

  it('blocks with the validation reason when the manifest is invalid', () => {
    const r = main(input, deps({ loadManifest: () => ({ ok: false, reason: 'bad tier "turbo"' }) }));
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain('turbo');
  });

  it('passes and prints the report', () => {
    const r = main(input, deps());
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('VERIFY PASS');
  });

  it('blocks on a failing verification', () => {
    const r = main(input, deps({
      runAll: () => ({ verdict: 'fail', failed: 'pnpm test', output: 'boom', seconds: 4 }),
    }));
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain('boom');
  });

  it('does not block twice for the same state key', () => {
    const r = main(input, deps({ readVerdict: () => 'fail' }));
    expect(r.exitCode).toBe(0);
  });

  it('never blocks in report mode', () => {
    const r = main(input, deps({
      mode: 'report',
      runAll: () => ({ verdict: 'fail', failed: 'pnpm test', output: 'boom', seconds: 4 }),
    }));
    expect(r.exitCode).toBe(0);
  });

  it('exits 0 when a dependency throws, rather than wedging the session', () => {
    const r = main(input, deps({ getChangedFiles: () => { throw new Error('git exploded'); } }));
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/verify.*error/i);
  });

  // Exiting 0 is what keeps a broken dispatcher from wedging every session,
  // which also makes the log the only trace a crash leaves — stdout on a Stop
  // hook is debug-only. Without it, verification dies silently everywhere.
  it('logs the error when a dependency throws', () => {
    const logged = [];
    const r = main(input, deps({
      getChangedFiles: () => { throw new Error('git exploded'); },
      logError: (e) => logged.push(e.message),
    }));
    expect(r.exitCode).toBe(0);
    expect(logged).toEqual(['git exploded']);
  });

  it('still exits 0 when logging itself throws', () => {
    const r = main(input, deps({
      getChangedFiles: () => { throw new Error('git exploded'); },
      logError: () => { throw new Error('disk full'); },
    }));
    expect(r.exitCode).toBe(0);
  });

  // A repo whose only surface is full-tier runs nothing inside the hook. It
  // must still say so, or it verifies nothing on every stop, silently.
  it('reports deferred work instead of exiting silently when nothing runs in the hook', () => {
    const r = main(input, deps({
      getChangedFiles: () => ['packages/db/a.sql', 'packages/db/b.sql'],
      loadManifest: () => ({
        ok: true,
        manifest: {
          repo: 'SnowPipe',
          surfaces: { 'packages/db/**': { tier: 'full', run: 'pnpm db:verify' } },
          always: null, unverified: {}, ignore: ['**/*.md'],
          budgets: { fast: 120, browser: 360, full: 900 },
        },
      }),
    }));
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('VERIFY DEFERRED');
    expect(r.stdout).toContain('pnpm db:verify');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/cli.test.mjs`
Expected: FAIL — cannot resolve `../src/cli.mjs`.

- [ ] **Step 3: Implement**

`src/cli.mjs`:

```javascript
#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { findRepoRoot, isInScope } from './repo.mjs';
import { getChangedFiles } from './changes.mjs';
import { loadManifest } from './manifest.mjs';
import { route } from './route.mjs';
import { stateKey, readVerdict, writeVerdict, CACHE_DIR } from './state.mjs';
import { runAll } from './run.mjs';
import { decide, formatPass, formatFailure } from './report.mjs';

const NO_OP = { exitCode: 0, stderr: '', stdout: '' };

/**
 * Durable record of a dispatcher crash (spec §10).
 *
 * The catch below exits 0 so a broken dispatcher cannot wedge every session
 * in every repo. But on a Stop hook stdout goes only to a debug log, so
 * without this file a crash would disable verification everywhere,
 * permanently and invisibly — the silent failure this tool exists to stop,
 * arriving through its own error handler.
 */
const defaultLogError = (err) => {
  mkdirSync(CACHE_DIR, { recursive: true });
  appendFileSync(
    path.join(CACHE_DIR, 'errors.log'),
    `${new Date().toISOString()} ${err?.stack ?? String(err)}\n`,
    'utf8',
  );
};

export function main(hookInput, deps) {
  const d = {
    findRepoRoot, isInScope, getChangedFiles, loadManifest,
    stateKey, readVerdict, writeVerdict, runAll,
    logError: defaultLogError,
    mode: process.env.SNOWFORGE_VERIFY_MODE ?? 'block',
    maxTier: 'browser',
    ...deps,
  };

  try {
    const repoRoot = d.findRepoRoot(hookInput.cwd);
    if (!repoRoot || !d.isInScope(repoRoot)) return NO_OP;

    const changed = d.getChangedFiles(repoRoot);
    if (changed.length === 0) return NO_OP;

    // One verdict per distinct code state, computed BEFORE any branch that can
    // block. Every blocking path must record it. Otherwise the same unchanged
    // state blocks again on the next stop, and the session can never end —
    // which is what happens to a repo with no manifest, since nothing the
    // agent does to the code makes the manifest appear.
    const key = d.stateKey(repoRoot);
    if (d.readVerdict(hookInput.session_id, key) !== null) return NO_OP;

    const loaded = d.loadManifest(repoRoot);
    if (!loaded.ok) {
      d.writeVerdict(hookInput.session_id, key, 'blocked');
      const reason =
        loaded.reason === 'missing'
          ? [
              `This repo has no verify manifest (${repoRoot}/.claude/verify.json).`,
              'Run /verify-init to create one, or add {"surfaces":{}} to opt out explicitly.',
            ].join('\n')
          : `Invalid verify.json: ${loaded.reason}`;
      const { exitCode } = decide('blocked', d.mode);
      return { exitCode, stderr: exitCode === 2 ? reason : '', stdout: reason };
    }

    const manifest = loaded.manifest;
    // The hook may never invoke the `full` tier: its 900s budget exceeds the
    // hook timeout, and a timed-out Stop hook fails open (spec §5).
    const plan = route(manifest, changed, d.maxTier);
    if (plan.runs.length === 0) {
      // Nothing to run. If the cap deferred work, say so rather than exiting
      // silently — a repo whose only surface is `full`-tier would otherwise
      // verify nothing on every stop and never tell anyone.
      if (plan.deferred.length) {
        return {
          exitCode: 0,
          stderr: '',
          stdout:
            `VERIFY DEFERRED  ${manifest.repo}\n` +
            `  nothing runs inside the hook for this change set.\n` +
            `  run by hand: ${plan.deferred.join(', ')}`,
        };
      }
      return NO_OP;
    }

    const budget = manifest.budgets[plan.tier] ?? manifest.budgets.fast;
    const result = d.runAll(repoRoot, plan.runs, budget);
    d.writeVerdict(hookInput.session_id, key, result.verdict);

    if (result.verdict === 'pass') {
      let stdout = formatPass(manifest.repo, plan.tier, result.seconds, plan.disclosures);
      if (plan.deferred.length) {
        stdout += `\n  deferred to the full tier (run by hand): ${plan.deferred.join(', ')}`;
      }
      return { exitCode: 0, stderr: '', stdout };
    }

    const text = formatFailure(manifest.repo, plan.tier, result.failed, result.output);
    const { exitCode } = decide(result.verdict, d.mode);
    return { exitCode, stderr: exitCode === 2 ? text : '', stdout: text };
  } catch (err) {
    // A broken dispatcher must never wedge every session in every repo, so
    // this exits 0. That makes the log file the only trace a crash leaves:
    // stdout on a Stop hook is debug-only, so without it verification would
    // die silently and permanently everywhere. Logging must not itself be
    // able to wedge the session, hence the inner catch.
    try {
      d.logError(err);
    } catch {
      /* nothing left to do; never rethrow from the safety net */
    }
    return { exitCode: 0, stderr: '', stdout: `verify: internal error, skipped (${err.message})` };
  }
}

// Entrypoint: read the hook JSON from stdin, act, exit.
//
// Use pathToFileURL, never a hand-built `file://` string. On Windows
// `import.meta.url` is `file:///C:/...` with THREE slashes, while
// `file://${path}` produces `file://C:/...` with two. They never compare
// equal, so the guard silently never fires: the hook runs `node cli.mjs`,
// the module loads, nothing executes, and the process exits 0 — which the
// harness reads as "do not block". Verification would be silently dead in
// every repo while every unit test still passed, because the tests call
// main() directly and never exercise this line.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => {
    let input = {};
    try { input = JSON.parse(raw); } catch { /* fall through with defaults */ }
    input.cwd ??= process.cwd();
    input.session_id ??= 'manual';
    // `--full` lifts the hook's tier cap for deliberate manual runs.
    const overrides = process.argv.includes('--full') ? { maxTier: 'full' } : {};
    const r = main(input, overrides);
    if (r.stdout) process.stdout.write(`${r.stdout}\n`);
    if (r.stderr) process.stderr.write(`${r.stderr}\n`);
    process.exit(r.exitCode);
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS, all eight suites green with no failures.

- [ ] **Step 5: Smoke-test manually against a real repo, with no hook registered**

**The target repo must actually have changed files, or this step proves nothing.** The dispatcher no-ops before the manifest check when the change set is empty, which is correct behaviour and indistinguishable at the shell from the entrypoint never firing. Pick a target and confirm its change set first:

```bash
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/snowforge-verify"
TARGET="C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowForge"
node -e "import('./src/changes.mjs').then(m=>console.log('changed files:', m.getChangedFiles(process.argv[1]).length))" "$TARGET"
```

If that prints 0, choose a different SnowForge repo that has uncommitted or unpushed work. Then:

```bash
echo "{\"session_id\":\"manual\",\"cwd\":\"$TARGET\"}" | node src/cli.mjs; echo "exit=$?"
```

Expected: the missing-manifest block, `exit=2`, mentioning `/verify-init` — the fail-loud onboarding path from spec §8.

**This step is the only check that the entrypoint works at all, so do not skip it or treat it as a formality.** Every unit test in this task calls `main()` directly and would still pass if the entrypoint block never executed.

**Disambiguating the two ways this prints nothing**, which matters because one is correct and the other means the tool is dead:

- `exit=0`, no output, **and the change count above was 0** — a legitimate no-op. Nothing changed, so nothing to verify.
- `exit=0`, no output, **but the change count was non-zero** — the entrypoint guard is not matching. The module loaded and ran nothing. Stop and report; do not record this as a pass.

- [ ] **Step 5b: Confirm the block fires only once for an unchanged state**

Run the exact same command from Step 5 a second time, with the same `session_id`.

Expected: `exit=0` and no output. The first run recorded a `blocked` verdict against the state key, so the second must not block. If it blocks again, a manifest-less repo would block on every stop forever with no escape, because nothing the agent does to the code makes a manifest appear.

- [ ] **Step 6: Verify the home-directory guard**

```bash
echo '{"session_id":"manual","cwd":"C:/Users/alexi"}' | node src/cli.mjs; echo "exit=$?"
```

Expected: no output, `exit=0`. The accidental home-directory repo must never trigger verification.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: dispatcher CLI entrypoint with injectable dependencies"
```

---

## Task 9: SnowPipe manifest and the #82 regression test

**Files:**
- Create: `SnowPipe/.claude/verify.json`
- Create: `SnowPipe/tests/regression/export-filters-82.test.ts`

**Interfaces:**
- Consumes: `normalizeExportFilters` and `filterRecordsStream` from `SnowPipe/src/server/streaming/filter-stream.ts` (defined at lines 293 and 321).
- Produces: a manifest that routes `src/server/streaming/**` and `src/server/core/**` to the fast tier, and the UI and export surfaces to the browser tier.

**Context for the implementer:** #82 was not a UI bug and not an engine bug. It was a *contract* bug between them: the settings UI persisted `exportFilters` as a bare array `[...]`, while the engine expected `{conditions: [...]}`, so filters were silently ignored on every code path. Typecheck passed because the field was typed loosely. The regression test therefore asserts the contract in both shapes at the `fast` tier — which is both cheaper and a more faithful reproduction than driving it through a browser.

- [ ] **Step 1: Read the current implementation before writing the test**

```bash
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowPipe"
sed -n '285,340p' src/server/streaming/filter-stream.ts
```

Expected: the signature `normalizeExportFilters(input: unknown): FilterConfig | null` and the async generator `filterRecordsStream`. Confirm the exact `FilterConfig` shape and condition field names before writing assertions against them.

- [ ] **Step 2: Write the failing regression test**

`SnowPipe/tests/regression/export-filters-82.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  normalizeExportFilters,
  filterRecordsStream,
} from '@/server/streaming/filter-stream';

/** Collect an async generator into an array. */
async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of gen) out.push(item);
  return out;
}

/**
 * `filterRecordsStream` takes an AsyncIterable, not an array, so the fixture
 * is wrapped rather than passed directly. A plain array would run fine, since
 * `for await` accepts sync iterables, but it would misrepresent the call shape
 * this test claims to cover.
 *
 * Nothing would catch that misrepresentation automatically: this repo's
 * tsconfig excludes `tests`, so `tsc --noEmit` never compiles this file.
 * Verified with `tsc --showConfig` — 489 files in the set, none under tests/.
 * The wrapper is correct because it matches the real signature, not because a
 * typechecker enforces it.
 */
async function* stream(
  records: Record<string, unknown>[],
): AsyncGenerator<Record<string, unknown>> {
  for (const r of records) yield r;
}

const RECORDS: Record<string, unknown>[] = [
  { id: '1', tags: 'snowpipe-test', title: 'Lodge Skillet' },
  { id: '2', tags: 'other', title: 'Vitamix Blender' },
  { id: '3', tags: 'snowpipe-test', title: 'OXO Peeler' },
];

const CONDITION = { field: 'tags', operator: 'contains', value: 'snowpipe-test' };

describe('#82: exportFilters shape contract', () => {
  it('normalizes the bare-array shape the settings UI persists', () => {
    const config = normalizeExportFilters([CONDITION]);
    expect(config).not.toBeNull();
    expect(config!.conditions).toHaveLength(1);
  });

  it('normalizes the wrapped shape the engine expects', () => {
    const config = normalizeExportFilters({ conditions: [CONDITION] });
    expect(config).not.toBeNull();
    expect(config!.conditions).toHaveLength(1);
  });

  it('returns null for empty and absent filters so callers skip filtering', () => {
    expect(normalizeExportFilters(null)).toBeNull();
    expect(normalizeExportFilters([])).toBeNull();
    expect(normalizeExportFilters({ conditions: [] })).toBeNull();
  });

  it('actually drops non-matching records for the bare-array shape', async () => {
    const config = normalizeExportFilters([CONDITION])!;
    const kept = await collect(filterRecordsStream(stream(RECORDS), config));
    expect(kept.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('produces identical results for both persisted shapes', async () => {
    const fromArray = await collect(
      filterRecordsStream(stream(RECORDS), normalizeExportFilters([CONDITION])!),
    );
    const fromWrapped = await collect(
      filterRecordsStream(stream(RECORDS), normalizeExportFilters({ conditions: [CONDITION] })!),
    );
    expect(fromArray).toEqual(fromWrapped);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `pnpm vitest run tests/regression/export-filters-82.test.ts`
Expected: PASS. #82 is already fixed (commit `5a6b84c`), so this test documents and locks the contract. **If it fails, stop and report** — that means the fix regressed, which is itself the finding.

Then confirm the repo still typechecks:

Run: `pnpm exec tsc --noEmit`
Expected: clean.

**Do not read that clean result as covering your new test.** This repo's `tsconfig.json` carries `"exclude": ["node_modules", "tests", "backend-ion", "scripts"]`, so `tsc` never compiles anything under `tests/`. Confirm it for yourself rather than assuming either way:

```bash
pnpm exec tsc --showConfig | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const f=JSON.parse(s).files||[];console.log('compiled files:',f.length,'| under tests/:',f.filter(x=>x.includes('/tests/')).length)})"
```

Expected: a few hundred compiled files and **0** under `tests/`. The async-generator wrapper in the test is correct because it matches `filterRecordsStream`'s real signature, not because a typechecker enforces it — nothing enforces it, so the shape has to be right by construction.

- [ ] **Step 4: Prove the test would have caught #82**

Temporarily make `normalizeExportFilters` reject the bare-array shape:

```bash
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowPipe"
git stash list  # note current state before experimenting
```

Edit `src/server/streaming/filter-stream.ts` so the early branch handling `Array.isArray(input)` returns `null`, then:

Run: `pnpm vitest run tests/regression/export-filters-82.test.ts`
Expected: FAIL on "normalizes the bare-array shape" and "actually drops non-matching records" — the #82 symptom exactly.

Then revert the experiment:

```bash
git checkout -- src/server/streaming/filter-stream.ts
pnpm vitest run tests/regression/export-filters-82.test.ts
```

Expected: PASS again. Do not commit the temporary edit.

- [ ] **Step 5: Write the manifest**

`SnowPipe/.claude/verify.json`:

```json
{
  "repo": "SnowPipe",
  "surfaces": {
    "src/server/streaming/**": { "tier": "fast", "run": "pnpm vitest run tests/regression tests/unit --exclude \"**/plugin-refresh-access-token.test.ts\"" },
    "src/server/core/**": { "tier": "fast", "run": "pnpm vitest run tests/regression tests/unit --exclude \"**/plugin-refresh-access-token.test.ts\"" },
    "backend-ion/**": { "tier": "fast", "run": "pnpm vitest run tests/regression tests/unit --exclude \"**/plugin-refresh-access-token.test.ts\"" },
    "prisma/**": { "tier": "fast", "run": "pnpm prisma validate" },
    "src/app/**": { "tier": "browser", "run": "pnpm test:e2e" },
    "src/components/**": { "tier": "browser", "run": "pnpm test:e2e" }
  },
  "always": "pnpm exec tsc --noEmit",
  "unverified": {
    "src/server/streaming/**": [
      "tests/unit/plugin-refresh-access-token.test.ts, which needs DATABASE_URL from Doppler and is excluded from the hook-invoked run; check it with: doppler run -- pnpm vitest run tests/unit/plugin-refresh-access-token.test.ts"
    ],
    "src/server/core/**": [
      "tests/unit/plugin-refresh-access-token.test.ts, which needs DATABASE_URL from Doppler and is excluded from the hook-invoked run; check it with: doppler run -- pnpm vitest run tests/unit/plugin-refresh-access-token.test.ts"
    ],
    "backend-ion/**": [
      "type errors under backend-ion/src: the root tsconfig excludes backend-ion and it has no typecheck script of its own, so the `always` tsc floor does not compile any of it. Functional coverage comes from the unit tests only",
      "the deployed Lambda runtime, SST deploy only (see #83, the ERR_REQUIRE_ESM cold-start crash)",
      "live Google Merchant API behavior, covered only by the full tier",
      "tests/unit/plugin-refresh-access-token.test.ts, which needs DATABASE_URL from Doppler and is excluded from the hook-invoked run"
    ],
    "src/app/**": [
      "production Clerk auth; e2e runs against a stored session state"
    ]
  },
  "budgets": { "fast": 120, "browser": 360, "full": 900 },
  "ignore": ["**/*.md", "docs/**", "content/**", "exports/**", "playwright-report/**", "**/*.png"]
}
```

**Two things about that `--exclude` are load-bearing, both measured rather than assumed:**

`tests/unit/plugin-refresh-access-token.test.ts` opens a Prisma connection and needs `DATABASE_URL`, which comes from Doppler and is absent in a plain shell. Run unmodified, the fast tier reports `1 failed | 260 passed` — so it would return `fail` on every verification of these surfaces, blaming correct code with a Prisma stack trace until the hook got switched off. Excluded, the same command is `260 passed (260)`, `4451 passed`, in 31.4s against a 120s budget.

The pattern is wrapped in **double** quotes, not single. The dispatcher runs commands through `spawnSync(cmd, {shell: true})`, which on Windows is `cmd.exe`, where single quotes are ordinary characters rather than quoting. Measured directly: a single-quoted argument arrives as `"'**/foo.test.ts'"` with the quotes embedded, so vitest would match nothing and run the excluded test anyway. Double quotes behave correctly under both `cmd.exe` and POSIX shells.

Excluding a test is a reduction in coverage, so it is declared in `unverified` on every surface that uses the command — the hook prints those lines on every pass, and they carry the Doppler command to run it properly.

- [ ] **Step 6: Confirm the referenced test paths exist**

```bash
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowPipe"
ls -d tests/regression tests/unit 2>/dev/null
```

If `tests/unit` does not exist, remove it from the three `run` strings so the command does not fail on a missing path. The manifest must reference only paths that exist.

- [ ] **Step 7: Run the dispatcher against SnowPipe end to end**

```bash
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/snowforge-verify"
echo '{"session_id":"manual","cwd":"C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowPipe"}' | node src/cli.mjs; echo "exit=$?"
```

Expected: `VERIFY PASS  SnowPipe  fast (Ns)`, `exit=0`, plus the `backend-ion` disclosure lines if backend files are in the change set. Record the observed wall-clock seconds — spec §14 open question 2 asks for this number.

- [ ] **Step 8: Commit both repos**

```bash
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowPipe"
git add .claude/verify.json tests/regression/export-filters-82.test.ts
git commit -m "test(#82): lock the exportFilters shape contract, add verify manifest"
```

---

## Task 10: SnowPipe browser tier preflight

**Files:**
- Modify: `snowforge-verify/src/run.mjs`
- Test: `snowforge-verify/tests/preflight.test.mjs`

**Interfaces:**
- Consumes: `runAll` from `src/run.mjs`.
- Produces: `preflight(repoRoot, tier, checks?): {ok: true} | {ok: false, remedy: string}`, called before browser-tier runs. Returns `blocked` with an actionable remedy rather than letting Playwright fail with an opaque error.

SnowPipe's `playwright.config.ts` requires `tests/playwright/.clerk/user.json` for its `storageState`, and boots its own dev server on port 3003. A missing auth state or an occupied port is an inability to verify, not a defect.

- [ ] **Step 1: Write the failing test**

`tests/preflight.test.mjs`:

```javascript
import { describe, it, expect } from 'vitest';
import { preflight } from '../src/run.mjs';

const checks = (over = {}) => ({
  fileExists: () => true,
  browsersInstalled: () => true,
  ...over,
});

describe('preflight', () => {
  it('is a no-op for the fast tier', () => {
    expect(preflight('/repo', 'fast', checks({ browsersInstalled: () => false }))).toEqual({ ok: true });
  });

  it('passes when browser prerequisites are present', () => {
    expect(preflight('/repo', 'browser', checks())).toEqual({ ok: true });
  });

  it('blocks with an install remedy when browsers are missing', () => {
    const r = preflight('/repo', 'browser', checks({ browsersInstalled: () => false }));
    expect(r.ok).toBe(false);
    expect(r.remedy).toContain('playwright install');
  });

  it('blocks with a seed remedy when the stored auth state is missing', () => {
    const r = preflight('/repo', 'browser', checks({ fileExists: () => false }));
    expect(r.ok).toBe(false);
    expect(r.remedy).toContain('.clerk/user.json');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/preflight.test.mjs`
Expected: FAIL — `preflight` is not exported.

- [ ] **Step 3: Implement**

Add these two lines to the **imports at the top** of `src/run.mjs`, alongside the existing `spawnSync` import:

```javascript
import { existsSync } from 'node:fs';
import path from 'node:path';
```

Then append the rest to the bottom of `src/run.mjs`:

```javascript
const defaultChecks = {
  fileExists: (p) => existsSync(p),

  /**
   * Whether Playwright's browser binaries are actually on disk.
   *
   * `playwright --version` is emphatically NOT this check. It exits 0 whenever
   * the npm package is present and says nothing about whether any browser was
   * ever downloaded — measured on this host, it printed `Version 1.58.2` while
   * proving nothing. A machine with the package but no binaries would pass
   * preflight, fail at browser launch, and be reported as `fail`, blaming the
   * code for missing tooling. That is the exact misdiagnosis preflight exists
   * to prevent.
   *
   * `install --dry-run` reports a resolved `Install location:` per browser and
   * honours PLAYWRIGHT_BROWSERS_PATH, so those paths can be checked on disk.
   *
   * If the output cannot be parsed at all, this returns true and lets the run
   * proceed. An unhelpful message is a smaller cost than blocking a repo whose
   * browsers are fine, and a genuine launch failure still surfaces as `fail`,
   * which blocks. Nothing here can turn into a silent pass.
   */
  browsersInstalled: (repoRoot) => {
    const r = spawnSync('pnpm exec playwright install --dry-run', {
      cwd: repoRoot, shell: true, encoding: 'utf8', timeout: 60000,
    });
    if (r.status !== 0) return false;
    const locations = [...String(r.stdout).matchAll(/Install location:\s*(.+)/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);
    if (locations.length === 0) return true; // cannot determine; do not block
    return locations.some((p) => existsSync(p));
  },
};

/**
 * Confirm a tier can actually run before running it. An unmet prerequisite
 * is `blocked` with a remedy, never a silent pass and never a bare failure.
 */
export function preflight(repoRoot, tier, checks = defaultChecks) {
  if (tier !== 'browser') return { ok: true };

  if (!checks.browsersInstalled(repoRoot)) {
    return { ok: false, remedy: 'Playwright browsers are missing. Run: pnpm exec playwright install chromium' };
  }

  const authState = path.join(repoRoot, 'tests', 'playwright', '.clerk', 'user.json');
  if (!checks.fileExists(authState)) {
    return {
      ok: false,
      remedy: 'Stored auth state tests/playwright/.clerk/user.json is missing. Run the Playwright setup project first: pnpm exec playwright test --project=setup',
    };
  }

  return { ok: true };
}
```

- [ ] **Step 4: Wire preflight into the CLI**

In `src/cli.mjs`, immediately after computing `budget` and before `d.runAll(...)`:

```javascript
    const pre = (d.preflight ?? preflight)(repoRoot, plan.tier);
    if (!pre.ok) {
      d.writeVerdict(hookInput.session_id, key, 'blocked');
      const text = `VERIFY BLOCKED  ${manifest.repo}  ${plan.tier}\n  ${pre.remedy}`;
      const { exitCode } = decide('blocked', d.mode);
      return { exitCode, stderr: exitCode === 2 ? text : '', stdout: text };
    }
```

Add `preflight` to the `src/run.mjs` import in `src/cli.mjs`.

- [ ] **Step 5: Run the full suite**

Run: `pnpm test`
Expected: PASS, all suites green. The existing `cli.test.mjs` fakes do not set `preflight`, so the real one runs and returns `{ok: true}` for the fast tier.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: browser-tier preflight with actionable remedies"
```

---

## Task 11: Register the blocking Stop hook

**Files:**
- Modify: `C:\Users\alexi\.claude\settings.json`

**Interfaces:**
- Consumes: `snowforge-verify/src/cli.mjs`.
- Produces: a registered `Stop` hook. This is the step that makes verification non-optional.

- [ ] **Step 1: Back up the current settings**

```bash
cp "C:/Users/alexi/.claude/settings.json" "C:/Users/alexi/.claude/settings.json.bak-verify-hook"
```

Expected: backup written. The file currently has no `hooks` key.

- [ ] **Step 2: Add the hook**

Add this top-level key to `C:\Users\alexi\.claude\settings.json`, preserving every existing key:

```json
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/snowforge-verify/src/cli.mjs",
            "timeout": 540,
            "statusMessage": "Verifying changes"
          }
        ]
      }
    ]
  }
```

The 540s timeout sits under the 600s default and above the 480s hook-invoked budget total, so the dispatcher always reports before the harness gives up.

- [ ] **Step 3: Validate the JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('C:/Users/alexi/.claude/settings.json','utf8')); console.log('valid')"
```

Expected: `valid`. A malformed settings file breaks every session, so do not skip this.

- [ ] **Step 4: Verify the guard in a throwaway repo**

```bash
mkdir -p "$TMPDIR/verify-guard-check" && cd "$TMPDIR/verify-guard-check" && git init -q && echo x > a.ts && git add a.ts
echo '{"session_id":"guard","cwd":"'"$PWD"'"}' | node "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/snowforge-verify/src/cli.mjs"; echo "exit=$?"
```

Expected: no output, `exit=0`. A repo outside SnowForgeLLC is untouched.

- [ ] **Step 5: Verify the block fires in a real session**

Start a Claude Code session in SnowPipe, make a trivial edit to a file under `src/server/streaming/`, and end the turn.

Expected: the Stop hook runs the fast tier. On green, the session ends and `VERIFY PASS SnowPipe fast (Ns)` appears in the debug log. To confirm blocking, temporarily break an assertion in `tests/regression/export-filters-82.test.ts` and end the turn again: the stop must be blocked with the failing output, and blocked **once** — a second stop with the same unchanged tree must be allowed through by the state-key cache.

- [ ] **Step 6: Revert the deliberate breakage**

```bash
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/SnowPipe"
git checkout -- tests/regression/export-filters-82.test.ts
```

- [ ] **Step 7: Commit the dispatcher repo and record the rollout**

```bash
cd "C:/Users/alexi/Documents/Diaz/Repositories/SnowForgeLLC/snowforge-verify"
git add -A && git commit -m "chore: phases 1-3 complete, stop hook registered"
```

Then update `C:\Users\alexi\.claude\TODO.md` with a dated entry recording that phases 1–3 are live, the measured browser-tier wall-clock from Task 9 Step 7, and that phases 4–8 (SnowCards, OnDeck, remaining repos, `/verify-init`, autobuild `report` mode) remain.

---

## Rollback

If the hook proves disruptive, remove the `hooks` key from `C:\Users\alexi\.claude\settings.json` or restore `settings.json.bak-verify-hook`. The dispatcher stays installed and runnable by hand, and every manifest stays valid — nothing else depends on the hook being registered.
