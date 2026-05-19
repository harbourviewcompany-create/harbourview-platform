import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';

describe('middleware legacy redirects', () => {
  it('redirects /commercial-intelligence', () => {
    const response = middleware(new NextRequest('https://example.com/commercial-intelligence'));

    expect(response.status).toBe(308);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/intelligence');
  });

  it('redirects /commercial-intelligence/ with trailing slash', () => {
    const response = middleware(new NextRequest('https://example.com/commercial-intelligence/'));

    expect(response.status).toBe(308);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/intelligence/');
  });

  it('redirects /marketplace/submit-listing/ with trailing slash', () => {
    const response = middleware(new NextRequest('https://example.com/marketplace/submit-listing/'));

    expect(response.status).toBe(308);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/marketplace/sell/');
  });
});
