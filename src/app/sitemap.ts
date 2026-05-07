import type { MetadataRoute } from 'next'

const SITE_URL = 'https://snowforge.dev'

const routes = [
  '/',
  '/about',
  '/contact',
  '/blog',
  '/blog/auditing-feeds-before-you-push',
  '/blog/building-snowforge',
  '/blog/why-product-feeds-break',
  '/blog/fortnite-shop-tracker',
  '/privacy',
  '/terms',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path.startsWith('/blog') ? 'monthly' : 'monthly',
    priority: path === '/' ? 1.0 : path.startsWith('/blog/') ? 0.7 : 0.5,
  }))
}
