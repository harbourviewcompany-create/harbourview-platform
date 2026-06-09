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
] as const;

export type HvPublicDtoName = keyof typeof HV_PUBLIC_DTO_ALLOWLISTS;

export function assertPublicDtoAllowlist(dtoName: HvPublicDtoName, fields: readonly string[]): boolean {
  const allowlist = new Set<string>(HV_PUBLIC_DTO_ALLOWLISTS[dtoName]);
  return fields.every((field) => allowlist.has(field) && !HV_FORBIDDEN_PUBLIC_DTO_FIELDS.includes(field as never));
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
  'hv_cultivar_passports',
  'hv_genetic_lineage',
  'hv_terpene_profiles',
  'hv_lab_certificates',
  'hv_claim_evidence',
  'hv_claim_reviews',
  'hv_admin_review_queue',
] as const

// Aliases for backward compatibility with leakageAudit and other consumers
export const HV_FORBIDDEN_PUBLIC_KEYS = HV_FORBIDDEN_PUBLIC_DTO_FIELDS
export type HvForbiddenPublicKey = typeof HV_FORBIDDEN_PUBLIC_DTO_FIELDS[number]
