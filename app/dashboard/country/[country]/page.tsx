import { notFound } from 'next/navigation'
import { CountryDashboardShell } from '@/components/dashboard-routing/CountryDashboardShell'
import { resolveCountryRouteParam } from '@/lib/dashboard/countryRegistry'

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  if (!resolveCountryRouteParam(country)) notFound()
  return <CountryDashboardShell countryParam={country}><p>Country overview and status strip.</p></CountryDashboardShell>
}
