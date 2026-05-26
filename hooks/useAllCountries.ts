'use client'

import { useEffect, useState } from 'react'

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

let _cache: CountryRow[] | null = null

export function useAllCountries(): State {
  const [state, setState] = useState<State>(_cache ? { status: 'ok', data: _cache } : { status: 'loading' })

  useEffect(() => {
    if (_cache) { setState({ status: 'ok', data: _cache }); return }
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) { setState({ status: 'error' }); return }

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
        _cache = rows
        setState({ status: 'ok', data: rows })
      })
      .catch(() => setState({ status: 'error' }))
  }, [])

  return state
}
