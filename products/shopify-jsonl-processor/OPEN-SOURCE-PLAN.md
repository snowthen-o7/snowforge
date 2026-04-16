# Shopify JSONL Processor: Open-Source Pivot Plan

**Date:** 2026-04-16
**Strategy:** Release as MIT open-source on GitHub + PyPI. Use as a SnowForge discovery funnel + credibility builder, not a direct-revenue product.

---

## Competitive Research (2026-04-16)

### What exists (broader Shopify ecosystem)

| Tool/Package | Language | What it does | Parses parent/child? | Flattens to CSV? | Standalone CLI? |
|---|---|---|---|---|---|
| [travis-r6s/shopify-bulk-export](https://github.com/travis-r6s/shopify-bulk-export) (npm) | Node.js | Triggers bulk op, polls, downloads raw JSONL. **Stops there.** | **No** | **No** | **No** (library) |
| [Shopify CLI `shopify app bulk execute`](https://shopify.dev/docs/api/shopify-cli/app/app-bulk-execute) | Node.js | Official CLI for triggering bulk ops. Outputs raw JSONL. Requires Shopify app context. | **No** | **No** | Requires app |
| [ShopifyQL Python SDK](https://github.com/Shopify/shopifyql-py) (`pip install shopifyql`) | Python | Official analytics-only SDK. Returns pandas DataFrames for ShopifyQL queries. **Not for product data.** | N/A | N/A (analytics) | Yes (analytics) |
| [ShopifyAPI (PyPI)](https://pypi.org/project/ShopifyAPI/) | Python | Official REST + GraphQL API client. Handles auth and requests. | **No** | **No** | **No** |
| [EcomGraduates/shopify-product-export-to-csv](https://github.com/EcomGraduates/shopify-product-export-to-csv) | Node.js | Simple CLI, uses REST API (not bulk ops). Paginates products. | N/A (REST) | Yes (simple) | Yes |
| [Matrixify](https://apps.shopify.com/excel-export-import) | Shopify App | Full import/export/migrate app. $0-200/mo. Most feature-rich. | Yes (internal) | Yes | **No** (web UI) |
| [shopify-api-ruby](https://github.com/Shopify/shopify-api-ruby) | Ruby | Official Ruby SDK. Has [open issue #729](https://github.com/Shopify/shopify-api-ruby/issues/729) requesting JSONL parsing. **Unresolved 3+ years.** | **No** | **No** | **No** |
| `jsonlines` (PyPI) | Python | Generic JSONL reader. No Shopify awareness. | **No** | **No** | **No** |
| Various blog posts + SO answers | Mixed | Ad-hoc code snippets. | Partial | Partial | **No** |

### Competitive gap analysis

| Capability | shopify-bulk-export (npm) | Shopify CLI | EcomGraduates CLI | Matrixify | **Our tool** |
|---|---|---|---|---|---|
| Trigger bulk operation | Yes | Yes | No (REST) | Yes (internal) | **Yes** |
| Poll + download result | Yes | Yes (--watch) | N/A | Yes | **Yes** |
| Parse JSONL parent/child | **No** | **No** | N/A | Yes | **Yes** |
| Flatten to CSV/JSON | **No** | **No** | Yes (simple) | Yes | **Yes** |
| Dynamic option columns | **No** | **No** | **No** | Unknown | **Yes** |
| Inventory by location | **No** | **No** | **No** | Yes | **Yes** |
| Legacy + modern inventory API | **No** | **No** | **No** | Unknown | **Yes** |
| Standalone CLI (no app context) | **No** (library) | **No** (needs app) | Yes | **No** (web) | **Yes** |
| Language | Node.js | Node.js | Node.js | N/A | **Python** |
| Open source | Yes | Yes | Yes | No ($) | **Yes** |

### Key differentiators

1. **Only Python tool** in this space (all others are Node.js or paid apps)
2. **Only tool that does the full lifecycle**: trigger → poll → download → parse → assemble → flatten → export. The npm package stops after download. Shopify CLI stops after download. Ours goes end-to-end.
3. **Parent/child assembly is our core value.** This is the hard part that every developer writes from scratch. Nobody has packaged it as a reusable library.
4. **Standalone CLI with no Shopify app context needed.** Shopify CLI requires `shopify app` scaffolding. Ours just needs a store domain + access token.
5. **Streaming/memory-bounded.** Processes one product at a time regardless of catalog size. Critical for the large stores that need bulk ops in the first place.

### Strongest signal

Shopify's own official Ruby SDK has an **open issue (#729) requesting exactly what we built**, and it remains unresolved after 3+ years. The npm ecosystem has a fetch-only library but no parser. The Python ecosystem has nothing at all. We are first-to-market across the full lifecycle in Python.

### Community pain threads

- [How can I manage JSONL parsing for large data with bulk operations?](https://community.shopify.com/t/how-can-i-manage-jsonl-parsing-for-large-data-with-bulk-operations/7090) (Shopify Community)
- [JSONL parsing issue for bulk operations](https://community.shopify.com/c/shopify-discussions/jsonl-parsing-issue-for-bulk-operations/td-p/602522) (Shopify Community)
- [Do the children in a bulk operation JSONL come right after their parent?](https://community.shopify.com/t/do-the-children-in-a-bulk-operation-jsonl-with-nested-connections-come-right-after-their-parent/165909) (Shopify Community)
- [GraphQL Bulk Operation TIMEOUT on Customers Query](https://community.shopify.com/t/graphql-bulk-operation-timeout-on-customers-query-shopify-plus/581465)
- [Bulk query timeout (Shopify Dev)](https://community.shopify.dev/t/bulk-query-timeout/26894)

---

## What We Have (already built)

| Module | Lines | Description |
|---|---|---|
| `parser.py` | 379 | Streaming JSONL parser, 6 normalizers, structural inference for exports without `__typename` |
| `expander.py` | 232 | Memory-bounded parent/child assembly, dynamic option columns, inventory aggregation, image fallback |
| `exporter.py` | 77 | CSV, JSON, JSONL output writers |
| `fetcher.py` | 190 | Trigger bulk op via GraphQL, poll with backoff, download with retry |
| `queries.py` | 100 | GraphQL query templates (products with/without inventory) |
| `types.py` | 220 | 14 dataclasses for all Shopify bulk node types |
| `cli.py` | 170 | Click CLI: `process`, `fetch`, `configs` subcommands |
| `configs/` | 3 YAML | products, inventory, orders presets |
| `tests/` | 27 tests | Parser + expander coverage |
| **Total** | ~1,900 lines | Complete, tested, working |

---

## Open-Source Execution Plan

### Step 1: License + repo setup (15 min)

- [ ] Switch LICENSE from proprietary to MIT
- [ ] Create GitHub repo `snowthen-o7/shopify-bulk` (short name for PyPI + CLI discoverability)
- [ ] Add `.gitignore` (Python standard: `__pycache__`, `.pytest_cache`, `dist/`, `*.egg-info`)
- [ ] Push initial code

### Step 2: README rewrite for GitHub (30 min)

Current README is Gumroad listing copy. Rewrite for open-source:
- [ ] Add badges: PyPI version, Python version, license, tests passing
- [ ] Installation: `pip install shopify-bulk`
- [ ] Quick-start code examples (both CLI and Python API)
- [ ] Feature list emphasizing what makes this different from generic JSONL tools
- [ ] "Why not just use `jsonlines`?" section (explaining the parent/child assembly gap)
- [ ] Contributing guidelines
- [ ] SnowForge branding footer: "Built by [SnowForge](https://snowforge.dev). For automated feed pipelines, see [SnowPipe](https://pipe.snowforge.dev)."

### Step 3: PyPI publish (15 min)

- [ ] Update `pyproject.toml`: name = "shopify-bulk", license = "MIT", project-urls (GitHub, docs)
- [ ] Register on PyPI if not already (Alex may already have an account from data-diff-checker)
- [ ] Build: `python -m build`
- [ ] Publish: `twine upload dist/*`
- [ ] Verify: `pip install shopify-bulk && shopify-bulk --help`

### Step 4: Blog post on snowforge.dev (60 min)

**Title:** "Why Your Shopify Bulk Operation Keeps Timing Out (and How to Fix It)"

**Structure:**
1. The problem (bulk ops timing out at ~10 min for large catalogs)
2. Root cause: nested connections multiply the operation size (presentment prices, inventory levels per location)
3. The free fix: limit your GraphQL query (show the exact modification)
4. The tool: `pip install shopify-bulk` for the full workflow
5. CTA: star the repo, try it, open issues

**Target keywords:** "shopify bulk operation timeout", "shopify jsonl parser", "shopify bulk query timeout"

### Step 5: Launch announcements (30 min)

Open-source launches are welcome where paid products weren't:

| Platform | Framing |
|---|---|
| r/shopify | "I open-sourced a CLI tool for parsing Shopify bulk operation exports. Handles the `__parentId` assembly that everyone has to write from scratch." |
| r/python | "Built a streaming JSONL parser for Shopify's Bulk Operations API. Handles 50K+ products with constant memory." |
| Hacker News | "Show HN: shopify-bulk, a CLI tool for processing Shopify bulk JSONL exports" |
| X | Link to blog post + repo |
| Shopify Community threads | Reply to the open threads (linked above) with "I built a tool for this, here's the repo" |

### Step 6: File issue on Shopify's Ruby SDK (5 min)

- [ ] Comment on [Shopify/shopify-api-ruby#729](https://github.com/Shopify/shopify-api-ruby/issues/729) linking the Python tool as a community solution. This cross-pollinates discovery.

---

## SnowForge Branding Strategy

Subtle, not heavy-handed. The goal is credibility, not a sales pitch.

**In the repo:**
- README footer: "Built by [SnowForge](https://snowforge.dev)"
- One line in README's "Going Further" section: "For automated feed pipelines with scheduling, transforms, and destination pushes, see [SnowPipe](https://pipe.snowforge.dev)."
- CLI `--version` output includes "by SnowForge"

**On snowforge.dev:**
- Blog post lives on snowforge.dev (not alexdiaz.me) to build domain authority
- Tools page lists the GitHub repo as a free tool alongside the paid Feed Audit Tool
- snowforge.dev link in PyPI project URLs

**NOT in the repo:**
- No SnowPipe upsell in the CLI output or help text (too aggressive)
- No tracking/analytics in the tool
- No "premium" gated features

---

## Metrics To Track

| Metric | Where to check | Signal |
|---|---|---|
| GitHub stars | repo page | Community interest |
| PyPI weekly downloads | pypi.org stats | Adoption |
| Inbound links to snowforge.dev | Google Search Console | SEO value |
| SnowPipe signups from snowforge.dev referrals | Clerk analytics + UTM | Revenue funnel working |
| Issues + PRs on the repo | GitHub notifications | Community engagement |

---

## Timeline

| Day | Action |
|---|---|
| Day 1 | License flip, repo creation, README rewrite, PyPI publish |
| Day 2 | Blog post written + published on snowforge.dev |
| Day 3 | Launch posts: r/shopify, r/python, HN, X, Shopify Community threads |
| Day 7 | Check: GitHub stars, PyPI downloads, any issues filed |
| Day 30 | Check: SnowPipe signup referrals from snowforge.dev |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Someone forks and claims credit | Low | MIT license is standard; GitHub timestamps prove provenance. Original blog post on snowforge.dev is canonical. |
| Shopify ships their own parser in the SDK | Medium | They've had issue #729 open for 3+ years. Even if they ship one, ours would be Python (theirs is Ruby/JS), so different audience. |
| Tool has bugs with real-world edge cases | High | Ship, then iterate. Being first-to-market with "good enough" beats being late with "perfect." |
| Nobody cares | Medium | The community threads + open SDK issue suggest demand exists. If stars are <20 after 30 days, the audience is too niche and we move on. |
