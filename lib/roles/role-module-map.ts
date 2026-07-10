import type { ModuleKey, RoleProfile } from './types'
import { roleFamilyMap } from './role-families'

export const priorityRank: Record<ModuleKey, number> = {
  country_status: 0, evidence_gap: 1, cultivar_passport: 10, ip_licensing: 11, production_readiness: 10, gacp_gmp_readiness: 11, product_readiness_file: 10, batch_release: 11, trade_corridor: 10, customs_logistics: 11, verified_suppliers: 10, procurement_watchlist: 11, clinical_pathway: 10, patient_access: 11, pharmacy_checklist: 10, dispensing_controls: 11, verification_services: 10, coa_review: 11, research_collaboration: 10, trial_readiness: 11, evidence_coverage: 10, policy_queue: 11, market_readiness: 10, diligence_room: 11, operator_demand: 10, service_marketplace: 11, compliance_demand: 10, licensing_tracker: 11, market_intelligence: 10, source_methodology: 11, review_queue: 10, admin_exposure_review: 11, documents: 90, counterparties: 91, actions: 92,
}

export function resolveRoleModuleOrder(role: RoleProfile): ModuleKey[] {
  const family = roleFamilyMap[role.family]
  const blocked = new Set(role.blockedModules ?? [])
  return Array.from(new Set<ModuleKey>([...family.baselineModules, ...role.roleModules, 'actions']))
    .filter((module) => !blocked.has(module))
    .sort((a, b) => priorityRank[a] - priorityRank[b] || a.localeCompare(b))
}
