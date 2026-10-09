import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NavLink } from './NavLink'

export function LandingHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-lg font-medium tracking-tight text-foreground hover:text-foreground/80"
        >
          SnowForge
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-x-4 text-sm text-ink-dim">
          <NavLink href="/about">About</NavLink>
          <NavLink href="/blog">Blog</NavLink>
          <NavLink href="/contact">Contact</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
