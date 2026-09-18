/**
 * P2-5: Keep runtime forbidden public fields non-empty and include critical private keys.
 */
import { describe, it, expect } from 'vitest'
import {
  FORBIDDEN_PUBLIC_FIELD_NAMES,
  assertPublicSafe,
  findForbiddenPublicFieldNames,
} from '@/lib/intelligence-os/publicSafety'

const MUST_BLOCK = [
  'contactEmail',
  'contact_email',
  'privateNotes',
  'private_notes',
  'internalNotes',
  'internal_notes',
  'provenance',
  'sourceEvidence',
  'score',
  'quality_confidence',
]

describe('publicSafety forbidden list (audit P2-5)', () => {
  it('includes critical private field names', () => {
    const set = new Set(FORBIDDEN_PUBLIC_FIELD_NAMES as readonly string[])
    for (const key of MUST_BLOCK) {
      expect(set.has(key), `missing forbidden field: ${key}`).toBe(true)
    }
  })

  it('assertPublicSafe throws on contactEmail', () => {
    expect(() => assertPublicSafe({ id: '1', contactEmail: 'x@y.z' })).toThrow(/forbidden/i)
  })

  it('assertPublicSafe allows confidence_score', () => {
    expect(() => assertPublicSafe({ id: '1', confidence_score: 80, title: 'ok' })).not.toThrow()
  })

  it('findForbiddenPublicFieldNames is recursive', () => {
    const found = findForbiddenPublicFieldNames({
      outer: { nested: { private_notes: 'secret' } },
    })
    expect(found).toContain('private_notes')
  })
})
