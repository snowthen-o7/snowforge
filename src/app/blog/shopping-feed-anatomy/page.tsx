import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'A field-by-field anatomy of a Google Shopping product feed · SnowForge',
  description:
    'What every required and recommended attribute in a Google Shopping feed actually does, and the gotcha hiding in each one.',
}

export default function Post() {
  return (
    <BlogLayout
      title="A field-by-field anatomy of a Google Shopping product feed"
      date="June 18, 2026"
      dek="What every required and recommended attribute actually does, and the gotcha hiding in each one."
    >
      <p>
        Most feed problems are not exotic. They are one of a dozen
        well-understood attributes being wrong in a quiet way. So here is the
        anatomy: the fields that matter in a Google Shopping feed, what each
        one is really for, and the trap that comes with it. Keep this next to
        your transformation and you will catch most issues before Merchant
        Center does.
      </p>

      <h2>The fields that get you rejected if they are wrong</h2>
      <p>
        <code>id</code> is the stable key for a variant. The gotcha: it must
        never change. Regenerate IDs on every export (because you keyed them
        off array position instead of the variant&rsquo;s own identifier) and
        Google sees a churn of products appearing and disappearing, which
        hurts you.
      </p>
      <p>
        <code>title</code> drives relevance. Front-load brand and product
        type; Google weights the early words. The trap is templated titles
        that read as keyword soup, which suppress rather than help.{' '}
        <code>description</code> is lower-weight but still indexed, so write
        for a human, not a crawler.
      </p>
      <p>
        <code>link</code> and <code>image_link</code> are where silent
        failures hide. The link must resolve to a live, in-stock landing page
        with a price that matches the feed. The image must be clean, large
        enough, and badge-free. Both carry a URL only, so the feed looks fine
        even when the destination is broken.
      </p>
      <p>
        <code>price</code> and <code>availability</code> must match the
        landing page at crawl time. A sale that updates the storefront
        instantly but the feed on the next push is the most common price
        mismatch there is. <code>availability</code> needs an explicit policy
        for what &ldquo;in stock&rdquo; means across your inventory
        locations.
      </p>
      <p>
        <code>brand</code> plus <code>gtin</code> or <code>mpn</code> are the
        identifier set. Validate the GTIN (length, numeric, valid check
        digit) instead of trusting the barcode field, and set{' '}
        <code>identifier_exists</code> to <code>no</code> for genuinely
        unbranded or custom products rather than leaving it ambiguous.
      </p>

      <h2>The fields that decide who sees the product</h2>
      <p>
        <code>google_product_category</code> places you in Google&rsquo;s
        official taxonomy, and getting it wrong does not always reject the
        product, it just shows it to the wrong searches.{' '}
        <code>product_type</code> is your own free-text category and is great
        for structuring campaigns, so use both: the official one for Google,
        your own for your bid strategy.
      </p>
      <p>
        <code>condition</code> (new, used, refurbished) is required and
        trivially easy to get wrong on resale inventory.{' '}
        <code>item_group_id</code> ties variants of the same product
        together; every color and size of one shirt should share it, with
        distinct <code>color</code>, <code>size</code>, and{' '}
        <code>material</code> attributes. Skip this and Google treats your
        variants as unrelated products, which fragments performance.
      </p>

      <h2>The fields people forget until a disapproval forces them</h2>
      <p>
        <code>shipping</code> and <code>tax</code> can be set in the feed or
        in account settings, and the two disagreeing is a real source of
        disapprovals. <code>sale_price</code> and{' '}
        <code>sale_price_effective_date</code> exist precisely so a promotion
        can be expressed in the feed instead of fought through a price
        mismatch. <code>custom_label_0</code> through{' '}
        <code>custom_label_4</code> carry nothing to Google but everything to
        your campaign segmentation; bestseller, margin tier, and season live
        here.
      </p>

      <h2>The meta-point</h2>
      <p>
        Notice the pattern: the dangerous fields are the ones that carry a
        reference (a URL, an identifier, a category) rather than a value. The
        feed can be perfectly formed and still point at a broken page, an
        invalid GTIN, or the wrong category. That is why validation has to
        check what the references resolve to, not just that the columns are
        present.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe maps a Shopify (or other) catalog into exactly these fields
        with the validation built in: identifier checks, category mapping,
        variant grouping, and row-level tracking when a field still gets a
        product disapproved. It is at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a> if you
        would rather not hand-maintain the mapping.
      </p>
    </BlogLayout>
  )
}
