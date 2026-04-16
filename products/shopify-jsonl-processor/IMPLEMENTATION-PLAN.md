# Shopify JSONL Bulk Processor, Implementation Plan

**Product name (working):** Shopify JSONL Bulk Processor
**Price:** $39
**Target ship date:** 2026-04-23 (7 days of evening/weekend work)
**Estimate:** 10-14 focused hours
**IP status:** clean (100% derived from Alex's SnowPipe code, no employer overlap)

---

## Why This Product Works

The tool solves a specific, searchable pain: large Shopify bulk operation exports choking on timeout, memory issues, or nested JSONL parsing. There is no free open-source Python tool that does this properly. Shopify's own documentation barely addresses the presentment price timeout issue. People hitting this problem will search for solutions and have to pay consultants or reverse-engineer fixes. A packaged $39 tool at the top of Google search for "shopify bulk operation timeout" is defensible pricing.

The seed code at SnowPipe already has:
- Line-by-line streaming JSONL parser with node type detection
- Parent/child record assembler (memory-efficient, buffers one product at a time)
- Row flattener with dynamic option columns + inventory-by-location aggregation
- Presentment price timeout knowledge encoded in the bulk operation manager

Porting this to a standalone Python CLI captures the learned expertise in a form other merchants can buy.

---

## Seed Code Inventory

**Primary seed: `SnowPipe/src/server/plugins/sources/shopify/bulk/parsers/`**

| TS file | Lines | What it does | Python port target |
|---|---|---|---|
| `jsonl-parser.ts` | 185 | Streaming line-by-line parser, detects node types (Product, ProductVariant, InventoryLevel, Image, Collection, Metafield), normalizes GraphQL responses | `shopify_jsonl/parser.py` |
| `streaming-expander.ts` | 110 | Memory-efficient parent/child assembly: buffers one product, flattens variants + inventory into output rows when product completes | `shopify_jsonl/expander.py` |
| `row-expander.ts` | 250 | Batch flattener: dynamic option columns (Size/Color/Material), inventory aggregation by location, weight extraction from `inventoryItem.measurement` | `shopify_jsonl/flattener.py` |

**Secondary seed: `SnowPipe/src/server/plugins/sources/shopify/bulk/bulk-operation-manager.ts`**
- ~80 lines of concurrency + timeout-aware polling
- Used only for the `fetch` subcommand that triggers a bulk operation from Shopify's API
- Port if we ship the `fetch` subcommand; skip if MVP is JSONL-file-only

**Tertiary seed: `SnowPipe/src/server/core/field-spec/specs/shopify-products.ts`**
- Field definitions + examples for validator feature
- Used only for the `validate` subcommand

**CLI framework: `data-diff-checker/src/data_diff_checker/`**
- `cli.py` structure (argparse-based), `progress.py` terminal UI with Windows ANSI fallback
- Reuse patterns directly, not code

---

## Product Scope: MVP vs Full

### MVP (8-10 hours, ship first)

Three subcommands:

```
shopify-bulk process   # parse a local JSONL file, output CSV or JSON
shopify-bulk fetch     # trigger + download a bulk op from Shopify Admin API
shopify-bulk --help
```

Plus:
- 3 preset configs: products, inventory, orders
- Streaming parser (never loads full file to memory)
- Parent/child assembly
- Row flattener with dynamic option columns
- Output: CSV, JSON, JSONL

**MVP skips:**
- `validate` subcommand (feed spec validator, defer to v1.1)
- `config` subcommand for managing saved configs (defer)
- Per-locale presentment price handling (ship with default flat-price behavior, add locale support in v1.1)

### Full v1.0 (3-4 hours additional)

- Add `validate` subcommand (check output against Google Merchant / Meta spec)
- Add `config` subcommand for user-saved configs
- Add `--max-presentments N` option on `fetch` for timeout-safe bulk ops

If MVP validates in market (first 3-5 sales), ship v1.0. Otherwise, stop and reassess.

---

## Python Module Structure

```
shopify-jsonl-processor/
├── README.md                      # Gumroad listing copy + quick start
├── pyproject.toml                 # Metadata, deps (click, pyyaml)
├── LICENSE                        # MIT
├── shopify_jsonl/
│   ├── __init__.py
│   ├── __main__.py                # python -m shopify_jsonl entry
│   ├── cli.py                     # click CLI wiring
│   ├── parser.py                  # ← port from jsonl-parser.ts (streaming)
│   ├── expander.py                # ← port from streaming-expander.ts
│   ├── flattener.py               # ← port from row-expander.ts
│   ├── exporter.py                # CSV / JSON / JSONL writers
│   ├── fetcher.py                 # optional, port from bulk-operation-manager.ts
│   ├── progress.py                # ← adapt from data-diff-checker
│   ├── types.py                   # dataclasses for bulk node types
│   └── configs/
│       ├── products.yaml
│       ├── inventory.yaml
│       └── orders.yaml
├── tests/
│   ├── test_parser.py
│   ├── test_expander.py
│   ├── test_flattener.py
│   └── fixtures/
│       ├── sample_products.jsonl      # small, 10 products
│       └── sample_variants.jsonl      # multi-variant edge cases
└── docs/
    ├── quickstart.md
    ├── troubleshooting.md
    └── field-reference.md
```

No external dependencies beyond `click` (CLI) and `pyyaml` (preset configs). No Shopify SDK in the MVP (fetcher uses raw requests against the Admin GraphQL API). Tests use `pytest`.

---

## CLI Design (MVP)

```
$ shopify-bulk --help

shopify-bulk: Process Shopify bulk operation JSONL exports without choking on large catalogs.

Usage:
  shopify-bulk process INPUT [options]
  shopify-bulk fetch --shop DOMAIN --token TOKEN [options]
  shopify-bulk --help

Subcommands:
  process   Parse a local JSONL export into CSV/JSON/JSONL
  fetch     Trigger + download a bulk operation from Shopify

Common options:
  --config NAME             Named preset (products, inventory, orders). Default: products
  --output FILE             Output path. Default: stdout
  --format FORMAT           csv | json | jsonl. Default: csv
  --fields FIELDS           Comma-separated fields to include (overrides preset)
  --help                    Show help for a subcommand

Process-specific:
  shopify-bulk process input.jsonl --config products --output out.csv

Fetch-specific:
  shopify-bulk fetch \
    --shop mystore.myshopify.com \
    --token shpat_xxxxx \
    --query products \
    --max-presentments 3 \
    --output out.jsonl
```

Default behavior: if user passes a JSONL file path as the only argument, infer `process`. Makes the simplest case a one-liner.

---

## Preset Config Format (YAML)

```yaml
# configs/products.yaml
name: products
description: Default flat product catalog export for feeds
root_node: Product
children:
  variants:
    type: ProductVariant
    merge: one_to_many
    fields:
      - variant_id
      - variant_sku
      - variant_price
      - variant_compare_at_price
      - variant_barcode
      - weight
      - weight_unit
  inventory:
    type: InventoryLevel
    merge: aggregate_by_location
    aggregate:
      - available
  images:
    type: Image
    merge: one_per_variant_fallback_product
    fields:
      - image_url
fields:
  - id
  - title
  - body_html
  - vendor
  - product_type
  - handle
  - status
  - tags
  - created_at
  - updated_at
dynamic_option_columns: true      # emit Option1 Name/Value, Option2, Option3 as columns
option_name_aliases:
  - color: [Color, Colour]
  - size: [Size, Sizes]
  - material: [Material, Fabric]
```

The preset tells the expander how to merge children into parent rows. Three merge strategies (`one_to_many`, `aggregate_by_location`, `one_per_variant_fallback_product`) cover the common cases. Power users can write their own YAML.

---

## Phased Implementation Order

### Phase 1: Core parser (3 hours)

1. Port `jsonl-parser.ts` → `parser.py`
   - Line-by-line file reader
   - Node type detection from `id` prefix (`gid://shopify/Product/...`)
   - Yield typed nodes as a generator
2. Port `bulk-types.ts` → `types.py` as Python dataclasses
3. Write `tests/test_parser.py` with a small fixture (20 lines of JSONL, 2 products + variants)

Checkpoint: `python -m shopify_jsonl.parser input.jsonl` streams nodes to stdout.

### Phase 2: Parent/child assembly (3 hours)

1. Port `streaming-expander.ts` → `expander.py`
   - Buffer one product at a time
   - Flush rows when product completes (next parent arrives or EOF)
   - Handle orphaned children (no parent) with a warning
2. Write `tests/test_expander.py` with a fixture containing 1 product + 3 variants + 4 images

Checkpoint: parser + expander together produce flat product rows.

### Phase 3: Flattener with dynamic columns (2-3 hours)

1. Port `row-expander.ts` → `flattener.py`
   - Read preset YAML
   - Apply merge strategies
   - Emit dynamic option columns based on product's productOptions
   - Aggregate inventory by location
2. Extend tests with multi-option products (Size + Color + Material)

Checkpoint: preset-driven flattening works for the products preset.

### Phase 4: CLI + exporters (1-2 hours)

1. Build `cli.py` with click (3 subcommands, shared options)
2. Build `exporter.py` (CSV / JSON / JSONL writers)
3. Integrate `progress.py` adapted from data-diff-checker
4. Wire `__main__.py`

Checkpoint: `shopify-bulk process input.jsonl --output out.csv` works end-to-end.

### Phase 5: Presets + fixtures (1-2 hours)

1. Write `configs/products.yaml`, `inventory.yaml`, `orders.yaml`
2. Add realistic fixtures: a 100-product JSONL with variants, inventory levels, images
3. Smoke-test each preset

Checkpoint: all three presets produce valid output against fixtures.

### Phase 6: Fetcher (optional for MVP, 2-3 hours)

1. Port `bulk-operation-manager.ts` → `fetcher.py`
   - GraphQL mutation to trigger bulk op
   - Polling with exponential backoff
   - Download result URL to local file
2. Add `--max-presentments N` option (modifies the GraphQL query to limit currency connections)
3. Integration test against a real store (manual, documented as a Gumroad-buyer's responsibility)

Decision point: include fetcher in MVP or ship parser-only first? **Recommendation: parser-only MVP. Ship fast. Add fetcher in v1.1 after first 3 sales.**

### Phase 7: Packaging + Gumroad (2 hours)

1. Write `README.md` (Gumroad listing copy)
2. Write `docs/quickstart.md`, `troubleshooting.md`, `field-reference.md`
3. Write `GUMROAD-LISTING-BRIEF.md` (like the Feed Audit Tool one)
4. Build zip: source + configs + README + quickstart + LICENSE
5. Create Gumroad listing, list at $39

---

## Testing Strategy

**Unit tests per module**, using small hand-crafted JSONL fixtures:

- `test_parser.py`: node type detection, edge cases (malformed lines, UTF-8 BOM, empty lines)
- `test_expander.py`: orphaned children, out-of-order children, streaming memory bound
- `test_flattener.py`: dynamic option columns, inventory aggregation, missing fields

**Integration tests** using realistic fixtures:

- `sample_products.jsonl`: 10 products with variants, mimics small Shopify store
- `sample_large.jsonl`: generated, 1000 products, tests memory stays bounded

**Manual smoke tests** Alex runs before shipping:

- Run `process` against a real NextVend JSONL export (already in `SnowPipe/tests/.generated/shopify-snapshot.jsonl`, 15,470 lines)
- Run `process` with all three presets
- Verify output is usable in Google Merchant Center (upload + check for errors)

Tests run via `pytest`. Aim for ~70% coverage on the core modules. No need to chase 100%.

---

## Gumroad Listing Checklist (when shipping)

- [ ] Product name: "Shopify JSONL Bulk Processor"
- [ ] Subtitle: "Process Shopify bulk operation exports without choking on large catalogs"
- [ ] Price: $39
- [ ] Cover image: screenshot of `shopify-bulk process` running against a large file with progress bar (1280x720)
- [ ] Additional images: CLI help output, sample CSV output, YAML preset config, terminal showing memory stays flat while processing 1M-row JSONL
- [ ] Description: paste from planning doc subtitle + features
- [ ] Tags: `shopify`, `graphql`, `bulk-operations`, `python`, `cli`, `csv`, `jsonl`, `feed-management`, `product-feed`
- [ ] File: `shopify-jsonl-processor-v1.zip` containing src + configs + README + LICENSE
- [ ] Refund policy: 30 days, Gumroad default
- [ ] Category: Software / Developer Tools

---

## Supporting Content

After shipping, write the blog post at snowforge.dev (already listed in the Gumroad planning doc):

**"Why your Shopify bulk operation keeps timing out on large catalogs"**

Structure:
1. The problem: bulk ops time out at ~10 min for large catalogs
2. Root cause: presentment price connections multiply exponentially
3. The fix (free): limit presentment prices in your GraphQL query (show the exact modification)
4. CTA: "I packaged this into a CLI tool" → link to Gumroad

This targets an exact Google search ("shopify bulk operation timeout"). People hitting this problem find the post, get the free GraphQL fix, and a percentage buy the tool for the full solution (streaming parser, flattener, presets).

---

## Risks + Mitigations

| Risk | Mitigation |
|---|---|
| Porting TS to Python introduces bugs | Keep tests close to the TS test fixtures in SnowPipe. Run both and diff results on the same input |
| MVP misses a feature buyers expect | Ship as v0.9, collect feedback from first 3 buyers, iterate to v1.0 with validator + fetcher |
| Shopify changes their bulk op API | Pin the API version in the fetcher. Write a 1-line docs note "tested against 2026-04" |
| Someone free-distributes the tool (the MIT license suggestion in the product README) | Use a proprietary license (all rights reserved) for the Gumroad distribution. Port logic stays free via SnowPipe if SnowPipe is ever open-sourced |

---

## Confirmed Decisions (2026-04-16)

1. **Python version: 3.14** (latest stable)
2. **License: proprietary** (all rights reserved) on the Gumroad distribution. SnowPipe's own code stays under whatever license SnowPipe uses separately
3. **Scope: parser-only MVP.** Fetcher (`fetch` subcommand) deferred to v1.1 after first 3 sales validate demand
4. **Order: product first.** Blog post after shipping so it can link to the live Gumroad listing

Phase 1 begins immediately after this file is written.
