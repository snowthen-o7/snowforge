import { SnowDotBackground } from './SnowDotBackground'

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden px-6 pt-28 pb-24 sm:pt-40 sm:pb-32"
    >
      <SnowDotBackground />

      {/* Warm glow bottom-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, var(--glow-color), transparent 60%)',
        }}
      />

      {/* Single snowflake glyph, left side to stay clear of the theme toggle */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-10 left-10 text-3xl text-ink-dim opacity-40 select-none"
      >
        ❋
      </span>

      <div className="relative mx-auto max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border border-white"
            style={{
              background:
                'linear-gradient(135deg, rgb(var(--warmth-start)), rgb(var(--warmth-end)))',
            }}
          />
          Hi, I&apos;m Alex. Solo founder, indie studio.
        </div>

        <h1 className="mt-6 font-display font-medium tracking-tight text-foreground text-5xl sm:text-7xl leading-[1.05] max-w-3xl">
          Small tools,
          <br />
          made with{' '}
          <span
            className="italic bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgb(var(--warmth-start)), rgb(var(--warmth-end)))',
            }}
          >
            big care
          </span>
          .
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          An indie studio forging the software I wished existed for e-commerce,
          content, automation, and the games I love. One account, every app.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#toolkit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Explore the tools ↓
          </a>
          <a
            href="#meet-alex"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-hover bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground"
          >
            Meet Alex
          </a>
        </div>
      </div>
    </section>
  )
}
