export default function Home() {
  const tools = [
    {
      name: 'SnowPipe',
      description: 'Data pipeline management and orchestration for modern workflows.',
      url: 'https://pipe.snowforge.dev',
      accent: 'bg-amber-500',
      accentText: 'text-amber-400',
    },
    {
      name: 'SnowScrape',
      description: 'Serverless web scraping automation with scheduled jobs and cloud storage.',
      url: 'https://scrape.snowforge.dev',
      accent: 'bg-blue-500',
      accentText: 'text-blue-400',
    },
    {
      name: 'SnowGen',
      description: 'AI-powered content generation and multi-platform publishing automation.',
      url: 'https://gen.snowforge.dev',
      accent: 'bg-violet-500',
      accentText: 'text-violet-400',
    },
    {
      name: 'SnowGlobe',
      description: 'Lead generation intelligence across Reddit, HN, and RSS feeds.',
      url: 'https://globe.snowforge.dev',
      accent: 'bg-emerald-500',
      accentText: 'text-emerald-400',
    },
    {
      name: 'SnowFort',
      description: 'Fortnite item shop tracker with alerts and a database of 17,000+ cosmetics.',
      url: 'https://fort.snowforge.dev',
      accent: 'bg-rose-500',
      accentText: 'text-rose-400',
    },
    {
      name: 'TrueIce',
      description: 'Advanced League of Legends analytics with match history and performance insights.',
      url: 'https://trueice.snowforge.dev',
      accent: 'bg-cyan-500',
      accentText: 'text-cyan-400',
    },
    {
      name: 'SnowSports',
      description: 'Sports analytics and data visualization for stats-driven fans.',
      url: 'https://sports.snowforge.dev',
      accent: 'bg-sky-500',
      accentText: 'text-sky-400',
      comingSoon: true,
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Content */}
      <div className="relative">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-32 sm:pt-40 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 text-xs font-medium bg-surface border border-border rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-muted-foreground">{tools.length} tools, one platform</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 text-foreground">
            SnowForge
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Automation, intelligence, and analytics — built for builders.
          </p>
        </section>

        {/* Tools Grid */}
        <section className="max-w-5xl mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const Tag = tool.comingSoon ? 'div' : 'a'
              return (
                <Tag
                  key={tool.name}
                  {...(!tool.comingSoon && { href: tool.url })}
                  className={`group relative bg-surface border border-border rounded-xl overflow-hidden transition-all duration-200 ${
                    tool.comingSoon
                      ? 'opacity-60 cursor-default'
                      : 'hover:border-border-hover hover:-translate-y-0.5'
                  }`}
                >
                  {/* Accent top bar */}
                  <div className={`h-0.5 ${tool.accent}`} />

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`text-lg font-semibold ${tool.accentText}`}>
                        {tool.name}
                      </h3>
                      {tool.comingSoon && (
                        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {tool.description}
                    </p>
                    {!tool.comingSoon && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        <span>Launch</span>
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Tag>
              )
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} SnowForge LLC</p>
              <div className="flex gap-6">
                <a href="https://alexdiaz.me" className="hover:text-foreground transition-colors">
                  Alex Diaz
                </a>
                <a href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </a>
                <a href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </a>
                <a href="https://github.com/snowthen-o7" className="hover:text-foreground transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
