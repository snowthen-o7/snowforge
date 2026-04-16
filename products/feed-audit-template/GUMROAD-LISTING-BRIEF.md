# Feed Audit Tool, Gumroad Listing Brief

**Purpose:** Everything Alex needs to publish the Feed Audit Tool on Gumroad at $29. Work through top to bottom. Total time estimate: 90 to 120 minutes.

---

## Step 1: Capture Screenshots (25 minutes)

You need 4 screenshots. Work from the verified audit tabs already in the shared Google Sheet:

**Sheet:** https://docs.google.com/spreadsheets/d/1ejSf_u7GglR7snXjg1YeoE9FzRZaGfk6yYPAC19XMNY/edit

### Screenshot 1: Hero Image (product card on Gumroad)
**Target size:** 1280 x 720 (Gumroad prefers this aspect ratio)
**Source tab:** `Audit — Full Scan — edge-cases-bad-feed`
**What to capture:**
- Scroll so the top of the audit results is visible with the header row
- Include a slice of ~8 to 12 checks showing a mix of PASS (green), FAIL (red), and WARNING (yellow)
- Try to include at least one row with a visible Example column hyperlink
- Also capture the Health Score at the bottom (you may need two shots stitched together, or crop a composite)

Save as `hero-1280x720.png`.

### Screenshot 2: Real-world Credibility Shot
**Target size:** 1280 x 720
**Source tab:** `Audit — Google Merchant — NextVend_Google_Shopping_destination-Google_Shopping_2026-04-14T03-31-13`
**What to capture:**
- Capture the bottom summary section showing "Total Products Analyzed: 51,192", the health score, pass rate, and counts
- This proves the tool handles enterprise-scale catalogs, not just toy data

Save as `scale-credibility-1280x720.png`.

### Screenshot 3: Findings Detail (show the hyperlinks)
**Target size:** 1280 x 720
**Source tab:** `Audit — Google Merchant — NextVend_Google_Shopping_destination-Google_Shopping_2026-04-14T03-31-13`
**What to capture:**
- Any 5 to 10 row window showing FAILs with populated Example columns
- Specifically capture the checks with lots of examples like "GPC not mapped (48,368 affected)" or "MPN present when GTIN missing" so the reader sees the hyperlinked row IDs

Save as `detail-hyperlinks-1280x720.png`.

### Screenshot 4: Menu Discoverability
**Target size:** 1280 x 720
**Where:** In your Google Sheet, click `Feed Audit` in the top menu bar so the dropdown is visible
**What to capture:**
- The expanded Feed Audit menu showing "Run Full Scan", "Run Audit (Google Merchant)", "Run Audit (Meta Catalog)", "Run Audit (Shopify)", "Clear All Results"
- This shows buyers the simple UI

Save as `menu-1280x720.png`.

### Tips

- Use Windows `Win + Shift + S` or a tool like ShareX to grab rectangular selections
- If the raw capture is larger than 1280x720, use any basic image editor to resize
- Keep the screenshots clean: no browser chrome, no other tabs visible, no personal info in the sidebar

---

## Step 2: Convert guide.md to PDF (15 minutes)

**Source file:** `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\products\feed-audit-template\guide.md`

**Options:**

### Option A: VS Code extension (fastest)
1. Install the `Markdown PDF` extension by yzane
2. Open guide.md in VS Code
3. Right click, select `Markdown PDF: Export (pdf)`
4. Saves `guide.pdf` in the same directory

### Option B: Pandoc (more control over styling)
```bash
pandoc guide.md -o guide.pdf --pdf-engine=wkhtmltopdf --css=style.css
```
Requires pandoc + wkhtmltopdf installed.

### Option C: Print to PDF from a Markdown preview tool
Open guide.md in any viewer that renders markdown (Typora, Obsidian, GitHub online), then use browser `Print to PDF` with letter or A4 size.

**After generating:** open the PDF and scan for:
- All 5 sections render correctly
- No em-dash artifacts from the source
- Page breaks don't awkwardly split the priority matrix table or the monitoring checklist
- About the Author block is on the last page

Save as `guide.pdf` in the `feed-audit-template/` directory.

---

## Step 3: Assemble the Gumroad Zip Bundle (5 minutes)

Create a zip file containing exactly these files:

```
feed-audit-tool-v1.zip
├── Code.gs                       (the Apps Script)
├── setup-instructions.md          (quick setup steps)
├── guide.pdf                      (companion guide, from Step 2)
└── README.md                      (optional: Gumroad listing copy, for buyer reference)
```

**Do NOT include:**
- The `test-data/` directory (contains internal test fixtures and audit results that customers shouldn't see)
- The `TESTING.md` file (internal testing notes)
- The `GUMROAD-LISTING-BRIEF.md` file (this document, internal only)

Zip command (Windows PowerShell):
```powershell
cd "C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\products\feed-audit-template"
Compress-Archive -Path Code.gs,setup-instructions.md,guide.pdf,README.md -DestinationPath feed-audit-tool-v1.zip
```

---

## Step 4: Create the Gumroad Listing (30 minutes)

Log in to Gumroad, create a new product with these settings:

### Product Metadata

| Field | Value |
|---|---|
| Name | `E-Commerce Product Feed Audit Tool` |
| Summary | `Automated audit for Google Shopping, Meta Catalog, and Shopify feeds. 130+ checks, color-coded report in 30 seconds, runs inside Google Sheets.` |
| Price | `$29` |
| Custom permalink | `feed-audit-tool` (if available, so URL becomes gumroad.com/l/feed-audit-tool) |
| Category | `Software > Spreadsheet Templates` (or closest match) |
| Tags | `shopify, google shopping, meta ads, product feed, ecommerce, google merchant center, feed optimization, gumroad audit, apps script` |

### Product Description

Paste the contents of `README.md` as the description. Gumroad supports Markdown formatting.

Edit lightly to remove the footer price and author block (Gumroad handles those automatically).

### Cover Image / Thumbnail

Use `hero-1280x720.png` from Step 1.

### Additional Images (Gumroad allows multiple)

Upload in this order:
1. `hero-1280x720.png` (cover)
2. `menu-1280x720.png` (shows the UI discovery)
3. `scale-credibility-1280x720.png` (shows 51k product scale)
4. `detail-hyperlinks-1280x720.png` (shows the clickable example feature)

### Product File

Upload `feed-audit-tool-v1.zip` from Step 3.

### Refund Policy

Set to Gumroad's default "30-day refund policy" or your preference. For a $29 digital product, generous refunds build trust without meaningful abuse risk.

### License / Usage

Enable `Allow customers to rate your product` (yes, social proof matters).

Do NOT enable `Require a customer review before download` (this blocks instant gratification, which is the main reason people buy on Gumroad).

---

## Step 5: Pre-publish Checklist (10 minutes)

Before clicking `Publish`:

- [ ] Screenshots render correctly in Gumroad's preview
- [ ] Product description preview looks clean (no raw markdown leaking through)
- [ ] Zip file downloads and contains all 4 files (test by downloading as a preview customer)
- [ ] Price shows `$29` in the currency you want
- [ ] Tags are populated
- [ ] Your Gumroad seller profile has a profile photo and name (increases trust)

---

## Step 6: Publish and Verify (5 minutes)

1. Click `Publish`
2. Copy the public URL
3. Open the URL in an incognito browser window
4. Verify the listing renders correctly to a logged-out viewer
5. Walk through the purchase flow as a test (you can use Gumroad's test mode if you want to not actually charge yourself)

---

## Step 7: Marketing Launch (optional, but recommended)

Do these in order when the listing goes live:

1. **Post on alexdiaz.me**: add a Tools page entry linking to Gumroad (already in TODO)
2. **Tweet / X post**: announce the launch with the hero screenshot
3. **LinkedIn post**: longer-form description targeting e-commerce folks, Shopify consultants, agency operators
4. **r/shopify, r/ecommerce**: honest "I built this tool, here's what it does" post. Reddit rewards authenticity
5. **Indie Hackers**: write a brief "launched my first Gumroad product" update

Do not cold-email. Do not spam Discord servers. The tool stands on its own.

---

## Gumroad Maintenance Plan

After launch:

- **First week:** monitor sales, read any reviews, respond within 24 hours to questions
- **First month:** track refund rate (target <5 percent). If higher, investigate the refund reasons
- **After first 10 customers:** if any repeated questions come up, add a FAQ section to the README and re-upload the zip
- **After 50 customers:** consider a v2 with email alerts, scheduled audits, or a bundled version with the Feed Diff Checker at a package price

---

## Asset Locations Summary

Everything Alex needs is already in the monorepo:

| Asset | Path |
|---|---|
| Apps Script | `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\products\feed-audit-template\Code.gs` |
| Setup instructions | `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\products\feed-audit-template\setup-instructions.md` |
| Guide markdown (convert to PDF) | `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\products\feed-audit-template\guide.md` |
| Listing description copy | `C:\Users\alexi\Documents\Diaz\Repositories\SnowForgeLLC\SnowForge\products\feed-audit-template\README.md` |
| Audit results for screenshots | Google Sheet at `https://docs.google.com/spreadsheets/d/1ejSf_u7GglR7snXjg1YeoE9FzRZaGfk6yYPAC19XMNY/edit` |

---

## Total Time Estimate

- Screenshots: 25 minutes
- PDF conversion: 15 minutes
- Zip assembly: 5 minutes
- Listing creation: 30 minutes
- Pre-publish review: 10 minutes
- Publish and verify: 5 minutes
- Marketing posts (optional): 30 minutes

**Total: 90 to 120 minutes.** If you sit down at 7 PM with no interruptions, the tool is live on Gumroad by 9 PM.
