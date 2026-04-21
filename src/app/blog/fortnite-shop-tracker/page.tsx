import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'How SnowFort tracks the Fortnite shop (and why the math matters) · SnowForge',
  description:
    'Item rotation patterns, V-Buck price drift, and why a shop tracker only earns trust if the data is honest.',
}

export default function Post() {
  return (
    <BlogLayout
      title="How SnowFort tracks the Fortnite shop (and why the math matters)"
      date="April 20, 2026"
      dek="Item rotation patterns, V-Buck price drift, and why a shop tracker only earns trust if the data is honest."
    >
      <p>
        The Fortnite item shop rotates every day at 00:00 UTC. For the
        players who care, the shop is a small piece of theater: a handful
        of cosmetics leave, a handful return, some have been gone for
        400 days and people have been waiting. There are a dozen websites
        that already track today&rsquo;s shop. What none of them do well
        is tell you the moment a specific skin you&rsquo;ve been waiting
        on finally comes back. That&rsquo;s the gap SnowFort fills.
      </p>

      <h2>How the notifications work</h2>
      <p>
        Here&rsquo;s the flow that matters. You browse the catalog, find
        items you like, tap Add to Watchlist. When the daily shop
        rotation pulls at midnight UTC, SnowFort compares the new shop
        against everyone&rsquo;s watchlists. If something on yours came
        back, you get an email within seconds. Premium users get the
        same alert by SMS and Discord DM on top, so the moment the shop
        rotates you know whether to open Fortnite.
      </p>
      <p>
        The 400-day skin problem is the use case that motivated the
        whole project. Without a tracker, you either open the shop every
        single day at midnight hoping to catch your item, or you miss it
        and wait another unknowable stretch. The watchlist collapses
        that worry into one notification when it actually matters.
      </p>

      <h2>What the data actually looks like</h2>
      <p>
        SnowFort pulls the daily shop from a community API around
        midnight UTC, stores every item appearance as a{' '}
        <code>shop_history</code> row (item, date, price), and never
        throws the old rows away. That history, across 8+ years of
        rotations, is the substrate. Every query the tracker runs is
        against that history.
      </p>
      <p>
        Two things fall out of it that I haven&rsquo;t seen other
        trackers show well. First: <strong>average rotation gap</strong>.
        If you average the days between a given item&rsquo;s consecutive
        shop appearances, you get a sense of cadence. Some skins cluster
        tight, reappearing every 40&ndash;60 days. Others have rotation
        gaps above a year. That distribution has structure: rarity, age,
        and event tie-ins all seem to matter. The exact shape of the
        correlation is still something I&rsquo;m working out, and
        honestly it&rsquo;s the most fun part of the project.
      </p>
      <p>
        Second: <strong>price drift</strong>. Skins don&rsquo;t always
        sell at the same V-Buck price across appearances. Epic adjusts,
        especially on bundles, and especially as an item ages. Seeing
        the min/max price range for a specific item tells you whether
        waiting for the next rotation is worth it or whether the price
        has been stable.
      </p>

      <h2>Why the tracker is ad-supported</h2>
      <p>
        The catalog is 25,000+ items. Each item has its own detail page,
        each detail page pulls its own history from the database. Hosting
        that at a cost a solo developer can sustain requires either ads
        or paid subscriptions. I chose both, on purpose. The public pages
        carry modest advertising, and a $4-per-month premium tier removes
        ads, adds SMS and Discord notifications, and lifts the watchlist
        cap. That split means users get to choose how they&rsquo;d
        prefer to support the project, and the project gets to serve
        both audiences well.
      </p>

      <h2>The &ldquo;honest&rdquo; part</h2>
      <p>
        A tracker only earns trust if the numbers are defensible. A
        tempting shortcut is to compute &ldquo;historical price
        average&rdquo; and show it prominently. It looks impressive. But
        if the item has only appeared twice and the two appearances had
        the same price, the average doesn&rsquo;t really mean anything.
        Worse, showing a big number there implies precision the data
        can&rsquo;t support.
      </p>
      <p>
        SnowFort&rsquo;s item detail pages only show stats that have
        enough underlying data to support them. If an item has appeared
        once, the detail page says &ldquo;first seen, still the current
        price.&rdquo; If it has appeared fifty times across four years,
        the detail page shows rotation cadence and price range. The
        goal is that every number on the page earns its place.
        That&rsquo;s a small commitment, but it&rsquo;s one I take
        seriously.
      </p>

      <h2>What&rsquo;s coming</h2>
      <p>
        The next things I want to build: rotation cadence visualizations
        (a small timeline on each item page showing every prior
        appearance), set-level rotation analysis (does the whole set
        usually rotate together?), and smarter watchlist digest emails
        so users don&rsquo;t get four separate emails on a day when
        four of their items return.
      </p>
      <p>
        SnowFort lives at{' '}
        <a href="https://fort.snowforge.dev">fort.snowforge.dev</a>. It
        is not affiliated with Epic Games, and every trademark belongs
        to whoever owns it. If you spot a data bug or want to suggest
        a feature, email{' '}
        <a href="mailto:support@snowforge.dev">support@snowforge.dev</a>.
      </p>
    </BlogLayout>
  )
}
