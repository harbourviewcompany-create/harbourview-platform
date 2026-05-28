import { DashboardShell } from '@/components/dashboard-country/DashboardShell'
import { resolveCountryRouteParam } from '@/lib/dashboard/country-registry'
import { notFound } from 'next/navigation'
export default async function Page({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  if (!resolveCountryRouteParam(country)) notFound()
  return <DashboardShell countryParam={country} section="market">market panel status-aware state rendered.</DashboardShell>
}
