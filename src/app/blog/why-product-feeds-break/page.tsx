import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Why product feeds break, and how to stop patching them · SnowForge',
  description:
    'Ten years of Shopify and Google Merchant pipelines taught me that the bugs are always in the same three places.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Why product feeds break, and how to stop patching them"
      date="April 19, 2026"
      dek="Ten years of Shopify and Google Merchant pipelines taught me that the bugs are always in the same three places."
    >
      <p>
        If you run an e-commerce store with any channel presence beyond
        your own website, you&rsquo;re running a product feed, whether you
        know it or not. Every morning somewhere, a CSV or JSON file moves
        from a source (Shopify, Magento, a warehouse ERP) to a destination
        (Google Merchant Center, Meta Commerce Catalog, TikTok, a
        marketplace). And every morning, some percentage of the rows in
        that file fail silently.
      </p>
      <p>
        I&rsquo;ve spent most of a decade watching product feeds fail and
        then fixing them. Here&rsquo;s what I wish someone had told me in
        year one: the bugs are always in the same three places.
      </p>

      <h2>1. The identifier problem</h2>
      <p>
        Google and Meta both require a unique identifier per product
        variant: GTIN or MPN or a manufacturer-assigned SKU.
        Shopify stores&rsquo; source of truth for this is either the{' '}
        <code>barcode</code> field (which store owners sometimes use for
        internal bin numbers) or nothing at all. When the feed
        transformation maps <code>barcode</code> to <code>gtin</code> and
        half your variants have an empty barcode field, you get the
        infamous <code>identifier_exists</code> disapproval. Google will
        reject the entire variant group.
      </p>
      <p>
        The fix is to check whether the barcode value actually looks like
        a GTIN (length 12/13/14, numeric, valid checksum) before mapping
        it. If it doesn&rsquo;t, set <code>identifier_exists</code> to{' '}
        <code>no</code> explicitly. This one change has saved more
        disapproved-product dashboards than any other tweak I&rsquo;ve
        shipped. Trying to manually scrub every merchant&rsquo;s barcode
        field sounds satisfying and scales terribly.
      </p>

      <h2>2. The image quality problem</h2>
      <p>
        Every channel has its own opinion about image dimensions,
        backgrounds, and watermarks. Google likes 800×800 minimum, white
        background preferred, no promotional text. Meta wants 500×500
        minimum, is more tolerant of lifestyle shots, but will flag any
        text overlay. TikTok wants portrait aspect ratios.
      </p>
      <p>
        The workable approach is to have the merchant upload channel-ready
        images once, to a dedicated image CDN or metafield, and let the
        feed pick the right URL based on the target channel. Resizing at
        export time sounds appealing and scales linearly with product
        count, which breaks as soon as you pass 10,000 variants.
      </p>

      <h2>3. The inventory and availability problem</h2>
      <p>
        Inventory lives in more places than any other piece of product
        data. In Shopify alone, a single variant can have inventory across
        multiple locations, each with its own commitment tracking. The
        feed needs to decide: which location counts as
        &ldquo;available&rdquo;? Usually it&rsquo;s the sum, minus
        committed, minus buffer. But Google also wants an{' '}
        <code>availability</code> string (in stock / out of stock /
        preorder), and the policy for what counts as &ldquo;in
        stock&rdquo; differs per merchant.
      </p>
      <p>
        The fix here is unglamorous. Pick one explicit policy per
        merchant, write it down in the feed config, and stop making that
        decision in code at runtime. When the policy is implicit, every
        engineer who touches the transformation thinks <em>their</em>{' '}
        interpretation is obviously right, and the transformation keeps
        drifting.
      </p>

      <h2>The meta-fix: row-level error tracking</h2>
      <p>
        All three of these problems have the same failure mode: they fail
        silently at row level. The feed pipeline succeeds (it wrote 50,000
        rows!), but only 47,000 of those rows make it to the destination
        without disapproval. The pipeline logs &ldquo;success.&rdquo; Only
        someone going into Merchant Center and scrolling through rejected
        items notices the problem, days or weeks later.
      </p>
      <p>
        The single most high-leverage change you can make to any feed
        system is row-level error tracking: every row that fails validation
        or destination-side rejection gets captured in a dead-letter queue
        with the specific error reason, linked back to the source record.
        Once you have that, the feed stops being a black box. You know
        exactly what fraction of your catalog is losing money every day
        and why.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe is the tool I wish I&rsquo;d had in year one. It does the
        three fixes above by default: identifier validation, image URL
        routing, explicit availability policy, and row-level error tracking
        with a dashboard. If you&rsquo;re running a Shopify store pushing
        to Google Merchant, Meta, or both, it&rsquo;s at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>. Free
        tier exists. If you try it and it&rsquo;s bad, email me and tell
        me why.
      </p>
    </BlogLayout>
  )
}
