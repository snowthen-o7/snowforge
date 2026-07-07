import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title:
    'GTIN, MPN, and brand: the identifier rules that get products disapproved · SnowForge',
  description:
    'The identifier_exists and invalid-GTIN disapprovals decoded, with the decision tree for when each identifier is required, optional, or correctly absent.',
}

export default function Post() {
  return (
    <BlogLayout
      title="GTIN, MPN, and brand: the identifier rules that get products disapproved"
      date="June 27, 2026"
      dek="The identifier_exists and invalid-GTIN disapprovals decoded, with the decision tree for when each identifier is required, optional, or correctly absent."
    >
      <p>
        Unique product identifiers are the single most common source of
        Merchant Center disapprovals I see on Shopify catalogs, and almost all
        of it comes from one confusion: treating identifiers as a box to fill
        rather than a set of rules with real exceptions. Google uses{' '}
        <code>gtin</code>, <code>mpn</code>, and <code>brand</code> to match
        your product to the same product elsewhere on the web. When they are
        wrong, or wrongly claimed to exist, the product gets pulled. When they
        are correctly absent, the product should still be fine, and merchants
        break it by forcing a value in anyway.
      </p>

      <h2>What each identifier is actually for</h2>
      <p>
        <code>gtin</code> is the barcode number the manufacturer assigned:
        UPC (12 digits), EAN (13), ISBN for books, or the 8- and 14-digit
        variants. It is globally unique and it is the strongest match Google
        has. <code>mpn</code> is the manufacturer&rsquo;s own part number,
        unique only within that brand. <code>brand</code> is the brand a
        shopper would recognize. The rule Google actually applies is: for a{' '}
        <em>new, branded</em> product that has a GTIN, send the GTIN. For a
        branded product with no GTIN, send <code>brand</code> plus{' '}
        <code>mpn</code>. For a product that genuinely has no identifiers,
        say so explicitly.
      </p>

      <h2>The invalid-GTIN disapproval</h2>
      <p>
        This one is mechanical, which makes it the easiest to fix and the
        easiest to prevent. A GTIN is not just &ldquo;a number in the barcode
        field.&rdquo; It has to be the right length (8, 12, 13, or 14 digits),
        it has to be numeric, and the final digit is a check digit computed
        from the others. Google validates that check digit. If your{' '}
        <code>barcode</code> field holds a warehouse bin number, a truncated
        UPC, or a value someone typed by hand and fat-fingered, it fails the
        checksum and the product is disapproved for an invalid GTIN even
        though the field was populated.
      </p>
      <p>
        The check digit uses a mod-10 weighting: from the right, multiply
        alternating digits by 3 and 1, sum them, and the check digit is
        whatever makes that sum a multiple of ten. You do not need to
        implement this by memory, but you do need to run it in your transform.
        Validating the checksum before export catches the malformed GTINs that
        Merchant Center would otherwise catch for you a day later, at the cost
        of a disapproval.
      </p>

      <h2>When identifier_exists=no is the correct answer</h2>
      <p>
        Here is the part merchants get backwards. <code>identifier_exists</code>{' '}
        defaults to <code>yes</code>. You set it to <code>no</code> when the
        product legitimately has no GTIN and no manufacturer part number, and
        that is not a failure state, it is the honest one. Genuinely
        identifier-free products include:
      </p>
      <ul>
        <li>Custom-made, handmade, or made-to-order goods.</li>
        <li>
          Your own private-label or store-brand products that were never
          assigned a GTIN.
        </li>
        <li>Vintage and one-of-a-kind items.</li>
        <li>
          Books and media old enough to predate the identifier system.
        </li>
      </ul>
      <p>
        For these, forcing a fake GTIN or copying a similar product&rsquo;s
        barcode is far worse than declaring none: a duplicated or wrong GTIN
        can attach your listing to a different product entirely. Set{' '}
        <code>identifier_exists</code> to <code>no</code>, supply a good{' '}
        <code>title</code>, <code>description</code>, and{' '}
        <code>google_product_category</code>, and let the product through on
        its own content.
      </p>

      <h2>The brand + MPN fallback</h2>
      <p>
        Between &ldquo;has a GTIN&rdquo; and &ldquo;has nothing&rdquo; sits the
        common middle case: a branded product with no barcode you can find. If
        you have the brand and the manufacturer part number, send both. That
        pair is a valid identifier set for most categories, and it keeps you
        out of the <code>identifier_exists=no</code> bucket while you chase
        down the real GTIN. Note that <code>brand</code> alone is not enough,
        and neither is <code>mpn</code> alone; Google wants the pair when there
        is no GTIN.
      </p>
      <p>
        There is one category exception worth knowing: for apparel and
        accessories, Google does not require GTINs the way it does for, say,
        electronics, because a lot of clothing simply is not sold with them.
        You still send whatever identifiers you have, but the absence of a
        GTIN on a t-shirt is not the automatic problem it would be on a
        branded appliance.
      </p>

      <h2>The decision tree</h2>
      <p>
        Put together, the logic your feed transform should encode is short:
      </p>
      <ul>
        <li>
          Does the value in <code>barcode</code> pass length, numeric, and
          check-digit validation? If yes, send it as <code>gtin</code> and stop.
        </li>
        <li>
          If no valid GTIN but you have <code>brand</code> and <code>mpn</code>,
          send both and leave <code>identifier_exists</code> at its default.
        </li>
        <li>
          If the product genuinely has none of these, set{' '}
          <code>identifier_exists</code> to <code>no</code> and lean on strong
          title, description, and category.
        </li>
        <li>
          Never invent, pad, or copy an identifier to fill the field. A wrong
          GTIN is worse than a declared-absent one.
        </li>
      </ul>

      <h2>Why this is a transform problem, not a data-entry problem</h2>
      <p>
        The instinct is to fix identifiers by cleaning the source: go find
        every missing barcode, back-fill every MPN. That never finishes,
        because new products arrive faster than you can research them. The
        durable fix is a rule in the pipeline that classifies each product
        into one of the three cases above every time it exports, so a
        malformed barcode becomes a declared-absent identifier automatically
        instead of a disapproval. You decide the policy once; the feed applies
        it forever.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe runs exactly this classification on every export: check-digit
        validation on GTINs, the brand-plus-MPN fallback, and{' '}
        <code>identifier_exists=no</code> set correctly for genuinely
        identifier-free products, with row-level tracking when one still gets
        flagged. It is at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>, with a
        free tier for smaller catalogs.
      </p>
    </BlogLayout>
  )
}
