import { describe, expect, it } from 'vitest'
import { COUNTRIES, getCountryByIso, getCountryCenter } from '@/data/globe/geography-registry'

describe('ISO-3166 geography registry', () => {
  it('contains the complete 249-entry ISO-3166-1 identity set', () => {
    expect(COUNTRIES).toHaveLength(249)
    expect(new Set(COUNTRIES.map((country) => country.iso2)).size).toBe(249)
    expect(new Set(COUNTRIES.map((country) => country.iso3)).size).toBe(249)
  })

  it('keeps alpha-2 and alpha-3 identifiers structurally distinct', () => {
    for (const country of COUNTRIES) {
      expect(country.iso2).toMatch(/^[A-Z]{2}$/)
      expect(country.iso3).toMatch(/^[A-Z]{3}$/)
      expect(country.iso2).not.toBe(country.iso3)
      expect(country.name).toBeTruthy()
    }
  })

  it('resolves representative ISO-3166 identifiers in both directions', () => {
    expect(getCountryByIso('CA')?.iso3).toBe('CAN')
    expect(getCountryByIso('CAN')?.iso2).toBe('CA')
    expect(getCountryByIso('deu')?.iso2).toBe('DE')
    expect(getCountryByIso('not-a-country')).toBeUndefined()
  })

  it('does not carry regulatory classifications in geography records', () => {
    for (const country of COUNTRIES) {
      expect(country).not.toHaveProperty('cannabisTier')
      expect(country).not.toHaveProperty('hempLegal')
      expect(country).not.toHaveProperty('localIntelSummary')
      expect(country.geographyStatus).toBe('unknown')
    }
  })

  it('uses null for unknown coordinates rather than [0, 0]', () => {
    expect(getCountryCenter('CA')).toBeNull()
    expect(getCountryCenter('ZZ')).toBeNull()
    for (const country of COUNTRIES) {
      expect(country.center).not.toEqual([0, 0])
    }
  })
})
