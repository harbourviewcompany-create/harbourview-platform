'use client'

import { useEffect, useState } from 'react'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'
import { countryOptions } from '@/config/globe/country-role-profiles'
import { getSupabasePublicClientKey, getSupabaseUrl } from '@/lib/supabase/env'

export interface CountryRow {
  iso_alpha2: string
  country_name: string
  market_access_status: string | null
  medical_status: string | null
  adult_use_status: string | null
  import_status: string | null
  export_status: string | null
  public_summary: string | null
  regulator_label: string | null
  country_slug: string | null
  opportunity_score: number | null
}

type State =
  | { status: 'loading' }
  | { status: 'ok'; data: CountryRow[] }
  | { status: 'error' }

function hasPathway(pathways: string[], pathway: 'medical' | 'adultUse') {
  return pathways.includes(pathway) ? 'tracked alpha' : 'not published'
}

const fixtureCountryRows: CountryRow[] = publicCountryIntelligenceFixtures
  .map((fixture, index) => ({
    iso_alpha2: countryOptions.find((country) => country.name === fixture.country)?.iso2 ?? '',
    country_name: fixture.country,
    market_access_status: fixture.reviewStatus === 'publicSafeSeed' ? 'public-safe seed' : 'needs analyst review',
    medical_status: hasPathway(fixture.pathways, 'medical'),
    adult_use_status: hasPathway(fixture.pathways, 'adultUse'),
    import_status: fixture.tradeRole.includes('import market') ? 'tracked alpha' : 'not published',
    export_status: fixture.tradeRole.includes('export market') || fixture.tradeRole.includes('supply origin') ? 'tracked alpha' : 'not published',
    public_summary: fixture.publicSummary,
    regulator_label: fixture.regulatorLabel ?? null,
    country_slug: fixture.slug,
    opportunity_score: 100 - index,
  }))
  .filter((row) => row.iso_alpha2)

let _cache: CountryRow[] | null = null

export function useAllCountries(): State {
  const [state, setState] = useState<State>(_cache ? { status: 'ok', data: _cache } : { status: 'loading' })

  useEffect(() => {
    if (_cache) { setState({ status: 'ok', data: _cache }); return }

    let url = ''
    let key = ''

    try {
      url = getSupabaseUrl()
      key = getSupabasePublicClientKey()
    } catch {
      _cache = fixtureCountryRows
      setState({ status: 'ok', data: fixtureCountryRows })
      return
    }

    const params = new URLSearchParams({
      select: 'iso_alpha2,country_name,market_access_status,medical_status,adult_use_status,import_status,export_status,public_summary,regulator_label,country_slug,opportunity_score',
      order: 'country_name.asc',
      limit: '300',
    })

    fetch(`${url.replace(/\/$/, '')}/rest/v1/countries?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((rows: CountryRow[]) => {
        const data = rows.length > 0 ? rows : fixtureCountryRows
        _cache = data
        setState({ status: 'ok', data })
      })
      .catch(() => {
        _cache = fixtureCountryRows
        setState({ status: 'ok', data: fixtureCountryRows })
      })
  }, [])

  return state
}
