import { describe, it, expect, vi, beforeEach } from 'vitest'

const liveMock = vi.fn()
vi.mock('@/lib/globe/globeDataServer', () => ({
  getGlobeLiveDataCached: () => liveMock(),
  GLOBE_REVALIDATE_SECONDS: 300,
}))

const country = {
  iso2: 'CA', name: 'Canada', lat: 1, lng: 2, opportunityScore: null, signalsStatus: null,
  marketAccessStatus: null, regulatoryTier: null, regulatoryTierEvidenceKey: null,
  regulatoryTierVerifiedAt: null, regulatoryTierExpiresAt: null, regulatoryTierProvenance: null,
}

describe('GET /api/globe', () => {
  beforeEach(() => {
    liveMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('returns 200 healthy payload with cache headers', async () => {
    liveMock.mockResolvedValue({ countries: [country], signalsByIso2: {}, unmappedSignalCountries: {} })
    const { GET } = await import('@/app/api/globe/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.degraded).toBe(false)
    expect(body.diagnostics.countryCount).toBe(1)
    expect(res.headers.get('cache-control')).toMatch(/s-maxage=300/)
  })

  it('returns 200 with degraded=true when signals are unavailable', async () => {
    liveMock.mockResolvedValue({
      countries: [country], signalsByIso2: {}, unmappedSignalCountries: {}, signalsUnavailable: true,
    })
    const { GET } = await import('@/app/api/globe/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.degraded).toBe(true)
    expect(body.countries).toHaveLength(1)
  })

  it('returns 503 no-store when countries fail', async () => {
    liveMock.mockRejectedValue(new Error('down'))
    const { GET } = await import('@/app/api/globe/route')
    const res = await GET()
    expect(res.status).toBe(503)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect((await res.json()).error).toBe('globe_live_data_unavailable')
  })
})
