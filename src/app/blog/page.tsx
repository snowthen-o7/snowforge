import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Blog · SnowForge',
  description:
    'Notes on building small software, e-commerce feed operations, and running an indie studio solo.',
}

const posts = [
  {
    slug: 'running-seven-apps-solo',
    title: "Running seven apps solo: the systems that make it survivable",
    dek: "One person, seven apps, nights and weekends. It only works because of systems, not heroics. Here are the ones that carry the weight.",
    date: '2026-06-28',
  },
  {
    slug: 'polite-web-scraping',
    title: "The polite, legal way to scrape public web data",
    dek: "Most web scraping is legitimate. The difference between responsible data collection and getting banned is in how you do it.",
    date: '2026-06-26',
  },
  {
    slug: 'faceless-video-pipelines',
    title: "Faceless video pipelines: what scales and what just burns money",
    dek: "Automated short-form video is sold as passive income. The pipeline is real, but the cost cliffs are not where people expect.",
    date: '2026-06-24',
  },
  {
    slug: 'product-feed-refresh-cadence',
    title: "How often should your product feed actually refresh?",
    dek: "More often is the wrong default. The right cadence depends on what changes, what the channel does with it, and what it costs you.",
    date: '2026-06-22',
  },
  {
    slug: 'nba-injury-reports-signal',
    title: "NBA injury reports as a market signal: what the data does and does not say",
    dek: "Injury designations carry real information, but the edge is in the timing and the noise, not the obvious headline.",
    date: '2026-06-20',
  },
  {
    slug: 'shopping-feed-anatomy',
    title: "A field-by-field anatomy of a Google Shopping product feed",
    dek: "What every required and recommended attribute actually does, and the gotcha hiding in each one.",
    date: '2026-06-18',
  },
  {
    slug: 'scanning-mtg-cards-ocr',
    title: "Scanning a Magic: The Gathering collection with a phone camera: the OCR reality",
    dek: "Reading a card name off a phone camera sounds trivial. The edge cases are where a collection scanner actually lives or dies.",
    date: '2026-06-16',
  },
  {
    slug: 'feed-rules-by-channel',
    title: "One product feed, three rule sets: Google, Meta, and TikTok",
    dek: "You build the feed once, but Google Shopping, Meta Commerce, and TikTok each reject it for different reasons. Here is where the rules actually diverge.",
    date: '2026-06-14',
  },
  {
    slug: 'reading-league-meta-from-data',
    title: "Reading the League of Legends meta from match data, not vibes",
    dek: "Win rate, pick rate, and ban rate tell a real story, but only if you read them with sample size, rank, and patch timing in mind.",
    date: '2026-06-12',
  },
  {
    slug: 'common-gmc-disapprovals',
    title: "The Google Merchant Center disapprovals that quietly cost you sales",
    dek: "Five disapproval reasons account for most of the lost revenue in Merchant Center. Here is what each one really means and the fix that actually scales.",
    date: '2026-06-10',
  },
  {
    slug: 'indie-cloud-cost',
    title: 'The cost of indie cloud: my real bill across 7 apps',
    dek: 'Real numbers from a seven-app portfolio in May 2026, the three incidents that drove the bill up, and the fixes that brought it back down.',
    date: '2026-05-10',
  },
  {
    slug: 'auditing-feeds-before-you-push',
    title: 'Audit your product feed before you push it',
    dek: 'Most GMC disapprovals are preventable if you audit the feed before you push it. Here is the eight-check list I use on real catalogs.',
    date: '2026-05-06',
  },
  {
    slug: 'building-snowforge',
    title: 'Why I&rsquo;m building SnowForge from a day-job desk',
    dek: 'A small studio, a handful of apps, and a slow build towards software I&rsquo;m genuinely excited to maintain.',
    date: '2026-04-18',
  },
  {
    slug: 'why-product-feeds-break',
    title: 'Why product feeds break, and how to stop patching them',
    dek: 'Ten years of Shopify and Google Merchant pipelines taught me that the bugs are always in the same three places.',
    date: '2026-04-19',
  },
  {
    slug: 'fortnite-shop-tracker',
    title: 'How SnowFort tracks the Fortnite shop (and why the math matters)',
    dek: 'Item rotation patterns, V-Buck price drift, and why a shop tracker only earns trust if the data is honest.',
    date: '2026-04-20',
  },
]

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <LandingHeader />
      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          Blog
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          Working notes
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Short essays on building small software, e-commerce feeds, and
          running an indie studio on nights and weekends.
        </p>

        <ul className="mt-12 space-y-8">
          {posts.map((p) => (
            <li key={p.slug} className="border-t border-border pt-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
                {p.date}
              </p>
              <h2 className="mt-2 font-display text-2xl font-medium text-foreground">
                <Link
                  href={`/blog/${p.slug}`}
                  className="hover:underline decoration-warmth-start decoration-2 underline-offset-4"
                  dangerouslySetInnerHTML={{ __html: p.title }}
                />
              </h2>
              <p className="mt-2 text-muted-foreground">{p.dek}</p>
              <Link
                href={`/blog/${p.slug}`}
                className="mt-3 inline-block text-sm text-foreground underline decoration-warmth-start decoration-2 underline-offset-4"
              >
                Read →
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <LandingFooter />
    </main>
  )
}
