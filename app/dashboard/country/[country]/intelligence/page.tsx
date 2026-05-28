import { notFound } from 'next/navigation'
import { resolveCountryRouteParam } from '@/lib/dashboard/countryRegistry'

export default async function Page({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  const resolved = resolveCountryRouteParam(country)
  if (!resolved) notFound()
  return <div aria-label="dashboard-section-intelligence">{resolved.displayName} intelligence panel</div>
}
