export type Post = {
  slug: string
  title: string
  dek: string
  /** ISO date, used for sorting and display. */
  date: string
}

/**
 * Single source of truth for the blog/article index.
 * Consumed by the homepage content hub (`/`) and the blog archive (`/blog`).
 * Ordered newest-first.
 */
export const POSTS: Post[] = [
  {
    slug: 'automating-content-quality-gates',
    title: 'Automating content without shipping slop: the quality gates that matter',
    dek: 'Volume is the easy part of an automated content pipeline. The gates that keep it from producing forgettable slop are what make it worth running.',
    date: '2026-07-06',
  },
  {
    slug: 'shopify-to-gmc-without-an-app',
    title: 'Shopify to Google Merchant without an app: what breaks and what to watch',
    dek: 'You can connect Shopify to Google Merchant Center with no third-party app. Here is exactly where the no-app path falls down.',
    date: '2026-07-05',
  },
  {
    slug: 'why-scrapers-get-blocked',
    title: 'Why your scraper keeps getting blocked',
    dek: 'Blocks are rarely random. Sites block behavior, not scraping. Fix the behavior and most of them disappear.',
    date: '2026-07-04',
  },
  {
    slug: 'openapi-servers-block',
    title: 'Your OpenAPI spec is shipping a dead base URL',
    dek: 'The servers block is part of your API product, not an afterthought. Two traps make it point nowhere, and both ship silently.',
    date: '2026-07-03',
  },
  {
    slug: 'merchant-center-misrepresentation',
    title: "The Merchant Center 'Misrepresentation' flag is about your storefront, not your feed",
    dek: 'The most feared account-level suspension and the most misdiagnosed. It almost never comes from the feed. Here is the storefront checklist.',
    date: '2026-07-02',
  },
  {
    slug: 'supplemental-feeds-done-right',
    title: 'Supplemental feeds, done right: patching a primary feed without breaking it',
    dek: 'A supplemental feed is a scalpel for fixing specific fields. Used as a second primary, it becomes a source of conflicts. Here is the line.',
    date: '2026-07-01',
  },
  {
    slug: 'selectors-xpath-or-llm',
    title: 'CSS selectors, XPath, or an LLM: choosing how to extract',
    dek: 'Three ways to pull structured data off a page, each with a real sweet spot. Here is how to pick without overpaying or over-engineering.',
    date: '2026-06-30',
  },
  {
    slug: 'serverless-dependency-weight',
    title: 'The dependency that works locally and breaks only in production',
    dek: 'A heavyweight import that passes every test and fails on the first real request in a Lambda. Why it happens, and how to keep serverless code light.',
    date: '2026-06-29',
  },
  {
    slug: 'running-seven-apps-solo',
    title: 'Running seven apps solo: the systems that make it survivable',
    dek: 'One person, seven apps, nights and weekends. It only works because of systems, not heroics. Here are the ones that carry the weight.',
    date: '2026-06-28',
  },
  {
    slug: 'gtin-mpn-brand-identifier-rules',
    title:
      'GTIN, MPN, and brand: the identifier rules that get products disapproved',
    dek: 'The identifier_exists and invalid-GTIN disapprovals decoded, with the decision tree for when each identifier is required, optional, or correctly absent.',
    date: '2026-06-27',
  },
  {
    slug: 'polite-web-scraping',
    title: 'The polite, legal way to scrape public web data',
    dek: 'Most web scraping is legitimate. The difference between responsible data collection and getting banned is in how you do it.',
    date: '2026-06-26',
  },
  {
    slug: 'fixing-price-mismatch-disapprovals',
    title:
      "Fixing 'price mismatch' disapprovals for good (currency, tax, and sale timing)",
    dek: 'The three real causes of price-mismatch disapprovals, how Google actually compares your feed against the landing page, and how to make them agree.',
    date: '2026-06-25',
  },
  {
    slug: 'faceless-video-pipelines',
    title: 'Faceless video pipelines: what scales and what just burns money',
    dek: 'Automated short-form video is sold as passive income. The pipeline is real, but the cost cliffs are not where people expect.',
    date: '2026-06-24',
  },
  {
    slug: 'google-product-category-vs-product-type',
    title:
      'google_product_category vs product_type: which one actually affects your ads',
    dek: 'One is Google’s taxonomy and one is yours. Here is what each field really does, and how miscategorization quietly tanks performance.',
    date: '2026-06-23',
  },
  {
    slug: 'product-feed-refresh-cadence',
    title: 'How often should your product feed actually refresh?',
    dek: 'More often is the wrong default. The right cadence depends on what changes, what the channel does with it, and what it costs you.',
    date: '2026-06-22',
  },
  {
    slug: 'custom-labels-shopping-campaigns',
    title:
      'Custom labels for Shopping campaigns: a segmentation scheme that scales',
    dek: 'How to use custom_label_0 through custom_label_4 for margin, season, and velocity bidding without turning your feed into a mess of one-off flags.',
    date: '2026-06-21',
  },
  {
    slug: 'nba-injury-reports-signal',
    title: 'NBA injury reports as a market signal: what the data does and does not say',
    dek: 'Injury designations carry real information, but the edge is in the timing and the noise, not the obvious headline.',
    date: '2026-06-20',
  },
  {
    slug: 'shopify-metafields-to-feed-attributes',
    title:
      'Shopify metafields to product feed attributes: the mapping that actually works',
    dek: 'Piping Shopify metafields into material, color, size, age_group, and GTIN feed fields cleanly, including the traps that break the mapping.',
    date: '2026-06-19',
  },
  {
    slug: 'shopping-feed-anatomy',
    title: 'A field-by-field anatomy of a Google Shopping product feed',
    dek: 'What every required and recommended attribute actually does, and the gotcha hiding in each one.',
    date: '2026-06-18',
  },
  {
    slug: 'scanning-mtg-cards-ocr',
    title: 'Scanning a Magic: The Gathering collection with a phone camera: the OCR reality',
    dek: 'Reading a card name off a phone camera sounds trivial. The edge cases are where a collection scanner actually lives or dies.',
    date: '2026-06-16',
  },
  {
    slug: 'feed-rules-by-channel',
    title: 'One product feed, three rule sets: Google, Meta, and TikTok',
    dek: 'You build the feed once, but Google Shopping, Meta Commerce, and TikTok each reject it for different reasons. Here is where the rules actually diverge.',
    date: '2026-06-14',
  },
  {
    slug: 'reading-league-meta-from-data',
    title: 'Reading the League of Legends meta from match data, not vibes',
    dek: 'Win rate, pick rate, and ban rate tell a real story, but only if you read them with sample size, rank, and patch timing in mind.',
    date: '2026-06-12',
  },
  {
    slug: 'common-gmc-disapprovals',
    title: 'The Google Merchant Center disapprovals that quietly cost you sales',
    dek: 'Five disapproval reasons account for most of the lost revenue in Merchant Center. Here is what each one really means and the fix that actually scales.',
    date: '2026-06-10',
  },
  {
    slug: 'indie-cloud-cost',
    title: 'The cost of indie cloud: my real bill across 7 apps',
    dek: 'Real numbers from a seven-app portfolio in May 2026, the three incidents that drove the bill up, and the fixes that brought it back down.',
    date: '2026-05-10',
  },
  {
    slug: 'auditing-feeds-before-you-push',
    title: 'Audit your product feed before you push it',
    dek: 'Most GMC disapprovals are preventable if you audit the feed before you push it. Here is the eight-check list I use on real catalogs.',
    date: '2026-05-06',
  },
  {
    slug: 'building-snowforge',
    title: 'Why I&rsquo;m building SnowForge from a day-job desk',
    dek: 'A small studio, a handful of apps, and a slow build towards software I&rsquo;m genuinely excited to maintain.',
    date: '2026-04-18',
  },
  {
    slug: 'why-product-feeds-break',
    title: 'Why product feeds break, and how to stop patching them',
    dek: 'Ten years of Shopify and Google Merchant pipelines taught me that the bugs are always in the same three places.',
    date: '2026-04-19',
  },
  {
    slug: 'fortnite-shop-tracker',
    title: 'How SnowFort tracks the Fortnite shop (and why the math matters)',
    dek: 'Item rotation patterns, V-Buck price drift, and why a shop tracker only earns trust if the data is honest.',
    date: '2026-04-20',
  },
]
