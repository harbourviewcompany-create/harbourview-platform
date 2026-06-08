import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('Hugging Face server-only env readiness', () => {
  it('reports a safe configuration-gap state when the org slug is missing', async () => {
    const { getHuggingFaceConfigStatus, getHuggingFaceOrgSlug } = await import('@/lib/env/huggingFaceEnv');

    const status = getHuggingFaceConfigStatus({});

    expect(getHuggingFaceOrgSlug({})).toBeUndefined();
    expect(status).toMatchObject({
      ok: false,
      configured: false,
      orgSlugConfigured: false,
      issues: [
        {
          code: 'HUGGINGFACE_ORG_SLUG_MISSING',
        },
      ],
    });
    expect(JSON.stringify(status)).not.toContain('hf_');
  });

  it('accepts a server-only Hugging Face org slug without exposing secret fields', async () => {
    const { getHuggingFaceConfigStatus, getHuggingFaceOrgSlug } = await import('@/lib/env/huggingFaceEnv');
    const env = { HUGGINGFACE_ORG_SLUG: 'harbourview-ai' };

    expect(getHuggingFaceOrgSlug(env)).toBe('harbourview-ai');
    expect(getHuggingFaceConfigStatus(env)).toEqual({
      ok: true,
      configured: true,
      orgSlugConfigured: true,
      issues: [],
    });
  });

  it('rejects URL-like slugs and public Hugging Face env exposure', async () => {
    const { getHuggingFaceConfigStatus } = await import('@/lib/env/huggingFaceEnv');

    const status = getHuggingFaceConfigStatus({
      HUGGINGFACE_ORG_SLUG: 'https://huggingface.co/harbourview-ai',
      NEXT_PUBLIC_HUGGINGFACE_ORG_SLUG: 'harbourview-ai',
    });

    expect(status.ok).toBe(false);
    expect(status.configured).toBe(false);
    expect(status.issues.map((issue) => issue.code)).toEqual([
      'HUGGINGFACE_ORG_SLUG_INVALID',
      'HUGGINGFACE_PUBLIC_ENV_FORBIDDEN',
    ]);
  });
});
