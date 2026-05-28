import { notFound } from 'next/navigation'
import { getEducationArticleBySlug } from '@/lib/education/store'
import { toPublicEducationArticleDto } from '@/lib/dto/education'

export default async function EducationArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getEducationArticleBySlug(slug)
  if (!article) return notFound()
  const dto = toPublicEducationArticleDto(article)

  return (
    <main className="page-container py-16">
      <h1 className="text-4xl font-semibold">{dto.title}</h1>
      <p className="mt-4 text-gray-600">{dto.summary}</p>
      <ul className="mt-8 space-y-2 text-sm text-gray-700">
        <li>Source basis: {dto.sourceBasis}</li>
        <li>Review status: {dto.reviewStatus}</li>
        <li>Last reviewed: {dto.lastReviewedAt ?? 'pending'}</li>
        <li>Next review due: {dto.nextReviewDueAt ?? 'pending'}</li>
        <li>Publication confidence: {dto.publicationConfidence}</li>
      </ul>
    </main>
  )
}
