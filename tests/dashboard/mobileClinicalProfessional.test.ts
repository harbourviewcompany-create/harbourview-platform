import { describe, expect, it } from 'vitest'
import {
  CANADA_CLINICAL_AUTHORITIES,
  CLINICAL_SOURCE_STATE_COPY,
  CLINICAL_SCOPE_NOTICE,
  clinicalJurisdictionLabel,
  containsLegacyClinicalFramework,
  countryIso2FromCommandHref,
  deriveClinicalSourceState,
  getClinicalAuthoritiesForCountry,
  hasClinicalAuthorityCoverage,
  listClinicalAuthorityCountries,
  normalizeClinicalCountryIso2,
  safeClinicalBriefing,
} from '@/components/dashboard/mobile-command/clinicalCommandContract'

describe('mobile professional clinical command contract', () => {
  it('suppresses stale ACMPR-era briefing copy', () => {
    const stale = 'Patients register under the ACMPR framework.'
    expect(containsLegacyClinicalFramework(stale)).toBe(true)
    expect(safeClinicalBriefing(stale)).toBeNull()
    expect(deriveClinicalSourceState({ patientAccess: stale })).toBe('stale')
  })

  it('derives loaded, empty and degraded states without inventing missing fields', () => {
    const loaded = {
      programStatus: 'Medical access available',
      medicalStatus: 'Medical legal',
      patientAccess: 'Reviewed patient pathway',
      physicianAccess: 'Reviewed professional pathway',
    }
    expect(deriveClinicalSourceState(loaded)).toBe('loaded')
    expect(deriveClinicalSourceState({})).toBe('empty')
    expect(deriveClinicalSourceState({ medicalStatus: 'Medical legal' })).toBe('degraded')
  })

  it('supports deterministic no-match, permission, error and limited-coverage states', () => {
    expect(deriveClinicalSourceState({ noMatch: true })).toBe('no-match')
    expect(deriveClinicalSourceState({ permissionDenied: true })).toBe('permission')
    expect(deriveClinicalSourceState({ error: true })).toBe('error')
    expect(deriveClinicalSourceState({ limitedAuthorityCoverage: true })).toBe('limited-coverage')
    expect(Object.keys(CLINICAL_SOURCE_STATE_COPY).sort()).toEqual(
      ['degraded', 'empty', 'error', 'limited-coverage', 'loaded', 'no-match', 'permission', 'stale'].sort(),
    )
  })

  it('keeps every material Canadian federal card tied to a primary authority and verification date', () => {
    expect(CANADA_CLINICAL_AUTHORITIES).toHaveLength(4)
    for (const authority of CANADA_CLINICAL_AUTHORITIES) {
      expect(authority.jurisdiction).toBe('Canada')
      expect(authority.countryIso2).toBe('CA')
      expect(authority.verifiedAt).toBe('2026-08-14')
      expect(authority.href).toMatch(/^https:\/\//)
      expect(authority.sourceName.length).toBeGreaterThan(10)
      expect(authority.evidenceStrength).toContain('not graded')
    }
  })

  it('does not represent a structured interaction checker as implemented', () => {
    const safety = CANADA_CLINICAL_AUTHORITIES.find(item => item.id === 'safety-interactions')
    expect(safety?.label).toBe('Safety & interaction guidance')
    expect(safety?.purpose).toContain('guidance')
  })

  it('covers major global medical-cannabis markets without Canada fallback', () => {
    const countries = listClinicalAuthorityCountries()
    expect(countries.length).toBeGreaterThanOrEqual(30)
    for (const code of ['CA', 'US', 'DE', 'GB', 'AU', 'FR', 'NL', 'IL', 'BR', 'NZ', 'ZA', 'TH', 'IT', 'PL', 'CH']) {
      expect(hasClinicalAuthorityCoverage(code)).toBe(true)
      const authorities = getClinicalAuthoritiesForCountry(code)
      expect(authorities.length).toBe(4)
      expect(authorities.every(a => a.countryIso2 === code)).toBe(true)
      if (code !== 'CA') {
        expect(authorities.some(a => /canada\.ca|justice\.gc\.ca/i.test(a.href))).toBe(false)
      }
    }
    expect(hasClinicalAuthorityCoverage('XX')).toBe(false)
    expect(getClinicalAuthoritiesForCountry('XX')).toEqual([])
  })

  it('parses country from command href and labels jurisdictions', () => {
    expect(countryIso2FromCommandHref('/dashboard?country=DE&section=clinical')).toBe('DE')
    expect(countryIso2FromCommandHref('/dashboard?country=BR')).toBe('BR')
    expect(countryIso2FromCommandHref('/dashboard?country=IL')).toBe('IL')
    expect(countryIso2FromCommandHref('/dashboard')).toBeNull()
    expect(clinicalJurisdictionLabel('BR')).toBe('Brazil')
    expect(clinicalJurisdictionLabel('IL')).toBe('Israel')
    expect(normalizeClinicalCountryIso2('New Zealand')).toBe('NZ')
  })

  it('states cannabinoid scope boundary in copy', () => {
    expect(CLINICAL_SCOPE_NOTICE.toLowerCase()).toContain('cannabinoid')
    expect(CLINICAL_SCOPE_NOTICE.toLowerCase()).toContain('not a general')
  })
})
