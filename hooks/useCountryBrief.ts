'use client'

import { useEffect, useState } from 'react'
import { publicCountryIntelligenceFixtures } from '@/lib/intelligence/fixtures'
import { countryOptions } from '@/config/globe/country-role-profiles'

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

const cache = new Map<string, CountryBrief>()

function statusFromFixturePathways(pathways: string[], pathway: 'medical' | 'adultUse') {
  return pathways.includes(pathway) ? 'tracked alpha' : 'not published'
}

function fixtureToBrief(fixture: (typeof publicCountryIntelligenceFixtures)[number]): CountryBrief | null {
  const iso2 = countryOptions.find((country) => country.name === fixture.country)?.iso2
  if (!iso2) return null

  return {
    iso_alpha2: iso2,
    country_name: fixture.country,
    market_access_status: fixture.reviewStatus === 'publicSafeSeed' ? 'public-safe seed' : 'needs analyst review',
    medical_status: statusFromFixturePathways(fixture.pathways, 'medical'),
    adult_use_status: statusFromFixturePathways(fixture.pathways, 'adultUse'),
    import_status: fixture.tradeRole.includes('import market') ? 'tracked alpha' : 'not published',
    export_status: fixture.tradeRole.includes('export market') || fixture.tradeRole.includes('supply origin') ? 'tracked alpha' : 'not published',
    public_summary: fixture.publicSummary,
    regulator_label: fixture.regulatorLabel ?? null,
    country_slug: fixture.slug,
  }
}

const fixtureBriefs = publicCountryIntelligenceFixtures
  .map(fixtureToBrief)
  .filter((brief): brief is CountryBrief => Boolean(brief))

const fixtureBriefMap = new Map(fixtureBriefs.map((brief) => [brief.iso_alpha2, brief]))

export function useCountryBrief(iso2: string | null | undefined): BriefState {
  const [state, setState] = useState<BriefState>({ status: 'idle' })

  useEffect(() => {
    if (!iso2) { setState({ status: 'idle' }); return }

    const cached = cache.get(iso2)
    if (cached) { setState({ status: 'ok', data: cached }); return }

    const fixture = fixtureBriefMap.get(iso2)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      if (fixture) {
        cache.set(iso2, fixture)
        setState({ status: 'ok', data: fixture })
      } else {
        setState({ status: 'error' })
      }
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
        const brief = rows[0] ?? fixture
        if (brief) {
          cache.set(iso2, brief)
          setState({ status: 'ok', data: brief })
        } else {
          setState({ status: 'error' })
        }
      })
      .catch(() => {
        if (fixture) {
          cache.set(iso2, fixture)
          setState({ status: 'ok', data: fixture })
        } else {
          setState({ status: 'error' })
        }
      })
  }, [iso2])

  return state
}
