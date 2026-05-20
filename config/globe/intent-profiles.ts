import type { IntentId, IntentProfile, RoleId, RoleIntentProfile } from '@/types/globe-router'

export const intentProfiles: IntentProfile[] = [
  { id: 'understand_import_rules', label: 'Understand import rules', description: 'Start with import pathway orientation.', destinationType: 'regulatory_education' },
  { id: 'find_qualified_supply', label: 'Find qualified supply', description: 'Route demand toward reviewed supply.', destinationType: 'wanted_request' },
  { id: 'screen_counterparties', label: 'Screen counterparties', description: 'Request reviewed commercial routing.', destinationType: 'request_intro' },
  { id: 'view_market_signals', label: 'View market signals', description: 'See public-safe market movement signals.', destinationType: 'signals' },
  { id: 'request_introduction', label: 'Request introduction', description: 'Ask Harbourview to review fit and route introductions.', destinationType: 'request_intro' },
  { id: 'find_target_markets', label: 'Find target markets', description: 'Compare markets and export access paths.', destinationType: 'signals' },
  { id: 'screen_import_pathways', label: 'Screen import pathways', description: 'Review demand and route feasibility.', destinationType: 'regulatory_education' },
  { id: 'prepare_export_positioning', label: 'Prepare export positioning', description: 'Start a seller or exporter path.', destinationType: 'seller_listing' },
  { id: 'understand_medical_rules', label: 'Understand medical rules', description: 'Use professional education orientation.', destinationType: 'medical_education' },
  { id: 'treatment_channel_basics', label: 'Learn treatment-channel basics', description: 'Understand the public professional channel.', destinationType: 'medical_education' },
  { id: 'country_specific_guidance', label: 'Find country-specific guidance', description: 'Route country-specific questions for review.', destinationType: 'request_intro' },
  { id: 'pharmacy_channel_rules', label: 'Understand pharmacy-channel rules', description: 'Start with pharmacy route orientation.', destinationType: 'regulatory_education' },
  { id: 'product_dispensing_constraints', label: 'Learn product and dispensing constraints', description: 'Review pharmacy constraints before reliance.', destinationType: 'regulatory_education' },
  { id: 'country_specific_education', label: 'View country-specific education', description: 'Route to education or review.', destinationType: 'medical_education' },
  { id: 'product_basics', label: 'Learn product basics', description: 'Use public education before routing.', destinationType: 'medical_education' },
  { id: 'local_retail_rules', label: 'Understand local retail rules', description: 'Review local public rules.', destinationType: 'regulatory_education' },
  { id: 'training_or_education', label: 'Find training or education', description: 'Start with public-safe education.', destinationType: 'medical_education' },
  { id: 'testing_requirements', label: 'Understand testing requirements', description: 'Review lab and testing orientation.', destinationType: 'regulatory_education' },
  { id: 'quality_documentation', label: 'Screen quality documentation', description: 'Route QA and documentation questions.', destinationType: 'request_intro' },
  { id: 'licensing_market_access', label: 'Understand licensing and market access', description: 'Start with route orientation for operators.', destinationType: 'regulatory_education' },
  { id: 'buyer_or_export_route', label: 'Find buyer or export route', description: 'Submit or route export-readiness context.', destinationType: 'seller_listing' },
  { id: 'documentation_burden', label: 'Screen documentation burden', description: 'Understand burden and route support.', destinationType: 'request_intro' },
  { id: 'genetics_market_access', label: 'Understand genetics market access', description: 'Route genetics constraints for review.', destinationType: 'routing_review' },
  { id: 'licensing_partner_pathway', label: 'Find licensing or partner pathway', description: 'Request review for partner routes.', destinationType: 'request_intro' },
  { id: 'country_specific_constraints', label: 'View country-specific constraints', description: 'Use public-safe constraints and review.', destinationType: 'routing_review' },
  { id: 'regulatory_framework', label: 'View regulatory framework', description: 'Start with the public framework.', destinationType: 'regulatory_education' },
  { id: 'track_signals', label: 'Track signals', description: 'View regulatory and market-access signals.', destinationType: 'signals' },
  { id: 'diligence_support', label: 'Request diligence support', description: 'Route diligence needs through intake.', destinationType: 'request_intro' },
  { id: 'opportunity_signals', label: 'View opportunity signals', description: 'View opportunity movement.', destinationType: 'signals' },
  { id: 'compare_markets', label: 'Compare markets', description: 'Compare public-safe market signals.', destinationType: 'signals' },
  { id: 'market_intelligence', label: 'I need market intelligence', description: 'Route intelligence needs.', destinationType: 'signals' },
  { id: 'medical_pharmacy_education', label: 'I need medical or pharmacy education', description: 'Use public-safe education first.', destinationType: 'medical_education' },
  { id: 'import_export_help', label: 'I need help importing or exporting', description: 'Route cross-border needs to intake.', destinationType: 'request_intro' },
  { id: 'routing_review', label: 'I need routing review', description: 'Ask Harbourview to decide the safest path.', destinationType: 'routing_review' },
]

export const intentProfileMap = Object.fromEntries(intentProfiles.map((intent) => [intent.id, intent])) as Record<IntentId, IntentProfile>

const importerIntents: IntentId[] = ['understand_import_rules', 'find_qualified_supply', 'screen_counterparties', 'view_market_signals', 'request_introduction']
const exporterIntents: IntentId[] = ['find_target_markets', 'screen_import_pathways', 'prepare_export_positioning', 'request_introduction', 'opportunity_signals']
const medicalIntents: IntentId[] = ['understand_medical_rules', 'treatment_channel_basics', 'country_specific_guidance', 'request_introduction']
const pharmacyIntents: IntentId[] = ['pharmacy_channel_rules', 'product_dispensing_constraints', 'country_specific_education', 'request_introduction']
const retailIntents: IntentId[] = ['product_basics', 'local_retail_rules', 'training_or_education', 'routing_review']
const labIntents: IntentId[] = ['testing_requirements', 'quality_documentation', 'track_signals', 'request_introduction']
const operatorIntents: IntentId[] = ['licensing_market_access', 'buyer_or_export_route', 'documentation_burden', 'request_introduction']
const geneticsIntents: IntentId[] = ['genetics_market_access', 'licensing_partner_pathway', 'country_specific_constraints', 'routing_review']
const complianceIntents: IntentId[] = ['regulatory_framework', 'track_signals', 'documentation_burden', 'diligence_support']
const investorIntents: IntentId[] = ['opportunity_signals', 'compare_markets', 'screen_counterparties', 'request_introduction']
const notSureIntents: IntentId[] = ['market_intelligence', 'medical_pharmacy_education', 'import_export_help', 'request_introduction', 'routing_review']

export const roleIntentProfiles: RoleIntentProfile[] = [
  { roleId: 'importer', defaultIntentIds: importerIntents },
  { roleId: 'exporter', defaultIntentIds: exporterIntents },
  { roleId: 'doctor_prescriber', defaultIntentIds: medicalIntents },
  { roleId: 'pharmacist', defaultIntentIds: pharmacyIntents },
  { roleId: 'budtender', defaultIntentIds: retailIntents },
  { roleId: 'retail_operator', defaultIntentIds: retailIntents },
  { roleId: 'lab_qa', defaultIntentIds: labIntents },
  { roleId: 'gmp_quality', defaultIntentIds: labIntents },
  { roleId: 'cultivator_producer', defaultIntentIds: operatorIntents },
  { roleId: 'processor_extractor', defaultIntentIds: operatorIntents },
  { roleId: 'geneticist_breeder', defaultIntentIds: geneticsIntents },
  { roleId: 'regulatory_compliance', defaultIntentIds: complianceIntents },
  { roleId: 'legal_advisory', defaultIntentIds: complianceIntents },
  { roleId: 'government_regulator', defaultIntentIds: complianceIntents },
  { roleId: 'investor_operator', defaultIntentIds: investorIntents },
  { roleId: 'distributor_wholesaler', defaultIntentIds: importerIntents },
  { roleId: 'clinic_healthcare_operator', defaultIntentIds: medicalIntents },
  { roleId: 'patient_caregiver_education', defaultIntentIds: ['product_basics', 'medical_pharmacy_education', 'routing_review'] },
  { roleId: 'logistics_customs', defaultIntentIds: ['understand_import_rules', 'screen_import_pathways', 'documentation_burden', 'request_introduction'] },
  { roleId: 'not_sure', defaultIntentIds: notSureIntents },
]

export const roleIntentProfileMap = Object.fromEntries(roleIntentProfiles.map((profile) => [profile.roleId, profile])) as Record<RoleId, RoleIntentProfile>

export function getIntentIdsForRole(roleId?: RoleId, countryIso2?: string, mode?: string): IntentId[] {
  if (mode === 'multi_market') return ['compare_markets', 'import_export_help', 'documentation_burden', 'request_introduction', 'opportunity_signals']
  if (!roleId) return notSureIntents

  const profile = roleIntentProfileMap[roleId]
  const override = countryIso2 ? profile?.countryOverrides?.[countryIso2] : undefined
  return override ?? profile?.defaultIntentIds ?? notSureIntents
}
