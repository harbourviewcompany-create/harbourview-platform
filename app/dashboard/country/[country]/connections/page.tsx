import { notFound } from 'next/navigation'
import { CountryDashboardShell } from '../_components'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'

export default async function ConnectionsDashboardPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: countryParam } = await params
  const country = resolveCountryRouteParam(countryParam)
  if (!country) notFound()
  return <CountryDashboardShell country={country} section="connections" />
}
