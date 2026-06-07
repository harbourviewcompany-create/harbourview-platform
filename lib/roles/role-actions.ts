import type { ActionDefinition, ActionKey } from './types'

const labels: Record<ActionKey, string> = {
  request_review: 'Request review', submit_evidence: 'Submit evidence', track_jurisdiction: 'Track this jurisdiction', view_adjacent_markets: 'View adjacent verified markets', create_cultivar_passport: 'Create Cultivar Passport', check_production_readiness: 'Check Production Readiness', build_product_readiness_file: 'Build Product Readiness File', assess_trade_corridor: 'Assess Trade Corridor', review_verified_suppliers: 'Review Verified Suppliers', open_clinical_pathway: 'Open Clinical Pathway', open_pharmacy_checklist: 'Open Pharmacy Checklist', offer_verification_services: 'Offer Verification Services', find_research_collaborations: 'Find Research Collaborations', review_evidence_coverage: 'Review Evidence Coverage', assess_market_readiness: 'Assess Market Readiness', find_operator_demand: 'Find Operator Demand', find_compliance_demand: 'Find Compliance Demand', open_market_intelligence: 'Open Market Intelligence', open_review_queue: 'Open Review Queue',
}

export const evidenceGapActionKeys: ActionKey[] = ['request_review', 'submit_evidence', 'track_jurisdiction', 'view_adjacent_markets']

export function getActionDefinition(key: ActionKey, countrySlug: string, roleSlug: string): ActionDefinition {
  const adminOnly = key === 'open_review_queue'
  return { key, label: labels[key], href: `/contact?intent=${key}&country=${countrySlug}&role=${roleSlug}`, permissionFloor: adminOnly ? 'harbourview_admin' : 'public_guest' }
}
