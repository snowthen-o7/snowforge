import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Running seven apps solo: the systems that make it survivable · SnowForge',
  description:
    'One person, seven apps, nights and weekends. It only works because of systems, not heroics. Here are the ones that carry the weight.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Running seven apps solo: the systems that make it survivable"
      date="June 28, 2026"
      dek="One person, seven apps, nights and weekends. It only works because of systems, not heroics. Here are the ones that carry the weight."
    >
      <p>
        Running seven small apps as one person, around a day job, sounds like
        a recipe for dropping all seven. The only reason it does not collapse
        is that almost none of it relies on me remembering things or working
        harder. It relies on systems that do the remembering. Here are the
        ones that actually carry the weight.
      </p>

      <h2>Share everything that can be shared</h2>
      <p>
        Seven apps do not mean seven of everything. They share one
        authentication system, so a user is one account across all of them.
        They share a UI component library, so a fix to a button is a fix
        everywhere. They share one secrets manager, so a rotated key updates
        in one place. The leverage is brutal and obvious: the marginal cost
        of the eighth app is low precisely because the first seven already
        paid for the shared spine.
      </p>

      <h2>Make status a file, not a memory</h2>
      <p>
        With more than two or three projects, &ldquo;what was I doing on this
        one?&rdquo; becomes the real bottleneck. Every app keeps a single
        plain-text progress file: what is done, what is not, what is blocked
        on me. There is one master to-do above all of them. When I open a
        project after two weeks away, I read the file instead of
        re-discovering the state by spelunking through code. The cost of
        context-switching drops from an hour to a minute.
      </p>

      <h2>Automate the watching, not just the work</h2>
      <p>
        The thing that kills a multi-app portfolio is not the work, it is the
        silent drift: a build that went red, a bill that crept up, a doc that
        no longer matches reality. So the highest-value automation is not code
        generation, it is the daily check that surfaces drift across all of
        them and tells me where to look. I would rather automate the question
        &ldquo;what is quietly broken?&rdquo; than any single answer.
      </p>

      <h2>Park apps without guilt</h2>
      <p>
        Not every app deserves attention every week. Some are parked on
        purpose, alive, cheap, but not actively developed, because the thesis
        has not earned more time yet. The discipline is to make parking
        explicit and cheap (scale the infrastructure toward zero, stop the
        crons) rather than letting an app quietly rot while still costing
        money. A parked app is a decision; a neglected one is an accident.
      </p>

      <h2>Let cost be a guardrail, not a surprise</h2>
      <p>
        Infrastructure that scales to zero is the indie operator&rsquo;s best
        friend, and a single misconfigured cron that keeps a database awake is
        the fastest way to lose that. Cost gets a guardrail: alerts when it
        moves, periodic reviews, and a default posture of off-until-needed.
        The goal is to never be surprised by a bill, because a surprise bill
        on a portfolio this size is the thing that ends it.
      </p>

      <h2>The real lesson</h2>
      <p>
        None of this is about working more hours. It is about making sure the
        hours I do spend go into building, not into remembering, re-deriving,
        firefighting, or babysitting. Leverage over effort, every time. The
        portfolio is not held up by discipline; it is held up by systems that
        make discipline optional.
      </p>

      <h2>The plug</h2>
      <p>
        The whole studio, all seven-plus apps, lives at{' '}
        <a href="https://snowforge.dev">snowforge.dev</a>. If you are building
        more than one thing at a time and the context-switching is eating you,
        the shared-spine and status-as-a-file ideas above are the two I would
        steal first.
      </p>
    </BlogLayout>
  )
}
