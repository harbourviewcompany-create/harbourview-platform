// Public country/area identity profile DTO — backs app/countries/* (the
// identity-only country directory) via lib/country-data/public-country-dto.ts.
// Both this and CountryBriefing coexist here because the briefing contract is
// intentionally separate from the identity-only public profile.

export interface CountryBriefing {
  iso2: string;
  overview: string;
  regulatory: {
    status: string | null;
    lastUpdated: string | null;
    keyLaws: string[];
  };
  marketIntel: {
    opportunityScore: number | null;
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

// Identity-only public country/area profile. Deliberately excludes any
// regulated-market, licensing, or import/export claims — those fields are
// always 'review_pending' here until primary-source evidence is captured.
export interface PublicCountryProfileDto {
  jurisdiction_id: string;
  slug: string;
  public_display_name: string;
  public_region: string | null;
  public_subregion: string | null;
  public_status_label: string;
  medical_cannabis_status_public: string;
  adult_use_cannabis_status_public: string;
  hemp_status_public: string;
  import_export_status_public: string;
  licensing_status_public: string;
  public_summary: string;
  confidence_band_public: string;
  last_identity_verified_at: string | null;
  last_regulatory_verified_at: string | null;
}

export const PUBLIC_COUNTRY_DTO_ALLOWLIST: readonly (keyof PublicCountryProfileDto)[] = [
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
]
