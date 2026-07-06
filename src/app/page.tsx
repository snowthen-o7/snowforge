import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { APPS } from '@/components/landing/apps'
import { POSTS } from '@/lib/posts'

export const metadata: Metadata = {
  title: 'SnowForge · Field notes on e-commerce feeds, web data, and small software',
  description:
    'Working notes from a solo software studio: Google Merchant Center and product feed operations, web scraping, and the craft of building small tools alone. Written by Alex Diaz.',
  alternates: { canonical: 'https://snowforge.dev/' },
}

export default function Home() {
  const [lead, ...rest] = POSTS

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <LandingHeader />

      {/* Content-hub intro */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-20 pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          SnowForge · Writing
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          Field notes on feeds, data, and small software.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          I&rsquo;m Alex Diaz. I&rsquo;ve spent a decade in e-commerce
          operations, and I build small software tools solo on nights and
          weekends. This is where I publish what I know: product feed and
          Google Merchant Center operations, responsible web scraping, and the
          reality of running a handful of apps alone. No fluff, no gated
          &ldquo;ultimate guides&rdquo; &mdash; just the working notes I wish
          I&rsquo;d had.
        </p>
        <p className="mt-4 text-sm text-ink-dim">
          New writing lands here regularly.{' '}
          <Link
            href="/about"
            className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4"
          >
            About the studio &amp; the tools &rarr;
          </Link>
        </p>
      </section>

      {/* Lead article */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-10">
        <Link href={`/blog/${lead.slug}`} className="group block">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            Latest · {lead.date}
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground group-hover:underline decoration-warmth-start decoration-2 underline-offset-4">
            <span dangerouslySetInnerHTML={{ __html: lead.title }} />
          </h2>
          <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
            {lead.dek}
          </p>
          <span className="mt-4 inline-block text-sm text-foreground underline decoration-warmth-start decoration-2 underline-offset-4">
            Read the article &rarr;
          </span>
        </Link>
      </section>

      {/* Article index */}
      <section className="mx-auto w-full max-w-3xl flex-1 px-6 pt-16 pb-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          All writing
        </p>
        <ul className="mt-8 space-y-8">
          {rest.map((p) => (
            <li key={p.slug} className="border-t border-border pt-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
                {p.date}
              </p>
              <h3 className="mt-2 font-display text-2xl font-medium text-foreground">
                <Link
                  href={`/blog/${p.slug}`}
                  className="hover:underline decoration-warmth-start decoration-2 underline-offset-4"
                  dangerouslySetInnerHTML={{ __html: p.title }}
                />
              </h3>
              <p className="mt-2 text-muted-foreground">{p.dek}</p>
              <Link
                href={`/blog/${p.slug}`}
                className="mt-3 inline-block text-sm text-foreground underline decoration-warmth-start decoration-2 underline-offset-4"
              >
                Read &rarr;
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Demoted: the tools behind the writing */}
      <section className="border-t border-border bg-surface px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
            The tools behind the notes
          </p>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
            SnowForge also builds software.
          </h2>
          <p className="mt-3 text-muted-foreground">
            These essays come out of building and running a small suite of
            tools for e-commerce, web data, and the games I love. If you came
            for the software rather than the writing, start here.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {APPS.filter((a) => !a.comingSoon).map((app) => (
              <li key={app.name}>
                <a
                  href={app.url}
                  className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
                >
                  {app.name}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm">
            <Link
              href="/about"
              className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4"
            >
              See the full toolkit and what SnowForge is &rarr;
            </Link>
          </p>
        </div>
      </section>

      <LandingFooter />
    </main>
  )
}
