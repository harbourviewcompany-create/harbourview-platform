import { createClient } from '@supabase/supabase-js'
import { countryIdentityRows, expectedGlobalCountryRouteCount } from '../lib/country-data/generated-country-identity-rows'
import { getPublicCountryProfiles } from '../lib/country-data/public-country-dto'

function requireWriteGate() {
  if (process.env.HARBOURVIEW_COUNTRY_DATA_LOAD !== '1') {
    throw new Error('Refusing country-data write: set HARBOURVIEW_COUNTRY_DATA_LOAD=1')
  }

  const baseUrl = process.env.HARBOURVIEW_PUBLIC_BASE_URL ?? ''
  const looksProduction = /harbourview-platform\.vercel\.app|harbourview/i.test(baseUrl)
  if (looksProduction && process.env.HARBOURVIEW_ALLOW_PRODUCTION_COUNTRY_DATA_LOAD !== '1') {
    throw new Error('Refusing production country-data write: set HARBOURVIEW_ALLOW_PRODUCTION_COUNTRY_DATA_LOAD=1')
  }
}

function buildRows() {
  const jurisdictions = countryIdentityRows.map((row) => ({
    jurisdiction_id: row[0],
    slug: row[1],
    canonical_name: row[2],
    display_name: row[2],
    iso_alpha3: row[0].replace('country_area:', ''),
    un_region_name: row[3],
    un_subregion_name: row[4],
    jurisdiction_type: 'country_or_area',
    identity_verification_status: 'verified_identity_only',
    data_release_status: 'seeded_identity_pending_regulated_market_review',
    created_at: row[5],
    updated_at: row[5],
  }))

  const publicProfiles = getPublicCountryProfiles().map((country) => ({
    profile_id: `public_profile:${country.jurisdiction_id.replace('country_area:', '')}`,
    jurisdiction_id: country.jurisdiction_id,
    slug: country.slug,
    public_display_name: country.public_display_name,
    public_region: country.public_region,
    public_subregion: country.public_subregion,
    public_status_label: country.public_status_label,
    medical_cannabis_status_public: country.medical_cannabis_status_public,
    adult_use_cannabis_status_public: country.adult_use_cannabis_status_public,
    hemp_status_public: country.hemp_status_public,
    import_export_status_public: country.import_export_status_public,
    licensing_status_public: country.licensing_status_public,
    public_summary: country.public_summary,
    confidence_band_public: country.confidence_band_public,
    last_identity_verified_at: country.last_identity_verified_at,
    last_regulatory_verified_at: country.last_regulatory_verified_at,
    public_dto_allowed: true,
    admin_evidence_excluded_from_public: true,
  }))

  return { jurisdictions, publicProfiles }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.env.HARBOURVIEW_COUNTRY_DATA_LOAD !== '1'
  const rows = buildRows()

  if (rows.jurisdictions.length !== expectedGlobalCountryRouteCount || rows.publicProfiles.length !== expectedGlobalCountryRouteCount) {
    throw new Error(`Expected ${expectedGlobalCountryRouteCount} rows, got jurisdictions=${rows.jurisdictions.length} profiles=${rows.publicProfiles.length}`)
  }

  const evidence = {
    dryRun,
    expectedJurisdictionCount: expectedGlobalCountryRouteCount,
    jurisdictionRows: rows.jurisdictions.length,
    publicProfileRows: rows.publicProfiles.length,
    writeGateRequired: true,
  }

  if (dryRun) {
    console.log(JSON.stringify({ ...evidence, status: 'dry_run_passed' }, null, 2))
    return
  }

  requireWriteGate()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase URL and service role key are required for country-data write mode')

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const importRunId = `country_data_identity_${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}`

  const { error: runError } = await supabase.from('country_data_import_runs').upsert({
    import_run_id: importRunId,
    package_name: 'harbourview_country_data_global_identity',
    package_version: '2026-06-11_identity_only_v1',
    source_zip_name: 'harbourview_country_data_global_consolidated.zip',
    expected_jurisdiction_count: expectedGlobalCountryRouteCount,
    loaded_jurisdiction_count: null,
    dry_run: false,
    status: 'started',
    evidence_json: evidence,
  })
  if (runError) throw runError

  const { error: jurisdictionsError } = await supabase.from('jurisdictions').upsert(rows.jurisdictions)
  if (jurisdictionsError) throw jurisdictionsError

  const { error: profilesError } = await supabase.from('country_profiles_public').upsert(rows.publicProfiles)
  if (profilesError) throw profilesError

  const { error: doneError } = await supabase.from('country_data_import_runs').upsert({
    import_run_id: importRunId,
    package_name: 'harbourview_country_data_global_identity',
    package_version: '2026-06-11_identity_only_v1',
    source_zip_name: 'harbourview_country_data_global_consolidated.zip',
    expected_jurisdiction_count: expectedGlobalCountryRouteCount,
    loaded_jurisdiction_count: expectedGlobalCountryRouteCount,
    dry_run: false,
    completed_at: new Date().toISOString(),
    status: 'completed',
    evidence_json: evidence,
  })
  if (doneError) throw doneError

  console.log(JSON.stringify({ ...evidence, importRunId, status: 'completed' }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
