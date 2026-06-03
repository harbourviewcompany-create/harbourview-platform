import { countryOptionMap, getCountryName } from '@/config/globe/country-role-profiles'
import {
  getDashboardRoleLabel,
  mapGlobeRoleToDashboardRole,
  parseCountries,
  isGlobeRouterMode,
  type DashboardRouteContext,
} from './dashboardShared'
import type { GlobeLayerId, IntentId, RoleId } from '@/types/globe-router'

export type { DashboardRole, DashboardRouteContext } from './dashboardShared'
export { getDashboardRoleLabel, mapGlobeRoleToDashboardRole }

type SearchParamsLike = Pick<URLSearchParams, 'get'>

const DEFAULT_DASHBOARD_CONTEXT: DashboardRouteContext = {
  role: 'commercial_operator',
  countries: [],
}

function readTrimmedParam(params: SearchParamsLike, key: string) {
  const value = params.get(key)?.trim()
  return value || undefined
}

function isKnownCountry(countryIso2?: string) {
  return Boolean(countryIso2 && countryOptionMap[countryIso2])
}

export function getDefaultDashboardRouteContext(): DashboardRouteContext {
  return { ...DEFAULT_DASHBOARD_CONTEXT, countries: [] }
}

export function parseDashboardGlobeRouteContext(params: SearchParamsLike): DashboardRouteContext {
  const source = readTrimmedParam(params, 'source')
  if (source !== 'globe_router') return getDefaultDashboardRouteContext()

  const rawMode = readTrimmedParam(params, 'mode')
  const rawCountry = readTrimmedParam(params, 'country')?.toUpperCase()
  const countries = parseCountries(readTrimmedParam(params, 'countries'))
  const countryIso2 = isKnownCountry(rawCountry) ? rawCountry : countries.find(isKnownCountry)
  const globeRoleId = readTrimmedParam(params, 'role') as RoleId | undefined
  const intentId = readTrimmedParam(params, 'intent') as IntentId | undefined
  const layerId = readTrimmedParam(params, 'layer') as GlobeLayerId | undefined
  const mode = isGlobeRouterMode(rawMode) ? rawMode : undefined
  const role = mapGlobeRoleToDashboardRole(globeRoleId)

  return {
    countryIso2,
    countryName: countryIso2 ? getCountryName(countryIso2) : undefined,
    role,
    source,
    mode,
    countries: countries.length ? countries : countryIso2 ? [countryIso2] : [],
    globeRoleId,
    intentId,
    layerId,
  }
}
