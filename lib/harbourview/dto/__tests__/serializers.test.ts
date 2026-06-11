/**
 * Tests for lib/harbourview/dto/ — serializers, allowlists, forbidden fields.
 *
 * Verifies:
 * 1. Each serializer returns only the Pick<> fields (structural enforcement test)
 * 2. No internal/private fields appear in serializer output
 * 3. Forbidden field list covers all required sensitive keys
 * 4. assertPublicDtoAllowlist throws on forbidden input
 * 5. assertPublicDtoAllowlist throws on disallowed fields
 * 6. Passport tables are absent from all public DTO exports
 */

import { describe, it, expect } from 'vitest';

import {
  toHvJurisdictionPublicDto,
  toHvSourcePublicDto,
  toHvMarketSignalPublicDto,
  toHvMarketplaceListingPublicDto,
  toHvOfferPublicDto,
  toHvClaimEvidencePublicDto,
} from '../public';

import {
  HV_PUBLIC_DTO_ALLOWLISTS,
  HV_FORBIDDEN_PUBLIC_DTO_FIELDS as HV_FORBIDDEN_PUBLIC_KEYS,
  HV_PASSPORT_TABLES_NO_PUBLIC_DTO,
  assertPublicDtoAllowlist,
  assertNoForbiddenFields,
} from '../allowlists';

import type {
  HvJurisdictionInternal,
  HvSourceInternal,
  HvMarketSignalInternal,
  HvMarketplaceListingInternal,
  HvOfferInternal,
  HvClaimEvidenceInternal,
} from '../internal';

// ---------------------------------------------------------------------------
// Test fixtures — full internal objects with every sensitive field populated
// ---------------------------------------------------------------------------

const jurisdiction: HvJurisdictionInternal = {
  id: 'jur-1',
  country_name: 'Germany',
  iso_code: 'DE',
  iso3: 'DEU',
  region: 'Europe',
  subregion: 'Western Europe',
  cannabis_market_status: 'legal_medical',
  priority_tier: '1',
  internal_score: 92,
  internal_notes: 'HIGH PRIORITY — do not expose score',
  sensitivity: 'internal',
  data_source: 'manual_review',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const source: HvSourceInternal = {
  id: 'src-1',
  source_name: 'BfArM',
  source_url: 'https://bfarm.de',
  normalized_url: 'https://bfarm.de',
  country_text: 'Germany',
  source_type_text: 'regulator',
  organization_text: 'Federal Institute for Drugs and Medical Devices',
  jurisdiction_level: 'national',
  verification_status: 'verified',
  last_checked: '2026-06-01T00:00:00Z',
  fetch_method: 'scheduled_scrape',
  robots_status: 'allowed',
  license_status: 'known_allowed',
  fetch_credentials_ref: 'vault://bfarm-creds',
  internal_quality_score: 98,
  internal_notes: 'Primary German regulator — high trust',
  sensitivity: 'internal',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const signal: HvMarketSignalInternal = {
  id: 'sig-1',
  jurisdiction_id: 'jur-1',
  title: 'Germany expands medicinal cannabis access',
  summary_public: 'Germany has expanded access to medicinal cannabis.',
  signal_type: 'regulatory_update',
  source_id: 'src-1',
  summary_private: 'INTERNAL: Strong BD opportunity — 3 known operators positioning.',
  raw_signal_text: 'Full scraped article text here...',
  confidence_score: 0.94,
  model_id: 'qwen3-4b-instruct-2507',
  prompt_version: 'v2.1',
  review_notes_private: 'Reviewer confirmed. Fast-track.',
  reviewer_id: 'user-abc123',
  review_status: 'approved',
  sensitivity: 'public',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const listing: HvMarketplaceListingInternal = {
  id: 'lst-1',
  company_id: 'co-1',
  title: 'EU-GMP Certified Flower — 100kg Available',
  description_public: 'Premium indoor-grown cannabis flower, EU-GMP certified.',
  category: 'flower',
  price_public: 'Contact for pricing',
  country_code: 'DE',
  description_private: 'Asking €4,200/kg. Flexible on volume.',
  price_internal: '4200 EUR/kg',
  contact_email: 'sales@operator.de',
  contact_phone: '+49 30 12345678',
  contact_name: 'Hans Müller',
  internal_score: 87,
  review_notes_private: 'Operator verified — licence confirmed.',
  reviewer_id: 'user-abc123',
  sensitivity: 'internal',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const offer: HvOfferInternal = {
  id: 'off-1',
  offer_id: 'offer-ext-123',
  company_id: 'co-1',
  title: 'Looking to Buy: High-THC Flower, 50kg',
  description_public: 'Seeking EU-GMP certified high-THC flower.',
  category: 'flower',
  description_private: 'Budget: €3,800/kg max. Urgency: high.',
  price_details: '3800 EUR/kg max',
  contact_email: 'buyer@company.com',
  contact_phone: '+1 555 9999',
  internal_notes: 'Repeat buyer — high trust.',
  sensitivity: 'internal',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const evidence: HvClaimEvidenceInternal = {
  id: 'ev-1',
  source_id: 'src-1',
  claim_table: 'hv_claims',
  claim_record_id: 'clm-1',
  evidence_type: 'regulatory_document',
  evidence_url: 'https://bfarm.de/doc/123',
  evidence_title: 'EU-GMP Certificate',
  public_summary: 'EU-GMP certification issued by BfArM.',
  evidence_notes_private: 'Expiry: 2027-03-01. Flag for renewal.',
  raw_evidence_text: 'Full certificate text...',
  verification_status: 'verified',
  review_status: 'approved',
  reviewer_id: 'user-abc123',
  public_visibility: true,
  sensitivity: 'internal',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Serializer output tests
// ---------------------------------------------------------------------------

describe('toHvJurisdictionPublicDto', () => {
  const dto = toHvJurisdictionPublicDto(jurisdiction);

  it('includes only approved public fields', () => {
    const keys = Object.keys(dto);
    const allowed = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.jurisdictions_public));
    expect(keys.every((k) => allowed.has(k))).toBe(true);
  });

  it('strips internal_score, internal_notes, sensitivity, iso3, subregion', () => {
    expect(dto).not.toHaveProperty('internal_score');
    expect(dto).not.toHaveProperty('internal_notes');
    expect(dto).not.toHaveProperty('sensitivity');
    expect(dto).not.toHaveProperty('iso3');
    expect(dto).not.toHaveProperty('subregion');
    expect(dto).not.toHaveProperty('data_source');
    expect(dto).not.toHaveProperty('created_at');
  });

  it('preserves correct public values', () => {
    expect(dto.country_name).toBe('Germany');
    expect(dto.iso_code).toBe('DE');
  });
});

describe('toHvSourcePublicDto', () => {
  const dto = toHvSourcePublicDto(source);

  it('includes only approved public fields', () => {
    const keys = Object.keys(dto);
    const allowed = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.sources_public));
    expect(keys.every((k) => allowed.has(k))).toBe(true);
  });

  it('strips robots_status, license_status, fetch_credentials_ref, internal fields', () => {
    expect(dto).not.toHaveProperty('robots_status');
    expect(dto).not.toHaveProperty('license_status');
    expect(dto).not.toHaveProperty('fetch_credentials_ref');
    expect(dto).not.toHaveProperty('internal_quality_score');
    expect(dto).not.toHaveProperty('internal_notes');
    expect(dto).not.toHaveProperty('fetch_method');
    expect(dto).not.toHaveProperty('sensitivity');
  });
});

describe('toHvMarketSignalPublicDto', () => {
  const dto = toHvMarketSignalPublicDto(signal);

  it('includes only approved public fields', () => {
    const keys = Object.keys(dto);
    const allowed = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.market_signals_public));
    expect(keys.every((k) => allowed.has(k))).toBe(true);
  });

  it('strips ALL private intelligence fields', () => {
    expect(dto).not.toHaveProperty('summary_private');
    expect(dto).not.toHaveProperty('raw_signal_text');
    expect(dto).not.toHaveProperty('confidence_score');
    expect(dto).not.toHaveProperty('model_id');
    expect(dto).not.toHaveProperty('prompt_version');
    expect(dto).not.toHaveProperty('review_notes_private');
    expect(dto).not.toHaveProperty('reviewer_id');
    expect(dto).not.toHaveProperty('sensitivity');
  });
});

describe('toHvMarketplaceListingPublicDto', () => {
  const dto = toHvMarketplaceListingPublicDto(listing);

  it('includes only approved public fields', () => {
    const keys = Object.keys(dto);
    const allowed = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.marketplace_listings_public));
    expect(keys.every((k) => allowed.has(k))).toBe(true);
  });

  it('strips contact details and internal pricing', () => {
    expect(dto).not.toHaveProperty('contact_email');
    expect(dto).not.toHaveProperty('contact_phone');
    expect(dto).not.toHaveProperty('contact_name');
    expect(dto).not.toHaveProperty('description_private');
    expect(dto).not.toHaveProperty('price_internal');
    expect(dto).not.toHaveProperty('internal_score');
    expect(dto).not.toHaveProperty('review_notes_private');
    expect(dto).not.toHaveProperty('reviewer_id');
  });
});

describe('toHvClaimEvidencePublicDto', () => {
  const dto = toHvClaimEvidencePublicDto(evidence);

  it('includes only approved public fields', () => {
    const keys = Object.keys(dto);
    const allowed = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.claim_evidence_public));
    expect(keys.every((k) => allowed.has(k))).toBe(true);
  });

  it('strips reviewer identity and private notes', () => {
    expect(dto).not.toHaveProperty('reviewer_id');
    expect(dto).not.toHaveProperty('evidence_notes_private');
    expect(dto).not.toHaveProperty('raw_evidence_text');
    expect(dto).not.toHaveProperty('sensitivity');
  });
});

// ---------------------------------------------------------------------------
// assertPublicDtoAllowlist runtime guard
// ---------------------------------------------------------------------------

describe('assertPublicDtoAllowlist', () => {
  it('does not throw on a clean public payload', () => {
    expect(() =>
      assertNoForbiddenFields({ id: '1', title: 'test', updated_at: '2026-01-01' }),
    ).not.toThrow();
  });

  it('throws on reviewer_id', () => {
    expect(() =>
      assertNoForbiddenFields({ id: '1', reviewer_id: 'user-abc' }),
    ).toThrow(/reviewer_id/);
  });

  it('throws on confidence_score', () => {
    expect(() =>
      assertNoForbiddenFields({ id: '1', confidence_score: 0.95 }),
    ).toThrow(/confidence_score/);
  });

  it('throws on payment_readiness_signals (passport field)', () => {
    expect(() =>
      assertNoForbiddenFields({ id: '1', payment_readiness_signals: {} }),
    ).toThrow(/payment_readiness_signals/);
  });

  it('throws on licence_number', () => {
    expect(() =>
      assertNoForbiddenFields({ id: '1', licence_number: 'DE-MED-2026-001' }),
    ).toThrow(/licence_number/);
  });

  it('throws on storage_path', () => {
    expect(() =>
      assertNoForbiddenFields({ id: '1', storage_path: '/private/docs/cert.pdf' }),
    ).toThrow(/storage_path/);
  });

  it('throws on multiple forbidden fields and names all of them', () => {
    expect(() =>
      assertNoForbiddenFields({ reviewer_id: 'x', model_id: 'y', sensitivity: 'internal' }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// assertPublicDtoAllowlist
// ---------------------------------------------------------------------------

describe('assertPublicDtoAllowlist', () => {
  it('does not throw on valid jurisdiction payload', () => {
    const payload = toHvJurisdictionPublicDto(jurisdiction) as Record<string, unknown>;
    expect(() => assertPublicDtoAllowlist('jurisdictions_public', Object.keys(payload))).not.toThrow();
  });

  it('throws when a field outside the allowlist is present', () => {
    const payload = { ...toHvJurisdictionPublicDto(jurisdiction), extra_field: 'sneaky' } as Record<string, unknown>;
    expect(() => assertPublicDtoAllowlist('jurisdictions_public', Object.keys(payload))).toThrow(/extra_field/);
  });

  it('throws when a forbidden field is present even if somehow in payload', () => {
    const payload = { ...toHvJurisdictionPublicDto(jurisdiction), reviewer_id: 'x' } as Record<string, unknown>;
    expect(() => assertPublicDtoAllowlist('jurisdictions_public', Object.keys(payload))).toThrow(/reviewer_id/);
  });
});

// ---------------------------------------------------------------------------
// Passport tables have no public DTO exports
// ---------------------------------------------------------------------------

describe('Passport tables excluded from public DTOs', () => {
  it('HV_PASSPORT_TABLES_NO_PUBLIC_DTO contains all 7 passport tables', () => {
    const required = [
      'hv_passports',
      'hv_passport_scores',
      'hv_licences',
      'hv_evidence_documents',
      'hv_claims',
      'hv_claim_reviews',
      'hv_admin_review_queue',
    ];
    for (const t of required) {
      expect(HV_PASSPORT_TABLES_NO_PUBLIC_DTO).toContain(t);
    }
  });

  it('public.ts does not export any passport-related DTO or serializer', async () => {
    const src = await import('fs').then((fs) =>
      fs.readFileSync(new URL('../public.ts', import.meta.url).pathname, 'utf-8'),
    );
    const forbidden = [
      'HvPassport', 'HvLicence', 'HvEvidenceDocument',
      'HvClaim', 'HvAdminReview', 'toHvPassport', 'toHvLicence',
    ];
    for (const term of forbidden) {
      expect(src, `public.ts must not export ${term}`).not.toContain(`export function to${term.replace('to', '')}`);
    }
  });

  it('forbidden list includes all passport-specific sensitive fields', () => {
    const passportSensitive = [
      'payment_readiness_signals',
      'recall_exposure_flag',
      'deal_readiness_score',
      'licence_number',
      'storage_path',
      'file_hash',
      'verified_by',
      'flags',
    ];
    const forbidden = new Set<string>(Array.from(HV_FORBIDDEN_PUBLIC_KEYS));
    for (const f of passportSensitive) {
      expect(forbidden.has(f), `${f} must be in HV_FORBIDDEN_PUBLIC_KEYS`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Allowlist/forbidden consistency: public.ts fields match allowlists.ts
// ---------------------------------------------------------------------------

describe('Allowlist consistency', () => {
  it('serializer output keys match jurisdiction allowlist exactly', () => {
    const dto = toHvJurisdictionPublicDto(jurisdiction);
    const actual = new Set(Object.keys(dto));
    const expected = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.jurisdictions_public));
    expect(actual).toEqual(expected);
  });

  it('serializer output keys match source allowlist exactly', () => {
    const dto = toHvSourcePublicDto(source);
    const actual = new Set(Object.keys(dto));
    const expected = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.sources_public));
    expect(actual).toEqual(expected);
  });

  it('serializer output keys match signal allowlist exactly', () => {
    const dto = toHvMarketSignalPublicDto(signal);
    const actual = new Set(Object.keys(dto));
    const expected = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.market_signals_public));
    expect(actual).toEqual(expected);
  });

  it('serializer output keys match listing allowlist exactly', () => {
    const dto = toHvMarketplaceListingPublicDto(listing);
    const actual = new Set(Object.keys(dto));
    const expected = new Set<string>(Array.from(HV_PUBLIC_DTO_ALLOWLISTS.marketplace_listings_public));
    expect(actual).toEqual(expected);
  });
});
