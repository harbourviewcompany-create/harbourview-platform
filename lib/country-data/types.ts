// Public country/area identity profile DTO — backs app/countries/* (the
// identity-only country directory) via lib/country-data/public-country-dto.ts.
// Restored after a concurrent edit (62f28cb) replaced this file's contents
// with the unrelated CountryBriefing types below, breaking app/countries/*,
// lib/country-data/public-country-dto.ts, and
// scripts/country-public-dto-check.ts (which all still depend on it). Both
// features now coexist in this file rather than colliding.
export type PublicCountryProfileDto = {
  jurisdiction_id: string
  slug: string
  public_display_name: string
  public_region: string | null
  public_subregion: string | null
  public_status_label: string | null
  medical_cannabis_status_public: string | null
  adult_use_cannabis_status_public: string | null
  hemp_status_public: string | null
  import_export_status_public: string | null
  licensing_status_public: string | null
  public_summary: string | null
  confidence_band_public: string | null
  last_identity_verified_at: string | null
  last_regulatory_verified_at: string | null
}

export const PUBLIC_COUNTRY_DTO_ALLOWLIST = [
  'jurisdiction_id',
  'slug',
  'public_display_name',
  'public_region',
  'public_subregion',
  'public_status_label',
  'medical_cannabis_status_public',
  'adult_use_cannabis_status_public',
  'hemp_status_public',
  'import_export_status_public',
  'licensing_status_public',
  'public_summary',
  'confidence_band_public',
  'last_identity_verified_at',
  'last_regulatory_verified_at',
] as const

export type PublicCountryDtoKey = typeof PUBLIC_COUNTRY_DTO_ALLOWLIST[number]

// --- Briefing Room local intel (added in 62f28cb) ---
export interface CountryBriefing {
  iso2: string;
  overview: string;
  regulatory: {
    status: string;
    lastUpdated: string;
    keyLaws: string[];
  };
  marketIntel: {
    opportunityScore: number; // 0-100
    keyPlayers?: string[];
    risks: string[];
  };
  localSignals: Array<{
    date: string;
    title: string;
    summary: string;
    source: string;
  }>;
}
