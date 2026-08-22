import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { getClinicalSupplyOutlook } from '@/lib/server/clinicalSupplyOutlookQuery'

function makeClient(result: { data: unknown; error: { message: string } | null }) {
  return { rpc: vi.fn(() => Promise.resolve(result)) }
}

describe('getClinicalSupplyOutlook', () => {
  beforeEach(() => {
    mocks.createClient.mockReset()
  })

  it('rejects a missing or malformed country code without calling the database', async () => {
    const client = makeClient({ data: null, error: null })
    mocks.createClient.mockResolvedValue(client)

    const result = await getClinicalSupplyOutlook({ countryIso2: 'DEU' })

    expect(result.state).toBe('error')
    expect(result.error).toMatch(/2-letter/)
    expect(client.rpc).not.toHaveBeenCalled()
  })

  it('maps a loaded row to the DTO shape and normalizes the country to uppercase', async () => {
    const client = makeClient({
      data: [
        {
          country_iso2: 'CA',
          risk_level: 'elevated',
          signal_count_90d: 4,
          signal_count_lookback: 6,
          top_category: 'commercial',
          most_recent_headline: 'Canopy protects a critical Europe export gate',
          most_recent_summary: 'EU-GMP renewal at Kincardine',
          most_recent_source_url: 'https://example.com/signal',
          most_recent_signal_at: '2026-08-15T00:00:00Z',
          generated_at: '2026-08-19T00:00:00Z',
        },
      ],
      error: null,
    })
    mocks.createClient.mockResolvedValue(client)

    const result = await getClinicalSupplyOutlook({ countryIso2: 'ca' })

    expect(client.rpc).toHaveBeenCalledWith('clinical_jurisdiction_supply_outlook', {
      p_country_iso2: 'CA',
      p_lookback_days: 180,
    })
    expect(result.state).toBe('loaded')
    expect(result.outlook).toMatchObject({
      countryIso2: 'CA',
      riskLevel: 'elevated',
      signalCount90d: 4,
      topCategory: 'commercial',
      mostRecentHeadline: 'Canopy protects a critical Europe export gate',
    })
  })

  it('surfaces a database error without throwing', async () => {
    const client = makeClient({ data: null, error: { message: 'permission denied for function' } })
    mocks.createClient.mockResolvedValue(client)

    const result = await getClinicalSupplyOutlook({ countryIso2: 'DE' })

    expect(result.state).toBe('error')
    expect(result.error).toBe('permission denied for function')
    expect(result.outlook).toBeNull()
  })

  it('returns an empty state when the function returns no row', async () => {
    const client = makeClient({ data: [], error: null })
    mocks.createClient.mockResolvedValue(client)

    const result = await getClinicalSupplyOutlook({ countryIso2: 'ZZ' })

    expect(result.state).toBe('empty')
    expect(result.outlook).toBeNull()
  })

  it('passes a custom lookback window through to the RPC call', async () => {
    const client = makeClient({ data: [], error: null })
    mocks.createClient.mockResolvedValue(client)

    await getClinicalSupplyOutlook({ countryIso2: 'US', lookbackDays: 90 })

    expect(client.rpc).toHaveBeenCalledWith('clinical_jurisdiction_supply_outlook', {
      p_country_iso2: 'US',
      p_lookback_days: 90,
    })
  })
})
