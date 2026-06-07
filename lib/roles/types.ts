export type RoleFamily =
  | 'genetics_breeding_ip'
  | 'cultivation_production'
  | 'processing_manufacturing'
  | 'trade_distribution'
  | 'buyers_procurement'
  | 'medical_clinical'
  | 'pharmacy_dispensing'
  | 'labs_qa_verification'
  | 'research_academia_trials'
  | 'regulators_policy_government'
  | 'finance_investment_insurance'
  | 'equipment_facilities_services'
  | 'legal_compliance_professional'
  | 'data_intelligence_media'
  | 'harbourview_admin_operator'

export type ModuleKey =
  | 'country_status'
  | 'evidence_gap'
  | 'cultivar_passport'
  | 'ip_licensing'
  | 'production_readiness'
  | 'gacp_gmp_readiness'
  | 'product_readiness_file'
  | 'batch_release'
  | 'trade_corridor'
  | 'customs_logistics'
  | 'verified_suppliers'
  | 'procurement_watchlist'
  | 'clinical_pathway'
  | 'patient_access'
  | 'pharmacy_checklist'
  | 'dispensing_controls'
  | 'verification_services'
  | 'coa_review'
  | 'research_collaboration'
  | 'trial_readiness'
  | 'evidence_coverage'
  | 'policy_queue'
  | 'market_readiness'
  | 'diligence_room'
  | 'operator_demand'
  | 'service_marketplace'
  | 'compliance_demand'
  | 'licensing_tracker'
  | 'market_intelligence'
  | 'source_methodology'
  | 'review_queue'
  | 'admin_exposure_review'
  | 'documents'
  | 'counterparties'
  | 'actions'

export type ActionKey =
  | 'request_review'
  | 'submit_evidence'
  | 'track_jurisdiction'
  | 'view_adjacent_markets'
  | 'create_cultivar_passport'
  | 'check_production_readiness'
  | 'build_product_readiness_file'
  | 'assess_trade_corridor'
  | 'review_verified_suppliers'
  | 'open_clinical_pathway'
  | 'open_pharmacy_checklist'
  | 'offer_verification_services'
  | 'find_research_collaborations'
  | 'review_evidence_coverage'
  | 'assess_market_readiness'
  | 'find_operator_demand'
  | 'find_compliance_demand'
  | 'open_market_intelligence'
  | 'open_review_queue'

export type EvidenceType =
  | 'country_law'
  | 'licence_registry'
  | 'regulatory_guidance'
  | 'clinical_guidance'
  | 'coa'
  | 'gmp_certificate'
  | 'gacp_certificate'
  | 'import_export_permit'
  | 'supplier_verification'
  | 'ip_chain_of_title'
  | 'market_signal'
  | 'admin_review'

export type DocumentType =
  | 'cultivar_passport'
  | 'ip_licence'
  | 'production_readiness_file'
  | 'gacp_file'
  | 'gmp_file'
  | 'product_readiness_file'
  | 'coa'
  | 'batch_release_file'
  | 'import_permit'
  | 'export_permit'
  | 'supplier_packet'
  | 'clinical_protocol'
  | 'pharmacy_sop'
  | 'lab_scope'
  | 'trial_protocol'
  | 'policy_brief'
  | 'diligence_memo'
  | 'service_capability_statement'
  | 'legal_memo'
  | 'market_report'
  | 'admin_review_packet'

export type CounterpartyType =
  | 'breeder'
  | 'cultivator'
  | 'manufacturer'
  | 'exporter'
  | 'importer'
  | 'distributor'
  | 'buyer'
  | 'supplier'
  | 'doctor'
  | 'clinic'
  | 'pharmacy'
  | 'lab'
  | 'research_institution'
  | 'regulator'
  | 'investor'
  | 'service_provider'
  | 'lawyer_consultant'
  | 'data_provider'
  | 'harbourview_reviewer'

export type PermissionTier = 'public_guest' | 'verified_user' | 'verified_organization' | 'harbourview_admin'
export type CountryRoleStatus = 'available' | 'evidence_gap' | 'restricted' | 'invalid_country' | 'invalid_role'

export interface CountryRoleCapability {
  countrySlug: string
  countryName: string
  countryIso2: string
  status: CountryRoleStatus
  available: boolean
  evidenceVerified: boolean
  requiredEvidence: EvidenceType[]
  permissionFloor: PermissionTier
}

export interface RoleProfile {
  key: RoleKey
  slug: string
  label: string
  shortLabel: string
  family: RoleFamily
  aliases: string[]
  operatingQuestion: string
  priority: string
  primaryCta: ActionKey
  language: string
  roleModules: ModuleKey[]
  blockedModules?: ModuleKey[]
  documentTypes: DocumentType[]
  counterpartyTypes: CounterpartyType[]
  evidenceRequirements: EvidenceType[]
  emptyState: string
}

export interface PrivateCountryRoleFields {
  counterpartyIntelligence: string[]
  sourceNotes: string[]
  evidenceVaultDetails: string[]
  geneticIpFiles: string[]
  supplierReviewNotes: string[]
  coaReviewInternals: string[]
  adminReviewState: string
  privateDocuments: string[]
  organizationDealData: string[]
  requestIntroductionHistory: string[]
}

export interface ResolvedCountryRoleDashboard {
  country: CountryRoleCapability
  role: RoleProfile
  family: RoleFamilyDefinition
  moduleOrder: ModuleKey[]
  actions: ActionKey[]
  primaryAction: ActionDefinition
  documents: DocumentType[]
  counterparties: CounterpartyType[]
  evidence: {
    confidence: 'verified' | 'evidence_gap'
    required: EvidenceType[]
    message?: string
  }
  visibility: PermissionTier
  private: PrivateCountryRoleFields
  admin: {
    reviewState: string
    exposureFlags: string[]
  }
}

export interface RoleFamilyDefinition {
  key: RoleFamily
  label: string
  description: string
  baselineModules: ModuleKey[]
  primaryCta: ActionKey
}

export interface ActionDefinition {
  key: ActionKey
  label: string
  href: string
  permissionFloor: PermissionTier
}

export type RoleKey = string
