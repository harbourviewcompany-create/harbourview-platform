import { describe, expect, it } from 'vitest'
import { scanMedicalClaims } from '@/lib/guardrails/medical-claims'

describe('medical claim guardrails', () => {
  it('blocks prohibited claim language', () => {
    const result = scanMedicalClaims('This treatment cures conditions with guaranteed efficacy and dosing guidance.')
    expect(result.blocked).toBe(true)
    expect(result.escalation).toBe('clinical-review')
  })
})
