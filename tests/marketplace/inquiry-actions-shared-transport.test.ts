import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}), { virtual: true })

import { submitMarketplaceInquiry } from '@/app/actions/submitInquiry'
import { submitQuoteRequest } from '@/app/actions/submitQuoteRequest'
import { marketplaceListings } from '@/lib/marketplace/listings'

function buildInquiryFormData() {
  const listing = marketplaceListings.find((item) => item.availabilityStatus !== 'sold_or_expired')
  if (!listing) throw new Error('No available listing fixture found for test.')

  const formData = new FormData()
  formData.set('listing_slug', listing.slug)
  formData.set('name', 'Test Buyer')
  formData.set('email', 'buyer@example.com')
  formData.set('company', 'Harbourview Labs')
  formData.set('country', 'Canada')
  formData.set('phone', '555-0100')
  formData.set('message', 'Need verification support for this listing.')
  formData.set('consent', 'on')
  formData.set('website', '')
  return formData
}

function buildQuoteFormData() {
  const formData = new FormData()
  formData.set('listingTitle', 'CO2 Extraction Skid')
  formData.set('name', 'Test Buyer')
  formData.set('email', 'buyer@example.com')
  formData.set('phone', '555-0100')
  formData.set('company', 'Harbourview Labs')
  formData.set('buyerType', 'Brand')
  formData.set('targetMarket', 'Canada')
  formData.set('volume', 'Monthly pallet quantities')
  formData.set('timeline', 'ASAP')
  formData.set('budget', 'Confidential')
  formData.set('supplierPreference', 'Domestic preferred')
  formData.set('requirements', 'Need verified availability and pricing.')
  formData.set('website', '')
  return formData
}

describe('marketplace inquiry actions shared transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  })

  it('uses the same rest/v1/marketplace_inquiries transport path for both actions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201, statusText: 'Created' }))
    vi.stubGlobal('fetch', fetchMock)

    const inquiryResult = await submitMarketplaceInquiry({ status: 'idle', message: '' }, buildInquiryFormData())
    const quoteResult = await submitQuoteRequest({ status: 'idle', message: '' }, buildQuoteFormData())

    expect(inquiryResult.status).toBe('success')
    expect(inquiryResult.message).toContain('[INQUIRY_OK]')
    expect(quoteResult.status).toBe('success')
    expect(quoteResult.message).toContain('[QUOTE_OK]')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co/rest/v1/marketplace_inquiries')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://zvxdgdkukjrrwamdpqrg.supabase.co/rest/v1/marketplace_inquiries')
  })

  it('preserves distinct failure diagnostics per action when shared transport fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500, statusText: 'Server Error' })))

    const inquiryResult = await submitMarketplaceInquiry({ status: 'idle', message: '' }, buildInquiryFormData())
    const quoteResult = await submitQuoteRequest({ status: 'idle', message: '' }, buildQuoteFormData())

    expect(inquiryResult.status).toBe('error')
    expect(inquiryResult.message).toContain('[INQUIRY_SUPABASE_INSERT_FAILED]')
    expect(quoteResult.status).toBe('error')
    expect(quoteResult.message).toContain('[QUOTE_SUPABASE_INSERT_FAILED]')
  })
})
