import { redirect } from 'next/navigation'

export default async function GeneticsCultivarSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/marketplace/genetics/${encodeURIComponent(slug)}`)
}
