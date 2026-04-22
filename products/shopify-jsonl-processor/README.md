# Shopify JSONL Bulk Processor

## Process Shopify bulk operation exports without choking on large catalogs.

If you have hit the Shopify bulk operations timeout, or struggled to parse the nested JSONL that Shopify's Bulk Operations API returns, this tool handles it.

Shopify's Bulk Operations API exports data as JSONL (JSON Lines). It sounds simple until you are dealing with:

- 50,000+ products with variants, each nesting inventory levels and images
- Parent-child relationships encoded via `__parentId` fields
- Two different inventory formats (legacy `available` vs new `quantities` array from API 2024-04+)
- Memory issues processing large export files

This CLI tool handles all of it in constant memory.

## How It Works

```
# Fetch your entire catalog from Shopify (triggers bulk op, polls, downloads)
shopify-bulk fetch --shop mystore.myshopify.com --token shpat_xxxxx -o export.jsonl

# Convert to clean CSV
shopify-bulk process export.jsonl -c products -o catalog.csv
```

Two commands. From "I have a Shopify store" to "I have a clean CSV of my entire catalog." No code to write, no API to figure out.

Or if you already have a JSONL file from another source:

```
shopify-bulk process export.jsonl
shopify-bulk process export.jsonl -f json -o products.json
shopify-bulk process export.jsonl -c inventory -o stock.csv
```

## What It Does

- **Streams the JSONL file line by line.** Never loads the entire file into memory. Processes 50K+ product catalogs in seconds with constant memory usage.
- **Assembles parent-child relationships automatically.** Products, variants, inventory levels, and images are buffered one product at a time and flattened into output rows.
- **Expands variants into individual rows.** Each row is one buyable SKU with all product-level fields carried through.
- **Extracts dynamic option columns.** Size, Color, Material (or whatever options a store uses) become their own columns automatically.
- **Aggregates inventory by location.** Each warehouse/location gets its own column plus a total.
- **Handles both inventory API formats.** Legacy `available` field and new `quantities` array (Shopify API 2024-04+) are normalized transparently.
- **Falls back gracefully on missing data.** Missing variant images fall back to the product's featured image. Missing fields become null, not errors.

## Preset Configs

Three built-in presets select the right fields and options for common use cases:

```
shopify-bulk process export.jsonl -c products     # Full catalog for feeds
shopify-bulk process export.jsonl -c inventory     # Stock levels by location
shopify-bulk configs                               # List all presets
```

The `products` preset gives you everything needed for Google Shopping, Meta Catalog, or general feed management. The `inventory` preset gives you a lean stock-focused view for reconciliation.

You can also write your own YAML config and pass it as a file path:

```
shopify-bulk process export.jsonl -c my-custom.yaml
```

## All Options

### fetch (trigger + download from Shopify)

```
shopify-bulk fetch [OPTIONS]

Options:
  --shop TEXT             Shopify store domain (required)
  --token TEXT            Admin API access token, shpat_... (required)
  -o, --output PATH      Output JSONL path (default: export.jsonl)
  --no-inventory         Skip inventory levels (faster for large catalogs)
  --api-version TEXT     Shopify API version (default: 2026-01)
  --max-wait FLOAT       Max seconds to wait (default: 1200)
  --poll-interval FLOAT  Seconds between status polls (default: 5)
  -v, --verbose          Debug logging
```

### process (parse JSONL to CSV/JSON)

```
shopify-bulk process INPUT_FILE [OPTIONS]

Options:
  -o, --output PATH              Output file path (default: stdout)
  -f, --format [csv|json|jsonl]  Output format (default: csv)
  -c, --config NAME              Preset config or path to .yaml
  --no-variants                  One row per product instead of per variant
  --no-inventory                 Skip per-location inventory breakdown
  --fields TEXT                  Comma-separated fields (overrides config)
  -v, --verbose                  Debug logging
```

## Output Fields

When using the `products` config (or no config with defaults), each row includes:

**Product-level:** id, title, body_html, vendor, product_type, handle, status, tags, image_url, product_url, product_category, seo_title, seo_description, published_at, total_inventory, additional_image_links, created_at, updated_at

**Variant-level:** variant_id, variant_title, variant_sku, variant_barcode, variant_price, compare_at_price, variant_image_url, weight, weight_unit, variant_position, variant_taxable, variant_available_for_sale, variant_inventory_policy

**Dynamic options:** size, color, material, or whatever option names the store uses

**Inventory:** inventory_total, variant_inventory_quantity, plus inventory_location_{name} columns for each warehouse

## Requirements

- Python 3.14+
- click (installed automatically)
- pyyaml (installed automatically)

## Installation

```bash
# Option 1: Install from the zip
pip install .

# Then run:
shopify-bulk process export.jsonl

# Option 2: Run directly without installing
python -m shopify_jsonl process export.jsonl
```

## Where to Get the Access Token

The `fetch` command needs a Shopify Admin API access token (`shpat_...`). You can get one by:

1. **Custom app (recommended):** In your Shopify admin, go to Settings > Apps and sales channels > Develop apps. Create a custom app, grant it `read_products` and `read_inventory` scopes, and copy the Admin API access token.
2. **Existing app:** If you already have an app with the right scopes, use its token.

The token is only used for the `fetch` command. The `process` command works entirely offline on local files.

## What's in the Download

- `shopify_jsonl/` Python package (parser, expander, exporter, CLI, 3 preset configs)
- `tests/` test suite with sample JSONL fixture
- `pyproject.toml` for pip installation
- `README.md` this file
- `LICENSE` proprietary license

## About

Built by Alex Diaz. For questions or feedback: alex@snowforge.dev
