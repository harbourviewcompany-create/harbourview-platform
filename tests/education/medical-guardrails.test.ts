import { describe, expect, it } from 'vitest'
import { scanMedicalClaims } from '@/lib/guardrails/medicalClaims'

describe('medical guardrails', () => {
  it('detects prohibited medical claims', () => {
    const findings = scanMedicalClaims('This cure offers guaranteed relief and patient-specific dosing guidance.')
    expect(findings.length).toBeGreaterThan(0)
  })
})
