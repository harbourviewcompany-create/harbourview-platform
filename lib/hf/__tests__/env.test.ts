/**
 * Tests for lib/hf/env.ts
 * Verifies: env validation, no NEXT_PUBLIC_HF_* vars, no hardcoded tokens.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseHfEnv, getHfEnv, getHfEnvHealth } from '../env';
import { HfError } from '../errors';

const env = (values: Record<string, string | undefined>): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  ...values,
} as NodeJS.ProcessEnv);

// ---------------------------------------------------------------------------
// Env validation
// ---------------------------------------------------------------------------

describe('parseHfEnv', () => {
  it('succeeds with valid token', () => {
    const result = parseHfEnv(env({ HF_TOKEN_SERVER:  'hf_test_token_abc' }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.HF_ORG).toBe('Harbourview');
      expect(result.data.HF_TOKEN_SERVER).toBe('hf_test_token_abc');
    }
  });

  it('fails when HF_TOKEN_SERVER is missing', () => {
    const result = parseHfEnv(env({}));
    expect(result.success).toBe(false);
  });

  it('fails when HF_TOKEN_SERVER is empty string', () => {
    const result = parseHfEnv(env({ HF_TOKEN_SERVER:  '' }));
    expect(result.success).toBe(false);
  });

  it('fails when HF_TOKEN_SERVER is whitespace only', () => {
    const result = parseHfEnv(env({ HF_TOKEN_SERVER:  '   ' }));
    expect(result.success).toBe(false);
  });

  it('defaults HF_ORG to Harbourview', () => {
    const result = parseHfEnv(env({ HF_TOKEN_SERVER:  'hf_x' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.HF_ORG).toBe('Harbourview');
  });

  it('rejects invalid endpoint URL', () => {
    const result = parseHfEnv(env({
      HF_TOKEN_SERVER: 'hf_x',
      HF_ENDPOINT_EMBED_BGE_M3: 'not-a-url',
    }));
    expect(result.success).toBe(false);
  });

  it('accepts valid endpoint URL', () => {
    const result = parseHfEnv(env({
      HF_TOKEN_SERVER: 'hf_x',
      HF_ENDPOINT_EMBED_BGE_M3: 'https://xyz.aws.endpoints.huggingface.cloud',
    }));
    expect(result.success).toBe(true);
  });
});

describe('getHfEnv', () => {
  it('throws HfError with code HF_ENV_INVALID when token missing', () => {
    expect(() => getHfEnv(env({}))).toThrow(HfError);
    try {
      getHfEnv(env({}));
    } catch (e) {
      expect(e).toBeInstanceOf(HfError);
      expect((e as HfError).code).toBe('HF_ENV_INVALID');
    }
  });
});

describe('getHfEnvHealth', () => {
  it('returns ok:false when token missing', () => {
    const h = getHfEnvHealth(env({}));
    expect(h.ok).toBe(false);
    expect(h.issues.length).toBeGreaterThan(0);
  });

  it('returns ok:true with valid token', () => {
    const h = getHfEnvHealth(env({ HF_TOKEN_SERVER: 'hf_x' }));
    expect(h.ok).toBe(true);
    expect(h.configured.tokenServer).toBe(true);
  });

  it('does not expose token value in health output', () => {
    const h = getHfEnvHealth(env({ HF_TOKEN_SERVER: 'hf_super_secret' }));
    const serialized = JSON.stringify(h);
    expect(serialized).not.toContain('hf_super_secret');
  });
});

// ---------------------------------------------------------------------------
// Security: no NEXT_PUBLIC_HF_ variables exist in the schema
// ---------------------------------------------------------------------------

describe('NEXT_PUBLIC_HF_ security', () => {
  it('schema does not include any NEXT_PUBLIC_HF_ key', async () => {
    const src = await import('fs').then((fs) =>
      fs.readFileSync(new URL('../env.ts', import.meta.url).pathname, 'utf-8'),
    );
    expect(src).not.toContain('NEXT_PUBLIC_HF');
  });
});

// ---------------------------------------------------------------------------
// Security: no hardcoded HF tokens in lib/hf/ source files
// ---------------------------------------------------------------------------

describe('No hardcoded HF tokens', () => {
  const HF_TOKEN_PATTERN = /hf_[A-Za-z0-9]{20,}/;
  const files = [
    'env.ts',
    'client.ts',
    'repos.ts',
    'serverOnly.ts',
    'errors.ts',
    'logging.ts',
    'index.ts',
  ];

  for (const file of files) {
    it(`${file} contains no hardcoded HF token`, async () => {
      const src = await import('fs').then((fs) =>
        fs.readFileSync(new URL(`../${file}`, import.meta.url).pathname, 'utf-8'),
      );
      expect(HF_TOKEN_PATTERN.test(src)).toBe(false);
    });
  }
});
