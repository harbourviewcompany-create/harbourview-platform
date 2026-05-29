import { notFound } from 'next/navigation'
import { CountryDashboardShell } from './_components'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { countryDashboardRoleLabels, normalizeCountryDashboardRole } from '@/lib/dashboard/commercial'

export default async function CountryDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ country: countryParam }, resolvedSearch] = await Promise.all([params, searchParams])
  const country = resolveCountryRouteParam(countryParam)
  if (!country) notFound()

  const rawRole = typeof resolvedSearch.role === 'string' ? resolvedSearch.role : undefined
  const dashboardRole = normalizeCountryDashboardRole(rawRole)
  const roleLabel = countryDashboardRoleLabels[dashboardRole]
  const rawLayer = typeof resolvedSearch.layer === 'string' ? resolvedSearch.layer : undefined

  return <CountryDashboardShell country={country} dashboardRole={dashboardRole} roleLabel={roleLabel} selectedLayer={rawLayer} />
}
