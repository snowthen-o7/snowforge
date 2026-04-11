export type AppEntry = {
  name: string
  shortDescription: string
  url: string
  /** Hex color used for the monogram background and top accent bar. */
  color: string
  /** Optional flag: renders the card as non-interactive with a "SOON" pill. */
  comingSoon?: boolean
}

export const APPS: AppEntry[] = [
  {
    name: 'SnowPipe',
    shortDescription: 'Product feed orchestration for Shopify, Meta, and Google.',
    url: 'https://pipe.snowforge.dev',
    color: '#f59e0b',
  },
  {
    name: 'SnowScrape',
    shortDescription: 'Serverless web scraping with scheduled jobs and cloud storage.',
    url: 'https://scrape.snowforge.dev',
    color: '#3b82f6',
  },
  {
    name: 'SnowGen',
    shortDescription: 'AI powered content generation and multi-platform publishing.',
    url: 'https://gen.snowforge.dev',
    color: '#8b5cf6',
  },
  {
    name: 'SnowGlobe',
    shortDescription: 'Lead gen intelligence across Reddit, HN, and RSS.',
    url: 'https://globe.snowforge.dev',
    color: '#10b981',
  },
  {
    name: 'SnowFort',
    shortDescription: 'Fortnite item shop tracker with alerts and 17,000+ cosmetics.',
    url: 'https://fort.snowforge.dev',
    color: '#f43f5e',
  },
  {
    name: 'TrueIce',
    shortDescription: 'Advanced League of Legends match history and analytics.',
    url: 'https://trueice.snowforge.dev',
    color: '#06b6d4',
  },
  {
    name: 'SnowSports',
    shortDescription: 'Sports analytics and data visualization for stats driven fans.',
    url: 'https://sports.snowforge.dev',
    color: '#0ea5e9',
    comingSoon: true,
  },
]
