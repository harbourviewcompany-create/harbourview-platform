import { describe, it, expect } from 'vitest'
import {
  redactListing,
  redactBuyerRequest,
  redactSupplierProfile,
  assertNoPrivateFields,
  LISTING_PRIVATE_FIELDS,
  BUYER_REQUEST_PRIVATE_FIELDS,
  SUPPLIER_PRIVATE_FIELDS,
} from '../lib/marketplace/redact'
import type { ListingRow, BuyerRequestRow, SupplierProfileRow } from '../lib/supabase/types'

const baseListing: ListingRow = {
  id: 'test-id',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  status: 'approved',
  category: 'cannabis-inventory',
  product_type: 'EU-GMP Bulk Flower',
  region: 'Germany',
  price_range: '$10,000 – $100,000',
  specs_summary: 'T20/C1 certified, 10kg minimum',
  seller_type: 'Licensed Producer',
  // Private fields
  legal_entity_name: 'Secret Corp GmbH',
  contact_name: 'Private Person',
  contact_email: 'private@secret.com',
  contact_phone: '+49 000 000',
  private_notes: 'Very sensitive notes',
  internal_score: 85,
  archived_at: null,
  superseded_by: null,
}

describe('redactListing', () => {
  it('removes all private fields', () => {
    const result = redactListing(baseListing) as Record<string, unknown>
    for (const field of LISTING_PRIVATE_FIELDS) {
      expect(result).not.toHaveProperty(field)
    }
  })

  it('retains public fields', () => {
    const result = redactListing(baseListing)
    expect(result.id).toBe('test-id')
    expect(result.category).toBe('cannabis-inventory')
    expect(result.product_type).toBe('EU-GMP Bulk Flower')
    expect(result.region).toBe('Germany')
    expect(result.price_range).toBe('$10,000 – $100,000')
    expect(result.specs_summary).toBe('T20/C1 certified, 10kg minimum')
    expect(result.seller_type).toBe('Licensed Producer')
    expect(result.status).toBe('approved')
  })

  it('does not mutate the original object', () => {
    redactListing(baseListing)
    expect(baseListing.legal_entity_name).toBe('Secret Corp GmbH')
    expect(baseListing.contact_email).toBe('private@secret.com')
  })
})

describe('redactBuyerRequest', () => {
  const base: BuyerRequestRow = {
    id: 'br-id',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    status: 'approved',
    product_type: 'EU-GMP oil',
    region_interest: 'Australia',
    quantity_range: '50–100kg',
    specs_requirements: 'THC <0.2%',
    buyer_type: 'Importer',
    legal_entity_name: 'Private Buyer Ltd',
    contact_name: 'Private',
    contact_email: 'private@buyer.com',
    contact_phone: null,
    private_notes: null,
    archived_at: null,
  }

  it('removes all private fields', () => {
    const result = redactBuyerRequest(base) as Record<string, unknown>
    for (const field of BUYER_REQUEST_PRIVATE_FIELDS) {
      expect(result).not.toHaveProperty(field)
    }
  })

  it('retains public fields', () => {
    const result = redactBuyerRequest(base)
    expect(result.id).toBe('br-id')
    expect(result.product_type).toBe('EU-GMP oil')
    expect(result.buyer_type).toBe('Importer')
  })
})

describe('assertNoPrivateFields', () => {
  it('does not throw when no private fields present', () => {
    expect(() =>
      assertNoPrivateFields({ id: 'x', category: 'cannabis-inventory' }, LISTING_PRIVATE_FIELDS)
    ).not.toThrow()
  })

  it('throws when a private field is present', () => {
    expect(() =>
      assertNoPrivateFields(
        { id: 'x', contact_email: 'secret@example.com' },
        LISTING_PRIVATE_FIELDS
      )
    ).toThrow('contact_email')
  })

  it('throws for internal_score leakage', () => {
    expect(() =>
      assertNoPrivateFields({ id: 'x', internal_score: 90 }, LISTING_PRIVATE_FIELDS)
    ).toThrow('internal_score')
  })
})
