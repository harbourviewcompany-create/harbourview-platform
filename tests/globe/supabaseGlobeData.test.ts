// tests/globe/supabaseGlobeData.test.ts
//
// Regression coverage for the country_iso2 wiring fix: `signals.country_iso2`
// is resolved server-side by the `trg_signals_resolve_geo` trigger (migration
// 20260716195743_signals_country_iso_resolution) and re-exposed through the
// `api.signals` view (migration 20260721_expose_signals_country_iso2_via_api_view).
// This file guards the two places that read it: the initial batch load
// (getGlobeLiveData) and the realtime merge (mergeSignalRealtimeRow, called
// from GlobeProvider's postgres_changes handler).
import { describe, expect, it, vi, beforeEach } from 'vitest'

type QueryResult = { data: unknown[] | null; error: { message: string } | null }

function makeQueryBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'not', 'gte', 'order', 'limit', 'eq', 'in']) {
    builder[method] = vi.fn(() => builder)
  }
  // supabase-js query builders are thenable; awaiting the builder itself
  // resolves to { data, error } without an explicit terminal call.
  ;(builder as { then: PromiseLike<QueryResult>['then'] }).then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject)
  return builder
}

const countryRow = {
  iso_alpha2: 'US',
  country_name: 'United States',
  lat: 39,
  lng: -98,
  opportunity_score: 80,
  signals_status: 'active',
  market_access_status: 'open',
  regulatory_tier: 'tier_1',
}

const fromMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: fromMock }),
}))

describe('getGlobeLiveData', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('reads country_iso2 directly off the row instead of re-resolving client-side', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'countries') return makeQueryBuilder({ data: [countryRow], error: null })
      if (table === 'signals') {
        return makeQueryBuilder({
          data: [
            {
              id: 's1',
              headline: 'US regulatory update',
              score: 70,
              cat: 'GAZETTE',
              country: 'USA', // free-text form -- proves we don't re-derive from this
              country_iso2: 'US', // already resolved server-side
              created_at: '2026-07-20T00:00:00Z',
            },
          ],
          error: null,
        })
      }
      throw new Error(`unexpected table: ${table}`)
    })

    const { getGlobeLiveData } = await import('@/lib/globe/supabaseGlobeData')
    const result = await getGlobeLiveData()

    expect(result.signalsByIso2.US).toHaveLength(1)
    expect(result.signalsByIso2.US[0]).toMatchObject({ id: 's1', countryIso2: 'US' })
    expect(result.unmappedSignalCountries).toEqual({})
  })

  it('buckets a null country_iso2 (regional/global/unresolved) into unmappedSignalCountries, not onto the globe', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'countries') return makeQueryBuilder({ data: [countryRow], error: null })
      if (table === 'signals') {
        return makeQueryBuilder({
          data: [
            {
              id: 's2',
              headline: 'Global market roundup',
              score: 65,
              cat: 'ECONOMIC',
              country: 'Global',
              country_iso2: null,
              created_at: '2026-07-20T00:00:00Z',
            },
          ],
          error: null,
        })
      }
      throw new Error(`unexpected table: ${table}`)
    })

    const { getGlobeLiveData } = await import('@/lib/globe/supabaseGlobeData')
    const result = await getGlobeLiveData()

    expect(result.signalsByIso2).toEqual({})
    expect(result.unmappedSignalCountries).toEqual({ Global: 1 })
  })

  it('fails loud when the signals query errors, rather than returning an empty globe silently', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'countries') return makeQueryBuilder({ data: [countryRow], error: null })
      if (table === 'signals') return makeQueryBuilder({ data: null, error: { message: 'boom' } })
      throw new Error(`unexpected table: ${table}`)
    })

    const { getGlobeLiveData } = await import('@/lib/globe/supabaseGlobeData')
    await expect(getGlobeLiveData()).rejects.toThrow(/signals query failed: boom/)
  })
})

describe('mergeSignalRealtimeRow', () => {
  const emptyState = { countries: [], signalsByIso2: {}, unmappedSignalCountries: {} }

  it('adds a resolved-iso2 realtime row to the front of that country\'s signal list', async () => {
    const { mergeSignalRealtimeRow } = await import('@/lib/globe/supabaseGlobeData')

    const state = mergeSignalRealtimeRow(emptyState, {
      id: 'r1',
      headline: 'New signal',
      score: 80,
      cat: 'GAZETTE',
      country: 'United States',
      country_iso2: 'US',
      created_at: '2026-07-22T00:00:00Z',
    })

    expect(state.signalsByIso2.US).toHaveLength(1)
    expect(state.signalsByIso2.US[0].id).toBe('r1')
    expect(state.unmappedSignalCountries).toEqual({})
  })

  it('caps signals at 50 per country, dropping the oldest', async () => {
    const { mergeSignalRealtimeRow } = await import('@/lib/globe/supabaseGlobeData')

    const full = {
      countries: [],
      signalsByIso2: {
        US: Array.from({ length: 50 }, (_, i) => ({
          id: `old-${i}`,
          headline: 'old',
          score: 50,
          cat: null,
          createdAt: '2026-07-01T00:00:00Z',
          countryIso2: 'US',
        })),
      },
      unmappedSignalCountries: {},
    }

    const state = mergeSignalRealtimeRow(full, {
      id: 'new-1',
      headline: 'newest',
      score: 90,
      cat: 'GAZETTE',
      country: 'United States',
      country_iso2: 'US',
      created_at: '2026-07-22T00:00:00Z',
    })

    expect(state.signalsByIso2.US).toHaveLength(50)
    expect(state.signalsByIso2.US[0].id).toBe('new-1')
    expect(state.signalsByIso2.US.some((s) => s.id === 'old-49')).toBe(false)
  })

  it('buckets a null country_iso2 realtime row into unmappedSignalCountries by raw country label', async () => {
    const { mergeSignalRealtimeRow } = await import('@/lib/globe/supabaseGlobeData')

    const state = mergeSignalRealtimeRow(emptyState, {
      id: 'r2',
      headline: 'Regional roundup',
      score: 60,
      cat: 'ECONOMIC',
      country: 'Europe',
      country_iso2: null,
      created_at: '2026-07-22T00:00:00Z',
    })

    expect(state.signalsByIso2).toEqual({})
    expect(state.unmappedSignalCountries).toEqual({ Europe: 1 })
  })

  it('falls back to the "(null)" bucket key when country itself is null', async () => {
    const { mergeSignalRealtimeRow } = await import('@/lib/globe/supabaseGlobeData')

    const state = mergeSignalRealtimeRow(emptyState, {
      id: 'r3',
      headline: 'No country tag',
      score: 60,
      cat: null,
      country: null,
      country_iso2: null,
      created_at: '2026-07-22T00:00:00Z',
    })

    expect(state.unmappedSignalCountries).toEqual({ '(null)': 1 })
  })
})
