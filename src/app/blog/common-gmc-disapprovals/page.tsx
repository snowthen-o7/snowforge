import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title:
    'The Google Merchant Center disapprovals that quietly cost you sales · SnowForge',
  description:
    'Five disapproval reasons account for most of the lost revenue in Merchant Center. Here is what each one really means and the fix that actually scales.',
}

export default function Post() {
  return (
    <BlogLayout
      title="The Google Merchant Center disapprovals that quietly cost you sales"
      date="June 10, 2026"
      dek="Five disapproval reasons account for most of the lost revenue in Merchant Center. Here is what each one really means and the fix that actually scales."
    >
      <p>
        A disapproved product in Google Merchant Center is not an error you
        see. There is no failed job, no red banner on your storefront, no
        email from a customer. The product simply stops showing in Shopping
        results, and the only signal is a number going quietly down. By the
        time most merchants notice, they have been paying for the gap for
        weeks.
      </p>
      <p>
        After a decade of running Shopping feeds, I can tell you that the
        long tail of disapproval reasons is real, but five of them account
        for most of the lost revenue. Here is what each one actually means
        and the fix that holds up past the first thousand products.
      </p>

      <h2>1. &ldquo;Missing identifier&rdquo; (identifier_exists)</h2>
      <p>
        Google wants a unique identifier for branded products: a GTIN, an
        MPN, or both. The trap is that Shopify&rsquo;s only native home for
        a GTIN is the variant <code>barcode</code> field, which store owners
        also use for warehouse bin numbers, internal SKUs, or nothing at
        all. Map <code>barcode</code> straight to <code>gtin</code> and a
        chunk of your catalog gets disapproved the moment a barcode is empty
        or invalid.
      </p>
      <p>
        The fix is not to chase down every missing barcode. It is to
        validate: if the value is a real GTIN (length 12, 13, or 14,
        numeric, valid check digit), send it; if it is not, set{' '}
        <code>identifier_exists</code> to <code>no</code> and let the product
        through on brand plus MPN. One conditional saves more disapproved
        rows than any manual cleanup ever will.
      </p>

      <h2>2. Image problems</h2>
      <p>
        Google wants a clean product image: roughly 800 by 800 or larger, no
        promotional text, no watermarks, no borders. The most common
        offender is the &ldquo;SALE&rdquo; or &ldquo;Free shipping&rdquo;
        badge a marketing team burned into the hero image months ago.
        Promotional overlays are an automatic disapproval, and they are
        invisible in your feed because the feed only carries a URL.
      </p>
      <p>
        Resize at export time and you scale your problems linearly with
        product count. The approach that lasts is one channel-ready image
        per product, stored once, with the badge-free version reserved for
        the feed. Decide the image policy upstream, not in the
        transformation.
      </p>

      <h2>3. &ldquo;Mismatched value: price&rdquo;</h2>
      <p>
        This one confuses people because the feed price is correct. Google
        crawls your landing page, reads the price out of the on-page
        structured data or visible markup, and compares it to the feed. If
        the page says one number and the feed says another, even for a few
        minutes during a sale, the product is disapproved for a price
        mismatch.
      </p>
      <p>
        The usual cause is a sale that updates the storefront instantly but
        reaches the feed on the next scheduled push. The fix is to make the
        feed and the page read from the same source of truth and update
        together, and to include tax and currency exactly the way the page
        presents them. Most price mismatches are timing bugs, not pricing
        bugs.
      </p>

      <h2>4. Availability and landing-page mismatch</h2>
      <p>
        Inventory lives in more places than any other field. In Shopify a
        single variant can have stock across several locations, each with
        its own committed quantity. The feed has to decide what counts as
        &ldquo;in stock,&rdquo; and Google separately checks that the
        landing page agrees. Mark a product available in the feed while the
        product page shows it sold out, and you earn a mismatch
        disapproval, plus a wasted click if it slips through.
      </p>
      <p>
        Pick one explicit availability policy per store, sum minus committed
        minus a buffer is a fine default, write it down in the feed config,
        and stop re-deciding it in code. When the policy is implicit, every
        engineer who touches the export quietly applies their own.
      </p>

      <h2>5. Account-level &ldquo;Misrepresentation&rdquo;</h2>
      <p>
        The item-level reasons above cost you products. This one costs you
        the whole account. Misrepresentation is Google&rsquo;s catch-all for
        trust: a missing or thin refund and returns policy, no real contact
        information, prices or promotions on the site that do not match the
        ad, or checkout that feels unsafe. It is the hardest to debug
        because the message is vague on purpose.
      </p>
      <p>
        Treat it as a storefront-credibility checklist, not a feed problem.
        Clear refund, shipping, and contact pages. Consistent business name
        and pricing everywhere. A secure, working checkout. Most
        misrepresentation flags come from the website, not the catalog.
      </p>

      <h2>The thing that actually fixes all five</h2>
      <p>
        Every one of these fails silently at the row level. Your pipeline
        reports success because it wrote fifty thousand rows; it has no idea
        that three thousand of them never made it past review. The single
        highest-leverage change is to treat disapprovals as a monitored
        metric: capture every rejected row with its specific reason, linked
        back to the source product, and watch the number the way you watch
        revenue. Once the feed stops being a black box, the fixes above are
        obvious and the lost sales stop being a surprise.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe does these fixes by default: identifier validation,
        channel-ready image routing, an explicit availability policy per
        store, and row-level disapproval tracking with a dashboard so the
        feed stops being a black box. If you run a Shopify store pushing to
        Google Merchant or Meta, it is
        at <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>. There
        is a free tier. If you try it and it falls short, email me and tell
        me where.
      </p>
    </BlogLayout>
  )
}
