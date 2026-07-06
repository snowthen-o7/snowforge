import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Supplemental feeds, done right: patching a primary feed without breaking it · SnowForge',
  description:
    'A supplemental feed is a scalpel for fixing specific fields. Used as a second primary, it becomes a source of conflicts. Here is the line.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Supplemental feeds, done right: patching a primary feed without breaking it"
      date="July 1, 2026"
      dek="A supplemental feed is a scalpel for fixing specific fields. Used as a second primary, it becomes a source of conflicts. Here is the line."
    >
      <p>
        A supplemental feed in Google Merchant Center is one of the most
        useful and most misused tools in the feed toolbox. Done right, it lets
        you fix or enrich specific fields without touching your source of
        truth. Done wrong, it becomes a shadow primary feed that fights the
        real one and leaves you debugging which value won. The difference is
        entirely about discipline.
      </p>

      <h2>What it actually is</h2>
      <p>
        A supplemental feed does not stand alone. It is keyed by{' '}
        <code>id</code> to your primary feed and overrides or adds only the
        fields it contains, leaving everything else untouched. Think of it as
        a patch: same product IDs, a handful of columns, applied on top of the
        primary. If a product is not in the primary, the supplemental cannot
        conjure it; it can only modify what is already there.
      </p>

      <h2>The jobs it is perfect for</h2>
      <p>
        Use it when you need to change a narrow slice without rewriting your
        export. Adding <code>custom_label</code> values for campaign
        segmentation. Overriding bad or generic titles for Shopping
        specifically, while leaving your storefront titles alone. Correcting
        <code>google_product_category</code> on a problem set. Adding
        promotional IDs. Excluding a subset of products. All of these are
        targeted edits to specific fields on specific products, which is
        exactly what a supplemental feed is built for.
      </p>

      <h2>The trap: turning it into a second primary</h2>
      <p>
        The misuse is loading a supplemental feed with most of the catalog and
        most of the fields, so it effectively becomes a competing primary.
        Now two feeds claim authority over the same data, the resolution rules
        are subtle, and a wrong value in either one is a hunt to track down.
        The symptom is a product showing a value that appears in neither feed
        you were looking at, because you were looking at the wrong one. Keep
        the supplemental narrow and it stays a patch; let it sprawl and it
        becomes a conflict.
      </p>

      <h2>The rules that keep it clean</h2>
      <p>
        Override only what you must, never re-state fields the primary already
        gets right. Keep one supplemental feed per clear purpose rather than
        one giant catch-all, so each has an obvious owner and reason. Document
        what each one overrides, because future-you will not remember. And
        make sure every row keys to a real <code>id</code> in the primary;
        orphan rows that match nothing are silent dead weight that makes the
        whole setup look more complicated than it is.
      </p>

      <h2>The deeper principle</h2>
      <p>
        A supplemental feed is a layering tool, and layering only helps when
        each layer has a single, clear job. The moment a layer tries to do
        everything, you have not added flexibility, you have added a second
        place for the truth to live, and two sources of truth is just zero
        sources of truth with extra steps. Patch narrowly, or do not patch at
        all.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe treats overrides as exactly that, scoped, documented edits on
        top of one canonical product, so you get the flexibility of
        supplemental data without the two-feeds-fighting problem. It is at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>.
      </p>
    </BlogLayout>
  )
}
