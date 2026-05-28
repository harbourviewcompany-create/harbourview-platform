import type { EducationArticleRecord } from '@/lib/education/types'

export type PublicEducationArticleDto = {
  slug: string
  title: string
  summary: string
  sourceBasis: string
  reviewStatus: string
  lastReviewedAt: string | null
  nextReviewDueAt: string | null
  confidence: number
  disclaimerType: string
  sections: Array<{ key: string; title: string; content: string }>
}

export function toPublicEducationArticleDto(record: EducationArticleRecord): PublicEducationArticleDto {
  return {
    slug: record.slug,
    title: record.title,
    summary: record.publicSummary,
    sourceBasis: record.sourceBasis,
    reviewStatus: record.publicationState,
    lastReviewedAt: record.lastReviewedAt,
    nextReviewDueAt: record.nextReviewDueAt,
    confidence: record.confidenceScore,
    disclaimerType: record.disclaimerType,
    sections: record.sections,
  }
}
