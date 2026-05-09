import { usedSurplusSources } from './used-surplus-sources'
import type { ScrapeResult } from './types'

export async function getMockUsedSurplusFeed(): Promise<ScrapeResult[]> {
  return usedSurplusSources.map((source, index) => ({
    source,
    status: source.status === 'enabled' ? 'fetched' : 'skipped',
    reason:
      source.status === 'enabled'
        ? undefined
        : 'Source pending parser validation before automated intake.',
    candidates:
      source.status === 'enabled'
        ? [
            {
              sourceId: source.id,
              sourceName: source.name,
              sourceUrl: source.url,
              title: `Automated intake candidate ${index + 1}`,
              description:
                'Normalized candidate generated from controlled scraper scaffold. Requires admin review before public publication.',
              price: '$12,500',
              currency: 'USD',
              location: 'United States',
              condition: 'used',
              imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab10380a2f3?q=80&w=1200&auto=format&fit=crop',
              tags: ['Automated Intake', 'Review Required', 'Used Equipment'],
              discoveredAt: new Date().toISOString(),
              confidence: 0.72,
            },
          ]
        : [],
  }))
}
