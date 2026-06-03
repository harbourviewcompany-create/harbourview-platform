import type { GlobeLayerId, GlobeRouterMode, IntentId, RoleId } from '@/types/globe-router'

export type DashboardRole = 'commercial_operator' | 'medical_professional' | 'regulatory_legal'

export interface DashboardRouteContext {
  countryIso2?: string
  countryName?: string
  role: DashboardRole
  source?: 'globe_router'
  mode?: GlobeRouterMode
  countries: string[]
  globeRoleId?: RoleId
  intentId?: IntentId
  layerId?: GlobeLayerId
}

export interface DashboardPreferencePatch {
  countryIso2?: string
  countries?: string[]
  role?: DashboardRole
  globeRoleId?: RoleId
  intentId?: IntentId
  mode?: GlobeRouterMode
  layerId?: GlobeLayerId
  marketplaceTab?: string
  notificationPanelOpen?: boolean
}

export const dashboardPreferenceWhitelist = [
  'countryIso2',
  'countries',
  'role',
  'globeRoleId',
  'intentId',
  'mode',
  'layerId',
  'marketplaceTab',
  'notificationPanelOpen',
] as const

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

export const dashboardRoleLabels: Record<DashboardRole, string> = {
  commercial_operator: 'Commercial Operator',
  medical_professional: 'Medical Professional',
  regulatory_legal: 'Regulatory & Legal',
}

export function mapGlobeRoleToDashboardRole(roleId?: RoleId): DashboardRole {
  if (!roleId) return 'commercial_operator'
  if (medicalRoleIds.has(roleId)) return 'medical_professional'
  if (regulatoryRoleIds.has(roleId)) return 'regulatory_legal'
  return 'commercial_operator'
}

export function getDashboardRoleLabel(role: DashboardRole) {
  return dashboardRoleLabels[role]
}

export function isDashboardRole(value: unknown): value is DashboardRole {
  return value === 'commercial_operator' || value === 'medical_professional' || value === 'regulatory_legal'
}

export function isGlobeRouterMode(value?: string): value is GlobeRouterMode {
  return value === 'single_market' || value === 'multi_market' || value === 'not_sure'
}

export function parseCountries(value?: string) {
  return value
    ? value.split(',').map((countryIso2) => countryIso2.trim().toUpperCase()).filter(Boolean)
    : []
}

export function sanitizePreferencePatch(input: unknown): DashboardPreferencePatch {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const record = input as Record<string, unknown>
  const patch: DashboardPreferencePatch = {}

  if (typeof record.countryIso2 === 'string') patch.countryIso2 = record.countryIso2.trim().toUpperCase()
  if (Array.isArray(record.countries)) {
    patch.countries = record.countries
      .filter((country): country is string => typeof country === 'string')
      .map((country) => country.trim().toUpperCase())
      .filter(Boolean)
  }
  if (isDashboardRole(record.role)) patch.role = record.role
  if (typeof record.globeRoleId === 'string') patch.globeRoleId = record.globeRoleId as RoleId
  if (typeof record.intentId === 'string') patch.intentId = record.intentId as IntentId
  if (typeof record.mode === 'string' && isGlobeRouterMode(record.mode)) patch.mode = record.mode
  if (typeof record.layerId === 'string') patch.layerId = record.layerId as GlobeLayerId
  if (typeof record.marketplaceTab === 'string') patch.marketplaceTab = record.marketplaceTab
  if (typeof record.notificationPanelOpen === 'boolean') patch.notificationPanelOpen = record.notificationPanelOpen

  return patch
}
