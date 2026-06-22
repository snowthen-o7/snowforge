import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'How often should your product feed actually refresh? · SnowForge',
  description:
    'More often is the wrong default. The right cadence depends on what changes, what the channel does with it, and what it costs you.',
}

export default function Post() {
  return (
    <BlogLayout
      title="How often should your product feed actually refresh?"
      date="June 22, 2026"
      dek="More often is the wrong default. The right cadence depends on what changes, what the channel does with it, and what it costs you."
    >
      <p>
        Ask how often a product feed should refresh and the instinctive
        answer is &ldquo;as often as possible.&rdquo; It feels safer. It is
        usually wrong. A feed that rebuilds every few minutes mostly burns
        compute and API quota to re-send data that did not change, and it can
        actively hurt you. The right cadence falls out of three questions:
        what changes, what the channel does with the change, and what each
        refresh costs.
      </p>

      <h2>What actually changes</h2>
      <p>
        Catalog data is not uniform in volatility. Titles, descriptions,
        images, categories, and identifiers change rarely, on the order of
        once a campaign or once a season. Price and availability change
        constantly, especially during sales and at the edges of stock. If you
        refresh the whole feed on one fast schedule, you are paying the price
        of the volatile fields to move the stable ones for no reason. The
        first optimization is to stop treating the catalog as one blob: the
        fields that move hourly and the fields that move monthly do not need
        the same cadence.
      </p>

      <h2>What the channel does with it</h2>
      <p>
        There is a difference between how often you <em>refresh</em> the feed
        and how often the channel <em>fetches and processes</em> it. You can
        rebuild every minute, but Google fetches a scheduled feed on its own
        cadence and re-reviews on its own clock. Pushing more frequently than
        the channel ingests is pure waste. For genuinely time-sensitive
        changes, price and availability, the answer is usually not a faster
        full feed but the targeted mechanism the channel provides for it, so
        the urgent fields move quickly while the rest ride the daily build.
      </p>

      <h2>What it costs</h2>
      <p>
        This is the part that bites indie and mid-market operators. Every
        refresh is compute, and on serverless infrastructure a cron that
        fires too often can keep a database awake around the clock and turn a
        few dollars a month into a few hundred. I have watched a feed
        scheduler set to every five minutes quietly pin a database that would
        otherwise scale to zero, and the only symptom was the bill. The
        cadence question is a cost question wearing a freshness costume.
      </p>

      <h2>A cadence that holds up</h2>
      <p>
        For most stores the durable pattern is tiered. Rebuild the full feed
        once or twice a day, that covers titles, images, categories, and the
        slow-moving majority. Move price and availability on a faster,
        cheaper, changed-rows-only path so a sale or a sellout propagates in
        minutes without rebuilding everything. Reserve true real-time for the
        cases that genuinely need it, flash sales, tight inventory, and even
        then push deltas, not the whole catalog. The goal is freshness where
        it changes the buyer&rsquo;s decision, and stillness everywhere else.
      </p>

      <h2>The plug</h2>
      <p>
        SnowPipe schedules feeds with this in mind: a sane default cadence,
        changed-rows-only updates for the volatile fields, and the cost
        awareness that keeps a background scheduler from quietly inflating
        your infrastructure bill. It is at{' '}
        <a href="https://pipe.snowforge.dev">pipe.snowforge.dev</a>. The
        thinking behind the cost side is in the{' '}
        <a href="/blog/indie-cloud-cost">indie cloud cost</a> post, too.
      </p>
    </BlogLayout>
  )
}
