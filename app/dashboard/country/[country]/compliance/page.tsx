import { notFound } from 'next/navigation'
import { CountryDashboardShell } from '@/components/dashboard-routing/CountryDashboardShell'
import { resolveCountryRouteParam } from '@/lib/dashboard/countryRegistry'

export default async function CompliancePage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  if (!resolveCountryRouteParam(country)) notFound()
  return <CountryDashboardShell countryParam={country} section='compliance'><p>compliance panel renders status-aware content.</p></CountryDashboardShell>
}
