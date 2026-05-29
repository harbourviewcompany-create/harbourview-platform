import { notFound } from 'next/navigation'
import { CountryDashboardShell } from '../_components'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDefaultRoleForDashboardSection, resolveCommercialDashboardSelection } from '@/lib/dashboard/commercialDashboard'

export default async function ComplianceDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ country: countryParam }, resolvedSearch] = await Promise.all([params, searchParams])
  const country = resolveCountryRouteParam(countryParam)
  if (!country) notFound()
  const { selectedRole, selectedLayer } = resolveCommercialDashboardSelection(resolvedSearch, getDefaultRoleForDashboardSection('compliance'))
  return <CountryDashboardShell country={country} section="compliance" selectedRole={selectedRole} selectedLayer={selectedLayer} />
}
