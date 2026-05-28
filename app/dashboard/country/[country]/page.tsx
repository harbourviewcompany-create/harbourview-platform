import { notFound } from 'next/navigation'
import { resolveCountryRouteParam } from '@/lib/dashboard/countryRegistry'

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  const resolved = resolveCountryRouteParam(country)
  if (!resolved) notFound()
  return <div aria-label="dashboard-country-overview">{resolved.displayName} dashboard overview</div>
}
