import Link from 'next/link'
export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface px-6 py-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-4 text-sm text-ink-dim sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} SnowForge LLC · Forged by Alex Diaz{' '}
          <span aria-hidden="true">❋</span>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/about" className="inline-flex min-h-11 items-center px-1 hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/blog" className="inline-flex min-h-11 items-center px-1 hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href="/contact" className="inline-flex min-h-11 items-center px-1 hover:text-foreground transition-colors">
            Contact
          </Link>
          <a href="https://alexdiaz.me" className="inline-flex min-h-11 items-center px-1 hover:text-foreground transition-colors">
            alexdiaz.me
          </a>
          <Link href="/privacy" className="inline-flex min-h-11 items-center px-1 hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center px-1 hover:text-foreground transition-colors">
            Terms
          </Link>
          <a
            href="https://github.com/snowthen-o7"
            className="inline-flex min-h-11 items-center px-1 hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
