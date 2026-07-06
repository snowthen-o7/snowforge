import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Workflow } from 'lucide-react'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { WhySnowForge } from '@/components/landing/WhySnowForge'
import { FeaturedApp } from '@/components/landing/FeaturedApp'
import { AppGrid } from '@/components/landing/AppGrid'
import { Faq } from '@/components/landing/Faq'

export const metadata: Metadata = {
  title: 'About · SnowForge',
  description:
    'SnowForge is an independent software studio building small, opinionated tools for e-commerce, automation, and the games we love. Run solo by Alex Diaz.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <LandingHeader />
      <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          About
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          Small tools, made with big care.
        </h1>

        <div className="mt-10 flex items-center gap-5">
          <Image
            src="/alex-diaz.jpg"
            alt="Alex Diaz, founder of SnowForge"
            width={72}
            height={72}
            className="rounded-full"
          />
          <div>
            <p className="font-medium">Alex Diaz, founder and sole developer</p>
            <p className="text-sm text-muted-foreground">
              <Link href="https://alexdiaz.me" className="underline">alexdiaz.me</Link>{' '}
              ·{' '}
              <a href="mailto:support@snowforge.dev" className="underline">support@snowforge.dev</a>
            </p>
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert mt-10 max-w-none">
          <h2 className="font-display text-2xl text-foreground">Why SnowForge exists</h2>
          <p>
            SnowForge is an independent software studio run by one person in
            Florida, on nights and weekends, alongside a day job. Every app
            under the SnowForge name is built because I needed it, or because
            I watched someone else need it and couldn&rsquo;t find a tool that
            actually solved the problem without getting in the way.
          </p>
          <p>
            I&rsquo;ve spent a decade working in e-commerce operations (feed
            orchestration, bulk catalog work, multi-channel sync), and most of
            the tools in that space are either enterprise-priced or abandoned.
            SnowForge is my attempt to build the middle ground: opinionated,
            small, cheap, reliable software for operators who want the job
            done.
          </p>

          <h2 className="font-display text-2xl text-foreground">What&rsquo;s in the studio</h2>
          <ul>
            <li>
              <strong>SnowPipe.</strong> Shopify, Meta, and Google Merchant
              product feed orchestration with row-level error tracking and
              live dashboards.
            </li>
            <li>
              <strong>SnowFort.</strong> Fortnite item shop tracker with
              return notifications by email, SMS, and Discord.
            </li>
            <li>
              <strong>SnowGen.</strong> Content generation for
              e-commerce product descriptions.
            </li>
            <li>
              <strong>SnowScrape.</strong> Hosted web scraping with schedule,
              CSS selectors, and webhook delivery.
            </li>
            <li>
              <strong>SnowGlobe.</strong> Internal lead generation and data
              tooling, used by the rest of SnowForge.
            </li>
          </ul>

          <h2 className="font-display text-2xl text-foreground">How this works as a business</h2>
          <p>
            SnowForge is run lean on purpose. There&rsquo;s no VC, no board,
            no quarterly targets. Revenue comes from direct subscriptions
            (Stripe), Gumroad one-off tool sales, and advertising on the
            free tiers of some apps. The same person who writes the code
            answers the support email.
          </p>
          <p>
            That means I&rsquo;m not going to break a feature to force an
            upgrade, and I&rsquo;m not going to sell your data. If an app
            stops making sense, I&rsquo;ll shut it down and refund the
            paying users. If an app works, I&rsquo;ll keep the price fair.
          </p>

          <h2 className="font-display text-2xl text-foreground">Getting in touch</h2>
          <p>
            Email is the fastest way:{' '}
            <a href="mailto:support@snowforge.dev">support@snowforge.dev</a>.
            For support on a specific app, include the app name in the
            subject line. For press, partnerships, or anything business-y,
            same address.
          </p>
        </div>
      </article>

      <FeaturedApp
        name="SnowPipe"
        body="The flagship. Product feed orchestration for Shopify, Meta, and Google Merchant, built by someone who's been drowning in feed bugs for a decade. Free tier, paid plans, live today."
        href="https://pipe.snowforge.dev"
        ctaText="Try SnowPipe →"
        icon={Workflow}
      />
      <AppGrid />
      <WhySnowForge />
      <Faq />
      <LandingFooter />
    </main>
  )
}
