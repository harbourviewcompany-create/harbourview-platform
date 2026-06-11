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
