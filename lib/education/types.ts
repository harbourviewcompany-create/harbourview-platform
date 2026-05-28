export const EDUCATION_AUDIENCES = [
  'clinician','pharmacist','qa','qp','importer','exporter','distributor','regulator','investor','laboratory','procurement','policymaker','educator',
] as const

export const EDUCATION_SENSITIVITY = [
  'standard','professional','medical','clinical','regulatory','legal','intelligence','restricted',
] as const

export const EDUCATION_PUBLICATION_STATE = [
  'draft','source-review','clinical-review','legal-review','approved','request-only','published','archived',
] as const

export type EducationPublicationState = (typeof EDUCATION_PUBLICATION_STATE)[number]

export type EducationArticleRecord = {
  slug: string
  title: string
  publicSummary: string
  disclaimerType: string
  sourceBasis: string
  confidenceScore: number
  reviewerType: string
  publicationState: EducationPublicationState
  lastReviewedAt: string | null
  nextReviewDueAt: string | null
  sections: Array<{ key: string; title: string; content: string }>
}
