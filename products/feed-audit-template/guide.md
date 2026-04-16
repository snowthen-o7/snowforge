# E-Commerce Product Feed Audit Guide

**By Alex Diaz**

---

## Table of Contents

1. How to Use This Tool
2. The 5 Feed Issues That Cost the Most Money
3. Platform-Specific Gotchas
4. How to Prioritize Fixes
5. Ongoing Monitoring Checklist

---

## 1. How to Use This Tool

This tool is a Google Sheets add-on that audits your product feed automatically. Paste your feed into a sheet, click one menu item, and get a color-coded report across 130+ checks in about 30 seconds. Works for feeds destined for Google Merchant Center, Meta Commerce Catalog, Shopify, or any combination.

### Getting Started

**Step 1. Create a new Google Sheet.**

A blank spreadsheet. You will paste your feed data into it.

**Step 2. Paste your product feed data.**

Row 1 should contain your column headers (for example `id`, `title`, `description`, `price`). Row 2 and beyond should contain one product per row. Column names don't have to be exact. The tool recognizes common variants like `product_title`, `Variant Price`, `Image Src`, or `Google Product Category` and maps them automatically using a library of 100+ aliases.

If you are exporting from Shopify, BigCommerce, or WooCommerce, the raw CSV export format works as-is. For Google Merchant or Facebook Commerce feeds, the standard TSV or XML column names work too.

**Step 3. Install the audit script.**

From the Google Sheets menu bar, go to `Extensions` → `Apps Script`. A new tab opens with a script editor. Delete any starter code shown, paste in the `Code.gs` file included with this product, then click the save icon. Close the script editor tab.

**Step 4. Reload your sheet.**

Refresh the Google Sheet in your browser. A `Feed Audit` menu item appears in the top menu bar next to `Help`.

**Step 5. Run the audit.**

From the `Feed Audit` menu, pick one:

- **Run Full Scan** grades across all platforms (Google, Meta, Shopify) and produces a comprehensive report.
- **Run Audit (Google Merchant)** focuses on Google Merchant Center requirements only.
- **Run Audit (Meta Catalog)** focuses on Facebook and Instagram Commerce requirements.
- **Run Audit (Shopify)** focuses on Shopify native export validation.

The first run will prompt you to authorize the script. Google shows a warning that the script is "unverified" because it is your own custom script, not a published add-on. Click `Advanced`, then `Go to Feed Audit Tool (unsafe)`, then `Allow`. Your data stays in your own Google Sheet. Nothing is sent externally.

The audit takes about 5 seconds per 1,000 products. A 50,000 product feed completes in roughly 30 seconds.

**Step 6. Review the results.**

A new tab appears named `Audit — [Platform] — [Your Sheet Name]` containing:

- **Health Score** at the bottom (0 to 100). 80+ is production-ready. Below 50 needs attention before pushing to any platform.
- **Per-check table** with color-coded status (green PASS, yellow WARNING, red FAIL, gray SKIP), category grouping (Required Fields, Title Quality, Pricing, Google Merchant, etc.), and severity (Critical, High, Medium, Low).
- **Example columns** showing up to 5 specific products that failed each check. Each example is a clickable hyperlink that jumps directly to the problem cell in your source data, so you can inspect and fix the issue in context.
- **Summary** at the bottom showing counts of passed, failed, warning, and skipped checks, plus pass rate.

### Understanding the Severity Levels

- **Critical**: blocks products from showing at all. Missing title, missing price, missing image, disallowed availability values. Fix these first.
- **High**: significant quality or policy impact. Invalid GTIN check digits, missing `google_product_category`, condition mismatch with title, exceeded character limits.
- **Medium**: optimization opportunities. Shallow categories, title length out of range, missing `item_group_id` for variants.
- **Low**: minor polish. UTM parameters missing, additional images missing, custom labels unused.

### Running Multiple Audits

You can run the audit on different data tabs if you have multiple feeds. When the sheet has more than one tab with data, the tool prompts you to pick which one to audit. Results are written to a new tab each time, so you can keep results from prior runs side by side for comparison.

To clear stale audit tabs, use `Feed Audit → Clear All Results`.

### Suggested Workflow

**First audit:** run Full Scan, read through all FAIL rows first, then WARNING rows. The example hyperlinks make review fast. Expect the first audit to surface 20 to 50 distinct issues for most catalogs.

**Subsequent audits:** after fixing issues, re-run the audit and watch the Health Score climb. The goal is not a perfect 100, it is consistent improvement across each sync. Most production-ready feeds land between 80 and 95 depending on catalog size and product mix.

**Before major campaigns:** run the audit before any significant promotion, feed schema change, or new product launch. Catching issues before they reach Google or Meta saves disapproval cycles and avoids account-level warnings.

---

## 2. The 5 Feed Issues That Cost the Most Money

After auditing hundreds of product feeds, these are the five issues I see most often, and they are the ones with the biggest direct revenue impact.

### Issue #1: Missing or Invalid GTINs

**What it is:** GTIN (Global Trade Item Number) includes UPC, EAN, and ISBN codes. Google uses these to match your products to its catalog and show them in Shopping results.

**Why it costs money:** Products without valid GTINs receive dramatically lower impression share in Google Shopping. Google has stated that GTIN is one of the strongest signals for product matching. Merchants who add valid GTINs to previously-unidentified catalogs typically see Shopping impression share increases of 20 to 40 percent within a couple of weeks.

**Pattern in the wild:** Shopify does not have native fields for GTIN, UPC, or EAN. It only has a `Barcode` field on variants, which merchants often leave blank. Running this tool against a 51,000-product Shopify catalog flagged GTIN absent on 100 percent of products, a finding confirmed by the Shopify source data itself. Most Shopify stores have this gap without realizing it. BigCommerce and WooCommerce have similar patterns: a GTIN field exists but is unpopulated for the majority of products unless explicitly migrated from supplier data.

**How to fix it:**
- Export your products and identify which ones are missing GTINs
- For products you purchase from manufacturers, request GTIN data from your suppliers or look up UPCs in databases like Barcodelookup.com
- For private label or handmade products, set `identifier_exists` to `no` and provide Brand + MPN instead
- Validate GTIN check digits before uploading. A single wrong digit makes the whole code invalid.

### Issue #2: Stale Prices Causing Disapprovals

**What it is:** The price in your feed does not match the price on your product landing page. Google crawls your site and compares. If they do not match, the product gets disapproved.

**Why it costs money:** This is a double hit. First, the product stops showing in ads entirely (lost revenue). Second, if enough products are disapproved for price mismatch, Google may flag your entire account for review, pulling ALL products offline for days or weeks.

**Pattern in the wild:** Flash sales are the most common trigger. A merchant discounts prices on their website at 9 AM but the feed only refreshes at midnight. For 15 hours, the feed advertises the regular price while the landing page shows the sale price. Google reads the mismatch on its next crawl and disapproves the affected products. Recovery typically takes 2 to 3 days after the prices reconcile, meaning merchants lose ad coverage for the entire sale window plus a multi-day tail. Running the audit before any promotion catches stale pricing before it reaches Google.

**How to fix it:**
- Increase feed update frequency to at least every 4-6 hours
- For sales and promotions, update your feed BEFORE changing website prices
- Enable Automatic Item Updates in Google Merchant Center as a safety net
- Use the Content API for real-time price updates on high-value products
- Monitor Merchant Center Diagnostics daily during sales events

### Issue #3: Low-Quality or Missing Images

**What it is:** Products with placeholder images ("no image available"), tiny thumbnails, images with watermarks/overlays, or broken image URLs.

**Why it costs money:** Images are the single most important element in a Shopping ad. A low-quality image tanks your click-through rate even if the product shows up. Broken image URLs cause disapprovals. Watermarked images violate Google's policies.

**Pattern in the wild:** A common failure mode is a feed tool pulling the wrong image URL. A store may have 1200x1200 product photos uploaded, but the feed tool extracts the thumbnail version (200x200) used in category grids. Running the audit against a real 51,000-product Shopify catalog flagged 99.95 percent of rows as missing image links entirely, because the feed pipeline was reading the variant-level image field rather than falling back to the parent product's image when the variant did not have its own. Image issues show up often and are almost always fixable at the feed layer.

**How to fix it:**
- Audit image URLs: check that they return HTTP 200, not 404 or 403
- Verify image dimensions meet minimums: 100x100 for non-apparel, 250x250 for apparel, but aim for 800x800 or larger
- Search your image URLs for patterns like "placeholder", "no-image", "default", or "coming-soon"
- Ensure images use HTTPS, not HTTP
- Provide additional_image_link for product gallery shots (Google supports up to 10)

### Issue #4: Availability Mismatches

**What it is:** Your feed says a product is "in_stock" but the product page says "sold out" (or vice versa).

**Why it costs money:** Availability mismatches are a top disapproval reason. They also create a terrible customer experience: a shopper clicks your Shopping ad, lands on a sold-out product, and bounces. You paid for that click. At scale, this wastes thousands in ad spend per month.

**Pattern in the wild:** The trap is in how the feed derives availability. Many merchants set availability based on a product's "status" field (active, draft, archived) rather than actual inventory quantity. The audit tool flags this directly: if most of your products show `out_of_stock` even though the store is selling normally, the transform is reading the wrong field. The correct approach is to compute availability from `inventory_quantity > 0`. Running the audit catches the pattern before it hits Google.

**How to fix it:**
- Increase inventory sync frequency (every 4 hours minimum for fast-moving inventory)
- Use supplemental feeds or Content API for real-time stock updates on top sellers
- Decide on a strategy for out-of-stock products: either exclude them from the feed entirely or submit them with availability set to "out_of_stock"
- Monitor the gap between feed update time and actual stock changes

### Issue #5: Poor or Missing Category Mapping

**What it is:** Products missing the `google_product_category` field, using only top-level categories, or having inconsistent `product_type` breadcrumbs.

**Why it costs money:** Categories affect two critical things: ad targeting relevance and tax calculation (for US merchants). Products in generic categories like "Apparel & Accessories" compete poorly against products correctly categorized as "Apparel & Accessories > Clothing > Dresses > Casual Dresses". Poor categorization also means your Shopping campaign structure cannot effectively segment bids.

**Pattern in the wild:** Running the audit tool against a real 51,000-product catalog flagged 94.5 percent of products with no `google_product_category` assigned and 100 percent with shallow `product_type` values (single-word entries like "snowboard" or "giftcard"). Google auto-categorizes products missing GPC, but the auto-assignment is less precise than a deep explicit category, which translates directly into worse impression share on specific queries. The audit tool surfaces this gap immediately so you can prioritize enrichment before it shows up as underperforming Shopping campaigns.

**How to fix it:**
- Map every product to the most specific Google product category available (3+ levels deep)
- Use Google's official taxonomy list (support.google.com/merchants/answer/6324436)
- Standardize product_type breadcrumbs across your catalog (e.g., always use "Home > Kitchen > Cookware > Pots & Pans", not sometimes "Kitchen > Pots")
- For apparel, ensure age_group, gender, size, and color are populated. These are required for apparel categories.
- Review and update category mappings whenever you add new product lines

---

## 3. Platform-Specific Gotchas

### Shopify Gotchas

**Variant explosion in feeds:**
Shopify products can have up to 100 variants (3 options with multiple values each). A single product with 5 colors and 8 sizes generates 40 line items in your feed. Common issues:
- Parent-level images showing for all variants instead of variant-specific images
- Inventory not tracked at variant level (check "Track quantity" per variant in Shopify admin)
- Titles not including variant attributes, leading to 40 identical-looking items in Shopping results

**Metafield gaps:**
Shopify does not have native fields for GTIN, MPN, age_group, gender, or google_product_category. These require metafields, and metafields are easy to leave blank. After setting up metafields, you need to populate them for EVERY existing product, not just new ones.

**Sales channel visibility:**
Products must be published to the specific sales channel your feed tool uses. A product can be "Active" in Shopify but hidden from the Google channel. Check: Admin > Products > select product > Sales channels and apps.

**Shopify's built-in Google channel limitations:**
Shopify's native Google channel integration is basic. It does not support custom labels, supplemental feeds, or advanced category mapping. Consider a dedicated feed management app if you have 500+ products.

**URL handle changes break product links:**
If you edit a product's URL handle in Shopify, the old URL redirects to the new one. But some feed tools cache the old URL. Verify that product links in your feed match current Shopify URLs after any URL changes.

### WooCommerce Gotchas

**WordPress cron unreliability:**
WooCommerce relies on WordPress cron (wp-cron) for scheduled tasks, including feed generation. But wp-cron only fires when someone visits your site. Low-traffic stores may have feeds that are hours or days stale. The fix: disable wp-cron and set up a real server-side cron job.

**Feed plugin configuration drift:**
WooCommerce feed plugins (Product Feed PRO, YITH, CTX Feed, etc.) have dozens of mapping settings. After plugin updates, settings can reset or new fields become available. Review your feed plugin configuration after every plugin update.

**Variable product vs. variation confusion:**
WooCommerce distinguishes between "variable products" (the parent) and "variations" (the children). Your feed must export variations, not variable products. A variable product has no price or stock of its own. It is just a container. If your feed exports the parent, you get products with no price and no inventory.

**Memory limits on feed generation:**
WooCommerce runs on PHP, which has memory limits. Stores with 10,000+ products may hit PHP memory limits during feed generation, causing truncated or empty feeds. Increase PHP memory_limit to at least 512MB, or use a feed plugin that supports batch/chunked generation.

**Tax-inclusive vs. tax-exclusive pricing:**
WooCommerce can display prices with or without tax. Your feed must match what Google expects for your target country. EU feeds typically include VAT; US feeds typically exclude tax. Mismatches cause price discrepancy disapprovals.

### Google Merchant Center Gotchas

**Disapproval cascades:**
When Google disapproves products for a policy violation, it often re-reviews your entire catalog. One batch of problematic products can trigger disapprovals on previously approved products. Fix violations quickly and in bulk, not one at a time.

**Microdata vs. feed conflicts:**
Google reads both your structured data (schema.org markup on your website) and your feed. If these conflict, Google may use the website data and flag a mismatch. Ensure your on-page structured data matches your feed data exactly.

**Processing time after fixes:**
After you fix a feed issue, Google does not re-approve products instantly. Allow 24-72 hours for re-review. During major fixes, do not keep making changes. Let Google process the first batch before making more edits.

**Currency and country mismatches:**
Each Merchant Center feed is tied to a target country and currency. Submitting USD prices in a feed targeting Germany (which expects EUR) will cause all products to be disapproved. Double-check your feed settings when setting up new country targets.

**Enhanced free listings vs. basic:**
Google has two tiers of free listings. Enhanced listings require more complete data (images, price, availability) and get better placement. If your data quality drops, you may be downgraded from enhanced to basic, losing visibility.

---

## 4. How to Prioritize Fixes

Not all feed issues are equal. Use this framework to prioritize what to fix first:

### Tier 1: Fix Disapprovals (They Block Revenue)

Disapproved products generate zero revenue. They are not showing in ads at all. This is the highest priority because you are paying for a product catalog that is partially invisible.

**Action steps:**
1. Export the full disapproved items list from Google Merchant Center > Diagnostics
2. Group disapprovals by reason (price mismatch, missing attribute, policy violation, etc.)
3. Fix the largest group first. One fix often resolves hundreds of products.
4. Re-upload the feed and allow 24-72 hours for re-review
5. Verify products are re-approved before moving to the next group

**Target: Zero disapprovals within 2 weeks of your first audit.**

### Tier 2: Fix Data Quality (They Cost Revenue)

These are products that are approved but underperforming due to poor data. They show up in Shopping results but with lower impression share, lower CTR, or in less relevant searches.

**Action steps:**
1. Add missing GTINs (biggest single impact on impression share)
2. Improve product titles (add brand, attributes, product type)
3. Upgrade image quality (replace thumbnails with full-size photos)
4. Fix category mapping (go deeper in taxonomy)
5. Ensure price accuracy (reduce mismatch risk)

**Target: Complete data enrichment within 4-6 weeks of your first audit.**

### Tier 3: Optimize for Growth (They Grow Revenue)

Once your feed is clean and complete, optimize for competitive advantage.

**Action steps:**
1. Add custom labels for campaign segmentation (margin tiers, seasonality, bestsellers)
2. Implement sale_price and sale_price_effective_date for promotions
3. Add rich product attributes (material, pattern, size_type, size_system)
4. Populate additional_image_link with lifestyle and alternate angle photos
5. Set up supplemental feeds for dynamic attribute management

**Target: Ongoing optimization, reviewed quarterly.**

### Priority Matrix

| Severity | Impact | Timeline | Examples |
|----------|--------|----------|----------|
| Critical | Products invisible or policy risk | Fix within 48 hours | Disapprovals, price mismatches, broken images |
| High | Significant revenue loss | Fix within 1 week | Missing GTINs, stale availability, poor categories |
| Medium | Moderate performance impact | Fix within 2-4 weeks | Image quality, description length, shipping setup |
| Low | Minor optimization opportunity | Fix within 1-2 months | Custom labels, additional images, optional attributes |

---

## 5. Ongoing Monitoring Checklist

Feed quality is not a one-time project. Use this schedule to maintain feed health over time.

### Daily (5 minutes)

- [ ] Check Google Merchant Center for new disapprovals (Diagnostics tab)
- [ ] Verify last feed fetch was successful (Feeds tab)
- [ ] Glance at product count. Any unexpected drops?

### Weekly (30 minutes)

- [ ] Review disapproval trends. Are they increasing or decreasing?
- [ ] Spot-check 10 random products: does feed data match the website?
- [ ] Check for newly added products. Are they appearing in the feed?
- [ ] Review Shopping campaign performance for anomalies that might indicate feed issues

### Monthly (1-2 hours)

- [ ] Run the full audit template again, focusing on previously failed checks
- [ ] Export and review the full disapproved items list
- [ ] Check for new Google Merchant Center policy updates or spec changes
- [ ] Review feed freshness: is update frequency still adequate?
- [ ] Audit image quality for any new product lines added since last audit
- [ ] Check GTIN coverage: what percentage of applicable products have valid GTINs?

### Quarterly (half day)

- [ ] Full audit pass using the complete template
- [ ] Review Google's product data specification for any changes
- [ ] Evaluate whether your feed management setup still meets your needs
- [ ] Assess category mapping for new product lines or seasonal inventory
- [ ] Review custom label strategy for campaign optimization
- [ ] Check competitor Shopping presence for new opportunities
- [ ] Update this document with any new checks or platform changes discovered

### When to Trigger an Emergency Audit

- Product count drops by more than 10% in a single feed update
- Disapproval rate exceeds 5% of your catalog
- Google Merchant Center account receives a warning or suspension notice
- You migrate platforms (e.g., Shopify to WooCommerce or vice versa)
- You change feed management tools or plugins
- You expand to a new country or currency
- Major platform update (Google spec change, Shopify version upgrade, etc.)

---

## About the Author

Alex Diaz specializes in e-commerce data systems, product feed optimization, and building tools that help merchants get more from their product data. This template is the result of years of hands-on feed management across platforms and verticals.

For questions, feedback, or consulting inquiries: visit alexdiaz.me

---

*This guide is meant to be used alongside the E-Commerce Product Feed Audit Template. The template provides the structure; this guide provides the context and expertise to use it effectively.*
