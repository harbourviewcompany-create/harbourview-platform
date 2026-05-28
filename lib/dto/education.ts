import type { EducationArticle } from '@/lib/education/models'

export type PublicEducationArticleDto = {
  slug: string
  title: string
  summary: string
  sourceBasis: string
  reviewStatus: string
  lastReviewed: string
  nextReviewDue: string
  publicationConfidence: string
  reviewerType: string
  controlledTopic: boolean
}

export const toPublicEducationArticleDto = (article: EducationArticle): PublicEducationArticleDto => ({
  slug: article.slug,
  title: article.title,
  summary: article.summary,
  sourceBasis: article.sourceBasis,
  reviewStatus: article.reviewStatus,
  lastReviewed: article.lastReviewed,
  nextReviewDue: article.nextReviewDue,
  publicationConfidence: article.publicationConfidence,
  reviewerType: article.reviewerType,
  controlledTopic: article.controlledTopic,
})
