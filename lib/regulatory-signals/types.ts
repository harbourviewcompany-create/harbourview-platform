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

// Must match the `regulatory_signals_type_check` CHECK constraint exactly —
// PostgREST rejects any insert/update with a value outside this list.
export type RegulatorySignalType =
  | 'licensing_market_access'
  | 'prescription_patient_access'
  | 'import_export_pathway'
  | 'enforcement_action'
  | 'policy_consultation'
  | 'legislation_change'
  | 'quota_allocation'
  | 'regulatory_guidance'
  | 'court_decision'
  | 'trade_agreement'
  | 'international_treaty'
  | 'pharmaceutical_reclassification'
  | 'hemp_cbd_boundary'
  | 'industrial_use_access'
  | 'professional_access'
  | 'research_access'
  | 'enforcement_risk'
  | 'market_exit'

// Must match the `regulatory_signals_review_status_check` CHECK constraint.
export type RegulatoryReviewStatus =
  | 'draft'
  | 'in_review'
  | 'published'
  | 'archived'
  | 'rejected'

// Must match the `regulatory_signals_confidence_check` CHECK constraint.
export type RegulatoryConfidence = 'low' | 'medium' | 'high' | 'verified'
export type RegulatoryImpactLevel = 'low' | 'moderate' | 'high' | 'critical'
export type RegulatoryWatchStatus = 'healthy' | 'changed' | 'stale' | 'failing' | 'blocked' | 'manual_review' | 'disabled'
export type RegulatoryAccessMethod = 'rss' | 'api' | 'html' | 'pdf' | 'manual'

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
  access_method: RegulatoryAccessMethod | null
  watch_frequency: string | null
  watcher_enabled: boolean | null
  watch_status: RegulatoryWatchStatus | null
  last_checked_at: string | null
  last_success_at: string | null
  last_changed_at: string | null
  last_error: string | null
  last_content_hash: string | null
  validation_notes: string | null
  internal_notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type RegulatorySourceSnapshot = {
  id: string
  source_id: string
  source_url: string
  title: string | null
  published_at: string | null
  captured_at: string
  raw_text: string | null
  content_hash: string
  previous_hash: string | null
  changed: boolean
  storage_path: string | null
  created_at: string
}

export type RegulatorySourceCheckRun = {
  id: string
  source_id: string
  checked_at: string
  status: RegulatoryWatchStatus
  http_status: number | null
  response_time_ms: number | null
  content_hash: string | null
  previous_hash: string | null
  changed: boolean
  snapshot_id: string | null
  signal_id: string | null
  error_message: string | null
  created_at: string
}
