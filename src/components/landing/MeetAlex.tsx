import Image from 'next/image'

export function MeetAlex() {
  return (
    <section
      id="meet-alex"
      className="border-y border-border bg-surface px-6 py-20"
    >
      <div className="mx-auto max-w-3xl grid gap-10 sm:grid-cols-[140px_1fr] sm:gap-12 items-start">
        <div className="flex justify-center sm:block">
          <div
            className="rounded-full p-[2px]"
            style={{
              background:
                'linear-gradient(135deg, rgb(var(--warmth-start)), rgb(var(--warmth-end)))',
            }}
          >
            <Image
              src="/alex-diaz.jpg"
              alt="Alex Diaz, founder of SnowForge"
              width={140}
              height={140}
              priority
              className="h-[140px] w-[140px] rounded-full object-cover"
            />
          </div>
        </div>

        <div>
          <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim mb-3">
            Meet the builder
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Hi, I&apos;m Alex Diaz.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            I&apos;m an e-commerce and product feed specialist who got tired of
            duct taping other people&apos;s tools together. So I started
            building my own. SnowForge is the home for those tools, every one
            of them shipped solo on nights and weekends, for operators who want
            software that actually works.
          </p>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            <strong className="text-foreground font-semibold">
              If you need help, you&apos;ll be emailing me directly.
            </strong>{' '}
            Same person, same inbox, for every app under SnowForge.
          </p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            <a
              href="https://alexdiaz.me"
              className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
            >
              alexdiaz.me →
            </a>
            <a
              href="mailto:support@snowforge.dev"
              className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
            >
              Email Alex →
            </a>
            <a
              href="https://github.com/snowthen-o7"
              className="text-foreground underline decoration-warmth-start decoration-2 underline-offset-4 hover:decoration-warmth-end"
            >
              GitHub →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
