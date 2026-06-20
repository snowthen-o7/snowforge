import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'NBA injury reports as a market signal: what the data does and does not say · SnowForge',
  description:
    'Injury designations carry real information, but the edge is in the timing and the noise, not the obvious headline.',
}

export default function Post() {
  return (
    <BlogLayout
      title="NBA injury reports as a market signal: what the data does and does not say"
      date="June 20, 2026"
      dek="Injury designations carry real information, but the edge is in the timing and the noise, not the obvious headline."
    >
      <p>
        An NBA injury report looks like simple information: a name, a status,
        a reason. In practice it is one of the noisiest, most time-sensitive
        signals in sports, and most people read it exactly wrong, treating a
        designation as a fact when it is really a probability with a clock on
        it. Here is what the data actually says, and where it stops.
      </p>

      <h2>The designations are probabilities, not verdicts</h2>
      <p>
        The official tiers, out, doubtful, questionable, probable, are league
        shorthand for likelihood, and the middle of that scale is where all
        the uncertainty lives. &ldquo;Out&rdquo; is close to a fact.
        &ldquo;Questionable&rdquo; is close to a coin flip, and it covers
        everything from a genuine game-time decision to load management
        theater. Reading &ldquo;questionable&rdquo; as &ldquo;probably
        playing&rdquo; or &ldquo;probably not&rdquo; without more context is
        guessing dressed up as analysis.
      </p>

      <h2>The information is in the change, not the status</h2>
      <p>
        A static report tells you little; the <em>update</em> tells you
        everything. A player upgraded from doubtful to questionable an hour
        before tip is a different world than the same player downgraded. The
        signal is the delta and its timing, and the closer to tip-off, the
        more it means, because that is when the team actually knows. Whoever
        reads the change first, and correctly, has the only real edge here,
        and it decays in minutes.
      </p>

      <h2>The second-order effects matter more than the first</h2>
      <p>
        A star sitting is the obvious headline. The useful read is what it
        does to everyone else: who absorbs the usage, whose minutes climb,
        which matchup quietly flips. The first-order &ldquo;star is out&rdquo;
        is priced into any market instantly. The second-order &ldquo;the
        backup point guard now runs the offense and his role triples&rdquo; is
        where the information actually lives, and it requires knowing the team,
        not just the report.
      </p>

      <h2>What the data does not say</h2>
      <p>
        It does not tell you minutes restrictions, which can make an active
        star nearly irrelevant. It does not tell you in-game re-injury or a
        coach&rsquo;s blowout decision to rest starters. And it is gameable:
        teams have every incentive to be vague, so the report is a partial,
        strategically-managed view, not ground truth. Treat it as one input
        with known blind spots, not as the answer.
      </p>

      <h2>The honest framing</h2>
      <p>
        Injury data is a probabilistic, fast-decaying signal whose value is in
        the timing of changes and the downstream effects, not in the headline
        status. Anyone selling certainty from it is selling you the noise. The
        realistic goal is to read the updates faster and reason about the
        second-order effects better than the field, and to stay honest about
        how much the report genuinely cannot see.
      </p>

      <h2>The plug</h2>
      <p>
        SnowSports watches the injury feed for exactly these moments, the
        change, the timing, the downstream shift, and surfaces them while they
        still matter. It is at{' '}
        <a href="https://sports.snowforge.dev">sports.snowforge.dev</a>. The
        data is a signal, not a crystal ball, and the tool treats it that way.
      </p>
    </BlogLayout>
  )
}
