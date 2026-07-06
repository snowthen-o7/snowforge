# SnowForge Content Hub Restructure Plan

**Goal:** Clear Google AdSense's "low value / thin content" rejection on the root domain `snowforge.dev` and build an SEO funnel. Because subdomains (`fort`, `lol`, `pipe`, `scrape`, `gen` .snowforge.dev) ride on the root domain's AdSense approval, the thin root has been blocking ad revenue across the entire app portfolio. One domain-level approval unlocks ads everywhere.

**Author:** Alex Diaz · SnowForge LLC
**Status:** Implemented on branch `claude-main` (pending Alex's review + merge).

---

## 1. What the site was (before)

- **`/` (homepage)** — a marketing landing page (`Hero`, `MeetAlex`, `WhySnowForge`, `FeaturedApp`, `AppGrid`, `Faq`, `LandingFooter`). ~800 words, product-directory framing. Critically, it rendered **no site header/nav** (just the `Hero`), so a crawler landing on `/` had no in-page link to the substantial blog content that already existed. This is the page AdSense reviews and keeps rejecting.
- **`/blog`** — a real, working blog index listing 18 hand-written posts. Each post is a Next.js App Router page under `src/app/blog/<slug>/page.tsx` rendering through a shared `BlogLayout` component. **No MDX / CMS** — posts are TSX. Substantial, unique, well-written content already existed here; it just wasn't the thing AdSense saw first.
- **`/about`** — company/founder prose (bio, why SnowForge exists, the app list, business model, contact).
- **`/contact`, `/privacy`, `/terms`** — supporting pages.
- **`content-queue/`** — a "drip" system: 5 complete, publish-ready article drafts (TSX using `BlogLayout`, with a `__PUBLISH_DATE__` placeholder) plus `queue.json` ordering. An autobuild task released one every 2 days. These were real, finished articles simply waiting in a queue.

**Root cause of the AdSense rejection:** the domain's front door (`/`) presented thin marketing with no path into the genuinely substantial writing. The good content was one level down at `/blog` and effectively invisible from the root.

## 2. New information architecture (after)

| Route | Role | Content |
|-------|------|---------|
| **`/`** | **Content hub (primary)** | Site header/nav, a short first-person intro that frames the site as published expertise, the **latest article featured**, then the **full article index** (23 posts). A demoted "The tools behind the notes" strip at the bottom links to the apps and to `/about`. |
| **`/blog`** | Blog archive | The same full article index (canonical `/blog`). Kept as a conventional, linkable archive. |
| **`/about`** | Company / marketing home | Founder bio, "why SnowForge exists," business model — **plus** the marketing sections moved off the homepage: `FeaturedApp` (SnowPipe), `AppGrid` (full toolkit), `WhySnowForge` (value props), and `Faq`. This is now the single home for all product/company marketing. |
| `/contact`, `/privacy`, `/terms` | Support | Unchanged. |

Single source of truth for posts is now `src/lib/posts.ts`, consumed by both `/` and `/blog`, so the index can never drift between the two.

### Why this specifically satisfies AdSense (and users)

- **Substantial, unique content at the reviewed URL.** The root now leads with 23 original, non-templated articles (hundreds to ~1,000+ words each) on real expertise, not a product pitch. AdSense reviews `/` and immediately sees a content library.
- **Clear navigation.** Every page now renders `LandingHeader` (About / Blog / Contact) — including the homepage, which previously had none. A reviewer or user can move through the site from any entry point.
- **No thin / under-construction pages.** Marketing was consolidated onto `/about` rather than deleted, so no page is a stub. The homepage is no longer "thin"; the product directory is demoted to a link, not removed.
- **Original value, not scraped/auto-slop.** Content is first-person operator writing with a specific point of view. Publishing the 5 queued drafts now (instead of dripping over 10 days) front-loads volume for the review.
- **Internal linking / SEO funnel.** Homepage → articles → app CTAs, with a full sitemap covering every post, creates the crawl paths and topical clustering that both AdSense and organic search reward.

## 3. Code changes made (branch `claude-main`)

1. **`src/lib/posts.ts` (new)** — shared, ordered post index (23 posts). Single source of truth.
2. **Published the 5 queued drafts** as real routes under `src/app/blog/<slug>/page.tsx` with real publish dates substituted for `__PUBLISH_DATE__`:
   - `automating-content-quality-gates` (Jul 6), `shopify-to-gmc-without-an-app` (Jul 5), `openapi-servers-block` (Jul 3), `supplemental-feeds-done-right` (Jul 1), `serverless-dependency-weight` (Jun 29).
3. **`content-queue/`** — removed the 5 now-published drafts; set `queue.json` to `[]` (drip is now empty).
4. **`src/app/blog/page.tsx`** — refactored to import the shared `POSTS`; added a self canonical.
5. **`src/app/page.tsx`** — rewritten from marketing landing to content hub (header + intro + featured latest + full index + demoted tools strip + footer).
6. **`src/app/about/page.tsx`** — absorbed the marketing sections moved off the homepage (`FeaturedApp`, `AppGrid`, `WhySnowForge`, `Faq`).
7. **`src/app/sitemap.ts`** — now generates blog routes from `POSTS` (previously listed only 5 of the posts).

**Verification:** `pnpm exec tsc --noEmit` → exit 0. `pnpm build` → exit 0, 33 static pages, all 23 posts prerendered.

**Left in place, now unused:** `src/components/landing/Hero.tsx` and `MeetAlex.tsx` are no longer imported (their content is covered by the new homepage intro and the `/about` bio). Safe to delete later; left untouched to avoid scope creep.

## 4. First-batch article slate (next 12–15)

Ranked by SEO opportunity × ease. Grounded in Alex's genuine expertise (Shopify, product feeds, Google Merchant Center, Meta/TikTok catalogs, e-commerce ETL) and the app domains (Fortnite shop data, League stats, TCG/MTG, sports). These are **outlines for Alex to write** — angle + key points + target keyword. They intentionally extend clusters the existing 23 posts already started.

> Grounding note: the repo's `docs/GOOGLE_MERCHANT_PRODUCT_DATA_SPECS.md` and the `products/` folder (feed-audit-template, feed-diff-checker, feed-qa-toolkit, shopify-jsonl-processor) are strong raw material for the feed-cluster pieces below.

### Tier 1 — high opportunity, low effort (feed/GMC cluster, Alex's core)

1. **"GTIN, MPN, and brand: the identifier rules that get products disapproved"**
   - *Angle:* the `identifier_exists` / invalid-GTIN disapproval decoded, with the decision tree for when each identifier is required vs. optional.
   - *Keyword:* `gtin required google merchant center`
2. **"Fixing 'price mismatch' disapprovals for good (microdata, currency, and sale timing)"**
   - *Angle:* the three real causes of price mismatches and how to make storefront and feed agree.
   - *Keyword:* `google merchant center price mismatch`
3. **"google_product_category vs product_type: which one actually affects your ads"**
   - *Angle:* what each taxonomy field does, why one is Google's and one is yours, and how miscategorization quietly tanks performance.
   - *Keyword:* `google product category vs product type`
4. **"Custom labels for Shopping campaigns: a segmentation scheme that scales"**
   - *Angle:* using `custom_label_0–4` for margin/season/velocity bidding without a mess.
   - *Keyword:* `google shopping custom labels`
5. **"Shopify metafields to product feed attributes: the mapping that actually works"**
   - *Angle:* piping Shopify metafields into GTIN, material, size, color feed fields cleanly.
   - *Keyword:* `shopify metafields product feed`

### Tier 2 — strong opportunity, moderate effort

6. **"Meta Commerce Manager rejections vs. Google: the same catalog, two rulebooks"**
   - *Angle:* the sequel to the existing "One product feed, three rule sets" post, going deep on Meta-specific rejects.
   - *Keyword:* `meta commerce catalog rejected`
7. **"A product feed QA checklist you can run in 10 minutes before every push"**
   - *Angle:* operationalizes the existing "audit before you push" post into a repeatable checklist (ties to `products/feed-qa-toolkit`).
   - *Keyword:* `product feed qa checklist`
8. **"Diffing two product feeds to catch what changed (and what broke)"**
   - *Angle:* why feed diffs catch regressions no validator will; ties to `products/feed-diff-checker`.
   - *Keyword:* `compare product feed versions`
9. **"Image requirements that silently kill Shopping performance"**
   - *Angle:* size, background, promotional-overlay, and `additional_image_link` rules and the disapprovals they trigger.
   - *Keyword:* `google shopping image requirements`
10. **"Handling variants: item_group_id done right across Google, Meta, and TikTok"**
    - *Angle:* the one grouping model, three consumers; where each diverges.
    - *Keyword:* `item_group_id variants`

### Tier 3 — audience/topical-authority (app-domain clusters, drive subdomain traffic)

11. **"Building a Fortnite item-shop dataset: schema, rotation math, and pitfalls"**
    - *Angle:* data-engineering companion to the existing SnowFort post; how to model shop history honestly. (Funnels to `fort.snowforge.dev`.)
    - *Keyword:* `fortnite item shop history data`
12. **"League of Legends champion tier lists from data: sample size and patch decay"**
    - *Angle:* extends the existing "reading the League meta" post into how to actually build a defensible tier list. (Funnels to `lol.snowforge.dev`.)
    - *Keyword:* `league of legends tier list data`
13. **"Pricing a Magic: The Gathering collection from a scan: matching, foils, and condition"**
    - *Angle:* the data problem after OCR — resolving a card name to a priced, conditioned SKU. (Extends the existing MTG OCR post.)
    - *Keyword:* `mtg collection value scanner`
14. **"Rate limits, retries, and backoff: a field guide for anyone pulling public APIs"**
    - *Angle:* the reusable engineering companion to the scraping posts; 429/`Retry-After`/jitter patterns.
    - *Keyword:* `api rate limit backoff strategy`
15. **"The real cost of a scheduled scraping job at scale (and where the money leaks)"**
    - *Angle:* cost breakdown sequel to "the cost of indie cloud," focused on data-collection workloads. (Funnels to `scrape.snowforge.dev`.)
    - *Keyword:* `web scraping cost at scale`

## 5. What still needs Alex

- **Review + merge `claude-main`.** No push/merge was done, per constraint.
- **Marketing voice on the new homepage intro.** The intro paragraph on `/` was written to match the existing site voice, but it's the most visible new prose — worth a read for tone. (Flagged: I did not want to guess hard on voice.)
- **Decide the `/` vs `/blog` overlap.** Both now render the same index. I set a self-canonical on `/blog` and kept it as a conventional archive; the homepage is the SEO-primary. If Alex prefers, `/blog` could `redirect('/')` instead — left as-is to keep `/blog` linkable and non-destructive.
- **Write the Tier-1 outlined articles** (section 4) — outlines only were produced, per the "no fake filler" constraint.
- **Drip system:** `content-queue/queue.json` is now empty. If Alex wants the 2-day drip to continue, add new drafts to the queue; otherwise the autobuild drip step will simply no-op.
- **Resolved:** a day-job reference in `docs/LAUNCH_PLAN.md` was scrubbed to a neutral "product-feed experience" phrasing, per the strict no-mention rule.
