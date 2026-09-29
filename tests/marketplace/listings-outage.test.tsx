import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/server/listingsQuery', () => ({ getPublicListings: vi.fn() }))

import MarketplaceListingsPage from '@/app/marketplace/listings/page'
import { getPublicListings } from '@/lib/server/listingsQuery'

describe('public listings during a database outage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('keeps the public routes visible without claiming there are no listings', async () => {
    vi.mocked(getPublicListings).mockRejectedValue(new Error('504 Gateway Timeout'))

    const html = renderToStaticMarkup(await MarketplaceListingsPage())

    expect(html).toContain('Reviewed listings are temporarily unavailable')
    expect(html).toContain('/marketplace/sell')
    expect(html).not.toContain('No approved public listings are currently available')
  })
})
