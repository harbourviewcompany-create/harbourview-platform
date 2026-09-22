import { describe, expect, it } from 'vitest'
import {
  canSetCommercialOutcome,
  isCommercialOutcome,
  requiresCommercialOutcome,
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


describe('closed stage outcome policy', () => {
  it('documents that closed must carry a commercial outcome', () => {
    // Server action applyInquiryWorkflowUpdate rejects closed without outcome.
    // Helper stays permissive for stage eligibility; enforcement is in the action.
    expect(canSetCommercialOutcome('closed')).toBe(true)
    expect(isCommercialOutcome('won')).toBe(true)
  })
})

describe('requiresCommercialOutcome', () => {
  it('allows non-closed without outcome', () => {
    expect(requiresCommercialOutcome('reviewing', null, null).ok).toBe(true)
  })

  it('rejects closed without outcome or short reason', () => {
    expect(requiresCommercialOutcome('closed', null, null).ok).toBe(false)
    expect(requiresCommercialOutcome('closed', 'won', 'x').ok).toBe(false)
    expect(requiresCommercialOutcome('closed', 'won', 'Deal signed').ok).toBe(true)
  })
})
