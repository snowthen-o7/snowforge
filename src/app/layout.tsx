import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import { ThemeToggle } from '@/components/ThemeToggle'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SnowForge · Small tools, made with big care.',
  description:
    'An indie software studio forging tools for e-commerce, content, automation, and the games I love. Seven apps, one account. Built by Alex Diaz.',
  keywords: [
    'indie software',
    'developer tools',
    'Shopify',
    'product feeds',
    'web scraping',
    'AI content generation',
    'gaming analytics',
    'Alex Diaz',
  ],
  authors: [{ name: 'Alex Diaz', url: 'https://alexdiaz.me' }],
  openGraph: {
    title: 'SnowForge · Small tools, made with big care.',
    description:
      'An indie software studio forging tools for e-commerce, content, automation, and the games I love. Seven apps, one account. Built by Alex Diaz.',
    type: 'website',
    url: 'https://snowforge.dev',
    siteName: 'SnowForge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnowForge · Small tools, made with big care.',
    description:
      'An indie software studio forging tools for e-commerce, content, automation, and the games I love. Seven apps, one account.',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SnowForge LLC',
  url: 'https://snowforge.dev',
  founder: {
    '@type': 'Person',
    name: 'Alex Diaz',
    url: 'https://alexdiaz.me',
  },
  email: 'support@snowforge.dev',
  sameAs: [
    'https://alexdiaz.me',
    'https://github.com/snowthen-o7',
    'https://pipe.snowforge.dev',
    'https://scrape.snowforge.dev',
    'https://gen.snowforge.dev',
    'https://globe.snowforge.dev',
    'https://fort.snowforge.dev',
    'https://trueice.snowforge.dev',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable}`}
    >
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased font-sans">
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
