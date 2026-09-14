/** P2-5: Keep critical private fields forbidden from public projections. */
import { describe, it, expect } from 'vitest'
import { FORBIDDEN_PUBLIC_FIELD_NAMES, assertPublicSafe, findForbiddenPublicFieldNames } from '@/lib/intelligence-os/publicSafety'

const MUST_BLOCK = ['contactEmail', 'contact_email', 'privateNotes', 'private_notes', 'internalNotes', 'internal_notes', 'provenance', 'sourceEvidence', 'score', 'quality_confidence']

describe('publicSafety forbidden list (audit P2-5)', () => {
  it('includes critical private field names', () => {
    const set = new Set(FORBIDDEN_PUBLIC_FIELD_NAMES as readonly string[])
    for (const key of MUST_BLOCK) expect(set.has(key), `missing forbidden field: ${key}`).toBe(true)
  })
  it('rejects contactEmail', () => {
    expect(() => assertPublicSafe({ id: '1', contactEmail: 'x@y.z' })).toThrow(/forbidden/i)
  })
  it('allows confidence_score', () => {
    expect(() => assertPublicSafe({ id: '1', confidence_score: 80, title: 'ok' })).not.toThrow()
  })
  it('finds forbidden fields recursively', () => {
    expect(findForbiddenPublicFieldNames({ outer: { nested: { private_notes: 'secret' } } })).toContain('private_notes')
  })
})
