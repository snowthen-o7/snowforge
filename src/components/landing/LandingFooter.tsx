export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface px-6 py-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-4 text-sm text-ink-dim sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} SnowForge LLC · Forged by Alex Diaz{' '}
          <span aria-hidden="true">❋</span>
        </p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="/about" className="hover:text-foreground transition-colors">
            About
          </a>
          <a href="/blog" className="hover:text-foreground transition-colors">
            Blog
          </a>
          <a href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </a>
          <a href="https://alexdiaz.me" className="hover:text-foreground transition-colors">
            alexdiaz.me
          </a>
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a
            href="https://github.com/snowthen-o7"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
