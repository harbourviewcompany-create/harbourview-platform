import type { ModuleKey, PermissionTier } from './types'

export const permissionRank: Record<PermissionTier, number> = { public_guest: 0, verified_user: 1, verified_organization: 2, harbourview_admin: 3 }

export const modulePermissionFloor: Record<ModuleKey, PermissionTier> = {
  country_status: 'public_guest', evidence_gap: 'public_guest', cultivar_passport: 'verified_user', ip_licensing: 'verified_organization', production_readiness: 'verified_user', gacp_gmp_readiness: 'verified_organization', product_readiness_file: 'verified_user', batch_release: 'verified_organization', trade_corridor: 'verified_user', customs_logistics: 'verified_user', verified_suppliers: 'verified_user', procurement_watchlist: 'verified_organization', clinical_pathway: 'public_guest', patient_access: 'verified_user', pharmacy_checklist: 'public_guest', dispensing_controls: 'verified_user', verification_services: 'public_guest', coa_review: 'verified_organization', research_collaboration: 'public_guest', trial_readiness: 'verified_organization', evidence_coverage: 'public_guest', policy_queue: 'verified_user', market_readiness: 'public_guest', diligence_room: 'verified_organization', operator_demand: 'public_guest', service_marketplace: 'verified_user', compliance_demand: 'public_guest', licensing_tracker: 'verified_user', market_intelligence: 'public_guest', source_methodology: 'public_guest', review_queue: 'harbourview_admin', admin_exposure_review: 'harbourview_admin', documents: 'verified_user', counterparties: 'verified_user', actions: 'public_guest',
}

export function filterVisibleModules(modules: ModuleKey[], tier: PermissionTier) {
  return modules.filter((module) => permissionRank[tier] >= permissionRank[modulePermissionFloor[module]])
}
