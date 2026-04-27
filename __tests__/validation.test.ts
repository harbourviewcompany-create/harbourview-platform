import { describe, it, expect } from 'vitest'
import {
  listingSubmitSchema,
  buyerRequestSubmitSchema,
  inquirySubmitSchema,
  listingStatusUpdateSchema,
  matchStatusUpdateSchema,
} from '../lib/marketplace/validation'

describe('listingSubmitSchema', () => {
  const valid = {
    category: 'cannabis-inventory',
    product_type: 'EU-GMP Bulk Flower',
    region: 'Germany',
    seller_type: 'Licensed Producer',
    legal_entity_name: 'Acme Cannabis GmbH',
    contact_name: 'Jane Smith',
    contact_email: 'jane@acme.com',
  }

  it('accepts a valid listing', () => {
    expect(listingSubmitSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects missing product_type', () => {
    const r = listingSubmitSchema.safeParse({ ...valid, product_type: '' })
    expect(r.success).toBe(false)
  })

  it('rejects invalid category', () => {
    const r = listingSubmitSchema.safeParse({ ...valid, category: 'illegal-drugs' })
    expect(r.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const r = listingSubmitSchema.safeParse({ ...valid, contact_email: 'notanemail' })
    expect(r.success).toBe(false)
  })

  it('rejects invalid region', () => {
    const r = listingSubmitSchema.safeParse({ ...valid, region: 'MadeUpLand' })
    expect(r.success).toBe(false)
  })

  it('accepts optional fields as empty strings', () => {
    const r = listingSubmitSchema.safeParse({ ...valid, phone: '', specs_summary: '' })
    expect(r.success).toBe(true)
  })

  it('rejects specs_summary over 1000 chars', () => {
    const r = listingSubmitSchema.safeParse({ ...valid, specs_summary: 'x'.repeat(1001) })
    expect(r.success).toBe(false)
  })
})

describe('buyerRequestSubmitSchema', () => {
  const valid = {
    product_type: 'EU-GMP oil',
    region_interest: 'Australia',
    buyer_type: 'Importer',
    legal_entity_name: 'Buyer Co',
    contact_name: 'John Doe',
    contact_email: 'john@buyer.com',
  }

  it('accepts valid buyer request', () => {
    expect(buyerRequestSubmitSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid buyer_type', () => {
    const r = buyerRequestSubmitSchema.safeParse({ ...valid, buyer_type: 'RandomType' })
    expect(r.success).toBe(false)
  })
})

describe('inquirySubmitSchema', () => {
  const valid = {
    inquirer_name: 'Alice',
    inquirer_email: 'alice@example.com',
    inquirer_type: 'Importer',
    message: 'I am interested in this listing.',
  }

  it('accepts valid inquiry', () => {
    expect(inquirySubmitSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects message under 10 chars', () => {
    const r = inquirySubmitSchema.safeParse({ ...valid, message: 'Short' })
    expect(r.success).toBe(false)
  })

  it('accepts with optional listing_id', () => {
    const r = inquirySubmitSchema.safeParse({ ...valid, listing_id: '550e8400-e29b-41d4-a716-446655440000' })
    expect(r.success).toBe(true)
  })

  it('rejects invalid listing_id (not uuid)', () => {
    const r = inquirySubmitSchema.safeParse({ ...valid, listing_id: 'not-a-uuid' })
    expect(r.success).toBe(false)
  })
})

describe('listingStatusUpdateSchema', () => {
  it('accepts approved', () => {
    expect(listingStatusUpdateSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
  it('accepts rejected with reason', () => {
    expect(listingStatusUpdateSchema.safeParse({ status: 'rejected', reason: 'Incomplete data' }).success).toBe(true)
  })
  it('rejects invalid status', () => {
    expect(listingStatusUpdateSchema.safeParse({ status: 'published' }).success).toBe(false)
  })
  it('does not allow pending_review as an update target', () => {
    // pending_review is initial state only — cannot be set via admin update
    expect(listingStatusUpdateSchema.safeParse({ status: 'pending_review' }).success).toBe(false)
  })
})

describe('matchStatusUpdateSchema', () => {
  const VALID_STATUSES = ['proposed', 'inquiry_received', 'disclosure_requested', 'disclosure_approved', 'introduced', 'closed_won', 'closed_lost']
  VALID_STATUSES.forEach((s) => {
    it(`accepts ${s}`, () => {
      expect(matchStatusUpdateSchema.safeParse({ status: s }).success).toBe(true)
    })
  })
  it('rejects unknown status', () => {
    expect(matchStatusUpdateSchema.safeParse({ status: 'completed' }).success).toBe(false)
  })
})
