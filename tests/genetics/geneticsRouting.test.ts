import { describe, expect, it } from 'vitest'
import { scoreGeneticsAccessRequest, canTriggerGeneticsIntroduction, type GeneticsAccessRequest } from '@/lib/introduction-routing/geneticsRouting'

const baseRequest: GeneticsAccessRequest = {
  intent: '',
  targetMarket: '',
  licenceStatus: '',
  hasClearUse: false,
  hasTimeline: false,
  hasScale: false,
  identityVerified: false,
  credibleCompany: false,
}

describe('scoreGeneticsAccessRequest', () => {
  it('scores a fully-empty request below the qualified band', () => {
    const result = scoreGeneticsAccessRequest(baseRequest)
    expect(result.band).not.toBe('qualified')
  })

  it('scores a fully-populated, verified request into the qualified band', () => {
    const result = scoreGeneticsAccessRequest({
      intent: 'commercial_introduction',
      targetMarket: 'Germany',
      licenceStatus: 'licensed',
      hasClearUse: true,
      hasTimeline: true,
      hasScale: true,
      identityVerified: true,
      credibleCompany: true,
    })
    expect(result.total).toBeGreaterThanOrEqual(70)
    expect(result.band).toBe('qualified')
  })

  it('is monotonic — adding a verifying signal never lowers the score', () => {
    const lower = scoreGeneticsAccessRequest(baseRequest)
    const higher = scoreGeneticsAccessRequest({ ...baseRequest, identityVerified: true })
    expect(higher.total).toBeGreaterThanOrEqual(lower.total)
  })

  it('penalizes missing licence status and missing identity verification in the risk component', () => {
    const noLicenceNoIdentity = scoreGeneticsAccessRequest(baseRequest)
    const withBoth = scoreGeneticsAccessRequest({ ...baseRequest, licenceStatus: 'licensed', identityVerified: true })
    // Both contribute via risk *and* licenceStatus also contributes via pathway,
    // so this just checks direction, not an exact delta.
    expect(withBoth.total).toBeGreaterThan(noLicenceNoIdentity.total)
  })
})

describe('canTriggerGeneticsIntroduction', () => {
  const approvedDrop = { geneticsHolderPermissionStatus: 'inquiry_routing_approved' } as any
  const notApprovedDrop = { geneticsHolderPermissionStatus: 'not_requested' } as any

  it('never triggers below score 70, regardless of drop permission', () => {
    expect(canTriggerGeneticsIntroduction(69, approvedDrop)).toBe(false)
  })

  it('never triggers if the holder has not approved inquiry routing, regardless of score', () => {
    expect(canTriggerGeneticsIntroduction(100, notApprovedDrop)).toBe(false)
  })

  it('triggers only when both the score gate and the holder-permission gate pass', () => {
    expect(canTriggerGeneticsIntroduction(70, approvedDrop)).toBe(true)
  })
})
