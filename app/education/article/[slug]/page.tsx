import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEducationArticleBySlug } from '@/lib/education/repository'
import { toPublicEducationArticleDto } from '@/lib/dto/education/publicEducationDto'

export const metadata: Metadata = {
  title: 'Education Article',
  description: 'Controlled professional education article with source and review metadata.',
}

export default async function EducationArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const record = await getEducationArticleBySlug(slug)
  if (!record || record.publicationState !== 'published') notFound()

  const article = toPublicEducationArticleDto(record)
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-slate-100">
      <h1 className="text-4xl font-semibold">{article.title}</h1>
      <p className="mt-4 text-slate-300">{article.summary}</p>
      <div className="mt-6 grid grid-cols-1 gap-2 text-sm text-slate-400 md:grid-cols-2">
        <p>Source basis: {article.sourceBasis}</p>
        <p>Review status: {article.reviewStatus}</p>
        <p>Last reviewed: {article.lastReviewedAt ?? 'Pending'}</p>
        <p>Next review due: {article.nextReviewDueAt ?? 'Pending'}</p>
      </div>
      <section className="mt-10 space-y-6">
        {article.sections.map((section) => (
          <article key={section.key}>
            <h2 className="text-xl font-medium">{section.title}</h2>
            <p className="mt-2 text-slate-300">{section.content}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
