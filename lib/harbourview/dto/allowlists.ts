export const HV_PUBLIC_DTO_ALLOWLISTS = {
  jurisdictions_public: ['id', 'country_name', 'iso_code', 'region', 'cannabis_market_status', 'priority_tier', 'updated_at'],
  sources_public: ['id', 'source_name', 'source_url', 'normalized_url', 'country_text', 'source_type_text', 'organization_text', 'jurisdiction_level', 'verification_status', 'last_checked', 'updated_at'],
  market_signals_public: ['id', 'jurisdiction_id', 'title', 'summary_public', 'signal_type', 'source_id', 'updated_at'],
  marketplace_listings_public: ['id', 'company_id', 'title', 'description_public', 'category', 'price_public', 'country_code', 'updated_at'],
  offers_public: ['id', 'offer_id', 'company_id', 'title', 'description_public', 'category', 'updated_at'],
  claim_evidence_public: ['id', 'source_id', 'claim_table', 'claim_record_id', 'evidence_type', 'evidence_url', 'evidence_title', 'public_summary', 'updated_at'],
  education_resources_public: ['id', 'title', 'summary_public', 'content_public', 'source_id', 'evidence_id', 'updated_at'],
} as const;

export const HV_FORBIDDEN_PUBLIC_DTO_FIELDS = [
  // Generic private / internal field names
  'private_notes',
  'notes_private',
  'summary_private',
  'description_private',
  'raw_row_id',
  'raw_source_file',
  'import_batch_id',
  'sensitivity',
  'operator_comments',
  'review_notes_private',
  'internal_score',
  'internal_notes',
  'internal_quality_score',
  // Reviewer / model provenance — never in public responses
  'reviewer_id',
  'model_id',
  'prompt_version',
  'raw_signal_text',
  'raw_evidence_text',
  'evidence_notes_private',
  // Commercial / contact details
  'price_internal',
  'price_details',
  'contact_email',
  'contact_phone',
  'contact_name',
  'fetch_method',
  'fetch_credentials_ref',
  // AI scoring fields — never expose raw scores
  'confidence',
  'confidence_score',
  'deal_readiness_score',
  'recall_exposure_flag',
  // Passport-level fields — hard FORBIDDEN per DTO allowlist spec
  'payment_readiness_signals',
  'completeness_score',
  'licence_number',
  'storage_path',
  'file_hash',
  'verified_by',
  'flags',
] as const;

export type HvPublicDtoName = keyof typeof HV_PUBLIC_DTO_ALLOWLISTS;

export function assertPublicDtoAllowlist(dtoName: HvPublicDtoName, fields: readonly string[]): void {
  const allowlist  = new Set<string>(HV_PUBLIC_DTO_ALLOWLISTS[dtoName]);
  const forbidden  = new Set<string>(HV_FORBIDDEN_PUBLIC_DTO_FIELDS);
  const violations = fields.filter((f) => !allowlist.has(f) || forbidden.has(f));
  if (violations.length > 0) {
    throw new Error(
      `Public DTO allowlist violation for '${dtoName}': [${violations.join(', ')}]`,
    );
  }
}

/** Throws if any key in `record` is a known forbidden public DTO field. */
export function assertNoForbiddenFields(record: Record<string, unknown>): void {
  const forbidden = Object.keys(record).filter((k) =>
    HV_FORBIDDEN_PUBLIC_DTO_FIELDS.includes(k as never),
  )
  if (forbidden.length > 0) {
    throw new Error(`Forbidden public DTO fields present: ${forbidden.join(', ')}`)
  }
}

/** Tables that contain passport-level data and must never have a public DTO. */
export const HV_PASSPORT_TABLES_NO_PUBLIC_DTO = [
  'hv_passports',
  'hv_passport_scores',
  'hv_licences',
  'hv_evidence_documents',
  'hv_claims',
  'hv_claim_reviews',
  'hv_admin_review_queue',
] as const

// Aliases for backward compatibility with leakageAudit and other consumers
export const HV_FORBIDDEN_PUBLIC_KEYS = HV_FORBIDDEN_PUBLIC_DTO_FIELDS
export type HvForbiddenPublicKey = typeof HV_FORBIDDEN_PUBLIC_DTO_FIELDS[number]
