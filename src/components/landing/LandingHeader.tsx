import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

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
        <nav className="flex items-center gap-x-5 text-sm text-ink-dim">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
