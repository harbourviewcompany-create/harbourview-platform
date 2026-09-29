import { describe, it, expect, vi, beforeEach } from 'vitest'

const countriesMock = vi.fn()
const signalsMock = vi.fn()
const staticCountry = { iso2: 'CA', name: 'Canada', lat: 56, lng: -106 }

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }))
vi.mock('@/lib/supabase/env', () => ({
  getSupabaseUrl: () => 'https://example.supabase.co',
  getSupabasePublicClientKey: () => 'anon',
  SUPABASE_DB_SCHEMA: 'api',
}))
vi.mock('@/lib/globe/supabaseGlobeData', () => ({
  getGlobeCountryMarkers: (...a: unknown[]) => countriesMock(...a),
  getGlobeSignals: (...a: unknown[]) => signalsMock(...a),
  getStaticGlobeCountryMarkers: () => [staticCountry],
}))

const country = { iso2: 'CA', name: 'Canada', lat: 1, lng: 2 }

describe('getGlobeLiveDataCached', () => {
  beforeEach(() => {
    countriesMock.mockReset()
    signalsMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('merges countries and signals when both succeed', async () => {
    countriesMock.mockResolvedValue([country])
    signalsMock.mockResolvedValue({ signalsByIso2: { CA: [] }, unmappedSignalCountries: {} })
    const { getGlobeLiveDataCached } = await import('@/lib/globe/globeDataServer')
    const data = await getGlobeLiveDataCached()
    expect(data.countries).toHaveLength(1)
    expect(data.signalsByIso2).toEqual({ CA: [] })
    expect(data.signalsUnavailable).toBeUndefined()
  })

  it('keeps countries and flags signalsUnavailable when signals fail', async () => {
    countriesMock.mockResolvedValue([country])
    signalsMock.mockRejectedValue(new Error('signals boom'))
    const { getGlobeLiveDataCached } = await import('@/lib/globe/globeDataServer')
    const data = await getGlobeLiveDataCached()
    expect(data.countries).toHaveLength(1)
    expect(data.signalsByIso2).toEqual({})
    expect(data.signalsUnavailable).toBe(true)
  })

  it('uses neutral static geography when countries fail', async () => {
    countriesMock.mockRejectedValue(new Error('countries down'))
    signalsMock.mockResolvedValue({ signalsByIso2: { CA: [] }, unmappedSignalCountries: {} })
    const { getGlobeLiveDataCached } = await import('@/lib/globe/globeDataServer')
    const data = await getGlobeLiveDataCached()
    expect(data.countries).toEqual([staticCountry])
    expect(data.countriesUnavailable).toBe(true)
    expect(data.signalsByIso2).toEqual({ CA: [] })
    expect(data.signalsUnavailable).toBeUndefined()
  })

  it('keeps static routing even when both live layers fail', async () => {
    countriesMock.mockRejectedValue(new Error('countries down'))
    signalsMock.mockRejectedValue(new Error('signals down'))
    const { getGlobeLiveDataCached } = await import('@/lib/globe/globeDataServer')
    const data = await getGlobeLiveDataCached()
    expect(data.countries).toEqual([staticCountry])
    expect(data.countriesUnavailable).toBe(true)
    expect(data.signalsUnavailable).toBe(true)
    expect(data.signalsByIso2).toEqual({})
  })
})
