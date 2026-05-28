import { describe, expect, it } from 'vitest'
import {
  FORBIDDEN_PUBLIC_LISTING_KEYS,
  PUBLIC_EQUIPMENT_DETAIL_DTO_KEYS,
  PUBLIC_LISTING_DTO_KEYS,
  PUBLIC_SUPPLY_DETAIL_DTO_KEYS,
  assertPublicListingDtoNoForbiddenKeys,
  toPublicListingDto,
} from '@/lib/marketplace/unifiedListings'

const supplyListingId = '11111111-1111-4111-8111-111111111111'
const equipmentListingId = '22222222-2222-4222-8222-222222222222'

function supplyListing(overrides: Record<string, unknown> = {}) {
  return {
    id: supplyListingId,
    title: 'Bulk Packaging Supply',
    slug: 'bulk-packaging-supply',
    listing_type: 'supply',
    category: 'Packaging',
    subcategory: 'Consumables',
    status: 'published',
    visibility: 'public',
    summary: 'Public-safe packaging supply summary.',
    description: 'Private description should not be projected to the public DTO.',
    location_country: 'Canada',
    location_region: 'Ontario',
    published_at: '2026-05-28T00:00:00.000Z',
    source_url: 'https://example.invalid/private-source',
    internal_review_notes: 'Internal note that must not project.',
    ...overrides,
  }
}

function supplyDetails(overrides: Record<string, unknown> = {}) {
  return {
    listing_id: supplyListingId,
    product_form: 'Jar',
    material: 'Glass',
    minimum_order_quantity: '5,000 units',
    pack_size: 'Case',
    origin_country: 'Canada',
    certifications: ['Child-resistant claim requires buyer verification'],
    lead_time: 'Quote dependent',
    supplier_email: 'private@example.invalid',
    ...overrides,
  }
}

function equipmentListing(overrides: Record<string, unknown> = {}) {
  return {
    id: equipmentListingId,
    title: 'Used Extraction Chiller',
    slug: 'used-extraction-chiller',
    listing_type: 'equipment',
    category: 'Extraction Support Equipment',
    subcategory: 'Chillers',
    status: 'published',
    visibility: 'public',
    summary: 'Public-safe equipment summary.',
    description: 'Private equipment description should not be projected.',
    location_country: 'United States',
    location_region: 'Michigan',
    published_at: '2026-05-28T00:00:00.000Z',
    sourceName: 'Private source name',
    provenanceSummary: 'Private provenance.',
    ...overrides,
  }
}

function equipmentDetails(overrides: Record<string, unknown> = {}) {
  return {
    listing_id: equipmentListingId,
    manufacturer: 'ColdTech',
    model: 'CT-100',
    year: 2021,
    condition: 'Used',
    hours_used: 1200,
    capacity: '10 ton',
    voltage: '480V',
    dimensions: 'Private warehouse dimensions should not project.',
    asset_location: 'North America',
    seller_contact: 'private@example.invalid',
    ...overrides,
  }
}

function expectOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  expect(Object.keys(value).sort()).toEqual([...keys].sort())
}

describe('unified marketplace listings DTO boundary', () => {
  it('projects supply listings through a public allowlist only', () => {
    const dto = toPublicListingDto({ listing: supplyListing(), supplyDetails: supplyDetails() })

    expectOnlyKeys(dto, PUBLIC_LISTING_DTO_KEYS)
    expect(dto).toMatchObject({
      id: supplyListingId,
      slug: 'bulk-packaging-supply',
      title: 'Bulk Packaging Supply',
      listingType: 'supply',
      category: 'Packaging',
      subcategory: 'Consumables',
      summary: 'Public-safe packaging supply summary.',
      locationCountry: 'Canada',
      locationRegion: 'Ontario',
      publishedAt: '2026-05-28T00:00:00.000Z',
    })
    expectOnlyKeys(dto.details as Record<string, unknown>, PUBLIC_SUPPLY_DETAIL_DTO_KEYS)
    expect(JSON.stringify(dto)).not.toContain('private-source')
    expect(JSON.stringify(dto)).not.toContain('Internal note')
    expect(JSON.stringify(dto)).not.toContain('supplier_email')
  })

  it('projects equipment listings through a public allowlist only', () => {
    const dto = toPublicListingDto({ listing: equipmentListing(), equipmentDetails: equipmentDetails() })

    expectOnlyKeys(dto, PUBLIC_LISTING_DTO_KEYS)
    expect(dto.listingType).toBe('equipment')
    expectOnlyKeys(dto.details as Record<string, unknown>, PUBLIC_EQUIPMENT_DETAIL_DTO_KEYS)
    expect(dto.details).toMatchObject({
      manufacturer: 'ColdTech',
      model: 'CT-100',
      year: 2021,
      condition: 'Used',
      capacity: '10 ton',
      voltage: '480V',
      assetLocation: 'North America',
    })
    expect(JSON.stringify(dto)).not.toContain('Private source name')
    expect(JSON.stringify(dto)).not.toContain('Private provenance')
    expect(JSON.stringify(dto)).not.toContain('seller_contact')
    expect(JSON.stringify(dto)).not.toContain('dimensions')
  })

  it('rejects unsupported listing_type values instead of silently creating a third schema path', () => {
    expect(() =>
      toPublicListingDto({
        listing: supplyListing({ listing_type: 'service' }),
        supplyDetails: supplyDetails(),
      }),
    ).toThrow()
  })

  it('rejects detail rows attached to the wrong canonical listing type', () => {
    expect(() =>
      toPublicListingDto({
        listing: supplyListing(),
        equipmentDetails: equipmentDetails({ listing_id: supplyListingId }),
      }),
    ).toThrow('Supply listings must not project equipment detail rows.')

    expect(() =>
      toPublicListingDto({
        listing: equipmentListing(),
        supplyDetails: supplyDetails({ listing_id: equipmentListingId }),
      }),
    ).toThrow('Equipment listings must not project supply detail rows.')
  })

  it('rejects public DTOs containing forbidden private keys at any depth', () => {
    for (const key of FORBIDDEN_PUBLIC_LISTING_KEYS) {
      expect(() => assertPublicListingDtoNoForbiddenKeys({ nested: { [key]: 'private' } })).toThrow(
        `Public listing DTO includes forbidden key: ${key}`,
      )
    }
  })
})
