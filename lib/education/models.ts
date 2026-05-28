import type { EducationAudience, EducationPublicationState, EducationSensitivity, EducationSourceBasis } from '@/lib/education/taxonomy'

export type EducationArticle = {
  id: string
  slug: string
  title: string
  summary: string
  state: EducationPublicationState
  audience: EducationAudience[]
  sensitivity: EducationSensitivity
  sourceBasis: EducationSourceBasis
  reviewStatus: 'review-required' | 'reviewed'
  lastReviewed: string
  nextReviewDue: string
  publicationConfidence: 'low' | 'medium' | 'high'
  reviewerType: string
  controlledTopic: boolean
}
