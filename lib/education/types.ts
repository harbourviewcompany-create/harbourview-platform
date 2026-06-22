export const EDUCATION_ROLES = [
  'doctor',
  'pharmacist',
  'clinic',
  'patient_general',
  'licensed_producer',
  'supplier',
  'buyer_importer',
  'distributor',
  'lab',
  'packaging_vendor',
  'equipment_vendor',
  'investor',
  'regulator_policy',
  'admin_operator',
] as const

export type EducationRole = (typeof EDUCATION_ROLES)[number]

export const EDUCATION_REVIEW_STATUSES = [
  'verified_primary_source',
  'verified_professional_body',
  'verified_peer_reviewed',
  'verified_secondary_source',
  'conflicting_sources',
  'stale_source',
  'jurisdiction_unclear',
  'clinical_review_required',
  'legal_review_required',
  'review_pending',
  'do_not_publish',
] as const

export type EducationReviewStatus = (typeof EDUCATION_REVIEW_STATUSES)[number]

export type EducationClaimType =
  | 'medical_scientific'
  | 'clinical_workflow'
  | 'dosage_reference'
  | 'drug_interaction_reference'
  | 'pharmacist_workflow'
  | 'legal_regulatory'
  | 'import_export'
  | 'licensing'
  | 'quality_manufacturing'
  | 'commercial_marketplace'
  | 'glossary_definition'
  | 'safety'
  | 'jurisdiction_summary'
  | 'professional_obligation'

export type EducationEvidenceGrade =
  | 'A_primary_binding'
  | 'B_primary_guidance'
  | 'C_professional_guideline'
  | 'D_peer_reviewed'
  | 'E_quality_standard'
  | 'F_secondary_context'
  | 'G_discovery_only'
  | 'X_conflict_or_unverified'

export type EducationVisibility = 'public' | 'professional' | 'commercial_user' | 'admin_only' | 'hidden'

export type EducationClaimLike = {
  id?: string
  slug?: string
  title?: string
  domain?: string
  claim_key?: string
  claim_type: EducationClaimType
  claim_text?: string
  public_safe_summary?: string | null
  jurisdiction_scope?: string[] | null
  audience_roles: EducationRole[]
  visibility: EducationVisibility
  evidence_grade?: EducationEvidenceGrade
  review_status: EducationReviewStatus
  last_verified_at?: string | null
  source_excerpt?: string | null
  admin_notes?: string | null
  reviewer?: string | null
  conflict_notes?: string | null
  do_not_publish_reason?: string | null
  medical_risk_level?: string | null
  legal_risk_level?: string | null
  commercial_risk_level?: string | null
}

export type PublicEducationDTO = {
  id?: string
  slug?: string
  title?: string
  domain?: string
  public_safe_summary?: string | null
  jurisdiction_scope?: string[] | null
  audience_roles: EducationRole[]
  topic?: string
  module_type?: string
  route_path?: string
  visibility: 'public'
  review_status?: 'published_source_backed' | 'public_summary_only'
  last_verified_at?: string | null
  content_blocks?: Array<{ title: string; body: string }>
}

export type CountryRoleEducationSelection = {
  country: string
  subjurisdiction?: string
  role: EducationRole
  professional_status?: 'unverified' | 'verified_professional' | 'not_applicable'
  commercial_goal?: 'learn' | 'buy' | 'sell' | 'import_export' | 'quality' | 'policy'
  education_depth?: 'overview' | 'operator' | 'professional' | 'admin_review'
  language?: string
  source_confidence_threshold?: 'primary_only' | 'reviewed' | 'public_safe'
}
