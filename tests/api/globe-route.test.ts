import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const liveMock = vi.fn()
const captureMessage = vi.fn()
const captureException = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...a: unknown[]) => captureMessage(...a),
  captureException: (...a: unknown[]) => captureException(...a),
}))
vi.mock('@/lib/globe/globeDataServer', () => ({
  getGlobeLiveDataCached: () => liveMock(),
  GLOBE_REVALIDATE_SECONDS: 300,
}))

const country = {
  iso2: 'CA', name: 'Canada', lat: 1, lng: 2, opportunityScore: null, signalsStatus: null,
  marketAccessStatus: null, regulatoryTier: null, regulatoryTierEvidenceKey: null,
  regulatoryTierVerifiedAt: null, regulatoryTierExpiresAt: null, regulatoryTierProvenance: null,
}

import { resetGlobeDegradedReportThrottle } from '@/lib/globe/degradedReporting'

describe('GET /api/globe', () => {
  // Warm the route module graph once so the first test is not charged the cold import.
  beforeAll(async () => {
    await import('@/app/api/globe/route')
  }, 60_000)

  beforeEach(() => {
    liveMock.mockReset()
    captureMessage.mockReset()
    captureException.mockReset()
    resetGlobeDegradedReportThrottle()
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

  it('returns 200 degraded when static countries are serving', async () => {
    liveMock.mockResolvedValue({
      countries: [country],
      signalsByIso2: {},
      unmappedSignalCountries: {},
      countriesUnavailable: true,
    })
    const { GET } = await import('@/app/api/globe/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.degraded).toBe(true)
    expect(body.diagnostics.countrySource).toBe('static')
    expect(body.countries).toHaveLength(1)
  })

  it('returns 503 no-store only on an unexpected server failure', async () => {
    liveMock.mockRejectedValue(new Error('down'))
    const { GET } = await import('@/app/api/globe/route')
    const res = await GET()
    expect(res.status).toBe(503)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect((await res.json()).error).toBe('globe_live_data_unavailable')
  })
  it('never edge-caches a degraded payload for the healthy window', async () => {
    liveMock.mockResolvedValue({
      countries: [country], signalsByIso2: {}, unmappedSignalCountries: {}, countriesUnavailable: true,
    })
    const { GET } = await import('@/app/api/globe/route')
    const res = await GET()
    const cc = res.headers.get('cache-control') ?? ''
    expect(res.status).toBe(200)
    expect(cc).toContain('s-maxage=15')
    expect(cc).toContain('stale-while-revalidate=0')
    expect(cc).not.toContain('s-maxage=300')
  })

  it('keeps the long edge cache for healthy payloads', async () => {
    liveMock.mockResolvedValue({ countries: [country], signalsByIso2: {}, unmappedSignalCountries: {} })
    const { GET } = await import('@/app/api/globe/route')
    const cc = (await GET()).headers.get('cache-control') ?? ''
    expect(cc).toContain('s-maxage=300')
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('reports a degraded response to Sentry, throttled to once per interval', async () => {
    liveMock.mockResolvedValue({
      countries: [country], signalsByIso2: {}, unmappedSignalCountries: {}, countriesUnavailable: true,
    })
    const { GET } = await import('@/app/api/globe/route')
    await GET()
    await GET()
    await GET()
    expect(captureMessage).toHaveBeenCalledTimes(1)
    expect(captureMessage.mock.calls[0][0]).toMatch(/countries unavailable/)
    expect(captureMessage.mock.calls[0][1]).toMatchObject({ level: 'error' })
  })

  it('does not fail the response when Sentry throws', async () => {
    captureMessage.mockImplementation(() => { throw new Error('sentry down') })
    liveMock.mockResolvedValue({
      countries: [country], signalsByIso2: {}, unmappedSignalCountries: {}, signalsUnavailable: true,
    })
    const { GET } = await import('@/app/api/globe/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect((await res.json()).degraded).toBe(true)
  })

  it('captures the exception on the 503 path', async () => {
    liveMock.mockRejectedValue(new Error('hard'))
    const { GET } = await import('@/app/api/globe/route')
    const res = await GET()
    expect(res.status).toBe(503)
    expect(captureException).toHaveBeenCalledTimes(1)
  })
})
