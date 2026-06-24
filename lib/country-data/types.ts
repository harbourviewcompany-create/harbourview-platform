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

export interface PublicCountryProfileDto {
  jurisdiction_id: string
  slug: string
  public_display_name: string
  public_region: string | null
  public_subregion: string | null
  public_status_label: string
  medical_cannabis_status_public: string
  adult_use_cannabis_status_public: string
  hemp_status_public: string
  import_export_status_public: string
  licensing_status_public: string
  public_summary: string
  confidence_band_public: string
  last_identity_verified_at: string | null
  last_regulatory_verified_at: string | null
}
