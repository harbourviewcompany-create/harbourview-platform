import { describe, it, expect } from 'vitest'
import {
  canTransitionListing,
  canTransitionBuyerRequest,
  canTransitionMatch,
  assertListingTransition,
  assertMatchTransition,
  LISTING_TRANSITIONS,
  BUYER_REQUEST_TRANSITIONS,
  MATCH_TRANSITIONS,
} from '../lib/marketplace/status'

describe('listing transitions', () => {
  it('allows pending_review → approved', () => {
    expect(canTransitionListing('pending_review', 'approved')).toBe(true)
  })
  it('allows pending_review → rejected', () => {
    expect(canTransitionListing('pending_review', 'rejected')).toBe(true)
  })
  it('allows approved → archived', () => {
    expect(canTransitionListing('approved', 'archived')).toBe(true)
  })
  it('allows approved → superseded', () => {
    expect(canTransitionListing('approved', 'superseded')).toBe(true)
  })
  it('allows rejected → pending_review (re-review)', () => {
    expect(canTransitionListing('rejected', 'pending_review')).toBe(true)
  })
  it('blocks archived → approved (no resurrection)', () => {
    expect(canTransitionListing('archived', 'approved')).toBe(false)
  })
  it('blocks pending_review → superseded (invalid skip)', () => {
    expect(canTransitionListing('pending_review', 'superseded')).toBe(false)
  })
  it('blocks superseded → anything', () => {
    const targets = ['approved', 'rejected', 'archived', 'pending_review'] as const
    targets.forEach((t) => expect(canTransitionListing('superseded', t)).toBe(false))
  })

  it('assertListingTransition throws on invalid transition', () => {
    expect(() => assertListingTransition('archived', 'approved')).toThrow()
  })
  it('assertListingTransition does not throw on valid transition', () => {
    expect(() => assertListingTransition('pending_review', 'approved')).not.toThrow()
  })
})

describe('buyer request transitions', () => {
  it('allows pending_review → approved', () => {
    expect(canTransitionBuyerRequest('pending_review', 'approved')).toBe(true)
  })
  it('allows approved → archived', () => {
    expect(canTransitionBuyerRequest('approved', 'archived')).toBe(true)
  })
  it('blocks archived → approved', () => {
    expect(canTransitionBuyerRequest('archived', 'approved')).toBe(false)
  })
})

describe('match transitions', () => {
  it('allows linear forward path', () => {
    expect(canTransitionMatch('proposed', 'inquiry_received')).toBe(true)
    expect(canTransitionMatch('inquiry_received', 'disclosure_requested')).toBe(true)
    expect(canTransitionMatch('disclosure_requested', 'disclosure_approved')).toBe(true)
    expect(canTransitionMatch('disclosure_approved', 'introduced')).toBe(true)
    expect(canTransitionMatch('introduced', 'closed_won')).toBe(true)
    expect(canTransitionMatch('introduced', 'closed_lost')).toBe(true)
  })
  it('allows closed_lost from any active state', () => {
    const activeStates = ['proposed', 'inquiry_received', 'disclosure_requested', 'disclosure_approved', 'introduced'] as const
    activeStates.forEach((s) => expect(canTransitionMatch(s, 'closed_lost')).toBe(true))
  })
  it('blocks closed_won → anything', () => {
    expect(canTransitionMatch('closed_won', 'introduced')).toBe(false)
    expect(canTransitionMatch('closed_won', 'closed_lost')).toBe(false)
  })
  it('blocks skipping steps', () => {
    expect(canTransitionMatch('proposed', 'introduced')).toBe(false)
    expect(canTransitionMatch('proposed', 'disclosure_approved')).toBe(false)
  })
  it('assertMatchTransition throws on invalid', () => {
    expect(() => assertMatchTransition('closed_won', 'introduced')).toThrow()
  })
})

describe('transition table completeness', () => {
  it('all listing statuses have entries in LISTING_TRANSITIONS', () => {
    const statuses = ['pending_review', 'approved', 'rejected', 'archived', 'superseded']
    statuses.forEach((s) => expect(LISTING_TRANSITIONS).toHaveProperty(s))
  })
  it('all match statuses have entries in MATCH_TRANSITIONS', () => {
    const statuses = ['proposed', 'inquiry_received', 'disclosure_requested', 'disclosure_approved', 'introduced', 'closed_won', 'closed_lost']
    statuses.forEach((s) => expect(MATCH_TRANSITIONS).toHaveProperty(s))
  })
})
