import { describe, expect, it } from 'vitest'
import {
  canSetCommercialOutcome,
  isCommercialOutcome,
  COMMERCIAL_OUTCOMES,
} from '@/lib/marketplace/inquiryWorkflow'

describe('commercial outcome helpers', () => {
  it('accepts won/lost/withdrawn only', () => {
    expect(isCommercialOutcome('won')).toBe(true)
    expect(isCommercialOutcome('lost')).toBe(true)
    expect(isCommercialOutcome('withdrawn')).toBe(true)
    expect(isCommercialOutcome('closed')).toBe(false)
    expect(COMMERCIAL_OUTCOMES).toEqual(['won', 'lost', 'withdrawn'])
  })

  it('allows outcome on terminal/near-terminal stages', () => {
    expect(canSetCommercialOutcome('qualified')).toBe(true)
    expect(canSetCommercialOutcome('not_fit')).toBe(true)
    expect(canSetCommercialOutcome('closed')).toBe(true)
    expect(canSetCommercialOutcome('received')).toBe(false)
  })
})
