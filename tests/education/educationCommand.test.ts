import { describe, expect, it } from 'vitest'
import {
  educationEvidenceState,
  educationGoalForTrack,
  moduleMatchesRole,
  practiceKind,
} from '@/lib/education/command'

describe('Education Command contracts', () => {
  it('treats All roles as the complete published audience universe', () => {
    expect(moduleMatchesRole(['doctor_prescriber'], null)).toBe(true)
    expect(moduleMatchesRole(['exporter'], null)).toBe(true)
    expect(moduleMatchesRole(['general'], null)).toBe(true)
  })

  it('preserves role filtering and the distributor audience alias', () => {
    expect(moduleMatchesRole(['processor_extractor'], 'processor_extractor')).toBe(true)
    expect(moduleMatchesRole(['general'], 'processor_extractor')).toBe(true)
    expect(moduleMatchesRole(['doctor_prescriber'], 'processor_extractor')).toBe(false)
    expect(moduleMatchesRole(['wholesaler_distributor'], 'distributor_wholesaler')).toBe(true)
  })

  it('never upgrades conflicting, stale, or missing review metadata to current', () => {
    expect(educationEvidenceState(['verified_primary_source', 'conflicting_sources'])).toBe('conflicting')
    expect(educationEvidenceState(['verified_primary_source', 'stale_source'])).toBe('stale')
    expect(educationEvidenceState(['review_pending'])).toBe('review_required')
    expect(educationEvidenceState(['verified_primary_source'])).toBe('current')
    expect(educationEvidenceState(['VERIFIED_PRIMARY_SOURCE'])).toBe('current')
    expect(educationEvidenceState([null, undefined, ''])).toBe('unknown')
    expect(educationEvidenceState([])).toBe('unknown')
  })

  it('maps published tracks to operator goals without inventing a curriculum', () => {
    expect(educationGoalForTrack('export')).toBe('market_access')
    expect(educationGoalForTrack('gmp-quality')).toBe('quality')
    expect(educationGoalForTrack('clinical')).toBe('clinical')
    expect(educationGoalForTrack('regulatory-intelligence')).toBe('regulatory')
    expect(educationGoalForTrack('history')).toBe('learn')
  })

  it('only exposes practice when section headings explicitly identify practice content', () => {
    expect(practiceKind('Inspection scenario')).toBe('scenario')
    expect(practiceKind('Case study: border rejection')).toBe('scenario')
    expect(practiceKind('Readiness checklist')).toBe('checklist')
    expect(practiceKind('Knowledge assessment')).toBe('assessment')
    expect(practiceKind('Overview')).toBeNull()
  })
})
