import { countryOptionMap, getCountryName } from '@/config/globe/country-role-profiles'
import { usStateByIso2 } from '@/data/globe/us-state-profiles'
import { canadaProvinceByIso2 } from '@/data/globe/canada-province-profiles'
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
  roleLabel?: string
  intentId?: IntentId
  intentLabel?: string
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

const medicalIntentIds = new Set<IntentId>([
  'understand_medical_rules',
  'treatment_channel_basics',
  'country_specific_guidance',
  'pharmacy_channel_rules',
  'product_dispensing_constraints',
  'country_specific_education',
])

const regulatoryIntentIds = new Set<IntentId>([
  'understand_import_rules',
  'screen_import_pathways',
  'testing_requirements',
  'quality_documentation',
  'licensing_market_access',
  'documentation_burden',
  'country_specific_constraints',
  'regulatory_framework',
  'track_signals',
  'import_export_help',
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

/** Accepts country ISO2 (DE), US state (US-GA), or Canadian province (CA-ON). */
function isKnownMarket(code?: string): boolean {
  if (!code) return false
  const upper = code.toUpperCase()
  return Boolean(countryOptionMap[upper] || usStateByIso2[upper] || canadaProvinceByIso2[upper])
}

/** For subnational codes return the parent ISO2; for country codes return as-is. */
function resolveEffectiveIso2(code: string): string {
  const upper = code.toUpperCase()
  if (usStateByIso2[upper])       return 'US'
  if (canadaProvinceByIso2[upper]) return 'CA'
  return upper
}

/** Human-readable name for any market code. */
function resolveMarketLabel(code: string): string {
  const upper = code.toUpperCase()
  return usStateByIso2[upper]?.name ?? canadaProvinceByIso2[upper]?.name ?? getCountryName(upper)
}

// Legacy alias for backward compat
function isKnownCountry(countryIso2?: string): boolean {
  return isKnownMarket(countryIso2)
}

function isGlobeRouterMode(value?: string): value is GlobeRouterMode {
  return value === 'single_market' || value === 'multi_market' || value === 'not_sure'
}

function titleCaseToken(value?: string) {
  return value
    ?.split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function mapGlobeRouteToDashboardRole(roleId?: RoleId, intentId?: IntentId): DashboardRole {
  if (roleId && medicalRoleIds.has(roleId)) return 'medical_professional'
  if (intentId && medicalIntentIds.has(intentId)) return 'medical_professional'
  if (roleId && regulatoryRoleIds.has(roleId)) return 'regulatory_legal'
  if (intentId && regulatoryIntentIds.has(intentId)) return 'regulatory_legal'
  return 'commercial_operator'
}

export function mapGlobeRoleToDashboardRole(roleId?: RoleId): DashboardRole {
  return mapGlobeRouteToDashboardRole(roleId)
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
  const rawResolved  = rawCountry && isKnownMarket(rawCountry) ? resolveEffectiveIso2(rawCountry) : null
  const countryIso2  = rawResolved ?? (countries.find(isKnownMarket) ? resolveEffectiveIso2(countries.find(isKnownMarket)!) : undefined)
  const globeRoleId = readTrimmedParam(params, 'role') as RoleId | undefined
  const intentId = readTrimmedParam(params, 'intent') as IntentId | undefined
  const layerId = readTrimmedParam(params, 'layer') as GlobeLayerId | undefined
  const mode = isGlobeRouterMode(rawMode) ? rawMode : undefined
  const role = mapGlobeRouteToDashboardRole(globeRoleId, intentId)

  if (!countryIso2) {
    return {
      ...getDefaultDashboardRouteContext(),
      source,
      mode,
      countries,
      globeRoleId,
      roleLabel: titleCaseToken(globeRoleId),
      intentId,
      intentLabel: titleCaseToken(intentId),
      layerId,
      role,
    }
  }

  return {
    countryIso2,
    countryName: rawCountry ? resolveMarketLabel(rawCountry) : getCountryName(countryIso2),
    role,
    source,
    mode,
    countries: countries.length ? countries : [countryIso2],
    globeRoleId,
    roleLabel: titleCaseToken(globeRoleId),
    intentId,
    intentLabel: titleCaseToken(intentId),
    layerId,
  }
}
