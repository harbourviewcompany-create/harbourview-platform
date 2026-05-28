import type { EducationArticle } from '@/lib/education/types'

export function toPublicEducationArticleDto(article: EducationArticle) {
  return {
    slug: article.slug,
    title: article.title,
    publicationState: article.publicationState,
    publicSummary: article.publicSummary,
    sourceBasis: article.sourceBasis,
    reviewStatus: article.reviewStatus,
    lastReviewed: article.lastReviewed,
    nextReviewDue: article.nextReviewDue,
    publicationConfidence: article.publicationConfidence,
    reviewerType: article.reviewerType,
    controlledTopic: article.controlledTopic,
    sections: article.sections,
  }
}
