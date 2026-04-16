# Gumroad Product: Shopify JSONL Bulk Processor

**Price:** $39
**Format:** Python CLI tool (downloadable zip)
**Effort to create:** 1-2 days (packaging existing knowledge + code)
**Why this matters:** You've debugged Shopify bulk ops extensively. This is your most unique expertise packaged.

---

## Gumroad Listing Copy

### Title
Shopify JSONL Bulk Processor

### Subtitle
Process Shopify bulk operation exports without choking on large catalogs. Built by someone who's debugged the timeout you're hitting right now.

### Description

**If you've hit the Shopify bulk operations timeout, this tool is for you.**

Shopify's Bulk Operations API exports data as JSONL (JSON Lines). It sounds simple until you're dealing with:
- 50,000+ products with variants
- Presentment prices multiplying your connection count
- Bulk operations timing out after 10 minutes
- Nested JSONL that doesn't parse like you expect
- Memory issues processing large export files

This CLI tool handles all of it.

**What it does:**
- Parses Shopify bulk operation JSONL exports correctly (handles nested parent/child records)
- Processes catalogs of any size with constant memory usage (streaming, not loading everything into memory)
- Flattens nested variant/inventory data into clean CSV or JSON
- Optimizes presentment price connections to prevent timeout
- Validates output against Google Merchant / Meta catalog specs
- Configurable field selection (only extract what you need)

**What you get:**
- Python CLI tool (works on Mac, Windows, Linux)
- Pre-built configs for common use cases (product export, inventory sync, order export)
- Documentation with examples for every Shopify resource type
- Troubleshooting guide for common bulk operation errors

**Use cases:**
- Exporting large Shopify catalogs for feed management
- Building product feeds for Google Shopping, Meta, TikTok
- Migrating product data between platforms
- Automated inventory/pricing snapshots
- CI/CD pipeline integration for feed regression testing

**Requirements:** Python 3.10+

---

## Technical Spec (What to Build)

### Core Module: `shopify_bulk.py`
```
Commands:
  process   Parse a JSONL export file into structured output
  fetch     Trigger + download a bulk operation from Shopify
  validate  Validate processed output against feed specs
  config    Manage saved configurations

Options:
  --input FILE          Input JSONL file path
  --output FILE         Output file path
  --format csv|json|jsonl  Output format (default: csv)
  --fields FIELDS       Comma-separated fields to include
  --config CONFIG       Named config to use
  --max-presentments N  Limit presentment prices (prevents timeout)
```

### Key Features to Implement
1. **Streaming JSONL parser** - Don't load entire file into memory
2. **Parent/child record assembly** - Shopify JSONL nests variants under products
3. **Presentment price limiter** - The #1 cause of bulk op timeouts
4. **Field flattener** - `product.variants[0].price` -> `variant_price`
5. **Feed spec validator** - Check required fields for Google/Meta
6. **Config system** - Save common field selections as named configs

### Package Structure
```
shopify-jsonl-processor/
├── README.md
├── setup.py / pyproject.toml
├── shopify_bulk/
│   ├── __init__.py
│   ├── cli.py          # Click CLI interface
│   ├── parser.py       # Streaming JSONL parser
│   ├── assembler.py    # Parent/child record assembly
│   ├── flattener.py    # Nested field flattening
│   ├── validator.py    # Feed spec validation
│   ├── exporter.py     # CSV/JSON/JSONL output
│   └── configs/
│       ├── products.yaml
│       ├── inventory.yaml
│       └── orders.yaml
├── tests/
│   ├── test_parser.py
│   ├── test_assembler.py
│   └── fixtures/
│       └── sample_export.jsonl
└── docs/
    ├── quickstart.md
    ├── troubleshooting.md
    └── field-reference.md
```

---

## Blog Post Tie-In

**Title:** "Why your Shopify bulk operation keeps timing out on large catalogs"

**Structure:**
1. The problem: bulk ops time out at ~10 min for large catalogs
2. Root cause: presentment price connections multiply exponentially
3. The fix: limit presentment prices in your GraphQL query
4. Show the exact query modification
5. CTA: "I packaged this into a tool" -> Gumroad link

This post targets an exact Google search query. People hitting this problem will find your post, get the free fix, and some will buy the tool for the full solution.

---

## Action Items

- [ ] Create repo (private, not in SnowForge org) or build within existing code
- [ ] Implement streaming JSONL parser + assembler
- [ ] Add CLI with Click
- [ ] Create 3 preset configs (products, inventory, orders)
- [ ] Write README (this IS the marketing)
- [ ] Add sample JSONL fixture for testing
- [ ] Package as zip for Gumroad
- [ ] Create 2-3 screenshots for listing
- [ ] Upload to Gumroad at $39
- [ ] Write blog post on alexdiaz.me
