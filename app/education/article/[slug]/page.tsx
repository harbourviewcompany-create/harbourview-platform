import { clinicalEducationModules } from '@/lib/fixtures/clinical-education'
import { toPublicEducationArticleDto } from '@/lib/dto/education'

export default async function EducationArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const module = clinicalEducationModules.find((item) => item.slug === slug)
  if (!module) return <main className="page-container py-16">Article not found.</main>

  const dto = toPublicEducationArticleDto({
    id: module.id,
    slug: module.slug,
    title: module.title,
    publicationState: module.publicUseApproved ? 'published' : 'request-only',
    publicSummary: module.publicSummary,
    sourceBasis: 'fixture',
    reviewStatus: module.moduleStatus,
    lastReviewed: module.lastReviewed,
    nextReviewDue: module.nextReviewDue,
    publicationConfidence: module.publicUseApproved ? 0.8 : 0.35,
    reviewerType: module.reviewerRoleRequired.join(', '),
    controlledTopic: module.riskLevel === 'high',
    sections: [{ key: 'overview', heading: 'Overview', body: module.publicSummary }],
    internal: { rawSourceUrls: ['https://private.example.local'], reviewerNotes: 'private' },
  })

  return <main className="page-container py-16"><h1>{dto.title}</h1><p>{dto.publicSummary}</p></main>
}
