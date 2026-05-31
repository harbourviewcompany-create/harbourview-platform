import type { ScraperSource } from './types'

export const usedSurplusSources: ScraperSource[] = [
  {
    id: 'bidspotter-processing',
    name: 'BidSpotter Processing Equipment',
    url: 'https://www.bidspotter.com',
    category: 'used_surplus',
    parserType: 'manual-html',
    status: 'enabled',
    cadenceHours: 12,
    region: 'north_america',
    notes: 'Industrial processing and packaging auction inventory.',
  },
  {
    id: 'federal-equipment',
    name: 'Federal Equipment Company',
    url: 'https://www.fedequip.com',
    category: 'used_surplus',
    parserType: 'html-card',
    status: 'enabled',
    cadenceHours: 24,
    region: 'north_america',
    notes: 'Used processing and extraction equipment listings.',
  },
  {
    id: 'machinio-extraction',
    name: 'Machinio Extraction Equipment',
    url: 'https://www.machinio.com',
    category: 'used_surplus',
    parserType: 'html-card',
    status: 'needs-review',
    cadenceHours: 24,
    region: 'north_america',
    notes: 'Marketplace aggregation source requiring parser validation.',
  },
]
