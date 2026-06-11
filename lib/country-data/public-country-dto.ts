import { countries as dashboardCountries } from '@/lib/dashboard/countries'
import type { PublicCountryProfileDto } from './types'

export const expectedGlobalCountryRouteCount = 248

const REVIEW_PENDING = 'review_pending'
const PUBLIC_SUMMARY = 'Profile initialized from global country/area identifiers. Cannabis, market-access, licensing, import/export, and regulatory authority data require primary-source review before publication.'

function mapDashboardCountry(country: (typeof dashboardCountries)[number]): PublicCountryProfileDto {
  return {
    jurisdiction_id: `country_area:${country.iso3}`,
    slug: country.slug,
    public_display_name: country.displayName,
    public_region: country.region ?? null,
    public_subregion: country.subregion ?? null,
    public_status_label: 'Country/area profile initialized',
    medical_cannabis_status_public: REVIEW_PENDING,
    adult_use_cannabis_status_public: REVIEW_PENDING,
    hemp_status_public: REVIEW_PENDING,
    import_export_status_public: REVIEW_PENDING,
    licensing_status_public: REVIEW_PENDING,
    public_summary: PUBLIC_SUMMARY,
    confidence_band_public: 'identity_verified_regulatory_pending',
    last_identity_verified_at: '2026-06-11',
    last_regulatory_verified_at: null,
  }
}

const mapped = dashboardCountries.map(mapDashboardCountry)
const hasAntarctica = mapped.some((country) => country.slug === 'antarctica')

const cleanupRows: PublicCountryProfileDto[] = hasAntarctica ? [] : [
  {
    jurisdiction_id: 'country_area:ATA',
    slug: 'antarctica',
    public_display_name: 'Antarctica',
    public_region: null,
    public_subregion: null,
    public_status_label: 'M49 cleanup profile initialized',
    medical_cannabis_status_public: REVIEW_PENDING,
    adult_use_cannabis_status_public: REVIEW_PENDING,
    hemp_status_public: REVIEW_PENDING,
    import_export_status_public: REVIEW_PENDING,
    licensing_status_public: REVIEW_PENDING,
    public_summary: PUBLIC_SUMMARY,
    confidence_band_public: 'identity_verified_regulatory_pending',
    last_identity_verified_at: '2026-06-11',
    last_regulatory_verified_at: null,
  },
]

export const publicCountryProfiles = [...mapped, ...cleanupRows]
  .sort((a, b) => a.public_display_name.localeCompare(b.public_display_name))

const bySlug = new Map(publicCountryProfiles.map((country) => [country.slug, country]))

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
