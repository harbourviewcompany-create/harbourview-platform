import type { EducationPublicationState } from '@/lib/education/taxonomy'

const transitions: Record<EducationPublicationState, EducationPublicationState[]> = {
  draft: ['source-review', 'archived'],
  'source-review': ['clinical-review', 'archived'],
  'clinical-review': ['legal-review', 'archived'],
  'legal-review': ['approved', 'archived'],
  approved: ['published', 'request-only', 'archived'],
  'request-only': ['published', 'archived'],
  published: ['archived'],
  archived: [],
}

export const canTransitionEducationReviewState = (from: EducationPublicationState, to: EducationPublicationState) => transitions[from].includes(to)
