import { countryIdentityRows, expectedGlobalCountryRouteCount } from './generated-country-identity-rows'
import type { PublicCountryProfileDto } from './types'

const REVIEW_PENDING = 'review_pending'
const PUBLIC_SUMMARY = 'Profile initialized from global country/area identifiers. Market-access, licensing, import/export, and authority data require primary-source review before publication.'

export const publicCountryProfiles = countryIdentityRows.map((row): PublicCountryProfileDto => ({
  jurisdiction_id: row[0],
  slug: row[1],
  public_display_name: row[2],
  public_region: row[3],
  public_subregion: row[4],
  public_status_label: 'Country/area profile initialized',
  medical_cannabis_status_public: REVIEW_PENDING,
  adult_use_cannabis_status_public: REVIEW_PENDING,
  hemp_status_public: REVIEW_PENDING,
  import_export_status_public: REVIEW_PENDING,
  licensing_status_public: REVIEW_PENDING,
  public_summary: PUBLIC_SUMMARY,
  confidence_band_public: 'identity_verified_regulatory_pending',
  last_identity_verified_at: row[5],
  last_regulatory_verified_at: null,
}))

const bySlug = new Map(publicCountryProfiles.map((country) => [country.slug, country]))

export { expectedGlobalCountryRouteCount }

export function getPublicCountryProfiles(): readonly PublicCountryProfileDto[] {
  return publicCountryProfiles
}

export function getPublicCountryProfileBySlug(slug: string): PublicCountryProfileDto | null {
  return bySlug.get(slug) ?? null
}

export function assertPublicCountryRouteCoverage() {
  const slugs = new Set(publicCountryProfiles.map((country) => country.slug))

  return {
    expected: expectedGlobalCountryRouteCount,
    actual: publicCountryProfiles.length,
    uniqueSlugs: slugs.size,
    antarcticaPresent: bySlug.has('antarctica'),
    pass: publicCountryProfiles.length === expectedGlobalCountryRouteCount && slugs.size === expectedGlobalCountryRouteCount && bySlug.has('antarctica'),
  }
}
