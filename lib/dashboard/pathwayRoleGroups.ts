// lib/dashboard/pathwayRoleGroups.ts
//
// Consolidates the 19-value RoleId taxonomy into 3 pathway content groups.
// RoleId itself stays untouched -- it's a state-machine discriminant used by
// the globe router's intent-routing system (config/globe/intent-profiles.ts,
// lib/globe/route-resolver.ts, country-role-profiles.ts) and must not change.
//
// What changes is how Access Pathway templates are looked up: a hand-curated
// cc_pathway_templates row authored for one role in the group (today, all 34
// bespoke templates use 'cultivator_producer') now applies to every role in
// that group, so Harbourview doesn't need ~19 bespoke variants per country.
//
// Groups:
//  - supplier:         get product OUT (cultivate, breed, process, QA, export)
//  - buyer:            get product IN (import, distribute, retail, dispense, prescribe)
//  - advisor_investor: not transacting -- regulatory, legal, government, investment

import type { RoleId } from '@/types/globe-router'

export type PathwayRoleGroup = 'supplier' | 'buyer' | 'advisor_investor'

export const SUPPLIER_ROLES: RoleId[] = [
  'cultivator_producer',
  'geneticist_breeder',
  'processor_extractor',
  'gmp_quality',
  'lab_qa',
  'exporter',
]

export const BUYER_ROLES: RoleId[] = [
  'importer',
  'distributor_wholesaler',
  'logistics_customs',
  'retail_operator',
  'clinic_healthcare_operator',
  'pharmacist',
  'budtender',
  'doctor_prescriber',
  'patient_caregiver_education',
]

export const ADVISOR_INVESTOR_ROLES: RoleId[] = [
  'regulatory_compliance',
  'legal_advisory',
  'government_regulator',
  'investor_operator',
]

const GROUP_MEMBERS: Record<PathwayRoleGroup, RoleId[]> = {
  supplier: SUPPLIER_ROLES,
  buyer: BUYER_ROLES,
  advisor_investor: ADVISOR_INVESTOR_ROLES,
}

const ROLE_TO_GROUP: Partial<Record<RoleId, PathwayRoleGroup>> = {}
for (const [group, roles] of Object.entries(GROUP_MEMBERS) as [PathwayRoleGroup, RoleId[]][]) {
  for (const role of roles) ROLE_TO_GROUP[role] = group
}

export function getPathwayRoleGroup(roleId: string | null | undefined): PathwayRoleGroup | null {
  if (!roleId) return null
  return ROLE_TO_GROUP[roleId as RoleId] ?? null
}

/**
 * Returns the ordered list of role_id values to try when looking up a
 * cc_pathway_templates row for this role: the exact role first, then every
 * other role in the same pathway group (deduped).
 */
export function getPathwayTemplateRoleCandidates(roleId: string | null | undefined): string[] {
  if (!roleId) return []
  const group = getPathwayRoleGroup(roleId)
  if (!group) return [roleId]
  const members = GROUP_MEMBERS[group]
  return [roleId, ...members.filter(r => r !== roleId)]
}
