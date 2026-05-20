import { describe, expect, it } from 'vitest'
import { listingSubmissionSchema, quoteSubmissionSchema } from '@/lib/marketplace/intakeValidation'

describe('marketplace intake validation schemas', () => {
  it('rejects listing submissions with invalid email', () => {
    const parsed = listingSubmissionSchema.safeParse({
      name: 'Jane Doe',
      email: 'not-an-email',
      company: 'Harbourview',
      listingType: 'Service',
      title: 'Regulatory support',
      price: '',
      location: '',
      description: 'Support needed',
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(['email'])
    }
  })

  it('rejects listing submissions with invalid listing type', () => {
    const parsed = listingSubmissionSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Harbourview',
      listingType: 'Invalid Type',
      title: 'Regulatory support',
      price: '',
      location: '',
      description: 'Support needed',
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects quote submissions with missing required fields', () => {
    const parsed = quoteSubmissionSchema.safeParse({
      listingTitle: '',
      name: '',
      email: 'buyer@example.com',
      phone: '',
      company: '',
      buyerType: 'Brand',
      targetMarket: '',
      volume: '',
      timeline: 'ASAP',
      budget: '',
      supplierPreference: '',
      requirements: '',
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects quote submissions with oversized fields', () => {
    const parsed = quoteSubmissionSchema.safeParse({
      listingTitle: 'A'.repeat(181),
      name: 'Buyer',
      email: 'buyer@example.com',
      phone: '',
      company: 'Company',
      buyerType: 'Brand',
      targetMarket: 'CA',
      volume: '10 units',
      timeline: 'ASAP',
      budget: '',
      supplierPreference: '',
      requirements: '',
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.code === 'too_big')).toBe(true)
    }
  })
})
