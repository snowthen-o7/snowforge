import type { Metadata } from 'next'
import Link from 'next/link'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Contact · SnowForge',
  description:
    'Get in touch with SnowForge. One inbox, one person: Alex Diaz answers every email.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <LandingHeader />
      <article className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          Contact
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          One inbox. One human.
        </h1>

        <p className="mt-6 text-muted-foreground">
          SnowForge is a one-person studio. Every email below goes to me,
          Alex, and I answer them myself. Response time is usually within a
          business day.
        </p>

        <dl className="mt-10 space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              General support
            </dt>
            <dd className="mt-2 text-muted-foreground">
              Questions, bugs, feature requests on any SnowForge app.
            </dd>
            <dd className="mt-2">
              <a
                href="mailto:support@snowforge.dev"
                className="underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
              >
                support@snowforge.dev
              </a>
            </dd>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              Billing
            </dt>
            <dd className="mt-2 text-muted-foreground">
              Invoices, cancellation, refunds, or anything subscription-related.
            </dd>
            <dd className="mt-2">
              <a
                href="mailto:support@snowforge.dev?subject=Billing"
                className="underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
              >
                support@snowforge.dev (subject: Billing)
              </a>
            </dd>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              Press &amp; partnerships
            </dt>
            <dd className="mt-2 text-muted-foreground">
              Interviews, collaborations, affiliate inquiries.
            </dd>
            <dd className="mt-2">
              <a
                href="mailto:support@snowforge.dev?subject=Press"
                className="underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
              >
                support@snowforge.dev (subject: Press)
              </a>
            </dd>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              Legal
            </dt>
            <dd className="mt-2 text-muted-foreground">
              See{' '}
              <Link href="/privacy" className="underline">Privacy</Link> and{' '}
              <Link href="/terms" className="underline">Terms</Link>. For DMCA
              or formal legal notice, email the support address above.
            </dd>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <dt className="font-display text-xl text-foreground">
              Mailing address
            </dt>
            <dd className="mt-2 text-sm text-muted-foreground">
              SnowForge LLC<br />
              Florida, United States<br />
              (Full address available on request for legal purposes.)
            </dd>
          </div>
        </dl>
      </article>
      <LandingFooter />
    </main>
  )
}
