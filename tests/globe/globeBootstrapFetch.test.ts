import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchGlobeBootstrapData } from '@/components/globe/GlobeProvider'

describe('fetchGlobeBootstrapData', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('rejects with a timeout error when /api/globe hangs, so loading can clear', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
          }),
      ),
    )

    const pending = fetchGlobeBootstrapData()
    const assertion = expect(pending).rejects.toThrow(/timed out/)
    await vi.advanceTimersByTimeAsync(8_001)
    await assertion
  })

  it('marks degraded when the server reports signalsUnavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          countries: [{ iso2: 'CA' }],
          signalsByIso2: {},
          unmappedSignalCountries: {},
          signalsUnavailable: true,
          degraded: true,
        }),
      })),
    )
    const result = await fetchGlobeBootstrapData()
    expect(result.degraded).toBe(true)
    expect(result.data.countries).toHaveLength(1)
  })

  it('rejects on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })))
    await expect(fetchGlobeBootstrapData()).rejects.toThrow(/503/)
  })
})
