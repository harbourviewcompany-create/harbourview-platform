import { countryOptionMap } from '@/config/globe/country-role-profiles'
import type { RoleId } from '@/types/globe-router'
import type { DashboardRole } from './DashboardContext'

export interface DashboardInitialState {
  countryIso2: string
  countryName: string
  role: DashboardRole
}

export const defaultDashboardInitialState: DashboardInitialState = {
  countryIso2: 'CA',
  countryName: 'Canada',
  role: 'commercial_operator',
}

const medicalDashboardRoles = new Set<RoleId>([
  'doctor_prescriber',
  'pharmacist',
  'clinic_healthcare_operator',
  'patient_caregiver_education',
])

const regulatoryDashboardRoles = new Set<RoleId>([
  'regulatory_compliance',
  'legal_advisory',
  'government_regulator',
])

function firstCsvEntry(value: string | null) {
  return value?.split(',').map((entry) => entry.trim()).filter(Boolean)[0]
}

export function mapGlobeRoleToDashboardRole(roleId: string | null): DashboardRole {
  if (medicalDashboardRoles.has(roleId as RoleId)) return 'medical_professional'
  if (regulatoryDashboardRoles.has(roleId as RoleId)) return 'regulatory_legal'
  return 'commercial_operator'
}

export function parseDashboardInitialStateFromGlobeParams(params: Pick<URLSearchParams, 'get'>): DashboardInitialState {
  if (params.get('source') !== 'globe_router') return defaultDashboardInitialState

  const requestedCountryIso2 = (params.get('country') || firstCsvEntry(params.get('countries')) || '').toUpperCase()
  const country = countryOptionMap[requestedCountryIso2]

  return {
    countryIso2: country?.iso2 ?? defaultDashboardInitialState.countryIso2,
    countryName: country?.name ?? defaultDashboardInitialState.countryName,
    role: mapGlobeRoleToDashboardRole(params.get('role')),
  }
}
