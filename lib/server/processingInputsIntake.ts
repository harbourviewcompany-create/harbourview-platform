import crypto from 'node:crypto'
import type {
  PublicProcessingInputProjection,
  ScrapedProcessingInputCandidate,
} from '@/lib/scrapers/types'

export interface ProcessingInputIntakeCandidate extends ScrapedProcessingInputCandidate {
  sourceContactEmail?: string
  internalNotes?: string
  sourceEvidence?: string
}

function createHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function normalizeProcessingInputCandidate(
  candidate: ProcessingInputIntakeCandidate,
): ProcessingInputIntakeCandidate {
  return {
    ...candidate,
    title: candidate.title.trim(),
    summary: candidate.summary.trim(),
    region: candidate.region?.trim() || 'Available on request',
    tags: [...new Set(candidate.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 10),
    pricingModel: candidate.pricingModel ?? 'quote-based',
  }
}

export function toPublicProcessingInputProjection(
  candidate: ProcessingInputIntakeCandidate,
): PublicProcessingInputProjection {
  const normalized = normalizeProcessingInputCandidate(candidate)

  return {
    id: createHash(`${normalized.sourceId}-${normalized.title}`).slice(0, 12),
    title: normalized.title,
    summary: normalized.summary,
    category: normalized.category,
    pricingModel: normalized.pricingModel ?? 'quote-based',
    region: normalized.region || 'Available on request',
    tags: normalized.tags,
    postedDate: normalized.discoveredAt.split('T')[0],
  }
}
