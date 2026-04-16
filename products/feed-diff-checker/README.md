# Feed Diff & Regression Checker

## One bad feed update can take down your entire Google Shopping catalog.

A price field that silently went blank. A category column that changed format. An image URL that started returning 404s. You do not find out until your ads stop running and revenue drops off a cliff.

**Feed Diff & Regression Checker catches those breaking changes before they hit production.**

Compare two versions of any product feed -- CSV, TSV, or JSON -- and get a detailed report of exactly what changed, what broke, and what needs your attention before you push to Google Merchant Center, Meta, or any other channel.

---

## The Problem

Every time your product feed updates, there is a risk that something broke:

- Your e-commerce platform changed its export format
- A plugin update reset your field mappings
- A bulk product edit wiped out GTINs for half your catalog
- A developer changed the price field from "29.99" to "29.99 USD" and broke every product
- A category re-org changed 2,000 product types overnight

Without a diff check, these changes silently flow into Google Merchant Center, Meta Commerce Manager, and your other channels. Products get disapproved. Ads stop running. Revenue drops. And you spend days figuring out what happened.

**This tool shows you exactly what changed in 30 seconds.**

---

## What It Does

- **Compares two versions of a product feed** (before and after, prod and staging, yesterday and today)
- **Identifies added, removed, and modified products** with exact row counts
- **Shows field-level changes** with before/after values for every modified product
- **Flags critical regressions** using configurable severity rules (price dropped to $0, GTIN removed, image URL broken)
- **Generates reports** in JSON and CSV formats
- **Handles large feeds efficiently** with streaming processing -- never loads entire files into memory
- **Supports composite primary keys** (e.g., match on SKU + locale for multi-market feeds)

---

## Features

### Smart Comparison
- Hash-based row comparison with two-pass algorithm (fast scan, then detailed diff only on changes)
- HTML content normalization (will not flag `<p>text</p>` vs `text` as a change)
- Whitespace and encoding tolerance (no false positives from trailing spaces or BOM characters)
- Floating-point precision handling (`0.10` vs `0.1` will not trigger a diff)
- Case-sensitive or case-insensitive comparison (configurable)

### Feed-Specific Presets
Included preset configurations for the three most common feed types:
- **Google Merchant Center** -- required fields, GTIN validation, price/availability severity rules
- **Meta Product Catalog** -- content ID matching, required attributes, image validation
- **Shopify Product Export** -- variant handling, inventory fields, handle-based matching

Each preset defines required fields, critical regression rules, high-severity rules, and field name mappings so the tool knows what matters for your specific platform.

### Performance
- Streaming CSV processing -- memory usage stays flat regardless of file size
- Processes 100,000+ row feeds in seconds
- Configurable row limits for quick spot-checks on massive feeds
- Concurrent processing for batch comparisons

### Output
- JSON reports with full diff details and summary statistics
- CSV reports for spreadsheet analysis
- Per-column change counts (instantly see that 500 products had their title changed)
- Example IDs with line numbers for quick debugging

---

## Quick Start

### Installation

```bash
# Requires Python 3.8+
pip install -e .
```

### Basic Usage

```bash
# Compare two feed files
data-diff --local-prod feed_monday.csv --local-dev feed_tuesday.csv

# Use a composite primary key
data-diff --local-prod feed_v1.csv --local-dev feed_v2.csv --primary-key "sku,locale"

# Limit rows for a quick check
data-diff --local-prod big_feed_old.csv --local-dev big_feed_new.csv --diff-rows 5000
```

### Using Feed Presets

Feed presets are JSON configuration files that tell the tool which fields matter, what constitutes a critical regression, and how to map field name variations.

```bash
# Check a Google Merchant Center feed with the included preset
data-diff --local-prod feed_v1.csv --local-dev feed_v2.csv --primary-key "id"

# Then review results against the preset's severity rules
# (See presets/ directory for configuration details)
```

### Batch Processing

```bash
# Compare all file pairs in a folder
data-diff --local-folder ./feed_snapshots/
```

---

## Preset Configuration

Each preset JSON file defines platform-specific rules:

```json
{
  "platform": "google-merchant",
  "required_fields": ["id", "title", "description", "price", "availability", "link", "image_link"],
  "critical_rules": [
    {"field": "price", "condition": "becomes_empty", "message": "Price removed -- product will be disapproved"},
    {"field": "price", "condition": "equals_zero", "message": "Price dropped to $0 -- critical regression"}
  ],
  "high_rules": [
    {"field": "gtin", "condition": "becomes_empty", "message": "GTIN removed -- will lose Shopping visibility"}
  ],
  "field_mappings": {
    "id": ["item_id", "product_id", "sku"],
    "title": ["product_title", "name", "product_name"]
  }
}
```

**Included presets:**
- `presets/google-merchant.json` -- Google Shopping feed rules
- `presets/meta-catalog.json` -- Meta/Facebook Product Catalog rules
- `presets/shopify-export.json` -- Shopify CSV export rules

You can create custom presets for any feed format by copying and modifying these files.

---

## Output Format

### Summary JSON

```json
{
  "mode": "local",
  "prod_file": "feed_monday.csv",
  "dev_file": "feed_tuesday.csv",
  "rows_added": 12,
  "rows_removed": 3,
  "rows_updated": 247,
  "detailed_key_update_counts": {
    "title": 89,
    "price": 45,
    "availability": 112,
    "image_link": 1
  },
  "prod_row_count": 8500,
  "dev_row_count": 8509,
  "runtime_seconds": 1.82
}
```

### Key Metrics

| Metric | What It Means |
|--------|---------------|
| `rows_added` | New products in the updated feed |
| `rows_removed` | Products that disappeared from the feed |
| `rows_updated` | Products with at least one field change |
| `detailed_key_update_counts` | How many products changed per field |

---

## Use Cases

### Pre-push feed validation
Run a diff before pushing a new feed version to Google Merchant Center. Catch regressions before they cause disapprovals.

### Daily feed monitoring
Compare today's feed to yesterday's. Set up a cron job or CI/CD step to alert you when critical changes are detected.

### Platform migration testing
Migrating from Shopify to WooCommerce? Compare the feed output from both platforms to verify data parity before switching.

### Feed plugin/tool evaluation
Testing a new feed management tool? Compare its output against your current tool to verify nothing is lost or changed unexpectedly.

### Debugging disapprovals
When Google disapproves products, diff your last two feed versions to find what changed. Often the cause is a field that silently went blank or changed format.

---

## Requirements

- Python 3.8+
- No external dependencies required for core functionality (aiohttp required only for URL-mode fetching)

---

## What's Included

- `data-diff` CLI tool with full comparison engine
- `presets/google-merchant.json` -- Google Shopping feed preset
- `presets/meta-catalog.json` -- Meta Product Catalog preset
- `presets/shopify-export.json` -- Shopify product export preset
- Source code (Python, MIT licensed)

---

**Price: $29**

*Built by Alex Diaz | alexdiaz.me*
