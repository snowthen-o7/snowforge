> **NOTE:** This was the original planning doc for a $19 manual template. The product evolved into an automated Google Sheets Apps Script tool at $29. See `products/feed-audit-template/` for the actual product files.

# Gumroad Product: E-Commerce Feed Audit Template

**Price:** $19
**Format:** Google Sheets template + PDF guide
**Effort to create:** 2-3 hours (you already know every check)
**Why this first:** Lowest friction product. No code to package. Ship today.

---

## Gumroad Listing Copy

### Title
E-Commerce Product Feed Audit Template

### Subtitle
The exact checklist I use to audit Shopify, WooCommerce, and Google Merchant feeds. Stop losing ad revenue to broken data.

### Description

**Your product feed is costing you money.** Missing fields, stale prices, broken images, and disapproved products mean wasted ad spend and lost sales. Most merchants don't know where to look.

This is the audit template I've refined over years of debugging product feeds across Shopify, Google Merchant Center, Meta Catalogs, and WooCommerce.

**What's included:**

- **Google Sheets template** with 60+ feed health checks organized by priority
- **PDF walkthrough guide** explaining each check and why it matters
- **Severity scoring** so you know what to fix first
- **Platform-specific tabs** for Shopify, WooCommerce, and Google Merchant
- **Common error patterns** with exact fix instructions

**Checks cover:**
- Required field completeness (title, description, price, availability, images)
- GTIN/MPN/brand compliance for Google Shopping
- Image quality and size requirements
- Price and availability sync accuracy
- Category and product type mapping
- Shipping and tax configuration
- Feed freshness and update frequency
- Disapproval pattern analysis

**Who this is for:**
- E-commerce store owners managing their own feeds
- Marketing managers running Google Shopping or Meta catalog ads
- Freelancers who audit feeds for clients (use this as your deliverable)
- Agencies onboarding new e-commerce clients

**Format:** Google Sheets (make a copy) + PDF guide

---

## Google Sheets Template Structure

### Tab 1: Audit Overview
- Store name, platform, date, auditor
- Overall health score (auto-calculated)
- Top 5 issues summary
- Recommended priority actions

### Tab 2: Required Fields Check
| Field | Present | Correct Format | Coverage % | Severity | Notes |
|-------|---------|----------------|------------|----------|-------|
| title | | | | | |
| description | | | | | |
| price | | | | | |
| availability | | | | | |
| image_link | | | | | |
| gtin | | | | | |
| mpn | | | | | |
| brand | | | | | |
| condition | | | | | |
| ...60+ more rows | | | | | |

### Tab 3: Google Merchant Specific
- Disapproval reasons checklist
- Policy compliance checks
- Feed specification version check
- Automatic item updates status
- Free listings eligibility

### Tab 4: Shopify Specific
- Product status vs feed inclusion
- Variant handling
- Metafield usage for feed enrichment
- Collection/tag mapping to categories
- Multi-currency/multi-language checks

### Tab 5: WooCommerce Specific
- Plugin configuration checks (if using feed plugin)
- Custom field mapping
- Variable product handling
- Stock management sync

### Tab 6: Feed Freshness
- Last update timestamp
- Update frequency vs platform requirements
- Stale product detection
- Price/availability lag measurement

### Tab 7: Issue Tracker
- Issue description
- Severity (Critical / High / Medium / Low)
- Platform affected
- Estimated fix effort
- Fix instructions
- Status (Open / In Progress / Resolved)

---

## PDF Guide Outline (8-10 pages)

1. **How to use this template** (1 page)
2. **The 5 feed issues that cost the most money** (2 pages)
   - Missing GTINs → limited Shopping visibility
   - Stale prices → disapprovals + wasted spend
   - Bad images → low CTR
   - Missing availability → policy violations
   - Wrong categories → irrelevant search placement
3. **Platform-specific gotchas** (2 pages)
   - Shopify: variant explosion, metafield gaps
   - WooCommerce: plugin config pitfalls
   - Google Merchant: disapproval patterns
4. **How to prioritize fixes** (1 page)
   - Fix disapprovals first (they block revenue)
   - Fix data quality next (they cost revenue)
   - Fix optimization last (they grow revenue)
5. **Ongoing monitoring checklist** (1 page)
   - Weekly: check disapprovals, verify pricing
   - Monthly: full audit pass
   - Quarterly: spec update review

---

## Action Items

- [ ] Create Google Sheets template with all tabs above
- [ ] Write PDF guide (can be done in Google Docs -> export PDF)
- [ ] Screenshot the template for Gumroad listing images
- [ ] Upload to Gumroad at $19
- [ ] Add link to alexdiaz.me/tools page
- [ ] Write blog post "How to audit your product feed in 30 minutes" with CTA to template
