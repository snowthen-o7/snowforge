# E-Commerce Product Feed Audit Tool

## Your product feed is costing you money. Find out exactly where in 30 seconds.

Broken images. Missing GTINs. Titles stuffed with promotional text. Sale prices higher than regular prices. Every one of these issues silently kills your Google Shopping ads, Meta dynamic campaigns, and marketplace listings. You do not get a notification. Your products just stop showing up.

This is an automated audit tool that finds those problems for you. Paste your product feed into Google Sheets, click a button, and get a color-coded graded report with 130+ checks, no manual review, no guesswork.

---

## How It Works

1. Paste your product feed CSV into the "Feed Data" sheet
2. Click **Feed Audit > Run Audit** from the menu bar
3. Get a graded report on the "Audit Results" tab in seconds

That is it. No software to install. No API keys. No account to create. Runs entirely inside Google Sheets using Google Apps Script.

---

## What Gets Checked

### Required Fields
- Title present, length (25-150 chars), no promotional text (sale, discount, BOGO, free shipping)
- Description present, length (100-5000 chars), no raw HTML tags
- Price present, valid format, positive value
- Availability present with valid values
- Image link present and valid URL
- Product URL present
- Unique product IDs (duplicate detection)
- Condition field validation

### Image Quality
- All image URLs use HTTPS (not HTTP)
- No placeholder or "coming soon" image URLs

### Pricing
- Price outlier detection (flags values >10x or <0.1x the median)
- Sale price always less than regular price

### Availability
- Out-of-stock percentage warning (flags if >50% OOS)
- Availability value distribution breakdown

### Feed Freshness
- Total product count
- Duplicate title detection with examples

### Google Merchant Center Specific
- GTIN present and valid format (8, 12, 13, or 14 digits)
- Brand present
- MPN required when GTIN is missing
- Google product category mapped
- Product type set
- Sale price below regular price (Google disapproves violations)
- Custom labels utilized for campaign segmentation

### Meta Catalog Specific
- Content ID present
- UTM parameters in product URLs for attribution tracking

### Shopify Specific
- Handle present
- Variant SKU present
- Product status validation (active, draft, archived)

---

## Smart Column Detection

Different platforms use different column names. This tool handles that automatically.

Paste a Shopify export with "Variant Price" and it finds the price column. Paste a Google feed with "image_link" and it works. Paste a WooCommerce export with "regular_price" and it picks it up.

The tool checks multiple aliases for every logical field -- over 100 column name variations across all platforms. You do not need to rename anything.

**Works with:**
- Shopify product CSV exports
- Google Merchant Center feed exports
- Meta / Facebook catalog exports
- WooCommerce feed plugin exports (CTX Feed, YITH, etc.)
- BigCommerce, Magento, and any other CSV product export

---

## What You Get

### 1. Feed Audit Tool (Google Apps Script)
The automated audit script that runs inside Google Sheets. Paste it into the Apps Script editor, refresh, and run. Includes:
- **130+ automated checks** across 9 categories
- **Platform-specific modes** for Google Merchant, Meta Catalog, and Shopify, plus a Full Scan that runs every check
- **Color-coded results** with severity ratings (Critical / High / Medium / Low)
- **Health score** (0 to 100) so you can track improvement over time
- **Smart column matching** with over 100 aliases that handles different naming conventions automatically
- **Cell-level hyperlinks** from each failed check example to the exact problem cell in your source data

### 2. Feed Audit Guide (PDF)
An 8-page companion guide covering:
- The 5 feed issues that cost the most money -- with real examples and revenue impact
- Platform-specific gotchas for Shopify, WooCommerce, and Google Merchant Center
- How to prioritize fixes using a 3-tier framework (Disapprovals > Data Quality > Optimization)
- Ongoing monitoring checklist with daily, weekly, monthly, and quarterly schedules

### 3. Setup Instructions
Step-by-step guide to get the tool running in under 5 minutes. No technical knowledge required.

---

## Who This Is For

- **Store owners** managing their own product feeds who want to find issues before Google or Meta does
- **Marketing managers** running Shopping or Catalog campaigns who need to diagnose performance drops
- **Freelancers and consultants** who audit feeds for clients -- run the tool and deliver the results sheet as a professional deliverable
- **Agencies** onboarding new e-commerce clients who need a structured feed health assessment
- **Feed managers** who want a repeatable, automated system instead of manual spot-checking

---

## What Makes This Different

This is not a checklist you fill out by hand. It is an automated tool that reads your actual feed data and grades every row against 130+ rules.

It catches things manual reviews miss: the 3 products with HTTP image links buried in a 5,000-row feed. The 12 items where sale price equals regular price. The duplicate IDs that cause silent overwrites in Google Merchant Center. The 414 products with empty titles in a 51,000 product Shopify catalog that would have been disapproved the moment they hit Google.

The severity ratings reflect real revenue impact. Critical items are things that get your products disapproved today. The health score gives you a single number to track over time.

---

## Format

- **Code.gs** -- Google Apps Script (paste into Extensions > Apps Script)
- **setup-instructions.md** -- Step-by-step setup guide
- **guide.pdf** -- Companion guide for fixing issues and ongoing monitoring

---

**Price: $29**

*By Alex Diaz | alexdiaz.me*
