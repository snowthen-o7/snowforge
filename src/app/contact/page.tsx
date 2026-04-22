import type { Metadata } from 'next'
import { ContactSection } from '@snowforge/ui'
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

        <div className="mt-10">
          <ContactSection />
        </div>
      </article>
      <LandingFooter />
    </main>
  )
}
