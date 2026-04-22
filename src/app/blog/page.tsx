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
