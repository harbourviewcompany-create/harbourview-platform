// =============================================================================
// Harbourview Signal Engine V1 — TypeScript Types
// Milestone 1: Database Foundation
// Single source of truth for all signal engine enums, interfaces, and constants.
// =============================================================================

// ---------------------------------------------------------------------------
// String union types — one per CHECK constraint enum in the schema
// ---------------------------------------------------------------------------

export type SourceAccessType =
  | 'public_web'
  | 'uploaded_file'
  | 'licensed_database'
  | 'partner_submission'
  | 'manual_admin_entry'
  | 'email_forward'
  | 'private_source'

export type SourcePermissionStatus =
  | 'allowed'
  | 'uncertain'
  | 'restricted'
  | 'blocked'

export type RawTextRetentionStatus =
  | 'retained'
  | 'redacted'
  | 'removed'
  | 'not_stored'

export type SignalType =
  | 'supplier_lead'
  | 'buyer_demand'
  | 'seller_listing'
  | 'used_equipment'
  | 'surplus_inventory'
  | 'facility_liquidation'
  | 'packaging_supply'
  | 'cannabis_inventory'
  | 'service_provider'
  | 'business_opportunity'
  | 'policy_change'
  | 'regulatory_signal'
  | 'market_entry_signal'
  | 'counterparty_signal'
  | 'ignore'

export type MarketplaceCategory =
  | 'new_products'
  | 'used_surplus'
  | 'cannabis_inventory'
  | 'wanted_requests'
  | 'services'
  | 'business_opportunities'
  | 'supplier_directory'
  | 'policy_regulatory_signal'
  | 'ignore'

export type SignalStatus =
  | 'needs_review'
  | 'needs_source_check'
  | 'needs_contact_enrichment'
  | 'needs_compliance_review'
  | 'needs_pricing_check'
  | 'priority_review'
  | 'approved'
  | 'rejected'
  | 'duplicate'
  | 'archived'
  | 'ready_for_outreach'
  | 'outreach_sent'
  | 'converted_to_listing'
  | 'converted_to_supplier'
  | 'converted_to_wanted_request'
  | 'converted_to_dossier'

export type EvidenceClaimType =
  | 'source_statement'
  | 'model_inference'
  | 'operator_verification'
  | 'commercial_interpretation'
  | 'regulatory_interpretation'
  | 'external_confirmation'

export type SignalRiskFlag =
  | 'stale'
  | 'duplicate'
  | 'restricted_source'
  | 'insufficient_evidence'
  | 'unclear_counterparty'
  | 'unclear_jurisdiction'
  | 'unverified_licence_claim'
  | 'high_compliance_risk'
  | 'low_commercial_value'
  | 'likely_spam'
  | 'not_cannabis_relevant'
  | 'not_marketplace_relevant'

export type SignalRiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export type SignalJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type SignalConversionType =
  | 'marketplace_listing'
  | 'supplier_directory_record'
  | 'wanted_request'
  | 'private_brokerage_opportunity'
  | 'dossier_item'

export type ModelCallStatus = 'success' | 'failed' | 'skipped' | 'mock'

// ---------------------------------------------------------------------------
// ScoreBreakdown — flexible per-candidate score annotation
// ---------------------------------------------------------------------------

export interface ScoreBreakdown {
  model_confidence?: number
  source_credibility?: number
  recency?: number
  evidence_strength?: number
  category_fit?: number
  novelty?: number
  commercial_relevance?: number
  commercial_actionability?: number
  [key: string]: number | undefined
}

// ---------------------------------------------------------------------------
// Table interfaces — nullable columns typed as T | null
// ---------------------------------------------------------------------------

export interface SourceDocument {
  id: string
  source_url: string | null
  source_title: string | null
  source_domain: string | null
  source_type: string
  source_access_type: SourceAccessType
  source_permission_status: SourcePermissionStatus
  source_reuse_allowed: boolean | null
  source_date: string | null        // ISO date string
  discovered_at: string             // ISO timestamptz
  last_seen_at: string | null
  raw_text: string | null
  cleaned_text: string | null
  raw_text_retention_status: RawTextRetentionStatus
  language_code: string | null
  checksum: string | null
  source_credibility_score: number | null
  created_at: string
  updated_at: string
}

export interface SourceChunk {
  id: string
  source_document_id: string
  chunk_index: number
  chunk_text: string
  embedding: number[] | null        // vector(384)
  token_estimate: number | null
  created_at: string
}

export interface SignalDuplicateGroup {
  id: string
  canonical_signal_candidate_id: string | null
  duplicate_reason: string | null
  similarity_score: number | null
  created_at: string
}

export interface SignalCandidate {
  id: string
  source_document_id: string | null
  source_chunk_id: string | null
  duplicate_group_id: string | null

  signal_type: SignalType
  marketplace_category: MarketplaceCategory | null

  title: string
  summary: string | null
  inferred_company_name: string | null
  inferred_location: string | null
  inferred_product_type: string | null

  jurisdiction_country: string | null
  jurisdiction_region: string | null
  jurisdiction_city: string | null
  jurisdiction_confidence: number | null
  jurisdiction_source: string | null

  model_confidence_score: number | null
  source_credibility_score: number | null
  recency_score: number | null
  evidence_strength_score: number | null
  category_fit_score: number | null
  novelty_score: number | null
  commercial_relevance_score: number | null
  commercial_actionability_score: number | null
  final_signal_score: number | null
  score_breakdown: ScoreBreakdown
  relevance_score: number | null
  rerank_score: number | null
  confidence_score: number | null

  status: SignalStatus
  review_notes: string | null
  created_at: string
  updated_at: string
}

export interface SignalEvidence {
  id: string
  signal_candidate_id: string
  source_document_id: string | null
  source_chunk_id: string | null
  evidence_type: string
  evidence_claim_type: EvidenceClaimType
  evidence_text: string
  source_url: string | null
  confidence_score: number | null
  created_at: string
}

export interface SignalReviewEvent {
  id: string
  signal_candidate_id: string
  reviewer_id: string | null
  event_type: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  reason: string | null
  created_at: string
}

export interface SignalJob {
  id: string
  job_type: string
  target_type: string
  target_id: string | null
  status: SignalJobStatus
  attempts: number
  max_attempts: number
  scheduled_at: string
  started_at: string | null
  completed_at: string | null
  failed_at: string | null
  error_code: string | null
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface SignalRiskFlagRow {
  id: string
  signal_candidate_id: string
  flag: SignalRiskFlag
  severity: SignalRiskSeverity
  reason: string | null
  created_at: string
}

export interface ModelPromptVersion {
  id: string
  task_name: string
  version: string
  prompt_or_query: string
  labels: Record<string, unknown> | null
  active: boolean
  created_at: string
}

export interface ModelCallLog {
  id: string
  provider: string
  model_name: string
  model_task: string
  prompt_version_id: string | null
  input_hash: string | null
  input_excerpt: string | null
  output_json: Record<string, unknown> | null
  latency_ms: number | null
  token_or_unit_count: number | null
  status: ModelCallStatus
  error_message: string | null
  created_at: string
}

export interface Entity {
  id: string
  entity_type: string
  name: string
  website: string | null
  domain: string | null
  country: string | null
  region: string | null
  verification_status: string
  created_at: string
  updated_at: string
}

export interface SignalEntityMention {
  id: string
  signal_candidate_id: string
  entity_id: string | null
  mentioned_name: string
  mention_role: string | null
  confidence_score: number | null
  created_at: string
}

export interface SignalConversion {
  id: string
  signal_candidate_id: string
  conversion_type: SignalConversionType
  converted_record_id: string | null
  converted_record_table: string | null
  reviewer_id: string | null
  conversion_notes: string | null
  created_at: string
}

export interface SignalProcessingError {
  id: string
  signal_job_id: string | null
  source_document_id: string | null
  signal_candidate_id: string | null
  error_code: string
  error_message: string | null
  error_context: Record<string, unknown>
  resolved: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// SIGNAL_CONSTANTS
// Readonly arrays of each enum's values — single source of truth for
// form validation, API route guards, and future Zod/Valibot schemas.
// ---------------------------------------------------------------------------

export const SIGNAL_CONSTANTS = {
  SOURCE_ACCESS_TYPES: [
    'public_web',
    'uploaded_file',
    'licensed_database',
    'partner_submission',
    'manual_admin_entry',
    'email_forward',
    'private_source',
  ] as const satisfies readonly SourceAccessType[],

  SOURCE_PERMISSION_STATUSES: [
    'allowed',
    'uncertain',
    'restricted',
    'blocked',
  ] as const satisfies readonly SourcePermissionStatus[],

  RAW_TEXT_RETENTION_STATUSES: [
    'retained',
    'redacted',
    'removed',
    'not_stored',
  ] as const satisfies readonly RawTextRetentionStatus[],

  SIGNAL_TYPES: [
    'supplier_lead',
    'buyer_demand',
    'seller_listing',
    'used_equipment',
    'surplus_inventory',
    'facility_liquidation',
    'packaging_supply',
    'cannabis_inventory',
    'service_provider',
    'business_opportunity',
    'policy_change',
    'regulatory_signal',
    'market_entry_signal',
    'counterparty_signal',
    'ignore',
  ] as const satisfies readonly SignalType[],

  MARKETPLACE_CATEGORIES: [
    'new_products',
    'used_surplus',
    'cannabis_inventory',
    'wanted_requests',
    'services',
    'business_opportunities',
    'supplier_directory',
    'policy_regulatory_signal',
    'ignore',
  ] as const satisfies readonly MarketplaceCategory[],

  SIGNAL_STATUSES: [
    'needs_review',
    'needs_source_check',
    'needs_contact_enrichment',
    'needs_compliance_review',
    'needs_pricing_check',
    'priority_review',
    'approved',
    'rejected',
    'duplicate',
    'archived',
    'ready_for_outreach',
    'outreach_sent',
    'converted_to_listing',
    'converted_to_supplier',
    'converted_to_wanted_request',
    'converted_to_dossier',
  ] as const satisfies readonly SignalStatus[],

  EVIDENCE_CLAIM_TYPES: [
    'source_statement',
    'model_inference',
    'operator_verification',
    'commercial_interpretation',
    'regulatory_interpretation',
    'external_confirmation',
  ] as const satisfies readonly EvidenceClaimType[],

  SIGNAL_RISK_FLAGS: [
    'stale',
    'duplicate',
    'restricted_source',
    'insufficient_evidence',
    'unclear_counterparty',
    'unclear_jurisdiction',
    'unverified_licence_claim',
    'high_compliance_risk',
    'low_commercial_value',
    'likely_spam',
    'not_cannabis_relevant',
    'not_marketplace_relevant',
  ] as const satisfies readonly SignalRiskFlag[],

  SIGNAL_RISK_SEVERITIES: [
    'low',
    'medium',
    'high',
    'critical',
  ] as const satisfies readonly SignalRiskSeverity[],

  SIGNAL_JOB_STATUSES: [
    'queued',
    'processing',
    'completed',
    'failed',
    'cancelled',
  ] as const satisfies readonly SignalJobStatus[],

  SIGNAL_CONVERSION_TYPES: [
    'marketplace_listing',
    'supplier_directory_record',
    'wanted_request',
    'private_brokerage_opportunity',
    'dossier_item',
  ] as const satisfies readonly SignalConversionType[],

  MODEL_CALL_STATUSES: [
    'success',
    'failed',
    'skipped',
    'mock',
  ] as const satisfies readonly ModelCallStatus[],
} as const
