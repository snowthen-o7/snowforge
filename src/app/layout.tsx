import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SnowForge — Developer Tools',
  description: 'A suite of powerful developer tools for web scraping, AI content generation, lead intelligence, and gaming analytics.',
  keywords: ['developer tools', 'web scraping', 'AI content generation', 'lead generation', 'gaming analytics'],
  authors: [{ name: 'Alex Diaz' }],
  openGraph: {
    title: 'SnowForge — Developer Tools',
    description: 'A suite of powerful developer tools for web scraping, AI content generation, lead intelligence, and gaming analytics.',
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
    <html lang="en" className="dark">
      <body className="antialiased bg-background text-zinc-50">
        {children}
      </body>
    </html>
  )
}
