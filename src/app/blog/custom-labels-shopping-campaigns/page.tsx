import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title:
    'Custom labels for Shopping campaigns: a segmentation scheme that scales · SnowForge',
  description:
    'How to use custom_label_0 through custom_label_4 for margin, season, and velocity bidding without turning your feed into a mess of one-off flags.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Custom labels for Shopping campaigns: a segmentation scheme that scales"
      date="June 21, 2026"
      dek="How to use custom_label_0 through custom_label_4 for margin, season, and velocity bidding without turning your feed into a mess of one-off flags."
    >
      <p>
        Custom labels are the one part of the feed that carries nothing to the
        shopper and everything to you. <code>custom_label_0</code> through{' '}
        <code>custom_label_4</code> are five free-text slots Google never shows
        to a buyer and never uses to match your product. They exist purely so
        you can subdivide your catalog inside Shopping campaigns and bid on the
        slices that matter. Used well, they are the difference between bidding
        on your whole catalog as one blob and bidding on your bestsellers, your
        high-margin lines, and your clearance separately. Used carelessly, they
        become five columns of inconsistent junk nobody trusts.
      </p>

      <h2>What they are, precisely</h2>
      <p>
        You get exactly five labels, numbered 0 to 4. Each holds free text, one
        value per product. They are invisible to shoppers and have no effect on
        whether or where a product shows; their only consumer is the campaign
        structure you build in Google Ads, where you can subdivide product
        groups by a custom label and set bids, budgets, or whole campaigns
        against each value. That is the entire feature. The discipline is all in
        how you decide what goes in the five slots.
      </p>

      <h2>The mistake: labels as ad-hoc flags</h2>
      <p>
        The failure mode is treating the five labels as scratch space. Someone
        needs a &ldquo;summer&rdquo; tag, so it goes in <code>custom_label_0</code>.
        Next month someone needs a margin flag and puts it in{' '}
        <code>custom_label_0</code> too, on a different set of products. Now
        label 0 means two things depending on the row, the values are a mix of{' '}
        <code>summer</code>, <code>high-margin</code>, and{' '}
        <code>true</code>, and no one can build a reliable product group on it.
        Five slots is a hard limit, so squandering them on one-offs is
        expensive.
      </p>

      <h2>The scheme: one dimension per slot, forever</h2>
      <p>
        The scheme that scales is boring on purpose: assign each label a single,
        fixed dimension and never repurpose it. A setup that covers most stores:
      </p>
      <ul>
        <li>
          <strong>custom_label_0 — margin tier.</strong> Values like{' '}
          <code>high</code>, <code>medium</code>, <code>low</code>. Bid harder
          where the product actually makes money.
        </li>
        <li>
          <strong>custom_label_1 — velocity.</strong>{' '}
          <code>bestseller</code>, <code>steady</code>, <code>slow</code>,
          derived from recent sales. Your bestsellers deserve their own bids and
          budget protection.
        </li>
        <li>
          <strong>custom_label_2 — season.</strong>{' '}
          <code>spring</code>, <code>summer</code>, <code>fall</code>,{' '}
          <code>winter</code>, <code>year-round</code>. Push seasonal ranges up
          in their window and pull back out of it.
        </li>
        <li>
          <strong>custom_label_3 — price band.</strong>{' '}
          <code>under-25</code>, <code>25-75</code>, <code>75-plus</code>.
          Price bands often want different bidding because they convert
          differently.
        </li>
        <li>
          <strong>custom_label_4 — clearance flag.</strong>{' '}
          <code>clearance</code> or empty. A simple switch to bid aggressively
          on stock you want gone.
        </li>
      </ul>
      <p>
        The specific dimensions matter less than the rule: each slot means one
        thing, always, and its values are a small, closed set. When label 0 is
        always margin tier and always one of three values, you can build a
        product group on it with confidence a year from now.
      </p>

      <h2>Keep the values low-cardinality</h2>
      <p>
        Resist the urge to be precise. A margin label with the exact percentage
        in it (<code>37.2</code>) is useless for grouping because every value is
        unique. Buckets are the point: <code>high</code>, <code>medium</code>,{' '}
        <code>low</code>. You bid on buckets, not on continuous numbers, so
        compute the bucket in the feed and store the bucket. Three to five
        values per label is the sweet spot; twenty is a sign you are encoding
        the raw data instead of the decision.
      </p>

      <h2>Compute them, do not hand-type them</h2>
      <p>
        The reason ad-hoc labels rot is that they are maintained by hand. The
        fix is to derive every label from data at export time. Margin tier comes
        from cost and price. Velocity comes from a rolling sales window. Season
        comes from a product attribute or collection. Clearance comes from an
        inventory or tag rule. When the labels are computed, they stay correct
        as the underlying data moves, a product that stops selling drifts from{' '}
        <code>bestseller</code> to <code>slow</code> on its own, and your bids
        follow reality instead of a stale spreadsheet.
      </p>

      <h2>The payoff in the campaign</h2>
      <p>
        Once the five labels are consistent and computed, the Google Ads side
        gets simple. You subdivide a product group by <code>custom_label_0</code>{' '}
        and instantly separate high-margin from low-margin bidding. You isolate{' '}
        <code>bestseller</code> velocity into its own campaign with its own
        budget so a spike does not starve everything else. You dial seasonal
        ranges up and down on schedule. None of that is possible if the labels
        are inconsistent, and all of it is easy if they are disciplined. The
        labels are cheap; the discipline is the product.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe computes custom labels from your data on every export, margin
        tier from cost and price, velocity from a rolling sales window, season
        and clearance from your own rules, so all five slots stay consistent and
        current instead of drifting. It is at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>, with a free
        tier.
      </p>
    </BlogLayout>
  )
}
