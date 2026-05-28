import type { EducationArticleRecord } from '@/lib/education/types'

const fixtureArticle: EducationArticleRecord = {
  slug: 'clinical-governance-foundations',
  title: 'Clinical Governance Foundations',
  publicSummary: 'Institutional education content with controlled claims and review metadata.',
  disclaimerType: 'education-only',
  sourceBasis: 'reviewed-public-source',
  confidenceScore: 0.82,
  reviewerType: 'clinical-analyst',
  publicationState: 'published',
  lastReviewedAt: '2026-05-01T00:00:00.000Z',
  nextReviewDueAt: '2026-08-01T00:00:00.000Z',
  sections: [
    { key: 'overview', title: 'Overview', content: 'Education-only overview with no dosing or treatment guidance.' },
    { key: 'compliance', title: 'Compliance Considerations', content: 'Route jurisdiction interpretations to qualified legal and regulatory review.' },
  ],
}

export async function getEducationArticleBySlug(slug: string): Promise<EducationArticleRecord | null> {
  if (slug === fixtureArticle.slug) return fixtureArticle
  return null
}
