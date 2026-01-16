export default function Home() {
  const tools = [
    {
      name: 'SnowScrape',
      description: 'Serverless web scraping automation with scheduled jobs and cloud storage.',
      url: 'https://scrape.snowforge.dev',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      textGradient: 'from-blue-400/70 to-cyan-400/70',
    },
    {
      name: 'SnowGen',
      description: 'AI-powered content generation and multi-platform publishing automation.',
      url: 'https://gen.snowforge.dev',
      gradient: 'from-purple-500/20 to-pink-500/20',
      textGradient: 'from-purple-400/70 to-pink-400/70',
    },
    {
      name: 'SnowGlobe',
      description: 'Lead generation intelligence across Reddit, HN, and RSS feeds.',
      url: 'https://globe.snowforge.dev',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      textGradient: 'from-emerald-400/70 to-teal-400/70',
    },
    {
      name: 'LoL Analytics',
      description: 'Professional League of Legends performance insights and analytics.',
      url: 'https://lol.snowforge.dev',
      gradient: 'from-amber-500/20 to-orange-500/20',
      textGradient: 'from-amber-400/70 to-orange-400/70',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Subtle radial gradient background for visual depth */}
      <div className="fixed inset-0 bg-gradient-radial from-zinc-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-40 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 text-xs font-medium bg-surface border border-border rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-zinc-400">4 tools, unified platform</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-blue-400/80 via-purple-400/80 to-cyan-400/80 bg-clip-text text-transparent">
              SnowForge
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
            Forging web applications that put users first
          </p>

          <p className="text-base text-zinc-500 max-w-xl mx-auto leading-relaxed">
            Automation, intelligence, and analytics for everyone.
          </p>
        </section>

        {/* Tools Grid */}
        <section className="max-w-6xl mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                className="group relative bg-surface border border-border rounded-2xl p-8 hover:border-zinc-700 transition-all duration-300"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative">
                  <h3 className={`text-2xl font-semibold mb-3 bg-gradient-to-r ${tool.textGradient} bg-clip-text text-transparent`}>
                    {tool.name}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed mb-6">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <span>Launch</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-8">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex gap-6">
                <a href="https://alexdiaz.me" className="hover:text-zinc-300 transition-colors">
                  Alex Diaz
                </a>
                <a href="/privacy" className="hover:text-zinc-300 transition-colors">
                  Privacy
                </a>
                <a href="/terms" className="hover:text-zinc-300 transition-colors">
                  Terms
                </a>
                <a href="https://github.com" className="hover:text-zinc-300 transition-colors">
                  GitHub
                </a>
              </div>
              <p>
                &copy; {new Date().getFullYear()} SnowForge
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
