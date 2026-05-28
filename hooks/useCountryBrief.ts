'use client'

import { useEffect, useState } from 'react'
import { getAlphaCountryFixtureRowByIso2 } from '@/lib/intelligence/alpha-country-coverage'

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

export function useCountryBrief(iso2: string | null | undefined): BriefState {
  const [state, setState] = useState<BriefState>({ status: 'idle' })

  useEffect(() => {
    if (!iso2) { setState({ status: 'idle' }); return }

    const cached = cache.get(iso2)
    if (cached) { setState({ status: 'ok', data: cached }); return }

    const fixtureBrief = getAlphaCountryFixtureRowByIso2(iso2)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      if (fixtureBrief) {
        cache.set(iso2, fixtureBrief)
        setState({ status: 'ok', data: fixtureBrief })
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
        if (rows[0]) {
          cache.set(iso2, rows[0])
          setState({ status: 'ok', data: rows[0] })
        } else if (fixtureBrief) {
          cache.set(iso2, fixtureBrief)
          setState({ status: 'ok', data: fixtureBrief })
        } else {
          setState({ status: 'error' })
        }
      })
      .catch(() => {
        if (fixtureBrief) {
          cache.set(iso2, fixtureBrief)
          setState({ status: 'ok', data: fixtureBrief })
        } else {
          setState({ status: 'error' })
        }
      })
  }, [iso2])

  return state
}
