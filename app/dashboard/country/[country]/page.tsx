import { notFound } from 'next/navigation'
import { CountryDashboardShell } from './_components'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { mapGlobeRoleToDashboardRole, getDashboardRoleLabel } from '@/lib/dashboard/globeRouteContext'
import {
  countryHeatmapLayers,
  resolveCountryDashboardRole,
  type CountryHeatmapLayer,
} from '@/lib/dashboard/commercial'
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
  const commercialRole = resolveCountryDashboardRole(rawRole)
  const dashboardRole = commercialRole === 'doctor' || commercialRole === 'pharmacist'
    ? 'medical_professional'
    : mapGlobeRoleToDashboardRole(rawRole as RoleId | undefined)
  const roleLabel = getDashboardRoleLabel(dashboardRole)
  const rawLayer = typeof resolvedSearch.layer === 'string' ? resolvedSearch.layer : undefined
  const selectedLayer = countryHeatmapLayers.includes(rawLayer as CountryHeatmapLayer) ? rawLayer as CountryHeatmapLayer : 'Marketplace Activity'

  return <CountryDashboardShell country={country} dashboardRole={dashboardRole} roleLabel={roleLabel} commercialRole={commercialRole} selectedLayer={selectedLayer} />
}

