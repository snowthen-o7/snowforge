# Feed Audit Tool, Test Findings (2026-04-10)

Analysis by Claude via direct read of the shared Google Sheet.

**Sheet:** https://docs.google.com/spreadsheets/d/1ejSf_u7GglR7snXjg1YeoE9FzRZaGfk6yYPAC19XMNY/edit

## Audit Runs Captured

| # | Source Tab | Audit Mode | Products | Health Score | Raw CSV |
|---|---|---|---|---|---|
| 1 | `edge-cases-bad-feed` | Full Scan | 11 | 0 / 100 | `results/audit-edge-cases-full-scan.csv` |
| 2 | `NextVend_Google_Shopping_destination-Google_Shopping_2026-04-10T20-49-38` | Google Merchant | 51,192 | 27 / 100 | `results/audit-transformed-gmc-google-merchant.csv` |
| 3 | `raw_shopify_data_MVP` | Shopify | 51,192 | 40 / 100 | `results/audit-raw-shopify-shopify-mode.csv` |

**Key insight from comparing runs 2 and 3:** Some bugs originally suspected as transformation issues are actually source sync issues. The raw Shopify feed is already missing image_link for 99.95% of rows and has 0% product URLs, so the transform cannot fix what the source never captured. This splits the SnowPipe work into two distinct layers.

---

## Category A: SnowPipe Transformation Bugs (CRITICAL)

The transformed GMC feed audit exposed severe gaps in the Shopify → Google Merchant transform. Every item below is a SnowPipe bug, not an audit tool problem. A customer pushing this feed to GMC would get the entire catalog disapproved.

### A1. CRITICAL: No `price` column in output
The transformed feed has `sale_price` but no `price` column at all. Result: `Price column not found in feed` skip, and 100% of products would be disapproved by GMC (price is a required attribute, sale_price is optional).
**Fix location:** SnowPipe Shopify → Google Merchant smart mapping template. The template must map Shopify variant price to the GMC `price` field.

### A2. CRITICAL: No `link` (product URL) column
The transformed feed has no `link` column. Result: `Product URL / link column not found`. GMC requires `link` for every product. 100% of feed would be rejected.
**Fix location:** Same mapping template, add `link` mapping to `https://{shop}/products/{handle}`.

### A3. CRITICAL: image_link empty for 99.95% of products
51,167 of 51,192 products have empty image_link (only 25 products have images). The snapshot I pulled shows one `snowboard` product has a valid Shopify CDN URL, but the vast majority are empty.
**Fix location:** Shopify source sync probably isn't populating `image_url` on variant rows, only on parent product rows, and the transform is pulling from the variant row. Either fix the source sync to propagate images to variants, or fix the transform to fall back to the parent product image.

### A4. CRITICAL: 100% of products marked `out_of_stock`
51,172 of 51,192 products (99.96%) report `out_of_stock`. Unless the test store really has everything out of stock, this is a transform bug: the availability mapping is defaulting to `out_of_stock` instead of checking `inventory_quantity > 0`.
**Fix location:** Transform function that maps Shopify inventory to GMC availability.

### A5. HIGH: google_product_category missing for 99.99%
51,188 of 51,192 products have no GPC. Only gift cards have a value (and it's shallow, just "Gift Cards"). SnowPipe has AI-powered categorization per the PROGRESS.md, but it clearly wasn't applied to this pipeline run.
**Fix location:** Verify AI categorization is enabled and running. Possibly the pipeline skipped the categorization step, or the column is being stripped during export.

### A6. HIGH: 414 products missing title, 17 missing description
About 0.8% of products have empty titles and a smaller set have empty descriptions. The snapshot row 2 (snowboard) confirmed this: title is literally empty while the product is clearly valid (it has brand, image, product_type). This is a transform bug, not a source data bug.
**Fix location:** Smart mapping template for Shopify → GMC title field. Possibly the template is reading `variant_title` for variant rows and getting blanks for products with only one variant (the default variant has `title = "Default Title"` which may be getting filtered out).

### A7. HIGH: Variants use item_group_id but have no variant attributes
100% (51,192) of products have `item_group_id` populated with `gid://shopify/Product/...` but no `color`, `size`, `material`, `pattern`, `gender`, or `age_group` columns exist in the output. Google requires at least one variant attribute when using item_group_id.
**Fix location:** Transform must map Shopify option values (Option1/Option2/Option3) to GMC variant attributes. Also: the item_group_id currently uses the raw Shopify GID. GMC requires a short alphanumeric string. Consider stripping to just the numeric ID.

### A8. MEDIUM: shipping_weight empty for 100%
Column exists but is empty for all rows. Shopify provides `weight` and `weight_unit` on variants.
**Fix location:** Add shipping_weight mapping (with unit, e.g. "500 g").

### A9. MEDIUM: Missing `mpn` column
With 100% missing GTIN, GMC requires MPN + brand as an alternative identifier. Without either, every product hits the "missing both GTIN and MPN" FAIL.
**Fix location:** Add mpn mapping (fall back to variant SKU if MPN not set).

### A10. MEDIUM: identifier_exists hardcoded to "no" with brand populated
All 51,192 products have `identifier_exists = no` while `brand = SnowForge` (or similar) is populated. This is inconsistent: per Google docs, `identifier_exists = no` means "this product has no unique identifier," but brand alone does not constitute a unique identifier, so the value is technically correct. However, if SnowPipe is hardcoding it to "no", that's a bug. It should compute dynamically: `yes` if (GTIN present) OR (brand AND MPN present), `no` otherwise.
**Fix location:** Conditional transform on identifier_exists.

### A11. MEDIUM: 95.2% of products share duplicate titles
48,741 of 51,192 products share duplicate titles, e.g. `"lightweight quarter-zip - xl / navy"` appearing 4 times. This means variant rows are being duplicated (likely multi-location inventory or a JOIN producing duplicates). Either the source sync is over-expanding variants, or the export is not deduping.
**Fix location:** Check the bulk operation expander in SnowPipe's Shopify plugin. Possibly a cartesian join with inventory locations.

---

## Status of Blocker Fixes (2026-04-10)

**B1 FIXED:** Unicode regex rewritten to use surrogate pair alternation. The old regex had `\u1F600-\u1F64F` which, without the `/u` flag, JS parsed as `\u1F60 + "0"` creating a range from ASCII `0` to U+1F64. That range matched all basic Latin letters and digits, flagging 99-100% of real titles. Fix: replaced with `[BMP chars]|[\uD83C-\uD83E][\uDC00-\uDFFF]` which correctly matches emoji via surrogate pairs. Description regex updated to match.

**B2 FIXED:** `identifier_exists matches identifiers` cross-check no longer treats brand alone as an identifier. Per Google Merchant spec, unique identifiers are GTIN and MPN; brand is used for categorization, not product identification. The check now only fires when GTIN or MPN is present but `identifier_exists = no/false`.

**C1 FIXED:** `edge-cases-bad-feed.csv` now quotes fields containing embedded commas (cost_of_goods_sold values, product_type with comma) so CSV parsing no longer shifts columns. PROD-004's COGS value corrected to `"5,50 USD"` instead of `5` + `50` (two fields).

**Next step:** Re-paste Code.gs into Google Apps Script, re-run audits 1 and 3, verify B1 goes from 99.2%/100% false positive to near-zero, and B2 warning clears on transformed GMC audit.

---

## Category B: Feed Audit Tool Bugs (FIX BEFORE GUMROAD LISTING)

These are real bugs in Code.gs that a paying customer would hit.

### B1. HIGH: "No special unicode characters" check has broken example display and likely false positives
The edge-cases audit flagged 9 titles as containing "special unicode symbols" with examples like:
- `PROD-001: Contains: B` (title starts with "B")
- `PROD-003: Contains: T` (title "Test Refurbished Widget..." starts with "T")
- `PROD-005: Contains: A` (title "AAAAAAAA..." starts with "A")

The example display is showing the first character of the title, not the detected special character. Worse, PROD-003 and PROD-005 have clean ASCII titles, so the detection is flagging them as having unicode when they don't.

In the transformed GMC audit, this check hit 99.2% (50,778 of 51,192) with similar "Contains: G", "Contains: T" examples. This false positive rate is unacceptable for a customer-facing tool.

**Fix location:** `checkTitleQuality` in Code.gs, the regex or character-class logic used for "special unicode" detection. Also fix the example rendering to show the actual detected character.

### B2. HIGH: "identifier_exists matches identifiers" check treats brand alone as an identifier
The transformed GMC audit flagged 51,192 products (100%) with: `identifier_exists=no but has GTIN, brand, or MPN populated. If identifiers exist, set to "yes"`.

But the example text shows only `identifier_exists=no but has brand`. Per Google's spec, brand alone does NOT constitute an identifier. The check should only trigger when GTIN or MPN is present, not brand alone.

**Fix location:** `checkGoogleMerchant` in Code.gs, remove the `hasBrand` check from the cross-check condition. Brand alone is fine with `identifier_exists=no`.

### B3. MEDIUM: Shallow GPC check is noise for gift cards
The transformed GMC audit flagged 4 "shallow GPC" warnings, all for gift cards with "Gift Cards" as category. Gift cards are a legit shallow category in Google's taxonomy.

**Fix location:** Consider exempting known-shallow Google categories (Gift Cards = GPC 53, Arts & Entertainment, etc.) from the >= 3 tier check. Low priority, minor polish.

### B4. MEDIUM: Title length check is too strict for short-by-design products
Gift cards with titles like "Gift Card - $10" (15 chars) get flagged as outside the 25-150 range. These are legitimately short.

**Fix location:** Either lower the minimum to 10 chars, or exempt products with GPC = Gift Cards. Low priority.

### B5. LOW: "UTM tracking parameters" check reports "10 affected" out of 11 total
The audit says 10 products affected at 90.9%. That's correct math, but the "affected count" for this check is the number of links WITHOUT UTM, which is slightly confusing labeling. Consider rewording the details text to say "X of Y links missing UTM".

**Fix location:** `checkMeta` in Code.gs.

### B6. LOW: Column width display issue (possible, needs verification in UI)
Not visible from CSV export. Worth checking visually that the Details column wraps correctly and Example columns show hyperlinks properly after the fix for B1.

---

## Category C: Test Data Bugs (MY FAULT, NOT THE AUDIT TOOL)

The `edge-cases-bad-feed.csv` I generated has CSV parsing bugs that produced misleading audit results. The audit tool correctly mapped columns by header name, but some rows have unquoted commas that shifted field positions.

### C1. Unquoted commas in PROD-001, PROD-003, PROD-007 rows
- PROD-001: `10,01 USD` in cost_of_goods_sold (should be `"10,01 USD"`)
- PROD-003: `Home, Garden > Tools` in product_type (should be `"Home, Garden > Tools"`)
- PROD-007: `8,99 USD` in cost_of_goods_sold (should be `"8,99 USD"`)

**Impact:** These shifts produced false results, including the "Material casing" warning showing promotion_id values as material, and the "Expiration date" FAIL with COGS fragments. These are NOT audit tool bugs.

**Fix:** I'll rewrite the edge cases CSV with proper quoting before you re-run audit #5.

### C2. Row 2 is empty
I intentionally left row 2 empty to trigger required-field checks, and it worked. All required-field FAILs correctly reference "Row 2: (empty)". This is working as designed.

---

## Category D: Confirmed Working (positive signal)

The transformed GMC audit passed 47 of 64 checks that actually ran. The audit tool correctly identified the real problems in SnowPipe's output. This validates the tool works on real data:

- GTIN format and check-digit validation passed on gift cards (no GTINs, correctly skipped)
- GPC format check correctly passed (the 4 populated values were valid)
- HTTPS check on image URLs correctly passed for the 25 products that had images
- Availability values correctly recognized as valid Google values
- Title casing, HTML, URL presence checks all worked

---

## Prioritized Action List

### Phase 1: Fix audit tool bugs (before listing on Gumroad)
1. **B1** Unicode false positives (blocks Gumroad listing, 99% false positive rate on real data)
2. **B2** identifier_exists cross-check (blocks Gumroad listing, 100% false positive rate)
3. **B3, B4** Gift card handling (polish, minor)
4. **B5, B6** Cosmetic

After each fix: re-paste Code.gs, re-run audits 1 and 2, verify regressions fixed.

### Phase 2: Fix the edge-cases test data (so re-runs are reliable)
1. **C1** Quote fields with commas in `edge-cases-bad-feed.csv`
2. Re-run audit 1 to confirm clean triage

### Phase 3: Run the 2 missing audits (fill in the test matrix)
1. Run `raw_shopify_data_MVP` with Shopify audit mode
2. Run `raw_bigcommerce_data_MVP` with Generic/Full Scan mode
3. Also run `raw_shopify_data_MVP` with Google Merchant mode (should produce lots of SKIPs for missing GMC-specific fields, validates tool correctly handles pre-transform data)

### Phase 4: SnowPipe bug fixes (separate workstream, not a Gumroad blocker)
These are real bugs but fixing them is SnowPipe's problem, not the Feed Audit Tool's. File them separately in SnowPipe's PROGRESS.md.

Priority order inside SnowPipe:
1. A1, A2 (price and link missing - these make the feed 100% unusable)
2. A3 (image_link 99.95% empty)
3. A4 (availability hardcoded OOS)
4. A5 (google_product_category missing)
5. A6 (414 empty titles)
6. A11 (95.2% duplicate titles suggests variant expansion bug)
7. A7 (variant attributes missing)
8. A8, A9, A10 (shipping_weight, mpn, identifier_exists)

### Phase 5: Gumroad listing
Only proceed after Phase 1 is complete. Phases 2-4 are not blockers for listing.

---

## Data Captured

All audit result CSVs have been saved to `test-data/results/` for reference during fix iteration:
- `audit-edge-cases-full-scan.csv`
- `audit-transformed-gmc-google-merchant.csv`
- `transformed-gmc-headers-preview.csv` (shows the 16 columns SnowPipe emits)
