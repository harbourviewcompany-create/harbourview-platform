/**
 * Tests for lib/hf/client.ts
 * Verifies: client construction, error handling, token never in logs/errors.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HfClient, getHfClient, _resetHfClientForTest } from '../client';
import { HfError } from '../errors';

beforeEach(() => {
  _resetHfClientForTest();
});

afterEach(() => {
  vi.restoreAllMocks();
  _resetHfClientForTest();
});

describe('HfClient construction', () => {
  it('constructs with valid env', () => {
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_test' });
    expect(client.orgSlug).toBe('Harbourview');
  });

  it('exposes orgSlug but not token', () => {
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_secret_token' });
    const serialized = JSON.stringify(client);
    expect(serialized).not.toContain('hf_secret_token');
    expect(client.orgSlug).toBe('Harbourview');
  });
});

describe('HfClient.request error handling', () => {
  it('throws HF_AUTH_FAILED on 401', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 401, json: async () => ({}) }));
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_test' });
    await expect(client.request({ path: '/test' })).rejects.toMatchObject({
      code: 'HF_AUTH_FAILED',
    });
  });

  it('throws HF_AUTH_FAILED on 403', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 403, json: async () => ({}) }));
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_test' });
    await expect(client.request({ path: '/test' })).rejects.toMatchObject({
      code: 'HF_AUTH_FAILED',
    });
  });

  it('throws HF_RATE_LIMITED on 429', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 429, json: async () => ({}) }));
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_test' });
    await expect(client.request({ path: '/test' })).rejects.toMatchObject({
      code: 'HF_RATE_LIMITED',
    });
  });

  it('throws HF_REPO_NOT_FOUND on 404', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404, json: async () => ({}) }));
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_test' });
    await expect(client.request({ path: '/test' })).rejects.toMatchObject({
      code: 'HF_REPO_NOT_FOUND',
    });
  });

  it('throws HF_ENDPOINT_UNREACHABLE on network error', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('ECONNREFUSED'); });
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_test' });
    await expect(client.request({ path: '/test' })).rejects.toMatchObject({
      code: 'HF_ENDPOINT_UNREACHABLE',
    });
  });

  it('does not include token value in thrown error messages', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 401, json: async () => ({}) }));
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_my_secret' });
    try {
      await client.request({ path: '/test' });
    } catch (e) {
      expect(String(e)).not.toContain('hf_my_secret');
      expect((e as HfError).message).not.toContain('hf_my_secret');
    }
  });
});

describe('HfClient.inferencePost', () => {
  it('rejects non-HTTPS endpoint URLs', async () => {
    const client = new HfClient({ HF_ORG: 'Harbourview', HF_TOKEN_SERVER: 'hf_test' });
    await expect(
      client.inferencePost('http://insecure-endpoint.com', { text: 'hello' }),
    ).rejects.toMatchObject({ code: 'HF_ENDPOINT_UNREACHABLE' });
  });
});

describe('getHfClient singleton', () => {
  it('returns the same instance on repeated calls', () => {
    const env = { HF_TOKEN_SERVER: 'hf_test', HF_ORG: 'Harbourview' };
    vi.stubEnv('HF_TOKEN_SERVER', 'hf_test');
    vi.stubEnv('HF_ORG', 'Harbourview');
    const a = getHfClient();
    const b = getHfClient();
    expect(a).toBe(b);
  });
});
