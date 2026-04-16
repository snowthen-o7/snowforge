# Gumroad Product: Feed Diff & Regression Checker

**Price:** $29
**Format:** Python CLI tool (downloadable zip) — repackage of Diaz Diff Checker
**Effort to create:** 1 day (repackaging existing tool with commercial README)
**Why this is fast:** The tool already exists. You just need to reposition it for the buyer.

---

## Gumroad Listing Copy

### Title
Feed Diff & Regression Checker

### Subtitle
Catch breaking changes in your product feeds before they hit production. Compare feed snapshots, flag regressions, generate reports.

### Description

**One bad feed update can disapprove your entire Google Shopping catalog.**

A price field that silently went blank. A category that changed format. An image URL that started 404ing. You don't find out until your ads stop running and revenue drops.

This tool catches those regressions before they go live.

**What it does:**
- Compares two versions of a product feed (CSV, TSV, JSON, JSONL)
- Identifies added, removed, and modified records
- Highlights field-level changes with before/after values
- Flags critical regressions (price drops to $0, missing required fields, broken URLs)
- Generates diff reports in HTML, CSV, or JSON
- Handles large feeds efficiently (async processing, 200 concurrent requests for URL validation)

**Built for:**
- Feed managers who push updates to Google Merchant, Meta, or TikTok
- E-commerce devs who need regression tests in their CI/CD pipeline
- Agencies managing product feeds for multiple clients
- Anyone who's been burned by a silent feed breakage

**Features:**
- Smart diffing with HTML content normalization
- Whitespace and encoding tolerance (won't flag false positives)
- Floating-point precision handling (0.10 vs 0.1 won't trigger)
- Configurable severity rules (define what counts as "critical")
- CSV, JSON, and HTML report output
- CI/CD friendly (exit codes for pass/fail, Newman-style)

**Requirements:** Python 3.10+

---

## Repackaging Plan

The Diaz Diff Checker already exists. To make it Gumroad-ready:

1. **Rename** from "Diaz Diff Checker" to "Feed Diff & Regression Checker" (buyer-facing name)
2. **Rewrite README** from developer notes to customer-facing documentation
3. **Add preset configs** for common feed formats:
   - Google Merchant Center feed (required fields, severity rules)
   - Meta Product Catalog feed
   - Shopify product export
4. **Add HTML report template** (visual diff output, not just CLI text)
5. **Add sample feeds** for testing (2 versions of a Google Shopping feed with intentional regressions)
6. **Package as zip** with clear install instructions

### What Already Works (From Portfolio)
- CSV/TSV parsing and comparison
- Async HTTP fetching (200 concurrent requests)
- Smart diffing with normalization
- Python CLI interface
- High-concurrency processing

### What to Add
- [ ] Feed-specific preset configs (Google, Meta, Shopify)
- [ ] Severity rule engine (critical: price=0, high: missing GTIN, etc.)
- [ ] HTML diff report template
- [ ] Sample regression test feeds
- [ ] Commercial README with quickstart + screenshots
- [ ] `--ci` flag for CI/CD exit codes

---

## Action Items

- [ ] Fork/copy Diaz Diff Checker into standalone package
- [ ] Rename and rebrand for buyer audience
- [ ] Add feed-specific presets (Google, Meta)
- [ ] Add HTML report output
- [ ] Write commercial README
- [ ] Screenshot the diff output for Gumroad listing images
- [ ] Upload to Gumroad at $29
- [ ] Update alexdiaz.me portfolio to link to Gumroad (paid) + GitHub (open core?)
