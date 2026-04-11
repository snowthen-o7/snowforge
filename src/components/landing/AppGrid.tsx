import { APPS, type AppEntry } from './apps'
import { Monogram } from './Monogram'
import { SnowDotBackground } from './SnowDotBackground'

export function AppGrid() {
  return (
    <section id="toolkit" className="relative overflow-hidden px-6 py-24">
      <SnowDotBackground />
      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            The full toolkit
          </h2>
          <p className="mt-3 text-sm text-ink-dim">
            Seven tools. One login. All of them shipped by hand.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => (
            <AppCard key={app.name} app={app} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function AppCard({ app }: { app: AppEntry }) {
  const content = (
    <>
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: app.color }}
      />
      <div className="flex items-start gap-3">
        <Monogram letter={app.name.charAt(0)} color={app.color} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">{app.name}</h3>
            {app.comingSoon && (
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-muted text-ink-dim">
                Soon
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-dim leading-relaxed">
            {app.shortDescription}
          </p>
        </div>
      </div>
      {!app.comingSoon && (
        <div className="mt-4 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          Launch →
        </div>
      )}
    </>
  )

  const baseClass =
    'group relative block overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all'

  if (app.comingSoon) {
    return (
      <li className="list-none">
        <div
          className={`${baseClass} opacity-60`}
          aria-disabled="true"
        >
          {content}
        </div>
      </li>
    )
  }

  return (
    <li className="list-none">
      <a
        href={app.url}
        className={`${baseClass} hover:-translate-y-0.5 hover:border-border-hover motion-reduce:hover:translate-y-0`}
      >
        {content}
      </a>
    </li>
  )
}
