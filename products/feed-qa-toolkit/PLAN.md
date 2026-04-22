# Feed QA Toolkit — Combined Product Plan

## The Pitch

**One product. Two tools. The complete feed QA workflow.**

The audit tool checks a snapshot: "your feed has problems." The diff checker catches changes: "your feed just broke." Together they cover the full lifecycle — audit before launch, diff before every update.

**Price:** $39 (vs $29 + $29 = $58 if sold separately)

---

## What the Buyer Gets

```
Feed-QA-Toolkit/
├── README.md                  # Getting started, what's inside, support
│
├── audit/
│   ├── Code.gs                # Google Apps Script — paste into Sheets
│   ├── setup-instructions.md  # 5-minute setup guide
│   └── guide.pdf              # 8-page companion guide
│
├── diff-checker/
│   ├── feediff                 # Python CLI (packaged or pip-installable)
│   ├── README.md              # CLI usage, flags, examples
│   └── sample-feeds/          # Two Google Shopping CSVs with intentional regressions
│       ├── baseline.csv
│       └── updated.csv
│
├── presets/                   # Shared between both tools
│   ├── google-merchant.json
│   ├── meta-catalog.json
│   └── shopify-export.json
│
└── workflow-guide.md          # How the two tools work together (see below)
```

---

## Shared Presets Design

The presets are the connective tissue. Both tools consume the same JSON files:

| Preset field | Used by Audit | Used by Diff Checker |
|---|---|---|
| `required_fields` | Checks presence/completeness | Flags when a required field goes blank |
| `recommended_fields` | Checks coverage % | Flags when a recommended field disappears |
| `critical_rules` | Validates values (format, allowed values) | Detects regressions (price→0, ID changed) |
| `high_rules` | Validates thresholds (GTIN length, title length) | Detects anomalies (80% price drop, bulk OOS) |
| `field_mappings` | Auto-detects column names | Auto-detects column names |
| `primary_key_candidates` | Duplicate ID detection | Matches rows across snapshots |

This means:
- Buyers can edit one preset file and both tools respect it
- Custom presets (e.g., TikTok catalog, Amazon SP-API) work with both tools
- "Add your own preset" becomes a selling point

---

## Workflow Guide Outline (workflow-guide.md)

Short doc (2-3 pages) that ties the tools together:

### When to Use What

| Scenario | Tool | Why |
|---|---|---|
| First time looking at a feed | Audit | Get a baseline health score |
| Before pushing a feed update | Diff Checker | Catch regressions before they go live |
| After a platform migration | Both | Audit the new feed, diff against the old one |
| Weekly maintenance | Audit | Recheck health score, track improvement |
| CI/CD pipeline | Diff Checker | Automated regression gate |
| Client onboarding (agency) | Both | Audit as deliverable, diff for ongoing monitoring |
| Emergency: "my ads stopped" | Audit | Find what's broken right now |
| Emergency: "something changed" | Diff Checker | Find exactly what changed and when |

### Suggested Workflow

```
Export feed (day 1) ──→ Run Audit ──→ Fix issues ──→ Save as baseline
                                                          │
Export feed (day N) ──→ Run Diff vs baseline ──→ Review changes ──→ Push if clean
                              │                                         │
                              └── Critical regressions? ──→ Fix first ──┘
```

### Using Presets with Both Tools

```bash
# Audit with Google Merchant preset (in Sheets, select "Google Merchant" mode)
# Diff with Google Merchant preset
feediff baseline.csv updated.csv --preset presets/google-merchant.json
```

---

## Gumroad Listing Copy

### Title
Feed QA Toolkit — Audit & Diff Tools for Product Feeds

### Subtitle
Find feed problems before Google and Meta do. Audit your catalog, catch regressions, protect your ad revenue.

### Description

**A bad product feed costs you money every day it goes unfixed.**

Missing GTINs tank your Shopping impressions. A price that silently drops to $0 gets your products disapproved. An image URL that 404s means your dynamic ads show nothing. You don't get a notification. Your products just stop performing.

This toolkit catches those problems — both the ones already in your feed and the ones your next update is about to introduce.

**Two tools, one workflow:**

**1. Feed Audit Tool** (Google Sheets)
Paste your product feed, click a button, get a color-coded graded report.
- 95+ automated checks across 7 categories
- Health score (0-100) to track improvement over time
- Platform-specific modes: Google Merchant, Meta Catalog, Shopify
- Smart column detection — works with any CSV export naming convention
- No software to install. Runs entirely in Google Sheets.

**2. Feed Diff Checker** (Python CLI)
Compare two versions of your feed and catch breaking changes.
- Identifies added, removed, and modified products
- Flags critical regressions: price drops to $0, required fields go blank, IDs change
- Severity-graded alerts based on platform rules
- Handles large feeds efficiently with streaming processing
- CI/CD friendly — exit codes for automated pipelines

**Both tools share platform presets** for Google Merchant Center, Meta Catalog, and Shopify. The presets encode platform-specific rules — what gets your products disapproved, what kills impressions, what breaks dynamic ads. Edit them or create your own for other platforms.

**Also includes:**
- 8-page Feed Audit Guide with the 5 most costly feed issues and how to fix them
- Workflow guide showing how to use both tools together
- Sample feeds with intentional regressions for testing

**Who this is for:**
- Feed managers pushing updates to Google, Meta, or TikTok
- Store owners who want to find issues before the platform does
- Agencies onboarding e-commerce clients (run audit → deliver report)
- E-commerce devs who want regression checks in their CI/CD pipeline

**Requirements:**
- Feed Audit Tool: Google account (Google Sheets)
- Feed Diff Checker: Python 3.10+

**Price: $39**

---

## Launch Strategy

### Phase 1: Ship v1.0 with Audit Tool complete ($39)

The audit tool is nearly done. Ship the toolkit with:
- ✅ Audit tool (Code.gs, setup instructions, guide)
- ✅ Shared presets (Google, Meta, Shopify)
- ✅ Workflow guide (positions the diff checker as included)
- ⏳ Diff checker marked as "v1.1 — included free when ready"

This gets the listing live and generating revenue. The $39 price is justified by the audit tool + presets + guide alone — the diff checker is a bonus.

**Why this works:** Gumroad buyers get free updates. When the diff checker ships, existing buyers get it automatically. Early buyers feel like they got a deal. The listing copy already describes both tools, so no rewrite needed.

### Phase 2: Ship v1.1 with Diff Checker (~2-3 sessions of work)

Remaining work on the diff checker:
1. Add `--preset` flag to load JSON preset files
2. Implement severity rule engine (evaluate `critical_rules` and `high_rules` against diffs)
3. Add HTML report template (visual diff output)
4. Add `--ci` flag for exit codes
5. Package sample regression feeds
6. Test end-to-end with all 3 presets

### Phase 3: Content marketing

- Blog post: "How to Audit Your Product Feed in 30 Seconds" → CTA to toolkit
- Blog post: "The Feed Update That Broke 10,000 Products" → CTA to toolkit
- LinkedIn post showing a before/after health score screenshot
- Reply to relevant Reddit/Twitter threads about Shopping ad performance drops

---

## Pricing Rationale

| Option | Price | Reasoning |
|---|---|---|
| Audit tool alone | Would be $29 | "Just a Google Sheets script" — harder to justify |
| Diff checker alone | Would be $29 | Requires Python — smaller audience |
| **Bundle at $39** | **$39** | Feels like a deal vs $58 separate. More substantial package. Single listing to promote. |
| Bundle at $49 | Too high | No brand recognition yet. $39 is impulse-buy territory. |

---

## What Needs to Happen (in order)

1. [ ] Move audit tool files into `feed-qa-toolkit/audit/`
2. [ ] Move preset files into `feed-qa-toolkit/presets/`
3. [ ] Write `workflow-guide.md`
4. [ ] Write top-level `README.md` (getting started)
5. [ ] Convert `guide.md` to PDF
6. [ ] Take screenshots of audit results for Gumroad listing
7. [ ] Create Gumroad listing with copy above
8. [ ] Zip and upload v1.0
9. [ ] (Later) Build preset loading into diff checker
10. [ ] (Later) Build severity rule engine
11. [ ] (Later) Ship v1.1 update on Gumroad
