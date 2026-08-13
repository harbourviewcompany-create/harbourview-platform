import { describe, expect, it } from 'vitest'

import {
  parseMarketCode,
  resolveMarketCountryIso2,
  resolveMarketRegionCode,
} from '@/lib/market/marketCode'
import { ALL_COUNTRIES } from '@/lib/dashboard/countries'

/**
 * Guards the defect reported 2026-08-12: selecting a US state or a Canadian
 * province on the globe landed the operator in Canada's Command Centre.
 *
 * A subdivision narrows the country; it must never replace or exclude it.
 */
describe('market code resolution', () => {
  it('resolves a US state to the United States, not to a fallback country', () => {
    expect(resolveMarketCountryIso2('US-KS')).toBe('US')
    expect(resolveMarketRegionCode('US-KS')).toBe('US-KS')

    // The reported symptom, stated directly.
    expect(resolveMarketCountryIso2('US-KS')).not.toBe('CA')
  })

  it('resolves a Canadian province to Canada while keeping the province', () => {
    // Ontario previously "worked" only by accident — the code failed to parse
    // and the Canada fallback happened to be the right country, with the
    // province silently discarded.
    expect(resolveMarketCountryIso2('CA-ON')).toBe('CA')
    expect(resolveMarketRegionCode('CA-ON')).toBe('CA-ON')
  })

  it('passes plain country codes through with no region', () => {
    expect(parseMarketCode('US')).toEqual({ countryIso2: 'US', regionCode: null })
    expect(parseMarketCode('ca')).toEqual({ countryIso2: 'CA', regionCode: null })
  })

  it('returns null for unrecognised input instead of guessing a country', () => {
    // The bug was a silent default. Unknown input must be reported as unknown
    // so callers decide, rather than being quietly resolved to somewhere.
    for (const value of ['', '   ', 'XX-YY', 'kansas', 'U', 'USA', null, undefined, 42, {}]) {
      expect(resolveMarketCountryIso2(value)).toBeNull()
    }
  })

  it('normalises case and surrounding whitespace', () => {
    expect(resolveMarketCountryIso2(' us-ks ')).toBe('US')
    expect(resolveMarketRegionCode(' ca-on ')).toBe('CA-ON')
  })

  it('every resolved country exists in the dashboard country list', () => {
    // Resolution is worthless if the dashboard cannot then find the country —
    // that lookup failing is what triggered the Canada fallback originally.
    for (const code of ['US-KS', 'CA-ON', 'US-CA', 'CA-BC', 'US', 'CA']) {
      const iso2 = resolveMarketCountryIso2(code)
      expect(iso2, `${code} did not resolve`).not.toBeNull()
      expect(
        ALL_COUNTRIES.some(country => country.iso2 === iso2),
        `${code} resolved to ${iso2}, which is not in ALL_COUNTRIES`,
      ).toBe(true)
    }
  })
})
