import type { ScraperSource } from './types'

export const usedSurplusSources: ScraperSource[] = [
  {
    id: 'bidspotter-processing',
    name: 'BidSpotter Processing Equipment',
    url: 'https://www.bidspotter.com',
    category: 'used-surplus',
    parserType: 'manual-html',
    status: 'enabled',
    cadenceHours: 12,
    notes: 'Industrial processing and packaging auction inventory.',
  },
  {
    id: 'federal-equipment',
    name: 'Federal Equipment Company',
    url: 'https://www.fedequip.com',
    category: 'used-surplus',
    parserType: 'html-card',
    status: 'enabled',
    cadenceHours: 24,
    notes: 'Used processing and extraction equipment listings.',
  },
  {
    id: 'machinio-extraction',
    name: 'Machinio Extraction Equipment',
    url: 'https://www.machinio.com',
    category: 'used-surplus',
    parserType: 'html-card',
    status: 'needs-review',
    cadenceHours: 24,
    notes: 'Marketplace aggregation source requiring parser validation.',
  },
]

export const processingInputSources: ScraperSource[] = [
  {
    id: 'packaging-index-network',
    name: 'Packaging Index Network',
    url: 'https://example.com/packaging-index-network',
    category: 'processing-inputs',
    parserType: 'manual-html',
    status: 'needs-review',
    cadenceHours: 24,
    notes: 'Aggregated packaging input opportunities and quote-based supplier programs.',
  },
  {
    id: 'lab-consumables-exchange',
    name: 'Lab Consumables Exchange',
    url: 'https://example.com/lab-consumables-exchange',
    category: 'processing-inputs',
    parserType: 'html-card',
    status: 'needs-review',
    cadenceHours: 24,
    notes: 'Quality-control and lab consumables availability snapshots.',
  },
]
