import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://harbourview.vercel.app'
  const now = new Date()

  const corePages = [
    { path: '', priority: 1.0, freq: 'monthly' as const },
    { path: '/what-we-do', priority: 0.8, freq: 'monthly' as const },
    { path: '/market-access', priority: 0.8, freq: 'monthly' as const },
    { path: '/commercial-intelligence', priority: 0.8, freq: 'monthly' as const },
    { path: '/strategic-introductions', priority: 0.8, freq: 'monthly' as const },
    { path: '/intake', priority: 0.9, freq: 'monthly' as const },
    { path: '/contact', priority: 0.7, freq: 'monthly' as const },
    { path: '/privacy', priority: 0.3, freq: 'yearly' as const },
    { path: '/terms', priority: 0.3, freq: 'yearly' as const },
  ]

  const marketplacePages = [
    { path: '/marketplace', priority: 0.9, freq: 'weekly' as const },
    { path: '/marketplace/new-products', priority: 0.8, freq: 'weekly' as const },
    { path: '/marketplace/used-surplus', priority: 0.7, freq: 'weekly' as const },
    { path: '/marketplace/cannabis-inventory', priority: 0.8, freq: 'weekly' as const },
    { path: '/marketplace/wanted-requests', priority: 0.8, freq: 'weekly' as const },
    { path: '/marketplace/services', priority: 0.7, freq: 'weekly' as const },
    { path: '/marketplace/business-opportunities', priority: 0.7, freq: 'weekly' as const },
    { path: '/marketplace/supplier-directory', priority: 0.7, freq: 'weekly' as const },
    { path: '/marketplace/submit-listing', priority: 0.6, freq: 'monthly' as const },
    { path: '/marketplace/submit-wanted', priority: 0.6, freq: 'monthly' as const },
  ]

  return [...corePages, ...marketplacePages].map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }))
}
