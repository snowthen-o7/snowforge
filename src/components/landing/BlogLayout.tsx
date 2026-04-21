import type { ReactNode } from 'react'
import Link from 'next/link'
import { LandingFooter } from '@/components/landing/LandingFooter'

interface BlogLayoutProps {
  title: string
  date: string
  dek?: string
  children: ReactNode
}

export function BlogLayout({ title, date, dek, children }: BlogLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          <Link href="/blog" className="hover:text-foreground">
            ← Blog
          </Link>
        </p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-medium tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-sm text-ink-dim">{date}</p>
        {dek ? (
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
            {dek}
          </p>
        ) : null}
        <div className="prose prose-lg prose-invert mt-10 max-w-none text-muted-foreground">
          {children}
        </div>
      </article>
      <LandingFooter />
    </main>
  )
}
