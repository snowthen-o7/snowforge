import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'The cost of indie cloud: my real bill across 7 apps · SnowForge',
  description:
    'Real numbers from a seven-app indie portfolio in May 2026, the three incidents that drove the bill up, and the fixes that brought it back down.',
}

export default function Post() {
  return (
    <BlogLayout
      title="The cost of indie cloud: my real bill across 7 apps"
      date="May 10, 2026"
      dek="Real numbers from a seven-app portfolio in May 2026, the three incidents that drove the bill up, and the fixes that brought it back down."
    >
      <p>
        &ldquo;What does it actually cost to run all of that?&rdquo; is the
        question I get asked most often when someone hears I run seven apps
        on the side. The answers floating around online are not very useful.
        Some are aspirational and assume you&rsquo;ll never leave the AWS
        free tier. Others are wrong-scale and describe how a Series-A
        company runs infrastructure. Neither matches the reality of an
        indie portfolio.
      </p>
      <p>
        This is what my actual cloud bill looks like in May 2026, broken
        down by vendor across all seven apps, including the three incidents
        in the past month that taught me more about cloud cost than any
        blog post could.
      </p>

      <h2>The portfolio</h2>
      <p>
        Seven apps share roughly the same stack. SnowPipe is a Shopify
        product feed orchestration platform. SnowGen does AI content.
        SnowScrape is a managed web scraping platform. SnowGlobe is a lead
        intelligence dashboard. SnowFort is a Fortnite shop tracker that
        runs as a Discord bot. SnowSports is a sports-data analytics tool.
        TrueIce publishes auto-updated League of Legends patch data.
      </p>
      <p>
        Some are revenue-bearing. Most are not yet. All of them run on
        roughly the same infrastructure: Vercel for hosting, Neon for
        Postgres, AWS for the heavy lifting on a couple of apps, Upstash
        for queue and rate limit, plus Doppler, Clerk, Stripe, Sentry, and
        a handful of smaller services. That sameness is intentional. A
        one-person studio cannot afford a different stack per app.
      </p>

      <h2>Vercel</h2>
      <p>
        Vercel hosts every app&rsquo;s frontend and most of its serverless
        functions. I&rsquo;m on the Pro plan. For a single solo founder,
        the most expensive line item on Vercel is not bandwidth or builds,
        it&rsquo;s function execution time when something goes wrong. A
        polling loop that should fire every five minutes but accidentally
        fires every five seconds will eat your monthly compute allowance
        in an afternoon. I&rsquo;ve come close to that exactly once, on a
        scheduler bug that started double-firing before I caught it.
        Vercel&rsquo;s metered usage emails are the early warning system.
      </p>
      <p>
        Across seven projects on a single team plan, Vercel is currently
        the largest fixed cost. That&rsquo;s fine. The alternative is
        operating my own load balancer and origin servers, and the math
        does not work for a one-person studio.
      </p>

      <h2>Neon</h2>
      <p>
        Postgres for almost every app, on Neon&rsquo;s serverless platform.
        Each app has its own project under the same org. The pitch with
        serverless Postgres is auto-suspend: an idle endpoint stops
        billing compute time after a configurable timeout, typically five
        minutes.
      </p>
      <p>
        That&rsquo;s the pitch. The reality is that the auto-suspend
        setting is per-endpoint, and I had nine endpoints across the org
        with auto-suspend disabled entirely. Every one of those was
        billing compute hours twenty-four hours a day, even when nobody
        was hitting the database. The bill ramped to about $80 per month
        before I noticed, and tracing it back showed Neon was the
        dominant driver of the entire indie cloud bill that month.
      </p>
      <p>
        The fix took less than ten minutes: set the suspend timeout to
        300 seconds on every endpoint. The bill dropped within the first
        weekly billing cycle. The lesson, beyond the obvious &ldquo;check
        your defaults,&rdquo; is that serverless platforms do not always
        default to cost-aware settings. Some of those endpoints had
        auto-suspend turned off because at one point I was running a
        long-lived migration and didn&rsquo;t want the connection to
        drop. Then I forgot.
      </p>

      <h2>AWS</h2>
      <p>
        I run two AWS accounts. The current one is where SnowPipe&rsquo;s
        Lambdas, SES email sending, and SQS queues live. Its monthly bill
        is essentially zero at indie scale because Lambda compute is
        metered to actual milliseconds and most workloads are sporadic.
      </p>
      <p>
        The other account is older. It started life as a side project
        called etriever and outlived the project. For most of last year I
        forgot it existed. Then in early May the monthly bill came in
        around $66, almost all of it from CloudWatch logs.
      </p>
      <p>
        The cause was a poison-pill loop. An SQS queue had a Lambda
        source mapping with no functioning consumer, three EventBridge
        crons were firing into the queue every few minutes, and every
        failed invocation was logging to CloudWatch, which charges per
        ingested gigabyte. The actual workload accomplished nothing. The
        side effect was about $58 per month of CloudWatch ingestion. I
        disabled the source mapping and the crons, and the burn stopped
        immediately. Full deletion of the account is pending, but the
        cost has already gone to near zero.
      </p>
      <p>
        The lesson is that old AWS accounts do not quietly deactivate
        themselves. They sit there spending your money until you log in
        and notice.
      </p>

      <h2>Upstash</h2>
      <p>
        Upstash provides Redis for queue work (BullMQ) and rate limiting
        across several apps. It bills by request and by storage, so an
        idle queue is essentially free.
      </p>
      <p>
        A few weeks ago I rotated a token that sat in front of an Upstash
        endpoint. Eleven secret-manager configs needed the new token. Ten
        of them updated cleanly. The eleventh was an orphaned BullMQ
        worker that had been disconnected from anything actually running
        for months but was still polling Redis with the old token,
        generating about $20 per month of zombie traffic. After the
        rotation, the worker could not authenticate anymore, and the
        cost dropped to zero almost overnight.
      </p>
      <p>
        A zombie worker is, mechanically, just a process nobody is still
        observing. It usually shows up as a queue with traffic but no
        consumer, a Redis instance with steady CPU but no human-driven
        changes, or in this case an account with $20 per month of
        activity that you cannot trace back to any current app.
      </p>

      <h2>The smaller stuff</h2>
      <p>
        Doppler costs nothing on the individual plan up to a generous
        secrets cap, and I&rsquo;m not over it. Clerk&rsquo;s free tier
        covers up to ten thousand monthly active users, and across seven
        apps I am not close to that aggregate yet. Stripe is purely
        transactional, so my fixed cost there is zero, with the rake
        taken from each charge. Sentry&rsquo;s free tier covers five
        thousand errors a month, more than enough at indie traffic.
        Cloudflare for DNS, GitHub on the personal plan, and a handful
        of other services round out the stack at zero or near-zero cost.
      </p>

      <h2>The total</h2>
      <p>
        At the peak last month, before any of the incidents above were
        resolved, the all-in monthly bill across all seven apps was
        around $240. Most of that was the Neon $80, the etriever $58,
        the Upstash $20, plus Vercel&rsquo;s fixed cost and modest
        Lambda usage.
      </p>
      <p>
        After the three incidents were fixed, the steady-state bill is
        somewhere between $60 and $80 per month across seven apps.
        That&rsquo;s roughly $10 per app per month. Not free, not
        expensive, but a real number that I think is roughly
        representative of what a solo founder with a serious indie
        portfolio actually pays.
      </p>

      <h2>Three lessons</h2>
      <p>
        <strong>Defaults on serverless platforms are not always
        cost-aware.</strong> Auto-suspend is the easy example, but
        reserved capacity, log retention, and instance sizing all default
        in directions that bias toward developer experience over your
        wallet. Read the dashboard, not the marketing.
      </p>
      <p>
        <strong>Old accounts are not free.</strong> AWS will not call
        you when an account you forgot about starts burning $58 per
        month. You have to look. I now do a quarterly review of every
        paid account I have credentials to, just opening the billing
        dashboard and confirming the number is what I expect.
      </p>
      <p>
        <strong>Zombies cost real money.</strong> A worker still
        polling, a cron still firing, a source mapping still active, all
        of these will keep generating bills long after the project they
        served has been shut down. The fix is not better tooling.
        It&rsquo;s writing down what you spun up so you can spin it back
        down later.
      </p>

      <h2>Closing</h2>
      <p>
        None of this is exotic. The reason I&rsquo;m publishing the
        numbers is that the genre of &ldquo;indie cloud cost&rdquo;
        articles is dominated by either AWS-free-tier optimism or
        scaled-up-startup post-mortems, and the middle ground that solo
        founders actually live in is undercovered. If you&rsquo;re
        running a small portfolio and your bill looks similar to mine,
        you&rsquo;re probably doing it right. If it&rsquo;s much higher,
        look for your zombies. If it&rsquo;s much lower, you&rsquo;re
        probably one project away from one of these incidents anyway.
      </p>
    </BlogLayout>
  )
}
