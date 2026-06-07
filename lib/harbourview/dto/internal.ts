/**
 * lib/harbourview/dto/internal.ts
 *
 * Full internal types for all HarbourView entities.
 * These types contain ALL fields — including private, reviewer, provenance,
 * and AI-generated fields that must NEVER appear in public DTOs.
 *
 * Public DTOs are derived from these via Pick<Internal, allowedKeys>.
 * Serializer functions in serializers.ts enforce the structural boundary.
 *
 * NEVER import this file in client components, public route handlers,
 * or any module that could be bundled for the browser.
 */

// ---------------------------------------------------------------------------
// Existing Supabase-backed internal types
// ---------------------------------------------------------------------------

export type HvJurisdictionInternal = {
  id: string;
  country_name: string;
  iso_code: string | null;
  region: string | null;
  cannabis_market_status: string | null;
  priority_tier: string | null;
  internal_notes: string | null;
  reviewer_id: string | null;
  review_status: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  updated_at: string;
  created_at: string;
};

export type HvSourceInternal = {
  id: string;
  source_name: string;
  source_url: string | null;
  normalized_url: string | null;
  country_text: string | null;
  source_type_text: string | null;
  organization_text: string | null;
  jurisdiction_level: string | null;
  verification_status: string;
  robots_status: string | null;
  license_status: string | null;
  raw_source_file: string | null;
  content_hash: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  operator_comments: string | null;
  reviewer_id: string | null;
  review_notes_private: string | null;
  last_checked: string | null;
  updated_at: string;
  created_at: string;
};

export type HvMarketSignalInternal = {
  id: string;
  jurisdiction_id: string | null;
  title: string;
  summary_public: string | null;
  summary_private: string | null;
  signal_type: string | null;
  source_id: string | null;
  confidence_score: number | null;
  reviewer_id: string | null;
  internal_notes: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  review_status: string | null;
  updated_at: string;
  created_at: string;
};

export type HvMarketplaceListingInternal = {
  id: string;
  company_id: string | null;
  title: string;
  description_public: string | null;
  description_private: string | null;
  category: string | null;
  price_public: string | null;
  country_code: string | null;
  internal_score: number | null;
  reviewer_id: string | null;
  review_notes_private: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  updated_at: string;
  created_at: string;
};

export type HvOfferInternal = {
  id: string;
  offer_id: string | null;
  company_id: string | null;
  title: string;
  description_public: string | null;
  description_private: string | null;
  category: string | null;
  internal_score: number | null;
  reviewer_id: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  updated_at: string;
  created_at: string;
};

export type HvClaimEvidenceInternal = {
  id: string;
  source_id: string | null;
  claim_table: string | null;
  claim_record_id: string | null;
  evidence_type: string | null;
  evidence_url: string | null;
  evidence_title: string | null;
  evidence_notes_private: string | null;
  public_summary: string | null;
  verification_status: string | null;
  review_status: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  reviewer_id: string | null;
  updated_at: string;
  created_at: string;
};

// ---------------------------------------------------------------------------
// HF Intelligence Layer internal types
// ---------------------------------------------------------------------------

export type HvHfSourceRecordInternal = {
  record_id: string;
  source_id: string;
  source_url: string;
  source_domain: string;
  source_type: string;
  jurisdiction_country: string;
  jurisdiction_region: string | null;
  language: string;
  captured_at: string;
  published_at: string | null;
  last_seen_at: string;
  content_hash: string;
  fetch_status: string;
  robots_status: string;
  license_status: string;
  raw_text_ref: string | null;
  clean_text: string;
  html_ref: string | null;
  pdf_ref: string | null;
  screenshot_ref: string | null;
  tables_ref: string | null;
  extraction_status: string;
  sensitivity: 'public_source' | 'internal' | 'confidential' | 'restricted';
  allowed_uses: string[];
  disallowed_uses: string[];
  review_status: string;
  reviewer_id: string | null;
  evidence_notes: string | null;
};

export type HvHfEntityCandidateInternal = {
  candidate_id: string;
  source_record_id: string;
  entity_type: string;
  name: string;
  normalized_name: string;
  aliases: string[];
  country: string | null;
  region: string | null;
  website: string | null;
  emails: string[];
  phones: string[];
  addresses: string[];
  license_numbers: string[];
  commercial_roles: string[];
  marketplace_categories: string[];
  education_categories: string[];
  regulatory_categories: string[];
  confidence: number;
  model_id: string;
  prompt_version: string;
  evidence_spans: Array<{ source_record_id: string; quote: string; start_char: number | null; end_char: number | null }>;
  review_status: string;
  public_release_allowed: boolean;
  private_notes: string | null;
};

export type HvHfReviewedFactInternal = {
  fact_id: string;
  entity_id: string;
  fact_type: string;
  fact_value: string | object | unknown[];
  source_record_ids: string[];
  evidence_quotes: string[];
  reviewer_id: string;
  reviewed_at: string;
  review_decision: 'approved' | 'rejected' | 'superseded';
  confidence: 'low' | 'medium' | 'high';
  freshness: 'current' | 'stale' | 'unknown';
  public_release_class: 'public_safe' | 'internal_only' | 'private_intelligence' | 'restricted';
  public_summary: string | null;
  private_notes: string | null;
  supersedes_fact_ids: string[];
};

export type HvHfSupplierInternal = {
  id: string;
  display_name: string;
  normalized_name: string;
  aliases: string[];
  country: string | null;
  region: string | null;
  website: string | null;
  emails: string[];
  phones: string[];
  addresses: string[];
  license_numbers: string[];
  marketplace_roles: string[];
  categories: string[];
  public_source_urls: string[];
  candidate_confidence: number;
  model_id: string;
  prompt_version: string;
  reviewer_id: string | null;
  private_notes: string | null;
  source_record_ids: string[];
  raw_evidence_quotes: string[];
  review_status: string;
  public_release_approved_at: string | null;
  last_reviewed_at: string | null;
};

export type HvHfMarketplaceEnrichmentInternal = {
  enrichment_id: string;
  entity_id: string;
  listing_id: string | null;
  enrichment_type: string;
  candidate_value: string | object | unknown[];
  confidence: number;
  source_record_ids: string[];
  model_id: string;
  prompt_version: string;
  review_status: string;
  commercial_use: string;
  public_release_allowed: boolean;
  private_notes: string | null;
};

export type HvHfEducationInternal = {
  education_record_id: string;
  source_record_id: string;
  topic: string;
  audience: string[];
  jurisdictions: string[];
  summary_candidate: string;
  claims: Array<{
    claim_text: string;
    evidence_quote: string;
    claim_type: string;
    risk_class: 'low' | 'medium' | 'high';
    requires_expert_review: boolean;
  }>;
  reviewer_id: string | null;
  private_notes: string | null;
  review_status: string;
  public_release_allowed: boolean;
  public_summary: string | null;
  reviewed_at: string | null;
  source_urls: string[];
};
