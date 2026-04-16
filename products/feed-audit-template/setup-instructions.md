# Feed Audit Tool - Setup Instructions

## What This Is

A Google Apps Script that runs inside Google Sheets. You paste your product feed data, click a button, and get an automated graded report with 95+ checks across required fields, images, pricing, availability, and platform-specific rules.

No software to install. Everything runs inside Google Sheets.

---

## Setup (5 minutes)

### Step 1: Create a New Google Sheet

Go to [sheets.new](https://sheets.new) to create a blank spreadsheet.

### Step 2: Paste Your Feed Data

1. Rename the default "Sheet1" tab to **Feed Data** (right-click the tab at the bottom and select "Rename").
2. Paste your product feed CSV data into this sheet.
   - Row 1 should be your **column headers** (e.g., title, description, price, image_link, etc.).
   - Row 2 onward should be your **product data**.
   - If you have a CSV file, you can open it in a text editor, select all, and paste directly into the sheet. Google Sheets will parse the columns automatically.
   - Alternatively, use **File > Import** to upload a CSV file directly.

### Step 3: Add the Script

1. In your Google Sheet, go to **Extensions > Apps Script**.
2. This opens the Apps Script editor in a new tab.
3. **Rename the project** by clicking "Untitled project" at the top left of the editor. Type **Feed Audit Tool** and press Enter. This ensures the authorization dialog shows "Feed Audit Tool" instead of "Untitled project."
4. Delete any existing code in the editor (it usually has a placeholder `myFunction`).
5. Open the **Code.gs** file from this package, copy the entire contents, and paste it into the Apps Script editor.
6. Click the **Save** icon (or press Ctrl+S / Cmd+S).
7. Close the Apps Script editor tab.

### Step 4: Refresh and Run

1. Go back to your Google Sheet tab and **refresh the page** (F5 or Ctrl+R / Cmd+R).
2. After a few seconds, a new menu item **"Feed Audit"** will appear in the menu bar (to the right of "Help").
3. Click **Feed Audit** and select the audit type that matches your feed:
   - **Run Full Scan** -- runs all checks across all platforms
   - **Run Audit (Google Merchant)** -- focuses on Google Merchant Center requirements
   - **Run Audit (Meta Catalog)** -- focuses on Meta/Facebook catalog requirements
   - **Run Audit (Shopify)** -- focuses on Shopify export requirements

   Each audit type creates its own results tab, so you can run multiple and compare side-by-side.

### Step 5: Authorize (First Run Only)

The first time you run the audit, Google will ask you to authorize the script. This is normal and required for any custom Apps Script.

1. A dialog will appear saying "Authorization required." Click **Continue**.
2. Select your Google account.
3. You may see a warning screen that says "Google hasn't verified this app." Click **Advanced** and then **Go to Feed Audit (unsafe)**.
   - This warning appears because you wrote the script yourself -- it is not a published add-on. The script only accesses the spreadsheet it is running in. It does not send data anywhere.
4. Click **Allow** to grant the script permission to read and write to your spreadsheet.

You only need to do this once. Future runs will not require authorization.

### Step 6: View Results

After the audit completes (usually a few seconds for feeds under 10,000 products), a new tab will appear with the results. Each audit type creates its own tab:
- **Audit — All Platforms** (generic)
- **Audit — Google Merchant**
- **Audit — Meta Catalog**
- **Audit — Shopify**

You can run multiple audit types and compare them side-by-side in separate tabs.

The results sheet includes:
- Every check with its **Category**, **Severity**, **Status**, and **Details**
- **Example Rows** column showing specific products with issues (with IDs or row numbers)
- Color-coded status indicators: green (PASS), red (FAIL), yellow (WARNING), gray (SKIP)
- A **summary section** at the bottom with pass rate, failure counts, and an overall health score out of 100

---

## Supported Feed Formats

The tool uses smart column detection to handle different naming conventions. It works with exports from:

- **Google Merchant Center** (XML or CSV exports, supplemental feeds)
- **Meta / Facebook Catalog** (CSV or TSV exports)
- **Shopify** (Products CSV export from Admin > Products > Export)
- **WooCommerce** (via product feed plugins like CTX Feed, YITH, etc.)
- **BigCommerce**, **Magento**, and other platforms that export CSV product data
- **Custom feeds** with standard column names

The script automatically detects columns like `title` / `product_title` / `Name`, `price` / `Variant Price` / `regular_price`, etc. You do not need to rename your columns.

---

## Tips

- **Re-running the audit**: Just click Feed Audit > Run Audit again. It will replace the existing Audit Results sheet.
- **Clearing results**: Use Feed Audit > Clear Results to delete the Audit Results tab.
- **Large feeds**: Google Sheets can handle up to ~100,000 rows. For very large feeds (50,000+ products), the audit may take 30-60 seconds.
- **Multiple feeds**: You can duplicate the spreadsheet (File > Make a copy) to audit different feeds side by side.
- **Sharing results**: The Audit Results tab can be exported as a PDF (File > Download > PDF) for stakeholder reporting.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Feed Audit" menu does not appear | Refresh the page. If it still does not appear, re-open the Apps Script editor and verify the code was saved correctly. |
| "No sheet named Feed Data found" | Rename your data sheet tab to exactly **Feed Data** (case-sensitive). |
| "The Feed Data sheet appears to be empty" | Make sure your data starts at row 1 (headers) and row 2 (first product). No blank rows above the headers. |
| Authorization error or loop | Try opening the Apps Script editor, clicking Run > Run function > onOpen, and authorizing from there. |
| Script takes a long time | Feeds over 50,000 rows may take up to a minute. If it times out, try splitting your feed into smaller batches. |
| Columns showing as "SKIP" | The script could not find a matching column name. Check your header row against the supported column aliases in the script. |

---

## What Gets Checked

The audit runs 35+ automated checks organized into these categories:

1. **Required Fields** -- Title, description, price, availability, image link, product URL, IDs, condition
2. **Image Quality** -- HTTPS usage, placeholder image detection
3. **Pricing** -- Price outlier detection, sale price validation
4. **Availability** -- Out-of-stock percentage, value distribution
5. **Feed Freshness** -- Product count, duplicate title detection
6. **Google Merchant** (when applicable) -- GTIN validation, brand, MPN, categories, custom labels
7. **Meta Catalog** (when applicable) -- Content ID, UTM parameter tracking
8. **Shopify** (when applicable) -- Handle, variant SKU, product status

Each check is graded with a severity level (Critical, High, Medium, Low) and a status (PASS, FAIL, WARNING, SKIP).

---

*By Alex Diaz*
