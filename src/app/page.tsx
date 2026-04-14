import { Workflow } from 'lucide-react'
import { Hero } from '@/components/landing/Hero'
import { MeetAlex } from '@/components/landing/MeetAlex'
import { WhySnowForge } from '@/components/landing/WhySnowForge'
import { FeaturedApp } from '@/components/landing/FeaturedApp'
import { AppGrid } from '@/components/landing/AppGrid'
import { Faq } from '@/components/landing/Faq'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <MeetAlex />
      <WhySnowForge />
      <FeaturedApp
        name="SnowPipe"
        body="The flagship. Product feed orchestration for Shopify, Meta, and Google Merchant, built by someone who's been drowning in feed bugs for a decade. Free tier, paid plans, live today."
        href="https://pipe.snowforge.dev"
        ctaText="Try SnowPipe →"
        icon={Workflow}
      />
      <AppGrid />
      <Faq />
      <LandingFooter />
    </main>
  )
}
