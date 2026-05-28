import type { EducationArticle } from '@/lib/education/models'

export const educationArticlesFixture: EducationArticle[] = [
  {
    id: 'art-1', slug: 'gmp-basics', title: 'GMP Basics for Regulated Cannabis', summary: 'Controlled GMP orientation content.',
    state: 'published', sourceBasis: 'reviewed-public-source', sensitivity: 'regulatory', audience: ['qa','qp','regulator'], reviewerRequired: true,
    lastReviewedAt: '2026-05-20', nextReviewDueAt: '2026-08-20', disclaimerType: 'standard', countryApplicability: ['global'], restrictedLanguageFlags: [], publicationConfidence: 'medium',
  },
]

export function getEducationArticleBySlug(slug: string) {
  return educationArticlesFixture.find((a) => a.slug === slug) ?? null
}
