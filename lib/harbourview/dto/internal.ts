/**
 * lib/harbourview/dto/internal.ts
 *
 * Internal (server-side only) full-field types for every HarbourView entity.
 * These types represent the complete database row — including all private,
 * sensitive, and operational fields.
 *
 * Rules:
 * - Never serialize these directly to HTTP responses.
 * - Never pass to client components.
 * - Public DTOs are derived from these via Pick<> in public.ts.
 * - Passport/licence/claim tables have NO public DTO scope yet — internal only.
 */

// ---------------------------------------------------------------------------
// Jurisdictions / Countries
// ---------------------------------------------------------------------------

export type HvJurisdictionInternal = {
  id: string;
  country_name: string;
  iso_code: string | null;
  iso3: string | null;
  region: string | null;
  subregion: string | null;
  cannabis_market_status: string | null;
  priority_tier: string | null;
  internal_score: number | null;
  internal_notes: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  data_source: string | null;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Sources / Source Registry
// ---------------------------------------------------------------------------

export type HvSourceInternal = {
  id: string;
  source_name: string;
  source_url: string | null;
  normalized_url: string | null;
  country_text: string | null;
  source_type_text: string | null;
  organization_text: string | null;
  jurisdiction_level: string | null;
  verification_status: 'verified' | 'unverified' | 'pending' | 'rejected';
  last_checked: string | null;
  // Internal-only fields — never expose publicly
  fetch_method: string | null;
  robots_status: string | null;
  license_status: string | null;
  fetch_credentials_ref: string | null;
  internal_quality_score: number | null;
  internal_notes: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Market Signals
// ---------------------------------------------------------------------------

export type HvMarketSignalInternal = {
  id: string;
  jurisdiction_id: string | null;
  title: string;
  summary_public: string | null;
  signal_type: string | null;
  source_id: string | null;
  // Internal-only fields
  summary_private: string | null;
  raw_signal_text: string | null;
  confidence_score: number | null;
  model_id: string | null;
  prompt_version: string | null;
  review_notes_private: string | null;
  reviewer_id: string | null;
  review_status: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Marketplace Listings
// ---------------------------------------------------------------------------

export type HvMarketplaceListingInternal = {
  id: string;
  company_id: string | null;
  title: string;
  description_public: string | null;
  category: string | null;
  price_public: string | null;
  country_code: string | null;
  // Internal-only fields
  description_private: string | null;
  price_internal: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  internal_score: number | null;
  review_notes_private: string | null;
  reviewer_id: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export type HvOfferInternal = {
  id: string;
  offer_id: string | null;
  company_id: string | null;
  title: string;
  description_public: string | null;
  category: string | null;
  // Internal-only fields
  description_private: string | null;
  price_details: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  internal_notes: string | null;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Claim Evidence
// ---------------------------------------------------------------------------

export type HvClaimEvidenceInternal = {
  id: string;
  source_id: string | null;
  claim_table: string | null;
  claim_record_id: string | null;
  evidence_type: string | null;
  evidence_url: string | null;
  evidence_title: string | null;
  public_summary: string | null;
  // Internal-only fields
  evidence_notes_private: string | null;
  raw_evidence_text: string | null;
  verification_status: string | null;
  review_status: string | null;
  reviewer_id: string | null;
  public_visibility: boolean;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Verification Queue (internal only — no public DTO)
// ---------------------------------------------------------------------------

export type HvVerificationQueueInternal = {
  id: string;
  airtable_record_id: string;
  destination_table: string;
  destination_record_id: string | null;
  queue_status: string;
  review_notes_private: string | null;
  operator_comments: string | null;
  sensitivity: 'internal' | 'confidential' | 'restricted';
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Passport system (internal only — NO public DTO scope defined yet)
// Passport tables contain: payment signals, recall flags, deal scores,
// licence numbers, storage paths, reviewer identities.
// None of these fields may appear in public output without explicit approval.
// ---------------------------------------------------------------------------

export type HvPassportInternal = {
  id: string;
  org_id: string;
  completeness_score: number | null;
  completeness_band: string | null;
  verification_level: string;
  export_readiness_score: number | null;
  export_readiness_band: string | null;
  import_readiness_score: number | null;
  deal_readiness_score: number | null;          // competitive intelligence — internal only
  payment_readiness_signals: Record<string, unknown> | null; // sensitive — internal only
  recall_exposure_flag: boolean;                // sensitive — internal only
  public_snapshot: Record<string, unknown> | null;
  last_computed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HvPassportScoreInternal = {
  id: string;
  passport_id: string;
  dimension: string;
  score: number | null;
  max_score: number;
  confidence: string;    // model-generated — internal only
  evidence_count: number;
  flags: Record<string, unknown> | null;  // internal flags — never public
  computed_at: string;
};

export type HvLicenceInternal = {
  id: string;
  org_id: string;
  licence_number: string;      // sensitive — never public without explicit approval
  issuing_authority: string;
  jurisdiction_country: string;
  jurisdiction_region: string | null;
  licence_type: string;
  permitted_activities: string[] | null;
  issued_at: string | null;
  expires_at: string;
  status: string;
  evidence_document_id: string | null;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;  // reviewer identity — never public
  created_at: string;
  updated_at: string;
};

export type HvEvidenceDocumentInternal = {
  id: string;
  org_id: string;
  document_type: string;
  display_name: string;
  storage_path: string;        // file system path — never public
  file_hash: string | null;    // internal integrity hash — never public
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string;         // user identity — never public
  verification_status: string;
  verified_by: string | null;  // reviewer identity — never public
  verified_at: string | null;
  expiry_date: string | null;
  is_public: boolean;
  created_at: string;
};

export type HvClaimInternal = {
  id: string;
  org_id: string;
  claim_type: string;
  claim_text: string;
  evidence_document_id: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type HvClaimReviewInternal = {
  id: string;
  claim_id: string;
  reviewed_by: string;   // reviewer identity — never public
  verdict: string;
  notes: string | null;  // reviewer notes — never public
  created_at: string;
};

export type HvAdminReviewQueueInternal = {
  id: string;
  queue_type: string;
  target_entity_type: string;
  target_entity_id: string;
  org_id: string;
  assigned_to: string | null;  // reviewer assignment — never public
  priority: string;
  status: string;
  notes: string | null;        // admin notes — never public
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};
