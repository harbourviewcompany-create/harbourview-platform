import { getExplainer } from '@/lib/compliance/explainers'

type ExplainerPageProps = {
  params: Promise<{ slug: string }>
}

export default async function ExplainerPage({ params }: ExplainerPageProps) {
  const { slug } = await params
  const explainer = getExplainer(slug)

  if (!explainer) return <div>Not found</div>

  return (
    <div className="page-container py-12 space-y-6">
      <h1 className="text-2xl font-bold text-navy">{explainer.title}</h1>
      <p>{explainer.summary}</p>
      <p className="text-sm text-gray-600">{explainer.disclaimer}</p>
    </div>
  )
}
