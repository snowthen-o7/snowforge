import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title:
    'Shopify metafields to product feed attributes: the mapping that actually works · SnowForge',
  description:
    'Piping Shopify metafields into material, color, size, age_group, and GTIN feed fields cleanly, including the type and normalization traps that break the mapping.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Shopify metafields to product feed attributes: the mapping that actually works"
      date="June 19, 2026"
      dek="Piping Shopify metafields into material, color, size, age_group, and GTIN feed fields cleanly, including the traps that break the mapping."
    >
      <p>
        Shopify&rsquo;s built-in product model runs out of fields fast. It has a
        title, a description, a couple of option axes, a <code>barcode</code>,
        and not much else that maps to what Google and Meta want. There is no
        native home for <code>material</code>, <code>pattern</code>,{' '}
        <code>age_group</code>, <code>gender</code>, or a reliable{' '}
        <code>gtin</code>. Metafields are where that structured data lives, and
        piping them into feed attributes cleanly is one of the highest-leverage
        things you can do for feed quality. It is also where a lot of mappings
        quietly go wrong.
      </p>

      <h2>Why metafields, and where they live</h2>
      <p>
        A metafield is a typed, namespaced piece of extra data attached to a
        product or a variant. You define, say, <code>custom.material</code> and
        fill it with <code>cotton</code>, and now every product carries a
        structured material value instead of you trying to scrape it out of the
        description. The two things to keep straight from the start are{' '}
        <em>level</em> and <em>type</em>. Level is whether the metafield sits on
        the product or on the individual variant. Type is what kind of value it
        holds, single-line text, a list, a number, a reference to a metaobject.
        Both decide how you have to read it in the transform.
      </p>

      <h2>The level trap: product vs variant</h2>
      <p>
        Feed attributes are per-variant, because a feed row is a variant. So an
        attribute that legitimately differs by variant, <code>size</code>,{' '}
        <code>color</code>, <code>gtin</code>, has to come from variant-level
        data, while an attribute that is the same across the whole product,{' '}
        <code>brand</code>, <code>material</code> on a single-fabric item, can
        come from a product-level metafield and be copied down to every row. Put
        a per-variant fact in a product-level metafield and you lose the
        variation; try to read a product-level metafield off a variant and it is
        simply not there. Decide the level to match how the attribute actually
        varies.
      </p>

      <h2>The type trap: text, lists, and metaobjects</h2>
      <p>
        A metafield&rsquo;s type changes the shape of what you read. A
        single-line text metafield gives you a string. A{' '}
        <code>list.single_line_text</code> gives you an array, and if you drop
        that straight into a feed field you get a stringified list where you
        wanted one value, or a joined blob where the channel wanted the first
        item. A metaobject reference gives you a handle you then have to resolve
        to the actual value. The mapping has to know each source metafield&rsquo;s
        type and read it accordingly, rather than assuming everything is a plain
        string.
      </p>

      <h2>Normalize to the channel&rsquo;s accepted values</h2>
      <p>
        This is the step people skip, and it is where good source data still
        produces disapprovals. Several feed attributes only accept values from a
        fixed list, and your metafield&rsquo;s free text has to be normalized to
        match:
      </p>
      <ul>
        <li>
          <strong>age_group</strong> accepts a closed set:{' '}
          <code>newborn</code>, <code>infant</code>, <code>toddler</code>,{' '}
          <code>kids</code>, <code>adult</code>. A metafield that says{' '}
          <code>Children</code> or <code>baby</code> has to be mapped onto one
          of those.
        </li>
        <li>
          <strong>gender</strong> accepts <code>male</code>,{' '}
          <code>female</code>, <code>unisex</code>. <code>Men</code>,{' '}
          <code>Mens</code>, and <code>M</code> all need to resolve to{' '}
          <code>male</code>.
        </li>
        <li>
          <strong>size / size_system / size_type</strong> want consistent
          values, and Google reads size best when the size system is declared
          rather than guessed.
        </li>
        <li>
          <strong>color</strong> should be a real color word, not a marketing
          name; <code>Midnight Dream</code> needs to become{' '}
          <code>Blue</code> (you can keep the fancy name too, primary color
          first).
        </li>
      </ul>
      <p>
        The normalization is a lookup from your values to the channel&rsquo;s
        accepted values, maintained in one place. Without it, a perfectly
        populated metafield still yields an invalid attribute.
      </p>

      <h2>GTIN from a metafield instead of barcode</h2>
      <p>
        The <code>barcode</code> field is the usual GTIN source, but if your
        store already misuses it for internal codes, a dedicated GTIN metafield
        is cleaner. Either way the rule from the identifier side still applies:
        validate the value (length, numeric, check digit) before sending it as{' '}
        <code>gtin</code>, and fall back to <code>identifier_exists=no</code>{' '}
        when there genuinely is no identifier. A metafield does not make a bad
        GTIN good; it just gives you a tidier place to keep the good one.
      </p>

      <h2>The mapping that holds up</h2>
      <p>
        The version that survives a growing catalog is a declared mapping, not
        code scattered through an export script: a table that says{' '}
        <em>this metafield, at this level, of this type, maps to this feed
        attribute, normalized through this lookup</em>. New attribute? Add a row.
        Channel changes its accepted values? Edit the lookup. When the mapping is
        data rather than buried logic, you can see the whole thing at a glance
        and reason about why a field came out the way it did. That is the
        difference between a mapping you trust and one you re-debug every time
        Merchant Center complains.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe reads product- and variant-level Shopify metafields, handles
        the list and metaobject types, normalizes values to each channel&rsquo;s
        accepted set, and validates identifiers on the way through, all from a
        mapping you can see rather than code you have to trace. It is at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>, with a free
        tier for smaller stores.
      </p>
    </BlogLayout>
  )
}
