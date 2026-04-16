# Feed Audit Tool, Launch Post Drafts

Four platform-specific launch posts ready to copy-paste. Product URL: https://alexdiazme.gumroad.com/l/feed-audit-tool

Publish order (suggested): X first (quick), then Indie Hackers (founder context), then LinkedIn (professional), then r/shopify (largest community, wait until you have a small bit of initial traction).

---

## 1. X / Twitter

Paste as-is. Under 280 chars. Attach `screenshots/hero-1280x720.png`.

```
Shipped a thing.

A Google Sheets tool that audits your product feed for Google Shopping, Meta Catalog, and Shopify in ~30 seconds. 130+ checks, clickable hyperlinks to the exact bad cells, color-coded results.

$29 on Gumroad.

https://alexdiazme.gumroad.com/l/feed-audit-tool
```

**Alt version (if you want to lead with a problem):**

```
Your product feed is probably rejecting ads you don't know about.

Missing GTINs. Sale price > regular price. Dupe IDs. HTTP image links.

Built a Google Sheets tool that catches 130+ of these in 30s. No install. No API keys.

$29 on Gumroad.

https://alexdiazme.gumroad.com/l/feed-audit-tool
```

---

## 2. Indie Hackers

Post in "Launches" or as a milestone. 400 to 600 words is the sweet spot.

**Title:** Shipped my first Gumroad product, a Google Sheets feed audit tool

**Body:**

```
Hey IH,

Just shipped my first paid product after months of circling around it. Wanted to share the context.

I've spent years working with e-commerce product feeds (Shopify exports, Google Merchant Center data, Meta catalogs) and kept running into the same class of problem: a merchant uploads a feed, Google silently rejects 30 percent of it, the merchant has no idea, and ad revenue slowly bleeds out.

The existing tooling for this is either enterprise SaaS (expensive, overkill for most stores) or the "run the feed through Google Merchant Center diagnostics and read the errors" approach (tedious, reactive, you only find out after damage is done).

So I built a Google Sheets Apps Script that audits a feed against 130+ checks in about 30 seconds. Paste your feed into a sheet, click a menu item, get a color-coded report with a health score and clickable hyperlinks to the exact cells that are broken.

What it checks:
- Required fields (title, description, price, image, availability, URL, GTIN, brand, MPN)
- Format compliance (GTIN check digits, GS1 prefix ranges, ISO date formats)
- Platform-specific requirements (Google Merchant, Meta Catalog, Shopify)
- Cross-field validation (sale price vs regular price, condition matching title text, apparel age_group requirements)

I dogfooded it against a 51,000 product test catalog and the tool immediately caught bugs in my own feed pipeline. The mutual QA loop of "test the audit tool against real data, fix the audit tool bugs, fix the real feed bugs it finds" was honestly the best validation I could have asked for.

Tech stack: pure Google Apps Script (JavaScript), single file, runs entirely inside the buyer's Google Sheet. No backend, no API keys, no account to create. Total build time was a few weekends spread over a couple months.

Pricing: $29 on Gumroad. Probably underpriced given the competitive landscape but I'd rather get copies in hands and learn than optimize for margin on day one.

Link: https://alexdiazme.gumroad.com/l/feed-audit-tool

Happy to answer questions about the build, the pricing, the distribution plan (TBD), or anything else.
```

---

## 3. LinkedIn

1200 to 1500 characters works best. Professional tone, story-led. Post with the hero screenshot as an image.

```
Shipped a product today.

For years I've watched e-commerce merchants upload product feeds to Google Shopping, Meta, or Shopify, then scratch their heads when their ads stop showing. The silent killer is always the same: feed data quality. Missing GTINs. Sale prices that exceed regular prices. HTTP image links. Duplicate IDs. Empty titles.

Every one of these gets the product disapproved. Google rarely sends a loud notification. The merchant just sees traffic decline and never connects it to the feed.

So I built a tool that audits a product feed against 130+ rules in about 30 seconds. It runs inside Google Sheets as an Apps Script add-on. Paste your feed, click a menu item, get a color-coded report with a health score and clickable links to the exact problem cells.

What's inside:
- 130+ automated checks across 9 categories
- Platform-specific audit modes for Google Merchant, Meta Catalog, and Shopify
- Smart column matching that handles different naming conventions (Shopify CSV, GMC TSV, Meta XML)
- Severity ratings (Critical / High / Medium / Low) so you know what to fix first
- Health score out of 100 to track improvement over time

I tested it against a 51,000 product catalog and it surfaced catastrophic feed bugs in under a minute that would have been rejected at scale by Google.

Live on Gumroad at $29. First of a series of feed management tools I'm building.

Link in first comment.
```

**First comment (LinkedIn best practice is to put the link in a comment, not the body):**

```
Link: https://alexdiazme.gumroad.com/l/feed-audit-tool
```

---

## 4. r/shopify

Reddit is allergic to obvious promotion. Lead with the problem, be honest about having built something, put the link at the END.

**Title:** I built a free-ish tool to audit Shopify product feeds for Google Shopping disapprovals

*Reddit will flag "free-ish" as clickbaity. Alternative title that reads less promotional:*

**Alt title:** Built a 130-check feed auditor for Shopify -> Google Shopping (asking for feedback)

**Body:**

```
Hey r/shopify,

I've been running into this problem over and over for years and finally built something to fix it.

When you export products from Shopify to Google Shopping (via the native Google channel, or a feed management app, or a CSV you upload manually), a bunch of subtle stuff can go wrong: GTINs in the wrong format, sale prices higher than regular prices, title length rules, missing google_product_category, identifier_exists cross-check issues, HTTPS requirements on image URLs, and about 120 more things.

Most of these don't generate obvious errors. Your products just silently stop showing in Shopping results or get disapproved in Merchant Center's diagnostics tab that nobody checks until their revenue tanks.

I built a Google Sheets script that audits a feed against 130+ of these rules in about 30 seconds. Paste your product export into a sheet, click a menu item, get a color-coded report with a health score and clickable links to the exact cells that are broken.

It handles Shopify product CSV exports natively (100+ column name aliases for things like "Variant Price", "Image Src", "Handle", etc.). Also works for Google Merchant Center feeds, Meta catalogs, and generic CSVs.

I'd love feedback from people who actually manage feeds at scale. What's missing from the check list? What's a false positive you'd hate? What platforms should I prioritize?

Happy to answer questions about how any specific check works or why it matters.

Link: https://alexdiazme.gumroad.com/l/feed-audit-tool ($29 on Gumroad if you want to try it, but honestly I'm more interested in feedback than first-day sales)
```

**Note:** the mods at r/shopify allow self-promotion if it's clearly useful to the community, disclosed, and not the entire thread. Posting this as a Discussion (not a link post) is safer. If r/shopify removes it, try r/ecommerce or r/googleadwords with the same copy.

---

## After The Posts

Watch for:

- Comments asking for a refund policy (answer: yes, 30 day refund via Gumroad default)
- Comments asking if it runs on X platform you did not list (answer: paste CSV, column matching handles most formats)
- Feature requests (log them in a followup doc, do not commit to anything in thread)
- Negative reviews about pricing (the $29 point is defensible based on competitive pricing and expected ROI, do not drop price in response to one comment)

**Do not:**

- Reply defensively to criticism
- Engage with obvious trolls
- Cross-post on the same day (Reddit will shadow-ban)
- Spam Shopify Discord servers or Facebook groups
- Cold DM strangers on LinkedIn

**Do:**

- Respond to every genuine question within 24 hours
- Thank early purchasers personally
- Ask every buyer for feedback after 48 hours
- Track which post drives the most sales (use Gumroad analytics and UTM parameters if you want granular data)

---

## Timing

| When | What |
|---|---|
| Tonight | X post + Indie Hackers post |
| Tomorrow morning | LinkedIn post (professional audience is most active weekday mornings) |
| Day after | r/shopify post (let the Gumroad page have a small initial view count before Reddit traffic hits) |

Do not post all four at the same time. Spread them across 48 hours so you can respond to each community without missing anything.
