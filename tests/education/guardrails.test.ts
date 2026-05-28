import { describe, expect, it } from 'vitest'
import { scanMedicalClaims } from '@/lib/education/medicalGuardrails'

describe('medical guardrails', () => {
  it('blocks prohibited treatment language', () => {
    const result = scanMedicalClaims('This protocol cures disease and includes dosing guidance.')
    expect(result.blocked).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('allows general education copy', () => {
    const result = scanMedicalClaims('This educational article explains historical policy frameworks.')
    expect(result.blocked).toBe(false)
  })
})
