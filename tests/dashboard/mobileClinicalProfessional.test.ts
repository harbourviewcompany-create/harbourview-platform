import { describe, expect, it } from 'vitest'
import {
  CANADA_CLINICAL_AUTHORITIES,
  CLINICAL_AUTHORITY_ABSENT_COPY,
  CLINICAL_SOURCE_STATE_COPY,
  clinicalAuthoritiesForJurisdiction,
  containsLegacyClinicalFramework,
  deriveClinicalSourceState,
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

  it('supports deterministic no-match, permission and error states for future source adapters', () => {
    expect(deriveClinicalSourceState({ noMatch: true })).toBe('no-match')
    expect(deriveClinicalSourceState({ permissionDenied: true })).toBe('permission')
    expect(deriveClinicalSourceState({ error: true })).toBe('error')
    expect(Object.keys(CLINICAL_SOURCE_STATE_COPY).sort()).toEqual(
      ['degraded', 'empty', 'error', 'loaded', 'no-match', 'permission', 'stale'].sort(),
    )
  })

  it('keeps every material federal card tied to a primary authority and verification date', () => {
    expect(CANADA_CLINICAL_AUTHORITIES).toHaveLength(4)
    for (const authority of CANADA_CLINICAL_AUTHORITIES) {
      expect(authority.jurisdiction).toBe('Canada')
      expect(authority.verifiedAt).toBe('2026-08-14')
      expect(authority.href).toMatch(/^https:\/\//)
      expect(authority.sourceName.length).toBeGreaterThan(10)
      expect(authority.evidenceStrength).toContain('not graded')
    }
  })

  it('never presents Canadian federal authority outside Canada', () => {
    expect(clinicalAuthoritiesForJurisdiction('Canada')).toEqual(CANADA_CLINICAL_AUTHORITIES)
    expect(clinicalAuthoritiesForJurisdiction('canada')).toEqual(CANADA_CLINICAL_AUTHORITIES)
    for (const jurisdiction of ['Germany', 'Australia', 'United States', 'Global', 'CA', '', null, undefined]) {
      expect(clinicalAuthoritiesForJurisdiction(jurisdiction)).toHaveLength(0)
    }
    expect(CLINICAL_AUTHORITY_ABSENT_COPY).toContain('does not substitute')
  })

  it('does not represent a structured interaction checker as implemented', () => {
    const safety = CANADA_CLINICAL_AUTHORITIES.find(item => item.id === 'safety-interactions')
    expect(safety?.label).toBe('Safety & interaction guidance')
    expect(safety?.purpose).toContain('guidance')
  })
})
