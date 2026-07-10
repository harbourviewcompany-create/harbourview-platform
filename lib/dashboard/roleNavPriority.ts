// Bridges the Command Centre's 20-role system (RoleId, dashboardShared.ts) to the
// 15-family module-priority system in lib/roles/ (built for the public
// /country/[country]/role/[role] preview) so the same relevance signal can drive
// sidebar ordering in the authenticated dashboard instead of a third, separate
// role taxonomy.
import type { RoleId } from '@/types/globe-router'
import type { ModuleKey, RoleFamily } from '@/lib/roles/types'
import { roleFamilyMap } from '@/lib/roles/role-families'
import { priorityRank } from '@/lib/roles/role-module-map'

// A few RoleIds have no exact family match (retail/budtender, patient education,
// GMP/quality) and are mapped to the closest existing family rather than
// inventing a 16th one — acceptable because this only affects display order,
// never visibility (see DASHBOARD_DESIGN_HANDOFF / IA discussion: reorder, don't hide).
const ROLE_FAMILY: Partial<Record<RoleId, RoleFamily>> = {
  doctor_prescriber:           'medical_clinical',
  pharmacist:                  'pharmacy_dispensing',
  budtender:                   'buyers_procurement',
  cultivator_producer:         'cultivation_production',
  geneticist_breeder:          'genetics_breeding_ip',
  processor_extractor:         'processing_manufacturing',
  lab_qa:                      'labs_qa_verification',
  importer:                    'trade_distribution',
  exporter:                    'trade_distribution',
  distributor_wholesaler:      'trade_distribution',
  clinic_healthcare_operator:  'medical_clinical',
  retail_operator:             'buyers_procurement',
  regulatory_compliance:       'legal_compliance_professional',
  legal_advisory:              'legal_compliance_professional',
  investor_operator:           'finance_investment_insurance',
  government_regulator:        'regulators_policy_government',
  patient_caregiver_education: 'medical_clinical',
  gmp_quality:                 'cultivation_production',
  logistics_customs:           'trade_distribution',
}

// Each Command Centre nav item mapped to the lib/roles module(s) it most closely
// represents, used only to rank relevance. Nav items with no entry here (briefing,
// digest, education, countries, settings) have no per-role signal and keep their
// original position.
const NAV_MODULE_KEYS: Record<string, ModuleKey[]> = {
  marketplace:      ['service_marketplace', 'verified_suppliers', 'procurement_watchlist', 'operator_demand'],
  watchlist:        ['procurement_watchlist'],
  'access-pathway': ['clinical_pathway', 'patient_access', 'pharmacy_checklist', 'dispensing_controls'],
  regulatory:       ['policy_queue', 'licensing_tracker', 'compliance_demand'],
  'local-intel':    ['market_intelligence', 'country_status'],
  evidence:         ['evidence_coverage', 'evidence_gap', 'coa_review', 'verification_services'],
  genetics:         ['cultivar_passport', 'ip_licensing'],
  compliance:       ['gacp_gmp_readiness', 'coa_review', 'licensing_tracker', 'compliance_demand', 'batch_release'],
  signals:          ['market_intelligence', 'evidence_coverage'],
}

// Lower rank = more relevant to this role. Missing keys mean "no signal, keep as-is."
export function getRoleNavRank(roleId: string): Partial<Record<string, number>> {
  const family = ROLE_FAMILY[roleId as RoleId]
  if (!family) return {}
  const baseline = new Set(roleFamilyMap[family].baselineModules)
  const ranks: Partial<Record<string, number>> = {}
  for (const [navId, moduleKeys] of Object.entries(NAV_MODULE_KEYS)) {
    const matched = moduleKeys.filter(k => baseline.has(k))
    if (matched.length === 0) continue
    ranks[navId] = Math.min(...matched.map(k => priorityRank[k]))
  }
  return ranks
}
