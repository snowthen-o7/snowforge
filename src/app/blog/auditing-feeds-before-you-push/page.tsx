import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Audit your product feed before you push it · SnowForge',
  description:
    'Most Google Merchant Center disapprovals are preventable if you audit the feed before sync. Here is the eight-check list I use on real catalogs.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Audit your product feed before you push it"
      date="May 6, 2026"
      dek="Most GMC disapprovals are preventable if you audit the feed before you push it. Here is the eight-check list I use on real catalogs."
    >
      <p>
        The first time I connected a 50,000-product Shopify store to Google
        Merchant Center, the dashboard turned red within an hour. Hundreds
        of disapprovals. Some were missing GTINs. Some had image URLs that
        404&rsquo;d. Some had categories that didn&rsquo;t exist in
        Google&rsquo;s taxonomy. The fix loop was awful: push the feed, wait
        for review, read the rejection, fix the source, push again. Each
        cycle was hours.
      </p>
      <p>
        The lesson I learned that week is the only feed-ops lesson that
        matters: GMC is not your validator. By the time GMC tells you a
        product is broken, you have already burned the slow async loop.
        Validate the feed locally before you push, and the disapproval
        count drops by 80% before Google even sees it.
      </p>

      <h2>The eight checks that catch almost everything</h2>
      <p>
        These are the checks I run on every feed before I let it out the
        door. Most are five lines of code or one Google Sheet formula. None
        of them require GMC.
      </p>
      <ol>
        <li>
          <strong>Required field presence.</strong> Every row needs id,
          title, description, link, image_link, availability, and price.
          Zero empty cells in those columns. If 414 titles are empty in a
          51,000-row feed, you have a transformation bug, not a content
          gap.
        </li>
        <li>
          <strong>GTIN check-digit math.</strong> The last digit is a
          checksum. Compute it, compare to what is on file, reject the
          mismatches. Half the GTINs I see hand-typed from supplier sheets
          fail this check.
        </li>
        <li>
          <strong>identifier_exists consistency.</strong> If a row has no
          GTIN and no MPN but the brand is set, you need
          identifier_exists set to no. Otherwise GMC treats it as a
          missing identifier and disapproves.
        </li>
        <li>
          <strong>Image URL reachability.</strong> HEAD-request every
          unique image_link. Flag anything that is not a 200 with a real
          content-length. Resolve redirect chains to the canonical URL
          in the feed itself.
        </li>
        <li>
          <strong>google_product_category coverage.</strong> Every row
          needs a category, and the category must exist in Google&rsquo;s
          current taxonomy. Download the taxonomy text file and check
          against it. The catch-all categories (like &ldquo;Apparel and
          Accessories&rdquo; with no subcategory) will not get
          disapproved, but they will underperform.
        </li>
        <li>
          <strong>Price and availability sanity.</strong> Look at the
          joint distribution. A thousand $0 in-stock rows is a bug. A
          hundred negative-inventory in-stock rows is a bug. Surface the
          surprising buckets.
        </li>
        <li>
          <strong>Title and description quality.</strong> Length checks,
          all-caps ratio, HTML tag stripping. Shopify descriptions are
          HTML by default, so the flatten step needs to remove tags or
          GMC will reject them.
        </li>
        <li>
          <strong>Variant uniqueness.</strong> Distinct ID count should
          match row count. If it doesn&rsquo;t, your flatten step has a
          join bug, usually an inventory-location join that fans out one
          row per location per variant.
        </li>
      </ol>

      <h2>The audit is a habit, not an event</h2>
      <p>
        Catalogs drift. Suppliers change SKUs. Photographers re-upload
        images at lower resolution. Whoever controls the source data
        will, at some point, make a change that breaks the feed. The
        audit needs to run on every push, not just the first one.
      </p>
      <p>
        I packaged the eight checks (and 120 more) into a Google Sheets
        add-on called{' '}
        <a href="https://alexdiazme.gumroad.com/l/feed-audit-tool">
          Feed Audit Tool
        </a>
        . It runs the full set in 30 seconds on a 50K-row feed, produces
        a color-coded report with cell-level clickable hyperlinks, and
        sells for $29 because it saves me an hour every time I run it.
        If you would rather run the checks yourself, the list above is
        the starting point.
      </p>
      <p>
        And if you are tired of running the audit by hand, that is what{' '}
        <a href="https://pipe.snowforge.dev">SnowPipe</a> is for: a
        Shopify-to-GMC sync tool with the audit logic baked in, so the
        feed is validated automatically on every push and the only
        pending statuses you see in GMC are the legitimate Google review
        windows, not the stuck states from a sync that quietly broke.
      </p>
    </BlogLayout>
  )
}
