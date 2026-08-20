import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

import { getCrossBorderFormularyCheck } from '@/lib/server/clinicalCrossBorderQuery'

function makeClient(result: { data: unknown; error: { message: string } | null }) {
  return { rpc: vi.fn(() => Promise.resolve(result)) }
}

describe('getCrossBorderFormularyCheck', () => {
  beforeEach(() => {
    mocks.createClient.mockReset()
  })

  it('rejects a malformed destination country without calling the database', async () => {
    const client = makeClient({ data: null, error: null })
    mocks.createClient.mockResolvedValue(client)

    const result = await getCrossBorderFormularyCheck({ destinationCountryIso2: 'GER' })

    expect(result.state).toBe('error')
    expect(result.error).toMatch(/2-letter/)
    expect(client.rpc).not.toHaveBeenCalled()
  })

  it('maps a same-brand match to a likely-portable verdict', async () => {
    const client = makeClient({
      data: [
        {
          destination_country_iso2: 'AU',
          match_kind: 'equivalent-profile',
          portability_verdict: 'profile-equivalent-available',
          matched_source_type: 'sku',
          matched_product_name: 'TGA SAS-B medicinal cannabis products (pathway class)',
          matched_brand_name: null,
          matched_authorization_status: 'authorised',
          supply_risk_level: 'watch',
          supply_signal_headline: 'Australia\u2019s DVA cannabis funding reset lands September 1',
          supply_signal_source_url: 'https://example.com/dva',
          generated_at: '2026-08-20T10:04:34Z',
        },
      ],
      error: null,
    })
    mocks.createClient.mockResolvedValue(client)

    const result = await getCrossBorderFormularyCheck({
      destinationCountryIso2: 'au',
      cannabinoidProfile: 'Wide CBD/THC range',
    })

    expect(client.rpc).toHaveBeenCalledWith('clinical_cross_border_formulary_check', {
      p_destination_country_iso2: 'AU',
      p_brand_name: null,
      p_cannabinoid_profile: 'Wide CBD/THC range',
    })
    expect(result.state).toBe('loaded')
    expect(result.result).toMatchObject({
      destinationCountryIso2: 'AU',
      matchKind: 'equivalent-profile',
      portabilityVerdict: 'profile-equivalent-available',
      matchedAuthorizationStatus: 'authorised',
      supplyRiskLevel: 'watch',
    })
  })

  it('reports a clean not-currently-available verdict when nothing matches', async () => {
    const client = makeClient({
      data: [
        {
          destination_country_iso2: 'DE',
          match_kind: 'no-match',
          portability_verdict: 'not-currently-available',
          matched_source_type: null,
          matched_product_name: null,
          matched_brand_name: null,
          matched_authorization_status: null,
          supply_risk_level: 'watch',
          supply_signal_headline: null,
          supply_signal_source_url: null,
          generated_at: '2026-08-20T10:04:44Z',
        },
      ],
      error: null,
    })
    mocks.createClient.mockResolvedValue(client)

    const result = await getCrossBorderFormularyCheck({
      destinationCountryIso2: 'DE',
      cannabinoidProfile: 'CBD 100mg/mL',
    })

    expect(result.state).toBe('loaded')
    expect(result.result?.portabilityVerdict).toBe('not-currently-available')
    expect(result.result?.matchedProductName).toBeNull()
  })

  it('surfaces a database error without throwing', async () => {
    const client = makeClient({ data: null, error: { message: 'permission denied for function' } })
    mocks.createClient.mockResolvedValue(client)

    const result = await getCrossBorderFormularyCheck({ destinationCountryIso2: 'FR', brandName: 'Example' })

    expect(result.state).toBe('error')
    expect(result.error).toBe('permission denied for function')
    expect(result.result).toBeNull()
  })

  it('trims and passes through the brand name when provided', async () => {
    const client = makeClient({ data: [], error: null })
    mocks.createClient.mockResolvedValue(client)

    await getCrossBorderFormularyCheck({ destinationCountryIso2: 'NL', brandName: '  Epidiolex  ' })

    expect(client.rpc).toHaveBeenCalledWith('clinical_cross_border_formulary_check', {
      p_destination_country_iso2: 'NL',
      p_brand_name: 'Epidiolex',
      p_cannabinoid_profile: null,
    })
  })
})
