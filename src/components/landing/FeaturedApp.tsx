import type { LucideIcon } from 'lucide-react'
import { Monogram } from './Monogram'

type FeaturedAppProps = {
  label?: string
  name: string
  body: string
  href: string
  ctaText: string
  icon: LucideIcon
}

export function FeaturedApp({
  label = '◆ FEATURED',
  name,
  body,
  href,
  ctaText,
  icon,
}: FeaturedAppProps) {
  return (
    <section id="featured" className="px-6 py-20">
      <div
        className="mx-auto max-w-5xl rounded-2xl border p-8 sm:p-10 grid gap-8 sm:grid-cols-[1fr_auto] items-center"
        style={{
          background: 'var(--warmth-soft-alpha)',
          borderColor: 'rgb(var(--warmth-start) / 0.35)',
        }}
      >
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
            {label}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            {name}
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
            {body}
          </p>
          <a
            href={href}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {ctaText}
          </a>
        </div>
        <div className="justify-self-center sm:justify-self-end">
          <Monogram icon={icon} size={140} warmthGradient />
        </div>
      </div>
    </section>
  )
}
