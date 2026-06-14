import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'One product feed, three rule sets: Google, Meta, and TikTok · SnowForge',
  description:
    'You build the feed once, but Google Shopping, Meta Commerce, and TikTok each reject it for different reasons. Here is where the rules actually diverge.',
}

export default function Post() {
  return (
    <BlogLayout
      title="One product feed, three rule sets: Google, Meta, and TikTok"
      date="June 14, 2026"
      dek="You build the feed once, but Google Shopping, Meta Commerce, and TikTok each reject it for different reasons. Here is where the rules actually diverge."
    >
      <p>
        The pitch for multi-channel selling is that you maintain one product
        catalog and it flows everywhere. The reality is that you maintain one
        catalog and then quietly maintain three sets of exceptions, because
        Google Shopping, Meta Commerce, and TikTok Shop each grade the same
        feed against their own rulebook. A product that sails through one can
        get disapproved on another for a reason that does not exist on the
        first. Here is where the divergence actually lives.
      </p>

      <h2>Images</h2>
      <p>
        Google is the strictest on cleanliness: it wants a large image, plain
        background preferred, and zero promotional text or watermarks. Meta
        is more forgiving of lifestyle shots and people-in-frame, but it will
        still flag text overlays and badges. TikTok cares about aspect ratio
        more than the others, it favors portrait and square formats that fit
        a vertical feed, and a landscape-only image library will look wrong
        even when it is technically accepted. The practical consequence is
        that one image URL per product is not enough; you want a clean
        primary that satisfies Google and the option of a lifestyle or
        portrait variant for the others.
      </p>

      <h2>Identifiers</h2>
      <p>
        Google is aggressive about unique product identifiers (GTIN or MPN
        plus brand) and will suppress branded products that lack them. Meta
        is looser, it will take the product on brand and a retailer ID in
        more cases. TikTok sits in between and leans on category. If you
        built your identifier logic to satisfy Google, you are already
        covered everywhere else. If you built it to satisfy Meta, you will be
        surprised by Google. Build to the strictest standard, which is
        Google, and validate the identifier rather than passing through
        whatever sits in the barcode field.
      </p>

      <h2>Taxonomy</h2>
      <p>
        Each channel has its own category tree. Google has the Google product
        category taxonomy, a long official list. Meta maps to its own
        commerce categories. TikTok has yet another. Mis-categorize and you
        do not always get a hard rejection, you get something worse: the
        product shows, but to the wrong audience, and the spend underperforms
        for reasons that never appear in a disapproval report. Keep a single
        canonical category on each product and a per-channel mapping table,
        not a best-guess at export time.
      </p>

      <h2>Titles and attributes</h2>
      <p>
        Google reads the title hard for relevance and rewards front-loading
        the important words (brand, product, key attribute) within the first
        few. Meta surfaces less of the title and leans on the image and
        category. TikTok behaves more like a social feed, where the title is
        a hook. The same 150-character title is not optimal in all three. The
        durable approach is a structured product (brand, type, color, size,
        material as discrete fields) and a per-channel title template, so you
        compose the right title instead of writing three by hand.
      </p>

      <h2>Policy and restricted categories</h2>
      <p>
        Each platform bans or restricts a different set of products and
        claims. Supplements, alcohol, anything health-adjacent, and certain
        wording (&ldquo;cures,&rdquo; &ldquo;best,&rdquo; absolute claims)
        trip different wires on different channels. This is the one area
        where you genuinely cannot normalize, you have to know each
        platform&rsquo;s current policy and gate products per channel.
      </p>

      <h2>The pattern that survives all three</h2>
      <p>
        Do not transform your catalog three times. Keep one canonical,
        richly-structured product as the source of truth, and treat each
        channel as a <em>view</em> over it: a mapping of categories, a title
        template, an image selection rule, an identifier policy, a
        restricted-category gate. When a channel changes its rules, and it
        will, you edit one view, not a tangle of per-channel scripts. The
        feed stops being three brittle exports and becomes one model with
        three lenses.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe is built around exactly that model: one canonical product,
        per-channel transformation rules, and validation tuned to each
        destination so a row that would be disapproved gets caught before it
        ships. If you are pushing the same catalog to Google, Meta, or TikTok
        and maintaining the exceptions by hand, it is at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>.
      </p>
    </BlogLayout>
  )
}
