import { intentProfileMap } from '@/config/globe/intent-profiles'
import type { DestinationType, GlobeRouteInput, GlobeRouteResult, IntentProfile, RoleId } from '@/types/globe-router'

// Maps globe role IDs to destination types while keeping /dashboard as the
// primary post-globe control center. Product areas are represented in the
// dashboard instead of routing users into legacy country dashboard paths.
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

function mapRoleToDestinationType(roleId?: RoleId): DestinationType {
  if (!roleId || roleId === 'not_sure') return 'routing_review'
  if (medicalRoleIds.has(roleId)) return 'medical_education'
  if (regulatoryRoleIds.has(roleId)) return 'regulatory_education'
  return 'marketplace_services'
}

function appendGlobeQuery(basePath: string, input: GlobeRouteInput) {
  const params = new URLSearchParams()

  params.set('source', input.source)
  params.set('mode', input.mode)

  if (input.countryIso2) params.set('country', input.countryIso2)
  if (input.countryIso2s?.length) params.set('countries', input.countryIso2s.join(','))
  if (input.roleId) params.set('role', input.roleId)
  if (input.intentId) params.set('intent', input.intentId)
  if (input.layerId) params.set('layer', input.layerId)

  return `${basePath}?${params.toString()}`
}

export function resolveGlobeRoute(input: GlobeRouteInput): GlobeRouteResult {
  const intent = input.intentId ? intentProfileMap[input.intentId] : undefined
  const destinationType: IntentProfile['destinationType'] = intent?.destinationType ?? mapRoleToDestinationType(input.roleId)

  return {
    status: 'resolved',
    href: appendGlobeQuery('/dashboard', input),
    destinationType,
  }
}

export function useRouteResolver() {
  return resolveGlobeRoute
}
