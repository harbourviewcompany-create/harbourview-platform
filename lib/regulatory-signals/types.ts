export type RegulatorySourceTier = 'tier_1_official' | 'tier_2_professional' | 'tier_3_secondary'

export type RegulatorySourceType =
  | 'regulator'
  | 'government_ministry'
  | 'legislature'
  | 'official_gazette'
  | 'court'
  | 'customs_authority'
  | 'health_authority'
  | 'drug_control_authority'
  | 'enforcement_authority'
  | 'consultation_portal'
  | 'international_body'
  | 'professional_body'
  | 'law_firm_update'
  | 'trade_association'
  | 'specialist_publication'
  | 'local_media'
  | 'trade_media'

export type RegulatorySignalType =
  | 'regulatory_change'
  | 'policy_announcement'
  | 'import_export_pathway'
  | 'licensing_market_access'
  | 'prescription_patient_access'
  | 'hemp_cbd_controlled_cannabinoids'
  | 'enforcement_compliance_action'
  | 'consultation_pending_rule_change'
  | 'court_agency_decision'
  | 'controlled_substance_scheduling'
  | 'customs_trade_requirement'
  | 'quality_standard_requirement'

export type RegulatoryReviewStatus =
  | 'captured'
  | 'triaged'
  | 'needs_source_validation'
  | 'in_review'
  | 'approved_private'
  | 'approved_public'
  | 'published'
  | 'rejected'
  | 'archived'
  | 'expired'

export type RegulatoryConfidence = 'low' | 'medium' | 'high' | 'official_confirmed'
export type RegulatoryImpactLevel = 'low' | 'moderate' | 'high' | 'critical'

export type RegulatorySignalRecord = {
  id: string
  slug: string
  headline: string
  signal_type: RegulatorySignalType
  review_status: RegulatoryReviewStatus
  confidence: RegulatoryConfidence
  impact_level: RegulatoryImpactLevel
  country_code: string | null
  country_name: string | null
  region: string | null
  jurisdiction: string | null
  regulator_name: string | null
  signal_date: string
  source_published_at: string | null
  captured_at: string
  source_tier: RegulatorySourceTier
  source_type: RegulatorySourceType
  source_url: string
  canonical_source_url: string | null
  source_id: string | null
  primary_evidence_id: string | null
  private_summary: string
  commercial_relevance: string | null
  compliance_relevance: string | null
  uncertainty_note: string | null
  public_summary: string | null
  public_implication: string | null
  public_safe: boolean
  publish_to_public: boolean
  last_reviewed_at: string | null
  next_review_due_at: string | null
  expires_at: string | null
  published_at: string | null
  private_notes: string | null
  analyst_notes: string | null
  rejection_reason: string | null
  created_by: string | null
  updated_by: string | null
  reviewed_by: string | null
  approved_by: string | null
  published_by: string | null
  created_at: string
  updated_at: string
}

export type PublicRegulatorySignal = {
  id: string
  slug: string
  headline: string
  signal_type: RegulatorySignalType
  confidence: RegulatoryConfidence
  impact_level: RegulatoryImpactLevel
  country_code: string | null
  country_name: string | null
  region: string | null
  jurisdiction: string | null
  regulator_name: string | null
  signal_date: string
  source_tier: RegulatorySourceTier
  source_type: RegulatorySourceType
  canonical_source_url: string | null
  public_summary: string
  public_implication: string
  published_at: string | null
  last_reviewed_at: string | null
}

export type RegulatorySource = {
  id: string
  source_name: string
  source_type: RegulatorySourceType
  source_tier: RegulatorySourceTier
  country_code: string | null
  country_name: string | null
  region: string | null
  jurisdiction: string | null
  regulator_name: string | null
  base_url: string
  watch_url: string | null
  rss_url: string | null
  contact_url: string | null
  language_code: string | null
  crawl_allowed: boolean
  is_active: boolean
  validation_notes: string | null
  internal_notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}
