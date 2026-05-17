import { describe, expect, it } from 'vitest'
import { hasPrivateReviewFields, toNetworkPublicProjectionDTO } from '@/lib/network/publicProjection'

describe('network public projection leakage boundary', () => {
  it('does not expose private review fields in public DTO projections', () => {
    const dto = toNetworkPublicProjectionDTO({
      id: 'projection-1',
      review_item_id: 'review-1',
      object_type: 'country',
      slug: 'canada',
      name: 'Canada',
      public_summary: 'Public-safe summary',
      country_label: 'Canada',
      category_label: 'Country pathway',
      published_state: 'published',
      published_at: new Date().toISOString(),
      published_by: null,
      is_active: true,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    expect('private_analyst_notes' in dto).toBe(false)
    expect('title_internal' in dto).toBe(false)
    expect(hasPrivateReviewFields(dto)).toBe(false)
  })
})
