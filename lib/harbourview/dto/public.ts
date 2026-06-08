/**
 * lib/harbourview/dto/public.ts
 *
 * Public-safe DTOs derived from internal types via Pick<>.
 * Every public type is structurally constrained — adding a field to a
 * serializer function that is not in the Pick<> type is a compile error.
 *
 * Rules:
 * - Only fields explicitly named in Pick<> can appear in public output.
 * - Each serializer must return EXACTLY the Pick<> type — no extras.
 * - Run assertPublicDtoAllowlist() as a second-layer runtime check.
 * - Passport/licence/evidence/claim/review types have NO public DTO here.
 *   They remain internal-only until a separate approved ticket defines scope.
 */

import type {
  HvJurisdictionInternal,
  HvSourceInternal,
  HvMarketSignalInternal,
  HvMarketplaceListingInternal,
  HvOfferInternal,
  HvClaimEvidenceInternal,
} from './internal';

// ---------------------------------------------------------------------------
// Jurisdictions
// ---------------------------------------------------------------------------

export type HvJurisdictionPublicDto = Pick<
  HvJurisdictionInternal,
  'id' | 'country_name' | 'iso_code' | 'region' | 'cannabis_market_status' | 'priority_tier' | 'updated_at'
>;

export function toHvJurisdictionPublicDto(internal: HvJurisdictionInternal): HvJurisdictionPublicDto {
  return {
    id: internal.id,
    country_name: internal.country_name,
    iso_code: internal.iso_code,
    region: internal.region,
    cannabis_market_status: internal.cannabis_market_status,
    priority_tier: internal.priority_tier,
    updated_at: internal.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export type HvSourcePublicDto = Pick<
  HvSourceInternal,
  | 'id'
  | 'source_name'
  | 'source_url'
  | 'normalized_url'
  | 'country_text'
  | 'source_type_text'
  | 'organization_text'
  | 'jurisdiction_level'
  | 'verification_status'
  | 'last_checked'
  | 'updated_at'
>;

export function toHvSourcePublicDto(internal: HvSourceInternal): HvSourcePublicDto {
  return {
    id: internal.id,
    source_name: internal.source_name,
    source_url: internal.source_url,
    normalized_url: internal.normalized_url,
    country_text: internal.country_text,
    source_type_text: internal.source_type_text,
    organization_text: internal.organization_text,
    jurisdiction_level: internal.jurisdiction_level,
    verification_status: internal.verification_status,
    last_checked: internal.last_checked,
    updated_at: internal.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Market Signals
// ---------------------------------------------------------------------------

export type HvMarketSignalPublicDto = Pick<
  HvMarketSignalInternal,
  'id' | 'jurisdiction_id' | 'title' | 'summary_public' | 'signal_type' | 'source_id' | 'updated_at'
>;

export function toHvMarketSignalPublicDto(internal: HvMarketSignalInternal): HvMarketSignalPublicDto {
  return {
    id: internal.id,
    jurisdiction_id: internal.jurisdiction_id,
    title: internal.title,
    summary_public: internal.summary_public,
    signal_type: internal.signal_type,
    source_id: internal.source_id,
    updated_at: internal.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Marketplace Listings
// ---------------------------------------------------------------------------

export type HvMarketplaceListingPublicDto = Pick<
  HvMarketplaceListingInternal,
  'id' | 'company_id' | 'title' | 'description_public' | 'category' | 'price_public' | 'country_code' | 'updated_at'
>;

export function toHvMarketplaceListingPublicDto(
  internal: HvMarketplaceListingInternal,
): HvMarketplaceListingPublicDto {
  return {
    id: internal.id,
    company_id: internal.company_id,
    title: internal.title,
    description_public: internal.description_public,
    category: internal.category,
    price_public: internal.price_public,
    country_code: internal.country_code,
    updated_at: internal.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export type HvOfferPublicDto = Pick<
  HvOfferInternal,
  'id' | 'offer_id' | 'company_id' | 'title' | 'description_public' | 'category' | 'updated_at'
>;

export function toHvOfferPublicDto(internal: HvOfferInternal): HvOfferPublicDto {
  return {
    id: internal.id,
    offer_id: internal.offer_id,
    company_id: internal.company_id,
    title: internal.title,
    description_public: internal.description_public,
    category: internal.category,
    updated_at: internal.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Claim Evidence
// ---------------------------------------------------------------------------

export type HvClaimEvidencePublicDto = Pick<
  HvClaimEvidenceInternal,
  | 'id'
  | 'source_id'
  | 'claim_table'
  | 'claim_record_id'
  | 'evidence_type'
  | 'evidence_url'
  | 'evidence_title'
  | 'public_summary'
  | 'updated_at'
>;

export function toHvClaimEvidencePublicDto(internal: HvClaimEvidenceInternal): HvClaimEvidencePublicDto {
  return {
    id: internal.id,
    source_id: internal.source_id,
    claim_table: internal.claim_table,
    claim_record_id: internal.claim_record_id,
    evidence_type: internal.evidence_type,
    evidence_url: internal.evidence_url,
    evidence_title: internal.evidence_title,
    public_summary: internal.public_summary,
    updated_at: internal.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Passport system — NO public DTOs defined.
// hv_passports, hv_passport_scores, hv_licences, hv_evidence_documents,
// hv_claims, hv_claim_reviews, hv_admin_review_queue are internal only.
// A separate approved ticket is required to define any public exposure.
// ---------------------------------------------------------------------------
