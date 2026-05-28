import type { EducationArticle } from '@/lib/education/models'

export type PublicEducationArticleDto = {
  slug: string
  title: string
  summary: string
  sourceBasis: EducationArticle['sourceBasis']
  reviewStatus: EducationArticle['state']
  lastReviewedAt: string | null
  nextReviewDueAt: string | null
  publicationConfidence: EducationArticle['publicationConfidence']
  controlledTopic: boolean
}

export function toPublicEducationArticleDto(article: EducationArticle): PublicEducationArticleDto {
  return {
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    sourceBasis: article.sourceBasis,
    reviewStatus: article.state,
    lastReviewedAt: article.lastReviewedAt,
    nextReviewDueAt: article.nextReviewDueAt,
    publicationConfidence: article.publicationConfidence,
    controlledTopic: ['clinical','medical','restricted','intelligence'].includes(article.sensitivity),
  }
}
