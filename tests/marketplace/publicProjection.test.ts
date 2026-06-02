import { describe, expect, it } from 'vitest'
import { toPublicMarketplaceListing } from '@/lib/marketplace/publicProjection'
import type { PrivateMarketplaceListing } from '@/lib/marketplace/marketplaceTypes'

const privateListing: PrivateMarketplaceListing = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'used-extraction-pump',
  title: 'Used extraction pump package',
  description: 'Operator-safe public description.',
  public_summary: 'Public-safe used equipment summary.',
  summary: 'Internal summary with private context.',
  category: 'used_surplus',
  marketplace_section: 'used_surplus',
  product_type: 'used_surplus_equipment',
  region: 'Ontario',
  condition: 'Used - good',
  location_country: 'Canada',
  location_region: 'Ontario',
  price_amount: 12000,
  price_currency: 'CAD',
  price_display: 'Request qualification',
  seller_type: 'controlled_review',
  is_featured: false,
  high_level_specs: { equipment_class: 'pump', internal_notes: 'never public', source_url: 'private source link' },
  private_specs: { serial_number: 'private' },
  source_url: 'private source link',
  source_name: 'Private source',
  seller_contact_private: 'private seller contact',
  seller_url_private: 'private seller link',
  seller_name_private: 'Private Seller LLC',
  evidence_summary_private: 'Private evidence text',
  internal_notes: 'operator note',
  confidence_score: 88,
  commercial_relevance_score: 91,
  compliance_risk_score: 40,
  next_operator_action: 'Call seller',
  created_at: '2026-06-01T00:00:00.000Z',
}

describe('marketplace public projection', () => {
  it('returns only public-safe fields', () => {
    const dto = toPublicMarketplaceListing(privateListing)
    const body = JSON.stringify(dto)
    expect(dto.description).toBe('Public-safe used equipment summary.')
    expect(body).not.toContain('private seller contact')
    expect(body).not.toContain('Private Seller LLC')
    expect(body).not.toContain('Private evidence text')
    expect(body).not.toContain('operator note')
    expect(body).not.toContain('private source link')
    expect(Object.keys(dto.high_level_specs)).toEqual(['equipment_class'])
  })
})
