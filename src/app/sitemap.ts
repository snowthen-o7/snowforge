import type { MetadataRoute } from 'next'
import { POSTS } from '@/lib/posts'

const SITE_URL = 'https://snowforge.dev'

const staticRoutes = ['/', '/about', '/contact', '/blog', '/privacy', '/terms']

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const blogRoutes = POSTS.map((p) => `/blog/${p.slug}`)
  const routes = [...staticRoutes, ...blogRoutes]

  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1.0 : path.startsWith('/blog/') ? 0.7 : 0.5,
  }))
}
