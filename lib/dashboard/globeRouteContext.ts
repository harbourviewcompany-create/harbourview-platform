import { countryOptionMap, getCountryName } from '@/config/globe/country-role-profiles'
import type { GlobeLayerId, GlobeRouterMode, IntentId, RoleId } from '@/types/globe-router'

export type DashboardRole = 'commercial_operator' | 'medical_professional' | 'regulatory_legal'

export interface DashboardRouteContext {
  countryIso2: string
  countryName: string
  role: DashboardRole
  source?: 'globe_router'
  mode?: GlobeRouterMode
  countries: string[]
  globeRoleId?: RoleId
  intentId?: IntentId
  layerId?: GlobeLayerId
}

type SearchParamsLike = Pick<URLSearchParams, 'get'>

const DEFAULT_DASHBOARD_CONTEXT: DashboardRouteContext = {
  countryIso2: 'CA',
  countryName: 'Canada',
  role: 'commercial_operator',
  countries: ['CA'],
}

const medicalRoleIds = new Set<RoleId>([
  'doctor_prescriber',
  'pharmacist',
  'clinic_healthcare_operator',
  'patient_caregiver_education',
])

const regulatoryRoleIds = new Set<RoleId>([
  'regulatory_compliance',
  'legal_advisory',
  'government_regulator',
  'gmp_quality',
  'lab_qa',
  'logistics_customs',
])

const dashboardRoleLabels: Record<DashboardRole, string> = {
  commercial_operator: 'Commercial Operator',
  medical_professional: 'Medical Professional',
  regulatory_legal: 'Regulatory & Legal',
}

function readTrimmedParam(params: SearchParamsLike, key: string) {
  const value = params.get(key)?.trim()
  return value || undefined
}

function parseCountries(value?: string) {
  return value
    ? value.split(',').map((countryIso2) => countryIso2.trim().toUpperCase()).filter(Boolean)
    : []
}

function isKnownCountry(countryIso2?: string) {
  return Boolean(countryIso2 && countryOptionMap[countryIso2])
}

function isGlobeRouterMode(value?: string): value is GlobeRouterMode {
  return value === 'single_market' || value === 'multi_market' || value === 'not_sure'
}

export function mapGlobeRoleToDashboardRole(roleId?: RoleId): DashboardRole {
  if (!roleId) return DEFAULT_DASHBOARD_CONTEXT.role
  if (medicalRoleIds.has(roleId)) return 'medical_professional'
  if (regulatoryRoleIds.has(roleId)) return 'regulatory_legal'
  return 'commercial_operator'
}

export function getDashboardRoleLabel(role: DashboardRole) {
  return dashboardRoleLabels[role]
}

export function getDefaultDashboardRouteContext(): DashboardRouteContext {
  return { ...DEFAULT_DASHBOARD_CONTEXT, countries: [...DEFAULT_DASHBOARD_CONTEXT.countries] }
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

  if (!countryIso2) {
    return {
      ...getDefaultDashboardRouteContext(),
      source,
      mode,
      countries,
      globeRoleId,
      intentId,
      layerId,
      role: mapGlobeRoleToDashboardRole(globeRoleId),
    }
  }

  return {
    countryIso2,
    countryName: getCountryName(countryIso2),
    role: mapGlobeRoleToDashboardRole(globeRoleId),
    source,
    mode,
    countries: countries.length ? countries : [countryIso2],
    globeRoleId,
    intentId,
    layerId,
  }
}
