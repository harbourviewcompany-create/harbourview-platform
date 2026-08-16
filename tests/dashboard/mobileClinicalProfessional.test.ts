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

  it('resolves Tier-1 countries without falling back to Canada', () => {
    expect(normalizeClinicalCountryIso2('de')).toBe('DE')
    expect(normalizeClinicalCountryIso2('Germany')).toBe('DE')
    expect(normalizeClinicalCountryIso2('uk')).toBe('GB')
    expect(getClinicalAuthoritiesForCountry('DE')).toHaveLength(4)
    expect(getClinicalAuthoritiesForCountry('AU')).toHaveLength(4)
    expect(getClinicalAuthoritiesForCountry('GB')).toHaveLength(4)
    expect(getClinicalAuthoritiesForCountry('DE').every(a => a.countryIso2 === 'DE')).toBe(true)
    expect(getClinicalAuthoritiesForCountry('DE').some(a => a.href.includes('canada.ca'))).toBe(false)
    expect(getClinicalAuthoritiesForCountry('XX')).toEqual([])
    expect(hasClinicalAuthorityCoverage('FR')).toBe(false)
    expect(hasClinicalAuthorityCoverage('CA')).toBe(true)
  })

  it('parses country from command href and labels jurisdictions', () => {
    expect(countryIso2FromCommandHref('/dashboard?country=DE&section=clinical')).toBe('DE')
    expect(countryIso2FromCommandHref('/dashboard?country=CA')).toBe('CA')
    expect(countryIso2FromCommandHref('/dashboard')).toBeNull()
    expect(clinicalJurisdictionLabel('DE')).toBe('Germany')
    expect(clinicalJurisdictionLabel(null)).toBe('Unknown jurisdiction')
  })

  it('states cannabinoid scope boundary in copy', () => {
    expect(CLINICAL_SCOPE_NOTICE.toLowerCase()).toContain('cannabinoid')
    expect(CLINICAL_SCOPE_NOTICE.toLowerCase()).toContain('not a general')
  })
})
