export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'
import { createClient } from '@/lib/supabase/server'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'
import { countryOptions } from '@/config/globe/country-role-profiles'

// POST /api/admin/seed-countries
// Upserts the 6 fixture countries into public.countries
// Safe to run repeatedly — uses ON CONFLICT (iso_alpha2) DO UPDATE
export async function POST() {
  const authFailure = await requireAdminApiAuth()
  if (authFailure) return authFailure

  const supabase = await createClient()

  const ISO3: Record<string, string> = {
    DE: 'DEU', GB: 'GBR', CA: 'CAN', CO: 'COL', BR: 'BRA', AU: 'AUS',
    US: 'USA', FR: 'FRA', IT: 'ITA', NL: 'NLD', PT: 'PRT', ES: 'ESP',
    CH: 'CHE', PL: 'POL', CZ: 'CZE', IL: 'ISR', NZ: 'NZL', TH: 'THA',
    ZA: 'ZAF', MX: 'MEX', AR: 'ARG', UY: 'URY',
  }

  const rows = publicCountryIntelligenceFixtures.map(fixture => {
    const iso2 = countryOptions.find(c => c.name === fixture.country)?.iso2 ?? ''
    if (!iso2) return null

    const hasMedical  = fixture.pathways.includes('medical')
    const hasAdultUse = fixture.pathways.includes('adultUse')
    const isImport    = fixture.tradeRole.some(r => r.includes('import'))
    const isExport    = fixture.tradeRole.some(r => r.includes('export') || r.includes('supply'))

    return {
      country_name:          fixture.country,
      country_slug:          fixture.slug,
      iso_alpha2:            iso2,
      iso_alpha3:            ISO3[iso2] ?? null,
      region:                fixture.region,
      market_access_status:  fixture.reviewStatus === 'publicSafeSeed' ? 'open'
                             : hasMedical ? 'active' : 'emerging',
      medical_status:        hasMedical ? 'active' : 'unknown',
      adult_use_status:      hasAdultUse ? 'emerging' : 'restricted',
      import_status:         isImport ? 'active' : 'unknown',
      export_status:         isExport ? 'active' : 'unknown',
      signals_status:        'emerging',
      opportunity_status:    'emerging',
      public_summary:        fixture.publicSummary,
      data_completeness:     fixture.reviewStatus === 'publicSafeSeed' ? 'full' : 'seed',
      last_updated_label:    new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      lat:                   fixture.coordinates?.lat ?? null,
      lng:                   fixture.coordinates?.lng ?? null,
      opportunity_categories: fixture.opportunityCategories,
      trade_roles:           fixture.tradeRole,
      regulator_label:       fixture.regulatorLabel ?? null,
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)

  const { error, count } = await supabase
    .from('countries')
    .upsert(rows, { onConflict: 'iso_alpha2', count: 'exact' })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, upserted: count, countries: rows.map(r => r?.country_name) })
}
