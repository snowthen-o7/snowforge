import { SnowDotBackground } from './SnowDotBackground'

type Value = {
  icon: string
  title: string
  body: string
}

const VALUES: Value[] = [
  {
    icon: '🔑',
    title: 'One account, every app',
    body:
      'Sign in once. It already works today across every app in the suite. SnowPipe, SnowScrape, SnowGen, SnowGlobe, SnowFort, and TrueIce share the same login.',
  },
  {
    icon: '⚒',
    title: 'Built by an operator',
    body:
      'Every tool started as a problem I hit in my own work. Real pain, real fix, shipped when it was ready. Features exist because I use them.',
  },
  {
    icon: '✉',
    title: 'A human at the other end',
    body:
      'Bugs, feature requests, weird edge cases: they all land in my inbox. Real replies, usually within a day.',
  },
]

export function WhySnowForge() {
  return (
    <section id="why" className="relative overflow-hidden px-6 py-24">
      <SnowDotBackground />
      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Why SnowForge?
          </h2>
          <p className="mt-3 text-sm text-ink-dim">
            What makes this different from the 47 other SaaS tabs in your browser.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {VALUES.map((value) => (
            <ValueCard key={value.title} {...value} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ValueCard({ icon, title, body }: Value) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div
        aria-hidden="true"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border text-lg"
        style={{
          backgroundColor: 'var(--warmth-soft-alpha)',
          borderColor: 'rgb(var(--warmth-start) / 0.3)',
        }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-ink-dim">{body}</p>
    </div>
  )
}
