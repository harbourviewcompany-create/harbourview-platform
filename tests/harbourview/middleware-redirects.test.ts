import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { proxy } from '@/proxy';

describe('middleware legacy redirects', () => {
  it('redirects /commercial-intelligence', async () => {
    const response = await proxy(new NextRequest('https://example.com/commercial-intelligence'));
    expect(response.status).toBe(308);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/intelligence');
  });

  it('redirects /commercial-intelligence/ with trailing slash', async () => {
    // Inbound trailing slash is normalized off before LEGACY_REDIRECTS lookup;
    // canonical target is always without a trailing slash.
    const response = await proxy(new NextRequest('https://example.com/commercial-intelligence/'));
    expect(response.status).toBe(308);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/intelligence');
  });

  it('redirects /marketplace/submit-listing', async () => {
    const response = await proxy(new NextRequest('https://example.com/marketplace/submit-listing'));
    expect(response.status).toBe(308);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/marketplace/sell');
  });

  it('redirects /marketplace/submit-listing/ with trailing slash', async () => {
    const response = await proxy(new NextRequest('https://example.com/marketplace/submit-listing/'));
    expect(response.status).toBe(308);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/marketplace/sell');
  });
});
