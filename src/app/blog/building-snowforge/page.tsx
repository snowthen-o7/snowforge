import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Why I&rsquo;m building SnowForge from a day-job desk · SnowForge',
  description:
    'A small studio, a handful of apps, and a slow build towards software I&rsquo;m genuinely excited to maintain.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Why I&rsquo;m building SnowForge from a day-job desk"
      date="April 18, 2026"
      dek="A small studio, a handful of apps, and a slow build towards software I&rsquo;m genuinely excited to maintain."
    >
      <p>
        SnowForge is a small software studio I run solo, on nights and
        weekends, alongside a day job in e-commerce. No outside capital,
        no employees, no runway. Just a long-running effort to build
        software I genuinely enjoy using, then charge a fair price for it,
        until that keeps the lights on.
      </p>

      <p>
        People ask what the master plan is, and the honest answer is
        that I don&rsquo;t have a grand one. I have a queue. There are
        a handful of apps right now: SnowPipe for product feeds,
        SnowFort for Fortnite shop tracking, SnowGen for content
        generation, SnowScrape for hosted scraping, and SnowGlobe for
        internal lead generation. Each one exists because I hit a wall at
        work or in a side project and couldn&rsquo;t find a tool that fit.
        Each one became something I wanted to use myself, which made it
        worth building properly.
      </p>

      <h2>What I&rsquo;m actually after</h2>
      <p>
        Here&rsquo;s the honest version. I want to build software that
        helps the people who use it, and I want to earn enough doing that
        to keep going. Unicorn exits, going public, magazine covers:
        those belong to other people. If my work helps real users with
        real problems, and I cover the bills with some snacks and drinks
        on top, I already think that&rsquo;s a pretty good world.
      </p>
      <p>
        That framing makes a lot of daily decisions easier. Each app
        gets to grow into what it wants to be, at whatever pace its
        audience finds it. I enjoy operating multiple small things at
        once, and the studio shape means there&rsquo;s always something
        to work on that&rsquo;s genuinely moving.
      </p>
      <p>
        Staying small is also a constraint that forces better choices.
        Without capital, I can&rsquo;t buy a design team, so the design
        has to earn its keep through simplicity. Without a sales team, the
        product has to explain itself. Without a marketing budget, the
        first users come from people who genuinely needed the thing, and
        that&rsquo;s the best kind of feedback loop I&rsquo;ve ever had.
      </p>

      <h2>Where the revenue comes from</h2>
      <p>
        The apps monetize in different ways on purpose. SnowPipe is a
        subscription SaaS, the flagship, priced for operators who are
        bleeding hours every month on feed errors. SnowFort is
        ad-supported with a $4-per-month premium tier for SMS and Discord
        alerts; the catalog is large enough that organic search should
        eventually cover hosting. Gumroad products ship the small stuff: a
        spreadsheet-based feed auditor, open-source CLI tools, that kind
        of thing. Different revenue shapes, so each app gets to prove
        itself on its own terms.
      </p>
      <p>
        Writers and illustrators have run studios this way for a century.
        A name on the door, a portfolio of small works, the same person
        answering the phone. It looks strange in software because software
        people are used to the all-in single-product story.
      </p>

      <h2>How a studio of one stays focused</h2>
      <p>
        The risk with this shape of business is that you fragment your
        attention and none of the apps get enough care. I keep a master
        TODO across all repos, updated constantly, so I always know what
        the single highest-priority next action is. Each app has its own
        progress tracker that I update the moment something ships or
        something changes. The habit is small, but it keeps me honest
        about where things stand, and it&rsquo;s how a solo operation
        stays accountable across five products without any one of them
        going quiet.
      </p>
      <p>
        I publish what I build and I&rsquo;m honest about what&rsquo;s
        working. Expect posts here to read as notes from the workshop,
        with actual numbers. Some of what I try will land. Some
        won&rsquo;t. I&rsquo;d rather write about both than pretend
        everything is easy.
      </p>

      <h2>What&rsquo;s next</h2>
      <p>
        For the rest of 2026 the priority is SnowPipe revenue. That
        product is closest to paying users and closest to real leverage.
        SnowFort will keep growing because the content compounds on
        search. The smaller Gumroad tools keep shipping as they get built.
        The day job stays until the numbers say otherwise. I&rsquo;m in
        no particular hurry. The work itself is the thing I enjoy.
      </p>
      <p>
        If you&rsquo;re curious about any specific app, the{' '}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/#app-grid">app grid on the homepage</a> is the
        map. Email me at{' '}
        <a href="mailto:support@snowforge.dev">support@snowforge.dev</a>{' '}
        if you want to talk about any of this.
      </p>
    </BlogLayout>
  )
}
