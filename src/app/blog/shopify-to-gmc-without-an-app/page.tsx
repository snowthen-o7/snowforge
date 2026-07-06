import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Shopify to Google Merchant without an app: what breaks and what to watch · SnowForge',
  description:
    'You can connect Shopify to Google Merchant Center with no third-party app. Here is exactly where the no-app path falls down.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Shopify to Google Merchant without an app: what breaks and what to watch"
      date="July 5, 2026"
      dek="You can connect Shopify to Google Merchant Center with no third-party app. Here is exactly where the no-app path falls down."
    >
      <p>
        You do not strictly need a paid app to get a Shopify catalog into
        Google Merchant Center. Shopify&rsquo;s native Google channel, or a
        plain product feed, will get you connected. The question is not
        whether it works on day one; it is what quietly breaks on day forty,
        once you have real variant complexity, sales, and inventory churn.
        Here is where the no-app path runs out of road.
      </p>

      <h2>Identifiers are on you</h2>
      <p>
        The native path maps Shopify fields to feed fields fairly directly,
        which means it maps the <code>barcode</code> field straight to GTIN,
        whatever is in it. If your store uses barcode for real GTINs, fine. If
        it is empty, or holds an internal bin number, you inherit a wave of{' '}
        <code>identifier_exists</code> disapprovals with no built-in
        validation to catch them. The no-app path does not know the difference
        between a valid GTIN and a warehouse code; you have to.
      </p>

      <h2>Variants and item grouping get fuzzy</h2>
      <p>
        Shopify&rsquo;s variant model and Google&rsquo;s{' '}
        <code>item_group_id</code> model do not line up perfectly, and the
        native mapping makes a reasonable default choice that is not always
        the right one for how you want products grouped in Shopping. Past a
        certain catalog complexity, you start wanting control over how
        variants collapse or split, and the no-app path gives you the default,
        not the dial.
      </p>

      <h2>Sales create price mismatches</h2>
      <p>
        Shopify updates your storefront price the instant a sale starts.
        Whether that reaches Google before its next crawl depends on sync
        timing you do not fully control on the native path, and the gap is
        exactly when a price mismatch disapproval appears. The native
        connection is &ldquo;good enough&rdquo; until you run frequent
        promotions, at which point the timing becomes a recurring tax.
      </p>

      <h2>You are flying without an instrument panel</h2>
      <p>
        The biggest gap is not any single field; it is visibility. The native
        path will happily report that it synced, while some fraction of your
        catalog sits disapproved in Merchant Center. There is no row-level
        view of which products failed and why, so you find out by manually
        scrolling the Merchant Center diagnostics, late. The feed is a black
        box, and black boxes lose money quietly.
      </p>

      <h2>When the no-app path is the right call</h2>
      <p>
        To be fair: if you have a small, simple catalog, clean GTINs, and run
        few promotions, the native connection is genuinely fine, and adding
        tooling would be over-engineering. The no-app path breaks down
        specifically when you scale variant complexity, run frequent sales, or
        grow past the point where eyeballing disapprovals is feasible. Know
        which store you are, and do not buy a solution to a problem you do not
        have yet.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe is the layer you add when the no-app path stops being enough:
        identifier validation, control over variant grouping, sale handling
        that does not desync, and row-level disapproval tracking so the feed
        stops being a black box. It is at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>, with a
        free tier for the stores that are not there yet.
      </p>
    </BlogLayout>
  )
}
