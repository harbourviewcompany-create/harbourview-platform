import type { CountryRoleEducationSelection, EducationRole } from './types'

export const EDUCATION_ROLE_LABELS: Record<EducationRole, string> = {
  doctor: 'Doctor',
  pharmacist: 'Pharmacist',
  clinic: 'Clinic',
  patient_general: 'Patient / general learner',
  licensed_producer: 'Licensed producer',
  supplier: 'Supplier',
  buyer_importer: 'Buyer / importer',
  distributor: 'Distributor',
  lab: 'Laboratory',
  packaging_vendor: 'Packaging vendor',
  equipment_vendor: 'Equipment vendor',
  investor: 'Investor',
  regulator_policy: 'Regulator / policy user',
  admin_operator: 'Harbourview admin / operator',
}

export const DEFAULT_EDUCATION_SELECTION: CountryRoleEducationSelection = {
  country: 'GLOBAL',
  role: 'patient_general',
  professional_status: 'unverified',
  commercial_goal: 'learn',
  education_depth: 'overview',
  language: 'en',
  source_confidence_threshold: 'public_safe',
}

export function normalizeEducationSelection(
  selection: Partial<CountryRoleEducationSelection>,
): CountryRoleEducationSelection {
  return {
    ...DEFAULT_EDUCATION_SELECTION,
    ...selection,
    country: selection.country?.trim().toUpperCase() || DEFAULT_EDUCATION_SELECTION.country,
  }
}

export function selectionAllowsRestrictedEducation(selection: CountryRoleEducationSelection) {
  if (selection.role === 'admin_operator') return selection.education_depth === 'admin_review'
  if (selection.role === 'doctor' || selection.role === 'pharmacist') {
    return selection.professional_status === 'verified_professional'
  }
  return false
}
