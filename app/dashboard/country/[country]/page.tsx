import { notFound } from 'next/navigation'
import { CountryDashboardShell } from './_components'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { mapGlobeRoleToDashboardRole, getDashboardRoleLabel } from '@/lib/dashboard/globeRouteContext'
import type { RoleId } from '@/types/globe-router'

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

  // Resolve the globe role from query params set by the router.
  // Falls back to 'commercial_operator' when navigating directly (no source param).
  const rawRole = typeof resolvedSearch.role === 'string' ? resolvedSearch.role : undefined
  const dashboardRole = mapGlobeRoleToDashboardRole(rawRole as RoleId | undefined)
  const roleLabel = getDashboardRoleLabel(dashboardRole)

  return <CountryDashboardShell country={country} dashboardRole={dashboardRole} roleLabel={roleLabel} />
}

