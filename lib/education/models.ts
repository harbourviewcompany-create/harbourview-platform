import type { EducationAudience, EducationSensitivity, PublicationState, SourceBasis } from '@/lib/education/taxonomy'

export type EducationArticle = {
  id: string
  slug: string
  title: string
  summary: string
  state: PublicationState
  sourceBasis: SourceBasis
  sensitivity: EducationSensitivity
  audience: EducationAudience[]
  reviewerRequired: boolean
  lastReviewedAt: string | null
  nextReviewDueAt: string | null
  disclaimerType: 'standard' | 'medical' | 'clinical' | 'request-only'
  countryApplicability: string[]
  restrictedLanguageFlags: string[]
  publicationConfidence: 'low' | 'medium' | 'high'
}

export type EducationSource = {
  id: string
  articleId: string
  label: string
  reviewerType: 'editorial' | 'clinical' | 'legal' | 'regulatory'
  confidence: 'low' | 'medium' | 'high'
  contradictorySourceFlag: boolean
}
