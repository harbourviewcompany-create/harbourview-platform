import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { PublicListing } from '@/lib/server/listingsQuery'
import { marketplaceMediaKey } from '@/lib/dashboard/marketplaceMediaProjection'

const getListingsBySections = vi.fn()
const getPublicMarketplaceImagesForItems = vi.fn(async () => ({}))

vi.mock('@/lib/server/listingsQuery', () => ({
  getListingsBySections: (...args: unknown[]) => getListingsBySections(...args),
}))

vi.mock('@/lib/marketplace/images/public-query', () => ({
  getPublicMarketplaceImagesForItems: (...args: unknown[]) => getPublicMarketplaceImagesForItems(...args),
  pickMarketplaceCardImage: (images: unknown[]) => images[0] ?? null,
}))

const { buildDashboardCommandSources } = await import('@/lib/dashboard/buildDashboardCommandSources')

function listing(section: string, id: string): PublicListing {
  return {
    id,
    slug: id,
    title: `${section} ${id}`,
    description: 'description',
    category: section,
    subcategory: null,
    marketplace_section: section,
    product_type: null,
    region: 'north_america',
    condition: null,
    location_country: 'CA',
    location_region: null,
    price_amount: null,
    price_currency: 'CAD',
    price_display: null,
    seller_type: 'verified_seller',
    is_featured: false,
    high_level_specs: {},
    created_at: '2026-08-01T00:00:00Z',
    average_rating: null,
    review_count: null,
  }
}

function marketplaceSource(countryIso2: string | null = 'CA') {
  const sources = buildDashboardCommandSources({
    countryIso2,
    roleId: 'exporter',
    userId: null,
    page: 'marketplace',
  })
  return sources.marketplaceRows
}

function loadProjection(countryIso2: string | null = 'CA') {
  return marketplaceSource(countryIso2).load()
}

describe('Command Centre marketplace projection', () => {
  beforeEach(() => {
    getListingsBySections.mockReset()
    getPublicMarketplaceImagesForItems.mockReset()
    getPublicMarketplaceImagesForItems.mockResolvedValue({})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('queries each view separately so a busy section cannot starve a quiet one', async () => {
    getListingsBySections.mockImplementation(async (sections: string[]) => {
      if (sections.includes('consumables')) {
        return Array.from({ length: 8 }, (_, i) => listing('consumables', `c${i}`))
      }
      if (sections.includes('wanted_requests')) return [listing('wanted_requests', 'w1')]
      if (sections.includes('cannabis_inventory')) return [listing('cannabis_inventory', 'k1')]
      return []
    })

    const projection = await loadProjection()

    expect(projection.rows.consumables).toHaveLength(8)
    expect(projection.rows.wanted).toHaveLength(1)
    expect(projection.rows.cannabis).toHaveLength(1)
  })

  it('caps each view at its own budget rather than a shared one', async () => {
    getListingsBySections.mockImplementation(async (_sections, _country, limit: number) =>
      Array.from({ length: limit }, (_, i) => listing('consumables', `c${i}`)),
    )

    await loadProjection()

    for (const call of getListingsBySections.mock.calls) {
      expect(call[2]).toBe(8)
    }
  })

  it('routes the live `processing` section to equipment, not cannabis', async () => {
    const equipmentCall = getListingsBySections.mockImplementation(async (sections: string[]) =>
      sections.includes('processing') ? [listing('processing', 'p1')] : [],
    )

    const projection = await loadProjection()

    expect(projection.rows.equipment).toHaveLength(1)
    expect(projection.rows.cannabis).toBeUndefined()

    const sectionsQueriedForEquipment = equipmentCall.mock.calls
      .map(call => call[0] as string[])
      .find(sections => sections.includes('equipment'))
    expect(sectionsQueriedForEquipment).toContain('processing')
  })

  it('passes the active country through to every view query', async () => {
    getListingsBySections.mockResolvedValue([])

    await loadProjection('DE')

    expect(getListingsBySections).toHaveBeenCalled()
    for (const call of getListingsBySections.mock.calls) {
      expect(call[1]).toBe('DE')
    }
  })

  it('keeps legacy row tuples unchanged while media lives in a separate typed map', async () => {
    getListingsBySections.mockImplementation(async (sections: string[]) =>
      sections.includes('cannabis_inventory') ? [listing('cannabis_inventory', 'k1')] : [],
    )

    const projection = await loadProjection()
    const row = projection.rows.cannabis?.[0]

    expect(row).toHaveLength(10)
    expect(row?.[7]).toBe('k1')
    expect(projection.mediaById[marketplaceMediaKey('cannabis', 'k1')]).toBeDefined()
    expect(projection.mediaById[marketplaceMediaKey('cannabis', 'k1')].kind).toBe('representative')
  })

  it('resolves all loaded listing media through one deduplicated bulk query', async () => {
    getListingsBySections.mockImplementation(async (sections: string[]) => {
      if (sections.includes('cannabis_inventory')) return [listing('cannabis_inventory', 'shared'), listing('cannabis_inventory', 'k2')]
      if (sections.includes('consumables')) return [listing('consumables', 'shared'), listing('consumables', 'c2')]
      return []
    })

    await loadProjection()

    expect(getPublicMarketplaceImagesForItems).toHaveBeenCalledTimes(1)
    const ids = getPublicMarketplaceImagesForItems.mock.calls[0][0] as string[]
    expect(ids.sort()).toEqual(['c2', 'k2', 'shared'])
  })

  it('keeps view-specific representative media separate for the same canonical listing id', async () => {
    getListingsBySections.mockImplementation(async (sections: string[]) =>
      sections.includes('wanted_requests') ? [listing('wanted_requests', 'shared-demand')] : [],
    )

    const projection = await loadProjection()
    const wanted = projection.mediaById[marketplaceMediaKey('wanted', 'shared-demand')]
    const opportunity = projection.mediaById[marketplaceMediaKey('opportunities', 'shared-demand')]

    expect(wanted).toBeDefined()
    expect(opportunity).toBeDefined()
    expect(wanted.altText).toContain('demand')
    expect(opportunity.altText).toContain('commercial opportunity')
    expect(wanted.src).not.toBe(opportunity.src)
  })

  it('returns already-loaded rows when optional image enrichment exceeds its timeout', async () => {
    vi.useFakeTimers()
    getListingsBySections.mockImplementation(async (sections: string[]) =>
      sections.includes('cannabis_inventory') ? [listing('cannabis_inventory', 'slow-media')] : [],
    )
    getPublicMarketplaceImagesForItems.mockImplementation(() => new Promise(() => undefined))

    const pending = loadProjection()
    await vi.advanceTimersByTimeAsync(1_500)
    const projection = await pending

    expect(projection.rows.cannabis?.[0]?.[7]).toBe('slow-media')
    expect(projection.mediaById[marketplaceMediaKey('cannabis', 'slow-media')].kind).toBe('representative')
  })

  it('classifies the wrapped projection as empty only when it has no row buckets', () => {
    const source = marketplaceSource()

    expect(source.isEmpty?.({ rows: {}, mediaById: {} })).toBe(true)
    expect(source.isEmpty?.({
      rows: { cannabis: [['title', 'summary', 'CA', 'Flower', 'Verified', 'Mediated', '80', 'id', '', '']] },
      mediaById: {},
    })).toBe(false)
  })

  it('omits views that have no rows instead of emitting empty buckets', async () => {
    getListingsBySections.mockResolvedValue([])

    const projection = await loadProjection()

    expect(Object.keys(projection.rows)).toHaveLength(0)
    expect(projection.mediaById).toEqual({})
    expect(getPublicMarketplaceImagesForItems).not.toHaveBeenCalled()
  })
})
