import { describe, expect, it } from 'vitest'
import { parseMarketCode, resolveMarketCountryIso2, resolveMarketRegionCode } from '@/lib/market/marketCode'
import {
  getClinicalAuthoritiesForCountry,
  countryIso2FromCommandHref,
  clinicalJurisdictionLabel,
} from '@/components/dashboard/mobile-command/clinicalCommandContract'

describe('jurisdiction resolution — no silent Canada (or other) fallback', () => {
  it('resolves subdivisions to their parent country, not Canada', () => {
    expect(resolveMarketCountryIso2('US-KS')).toBe('US')
    expect(resolveMarketCountryIso2('US-CA')).toBe('US')
    expect(resolveMarketRegionCode('US-KS')).toBe('US-KS')
    expect(resolveMarketCountryIso2('CA-ON')).toBe('CA')
    expect(resolveMarketCountryIso2('DE')).toBe('DE')
    expect(resolveMarketCountryIso2('BR')).toBe('BR')
  })

  it('returns null for missing or unrecognized markets instead of inventing a country', () => {
    expect(resolveMarketCountryIso2(null)).toBeNull()
    expect(resolveMarketCountryIso2(undefined)).toBeNull()
    expect(resolveMarketCountryIso2('')).toBeNull()
    expect(resolveMarketCountryIso2('not-a-country')).toBeNull()
    expect(parseMarketCode('XX-ZZ')).toBeNull()
  })

  it('does not attach foreign authorities when country is absent', () => {
    expect(countryIso2FromCommandHref('/dashboard?section=clinical')).toBeNull()
    expect(countryIso2FromCommandHref('/dashboard?country=US-KS&section=clinical')).toBe('US')
    expect(getClinicalAuthoritiesForCountry(null)).toEqual([])
    expect(getClinicalAuthoritiesForCountry(countryIso2FromCommandHref('/dashboard'))).toEqual([])
    expect(clinicalJurisdictionLabel(null)).toBe('Select jurisdiction')
  })

  it('keeps regional authority packs isolated', () => {
    const de = getClinicalAuthoritiesForCountry('DE')
    const es = getClinicalAuthoritiesForCountry('ES')
    const co = getClinicalAuthoritiesForCountry('CO')
    expect(de.every(a => a.countryIso2 === 'DE')).toBe(true)
    expect(es.every(a => a.countryIso2 === 'ES')).toBe(true)
    expect(co.every(a => a.countryIso2 === 'CO')).toBe(true)
    expect(de.some(a => /canada\.ca/i.test(a.href))).toBe(false)
    expect(es.some(a => /bfarm\.de/i.test(a.href))).toBe(false)
  })
})
