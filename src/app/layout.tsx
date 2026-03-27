import type { Metadata } from 'next'
import './globals.css'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'SnowForge — Developer Tools',
  description: 'A suite of tools for web scraping, AI content generation, data pipelines, lead intelligence, and gaming analytics.',
  keywords: ['developer tools', 'web scraping', 'AI content generation', 'lead generation', 'gaming analytics', 'data pipelines'],
  authors: [{ name: 'Alex Diaz' }],
  openGraph: {
    title: 'SnowForge — Developer Tools',
    description: 'A suite of tools for web scraping, AI content generation, data pipelines, lead intelligence, and gaming analytics.',
    type: 'website',
    url: 'https://snowforge.dev',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'light') return;
                if (theme === 'dark' || !window.matchMedia('(prefers-color-scheme: light)').matches) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
