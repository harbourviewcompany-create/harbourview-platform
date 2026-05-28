export type EducationAudience = 'clinician'|'pharmacist'|'qa'|'qp'|'importer'|'exporter'|'distributor'|'regulator'|'investor'|'laboratory'|'procurement'|'policymaker'|'educator'
export type EducationSensitivity = 'standard'|'professional'|'medical'|'clinical'|'regulatory'|'legal'|'intelligence'|'restricted'
export type PublicationState = 'draft'|'source-review'|'clinical-review'|'legal-review'|'approved'|'request-only'|'published'|'archived'
export type SourceBasis = 'official-source'|'reviewed-public-source'|'internal-analysis'|'expert-reviewed'|'pending-verification'|'fixture'|'draft'

export type EducationArticle = {
  id: string
  slug: string
  title: string
  publicationState: PublicationState
  publicSummary: string
  sourceBasis: SourceBasis
  reviewStatus: string
  lastReviewed: string
  nextReviewDue: string
  publicationConfidence: number
  reviewerType: string
  controlledTopic: boolean
  sections: Array<{ key: string; heading: string; body: string }>
  internal?: { rawSourceUrls: string[]; reviewerNotes: string }
}
