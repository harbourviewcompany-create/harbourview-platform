'use client'

import { useEffect, useState } from 'react'
import { countryOptions } from '@/config/globe/country-role-profiles'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'

export type CountryBrief = {
  iso_alpha2: string
  country_name: string
  market_access_status: string
  medical_status: string
  adult_use_status: string
  import_status: string
  export_status: string
  public_summary: string | null
  regulator_label: string | null
  country_slug: string
}

type BriefState = { status: 'idle' } | { status: 'loading' } | { status: 'ok'; data: CountryBrief } | { status: 'error' }

const fixtureByCountry = new Map(publicCountryIntelligenceFixtures.map((fixture) => [fixture.country, fixture]))
const staticBriefs = new Map<string, CountryBrief>(countryOptions.flatMap((country) => {
  const fixture = fixtureByCountry.get(country.name)
  if (!fixture) return []

  return [[country.iso2, {
    iso_alpha2: country.iso2,
    country_name: fixture.country,
    market_access_status: fixture.reviewStatus === 'publicSafeSeed' ? 'tracked' : 'review-required',
    medical_status: fixture.pathways.includes('medical') ? 'tracked' : 'unknown',
    adult_use_status: fixture.pathways.includes('adultUse') ? 'tracked' : 'unknown',
    import_status: fixture.tradeRole.includes('import market') ? 'tracked' : 'unknown',
    export_status: fixture.tradeRole.includes('export market') ? 'tracked' : 'unknown',
    public_summary: fixture.publicSummary,
    regulator_label: fixture.regulatorLabel ?? null,
    country_slug: fixture.slug,
  } satisfies CountryBrief]]
}))

const cache = new Map<string, CountryBrief>()

export function useCountryBrief(iso2: string | null | undefined): BriefState {
  const [state, setState] = useState<BriefState>({ status: 'idle' })

  useEffect(() => {
    if (!iso2) { setState({ status: 'idle' }); return }

    const cached = cache.get(iso2)
    if (cached) { setState({ status: 'ok', data: cached }); return }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      const fallback = staticBriefs.get(iso2)
      setState(fallback ? { status: 'ok', data: fallback } : { status: 'error' })
      return
    }

    setState({ status: 'loading' })
    const params = new URLSearchParams({
      select: 'iso_alpha2,country_name,market_access_status,medical_status,adult_use_status,import_status,export_status,public_summary,regulator_label,country_slug',
      iso_alpha2: `eq.${iso2}`,
      limit: '1',
    })

    fetch(`${url.replace(/\/$/, '')}/rest/v1/countries?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((rows: CountryBrief[]) => {
        if (rows[0]) {
          cache.set(iso2, rows[0])
          setState({ status: 'ok', data: rows[0] })
        } else {
          const fallback = staticBriefs.get(iso2)
          setState(fallback ? { status: 'ok', data: fallback } : { status: 'error' })
        }
      })
      .catch(() => {
        const fallback = staticBriefs.get(iso2)
        setState(fallback ? { status: 'ok', data: fallback } : { status: 'error' })
      })
  }, [iso2])

  return state
}
