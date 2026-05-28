import { describe, expect, it } from 'vitest'
import { scanMedicalClaims } from '@/lib/guardrails/medical-claims'

describe('medical claim scanner', () => {
  it('blocks prohibited claims', () => {
    const result = scanMedicalClaims('This cure is guaranteed and you should take 5mg dose daily')
    expect(result.blocked).toBe(true)
    expect(result.hits.length).toBeGreaterThan(0)
  })
})
