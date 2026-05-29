import { notFound } from 'next/navigation'
import { CountryDashboardShell } from '../_components'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDefaultRoleForDashboardSection, resolveCommercialDashboardSelection } from '@/lib/dashboard/commercialDashboard'

export default async function ConnectionsDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ country: countryParam }, resolvedSearch] = await Promise.all([params, searchParams])
  const country = resolveCountryRouteParam(countryParam)
  if (!country) notFound()
  const { selectedRole, selectedLayer } = resolveCommercialDashboardSelection(resolvedSearch, getDefaultRoleForDashboardSection('connections'))
  return <CountryDashboardShell country={country} section="connections" selectedRole={selectedRole} selectedLayer={selectedLayer} />
}
