import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title:
    "Fixing 'price mismatch' disapprovals for good (currency, tax, and sale timing) · SnowForge",
  description:
    'The three real causes of Merchant Center price-mismatch disapprovals, how Google actually compares your feed against the landing page, and how to make them agree.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Fixing 'price mismatch' disapprovals for good (currency, tax, and sale timing)"
      date="June 25, 2026"
      dek="The three real causes of price-mismatch disapprovals, how Google actually compares your feed against the landing page, and how to make them agree."
    >
      <p>
        A price-mismatch disapproval is maddening because the feed looks
        correct. The number in your <code>price</code> column is the number you
        meant to charge. But Google does not just trust the feed: it crawls the
        product&rsquo;s landing page, reads a price out of the page, and
        compares the two. When they disagree, the product is disapproved for{' '}
        <code>Mismatched value (price)</code>, and it stops showing until they
        line up. Almost every case traces back to one of three causes, and none
        of them is &ldquo;the feed price is wrong.&rdquo;
      </p>

      <h2>How Google reads the page price</h2>
      <p>
        Google gets the landing-page price two ways. The reliable one is
        structured data: the <code>schema.org</code> Product/Offer markup
        embedded in the page, where <code>price</code> and{' '}
        <code>priceCurrency</code> are stated in machine-readable form. The
        fallback is the visible price it can parse from the rendered page. If
        your theme&rsquo;s structured data says one thing and your feed says
        another, that is the mismatch, even when the price a human sees looks
        fine. So the first move on any price-mismatch case is to open the
        page&rsquo;s structured data and read what it actually claims.
      </p>

      <h2>Cause 1: sale timing</h2>
      <p>
        This is the big one. You start a sale in Shopify, and the storefront
        price changes the instant you hit save. Your feed, though, updates on
        its schedule, on the next scheduled fetch or the next push. In the gap
        between the two, the page says the sale price and the feed says the old
        one, and Google disapproves the product for the mismatch. When the sale
        ends, the same gap opens in reverse.
      </p>
      <p>
        The right fix is not to push the feed faster and hope. It is to express
        the promotion <em>inside</em> the feed with <code>sale_price</code> and{' '}
        <code>sale_price_effective_date</code>. You keep <code>price</code> at
        the regular price, put the discounted number in <code>sale_price</code>,
        and give the start and end timestamps in{' '}
        <code>sale_price_effective_date</code>. Now Google knows the sale is
        intentional and expects the page to show the sale price during that
        window, instead of reading a contradiction.
      </p>

      <h2>Cause 2: tax and currency handling</h2>
      <p>
        The second cause is that the feed and the page are quoting the price
        under different rules. Two specifics catch people:
      </p>
      <ul>
        <li>
          <strong>Tax.</strong> In the United States, the feed{' '}
          <code>price</code> should be the pre-tax price, and tax is handled
          through account settings, because that is how US stores present
          prices on the page. In countries that quote VAT-inclusive prices, the
          feed price must include the tax the same way the page does. Send a
          pre-tax number while the page shows a tax-inclusive one and you have
          engineered a mismatch.
        </li>
        <li>
          <strong>Currency.</strong> The <code>price</code> value must carry
          the correct ISO currency code (<code>19.99 USD</code>), and it has to
          match the currency the landing page actually transacts in for that
          shopper. Multi-currency storefronts are a frequent offender: the feed
          is built in one currency while the page renders another based on the
          visitor&rsquo;s region.
        </li>
      </ul>
      <p>
        The principle is that price is not a number, it is a number under a
        convention. Decide the tax and currency convention once, make the feed
        and the page use the same one, and this class of mismatch disappears.
      </p>

      <h2>Cause 3: stale or wrong on-page structured data</h2>
      <p>
        The third cause hides in the theme. A lot of Shopify themes and apps
        inject their own <code>schema.org</code> Offer markup, and it does not
        always reflect the current price, especially around sales, currency
        conversion, or bundle pricing. If the visible price is right but the
        embedded markup is stale, Google reads the stale markup and disapproves
        the product. I have watched people chase feed bugs for a week when the
        actual culprit was a second, hidden price in the page&rsquo;s
        structured data.
      </p>
      <p>
        Fix it at the source: make sure the page emits exactly one, correct
        Offer with the live price and currency. If a theme or app is emitting a
        conflicting one, that is the bug. When the page&rsquo;s structured data
        is honest, the feed only has to agree with one number.
      </p>

      <h2>Let Google update prices between crawls</h2>
      <p>
        There is a safety net worth turning on: automatic item updates. With it
        enabled, when Google crawls a landing page and finds a price that
        differs from the feed, it can update the item&rsquo;s price to match the
        page rather than disapproving it outright, within a tolerance. It is not
        a license to run a sloppy feed, but it absorbs the short-lived gaps that
        sale timing creates and keeps a product live while your feed catches up.
        Treat it as a cushion, not the fix.
      </p>

      <h2>The durable setup</h2>
      <p>
        Put the pieces together and price mismatches stop being recurring.
        Drive the feed price and the page price from the same source of truth so
        they cannot drift. Express promotions with <code>sale_price</code> and{' '}
        <code>sale_price_effective_date</code> instead of racing the crawler.
        Pin one tax and currency convention and apply it on both sides. Keep the
        page&rsquo;s structured data to a single correct Offer. Do those four
        things and the mismatch disapproval becomes a rarity instead of a weekly
        chore.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe handles the feed side of this by default: sale pricing through{' '}
        <code>sale_price</code> and effective dates, explicit currency and tax
        handling, and row-level tracking so you see a price mismatch the moment
        it appears instead of finding it in the diagnostics tab a week later.
        It is at <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>,
        with a free tier.
      </p>
    </BlogLayout>
  )
}
