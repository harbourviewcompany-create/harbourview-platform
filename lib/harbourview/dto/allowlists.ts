/**
 * lib/harbourview/dto/allowlists.ts
 *
 * Runtime allowlist enforcement for public DTOs.
 * This is the SECOND layer of protection.
 * The FIRST layer is structural: Pick<> types in public.ts make leakage
 * a compile-time error. This layer catches it at runtime if a field
 * is somehow added without going through the type system.
 *
 * Usage pattern:
 *   const dto = toHvJurisdictionPublicDto(internal);  // structural guard
 *   assertNoForbiddenFields(dto);                     // runtime guard
 */

// ---------------------------------------------------------------------------
// Approved public field allowlists (must match Pick<> types in public.ts)
// ---------------------------------------------------------------------------

export const HV_PUBLIC_DTO_ALLOWLISTS = {
  jurisdictions_public: [
    'id', 'country_name', 'iso_code', 'region',
    'cannabis_market_status', 'priority_tier', 'updated_at',
  ],
  sources_public: [
    'id', 'source_name', 'source_url', 'normalized_url', 'country_text',
    'source_type_text', 'organization_text', 'jurisdiction_level',
    'verification_status', 'last_checked', 'updated_at',
  ],
  market_signals_public: [
    'id', 'jurisdiction_id', 'title', 'summary_public',
    'signal_type', 'source_id', 'updated_at',
  ],
  marketplace_listings_public: [
    'id', 'company_id', 'title', 'description_public',
    'category', 'price_public', 'country_code', 'updated_at',
  ],
  offers_public: [
    'id', 'offer_id', 'company_id', 'title',
    'description_public', 'category', 'updated_at',
  ],
  claim_evidence_public: [
    'id', 'source_id', 'claim_table', 'claim_record_id',
    'evidence_type', 'evidence_url', 'evidence_title', 'public_summary', 'updated_at',
  ],
} as const;

export type HvPublicDtoName = keyof typeof HV_PUBLIC_DTO_ALLOWLISTS;

// ---------------------------------------------------------------------------
// Forbidden fields — must never appear in any public payload
// ---------------------------------------------------------------------------

export const HV_FORBIDDEN_PUBLIC_KEYS = [
  // Generic private annotation fields
  'private_notes',
  'notes_private',
  'summary_private',
  'description_private',
  'evidence_notes_private',
  'review_notes_private',
  'internal_notes',
  'operator_comments',

  // Reviewer/operator identity fields
  'reviewer_id',
  'reviewed_by',
  'uploaded_by',
  'assigned_to',
  'verified_by',

  // Internal scoring and model metadata
  'internal_score',
  'confidence_score',
  'confidence',
  'model_id',
  'prompt_version',
  'internal_quality_score',

  // Source/pipeline internals
  'raw_text_ref',
  'raw_signal_text',
  'raw_evidence_text',
  'clean_text',
  'html_ref',
  'pdf_ref',
  'screenshot_ref',
  'tables_ref',
  'content_hash',
  'file_hash',
  'storage_path',
  'fetch_credentials_ref',
  'robots_status',
  'license_status',
  'fetch_method',

  // Sensitivity / classification meta
  'sensitivity',

  // Import/pipeline tracking
  'import_batch_id',
  'raw_row_id',
  'raw_source_file',

  // Passport system — all passport fields are internal only
  'payment_readiness_signals',
  'recall_exposure_flag',
  'deal_readiness_score',
  'export_readiness_score',
  'import_readiness_score',
  'completeness_score',
  'export_readiness_band',
  'completeness_band',
  'verification_level',
  'public_snapshot',          // serialized internally, never raw
  'flags',                    // internal model flags

  // Licence fields — never public without explicit approval
  'licence_number',
  'permitted_activities',
  'evidence_document_id',
  'verified_at',              // internal verification timestamp
] as const;

export type HvForbiddenPublicKey = (typeof HV_FORBIDDEN_PUBLIC_KEYS)[number];

// ---------------------------------------------------------------------------
// Runtime guards
// ---------------------------------------------------------------------------

/**
 * Throws if any key in the object is in the forbidden list.
 * Call after toHvXxxPublicDto() as a runtime second-layer check.
 */
export function assertNoForbiddenFields(
  payload: Record<string, unknown>,
  context = 'unknown',
): void {
  const forbidden = HV_FORBIDDEN_PUBLIC_KEYS as readonly string[];
  const found = Object.keys(payload).filter((k) => forbidden.includes(k));
  if (found.length > 0) {
    throw new Error(
      `[dto] Forbidden fields in public payload (${context}): ${found.join(', ')}`,
    );
  }
}

/**
 * Returns true only if all fields are in the named allowlist and none are forbidden.
 * Use assertPublicDtoAllowlist for strict enforcement, or check the return value.
 */
export function assertPublicDtoAllowlist(
  dtoName: HvPublicDtoName,
  fields: readonly string[],
): boolean {
  const allowed = new Set<string>(HV_PUBLIC_DTO_ALLOWLISTS[dtoName]);
  const forbidden = new Set<string>(HV_FORBIDDEN_PUBLIC_KEYS);
  return fields.every((f) => allowed.has(f) && !forbidden.has(f));
}

/**
 * Checks all fields in a payload against the allowlist for the given DTO name.
 * Throws if any field is not in the allowlist or is in the forbidden list.
 */
export function enforcePublicDtoAllowlist(
  dtoName: HvPublicDtoName,
  payload: Record<string, unknown>,
): void {
  const allowed = new Set<string>(HV_PUBLIC_DTO_ALLOWLISTS[dtoName]);
  const forbidden = new Set<string>(HV_FORBIDDEN_PUBLIC_KEYS);
  const keys = Object.keys(payload);

  const notAllowed = keys.filter((k) => !allowed.has(k));
  const isForbidden = keys.filter((k) => forbidden.has(k));

  const errors: string[] = [];
  if (notAllowed.length) errors.push(`Not in allowlist: ${notAllowed.join(', ')}`);
  if (isForbidden.length) errors.push(`Forbidden: ${isForbidden.join(', ')}`);

  if (errors.length) {
    throw new Error(`[dto] Public DTO allowlist violation for ${dtoName}: ${errors.join('; ')}`);
  }
}

// ---------------------------------------------------------------------------
// Passport tables — explicitly out of scope for public DTOs
// Any attempt to define a public DTO for these tables requires a separate
// approved ticket with an explicit allowlist entry above.
// ---------------------------------------------------------------------------

export const HV_PASSPORT_TABLES_NO_PUBLIC_DTO = [
  'hv_passports',
  'hv_passport_scores',
  'hv_licences',
  'hv_evidence_documents',
  'hv_claims',
  'hv_claim_reviews',
  'hv_admin_review_queue',
] as const;

// Legacy alias — keep for backward compat with any existing imports
/** @deprecated Use HV_FORBIDDEN_PUBLIC_KEYS */
export const HV_FORBIDDEN_PUBLIC_DTO_FIELDS = HV_FORBIDDEN_PUBLIC_KEYS;
