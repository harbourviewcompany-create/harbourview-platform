import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitMarketplaceInquiry } from '@/app/actions/submitInquiry';
import { submitQuoteRequest } from '@/app/actions/submitQuoteRequest';

vi.mock('@/lib/marketplace/notification', () => ({
  notifyMarketplaceInquiry: vi.fn().mockResolvedValue(undefined),
}));

function validInquiryFormData() {
  const fd = new FormData();
  fd.set('listing_slug', 'cascade-tek-cvo-5-l-vacuum-oven');
  fd.set('name', 'Test Buyer');
  fd.set('email', 'buyer@example.com');
  fd.set('company', 'Example Co');
  fd.set('country', 'US');
  fd.set('phone', '+1 555 111 2222');
  fd.set('message', 'Please contact me with availability details.');
  fd.set('inquiry_type', 'seller_contact');
  fd.set('consent', 'on');
  return fd;
}

function validQuoteFormData() {
  const fd = new FormData();
  fd.set('listingTitle', 'Cascade TEK CVO-5-L Vacuum Oven');
  fd.set('name', 'Quote Buyer');
  fd.set('email', 'quote@example.com');
  fd.set('phone', '+1 555 444 3333');
  fd.set('company', 'Quote Company');
  fd.set('buyerType', 'Brand');
  fd.set('targetMarket', 'US');
  fd.set('volume', '10 units');
  fd.set('timeline', 'ASAP');
  fd.set('budget', '$10000');
  fd.set('supplierPreference', 'Domestic');
  fd.set('requirements', 'Need validated units.');
  return fd;
}

describe('marketplace action shared submission transport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key';
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('uses shared transport path for inquiry action and preserves inquiry failure code', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitMarketplaceInquiry({ status: 'idle', message: '' }, validInquiryFormData());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/rest/v1/marketplace_inquiries');
    expect(result.message).toContain('[INQUIRY_SUPABASE_INSERT_FAILED]');
  });

  it('uses shared transport path for quote action and preserves quote failure code', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitQuoteRequest({ status: 'idle', message: '' }, validQuoteFormData());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/rest/v1/marketplace_inquiries');
    expect(result.message).toContain('[QUOTE_SUPABASE_INSERT_FAILED]');
  });
});
