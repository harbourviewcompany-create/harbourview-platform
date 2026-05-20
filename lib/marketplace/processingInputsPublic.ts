import { processingInputSources } from '@/lib/scrapers/used-surplus-sources'
import {
  toPublicProcessingInputProjection,
  type ProcessingInputIntakeCandidate,
} from '@/lib/server/processingInputsIntake'

const seedCandidates: ProcessingInputIntakeCandidate[] = [
  {
    sourceId: processingInputSources[0].id,
    sourceName: processingInputSources[0].name,
    sourceUrl: processingInputSources[0].url,
    title: 'Compostable barrier pouches for regulated retail packaging',
    summary: 'Quote-based pouch and child-resistant format program for multi-SKU operators.',
    category: 'packaging',
    pricingModel: 'quote-based',
    region: 'North America',
    tags: ['packaging', 'retail', 'child-resistant'],
    discoveredAt: new Date('2026-05-20T00:00:00.000Z').toISOString(),
    confidence: 0.82
  },
  {
    sourceId: processingInputSources[1].id,
    sourceName: processingInputSources[1].name,
    sourceUrl: processingInputSources[1].url,
    title: 'ISO-calibrated lab QA consumables restock program',
    summary: 'Catalog and quote path for reference standards, vials and QA handling kits.',
    category: 'lab',
    pricingModel: 'catalog',
    region: 'US / Canada',
    tags: ['lab', 'qa', 'consumables'],
    discoveredAt: new Date('2026-05-18T00:00:00.000Z').toISOString(),
    confidence: 0.79
  },
]

export const publicProcessingInputListings = seedCandidates.map(
  toPublicProcessingInputProjection,
)
