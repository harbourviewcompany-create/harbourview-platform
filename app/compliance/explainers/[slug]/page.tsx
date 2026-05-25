import { notFound } from 'next/navigation'
import { getExplainer } from '@/lib/compliance/explainers'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'

type ExplainerPageProps = { params: Promise<{ slug: string }> }

export default async function ExplainerPage({ params }: ExplainerPageProps) {
  const { slug } = await params
  const explainer = getExplainer(slug)
  if (!explainer) return notFound()

  return (
    <>
      <PublicHero eyebrow="Compliance / Explainers" title={explainer.title} compact>{""}</PublicHero>
      <PublicSection tone="navy">
        <div className="mx-auto max-w-3xl">
          <PublicCard className="p-8 space-y-5 text-sm leading-8 text-white/62">
            <p>{explainer.summary}</p>
            <p className="text-xs text-white/36 border-t border-white/10 pt-4">{explainer.disclaimer}</p>
          </PublicCard>
        </div>
      </PublicSection>
    </>
  )
}
