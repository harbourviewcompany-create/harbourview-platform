import 'server-only';

import { z } from 'zod';

const orgSlug = z
  .string()
  .trim()
  .min(1)
  .max(96)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Use a Hugging Face org/user slug, not a URL or token.')
  .optional()
  .transform((value) => (value ? value : undefined));

const schema = z.object({
  HUGGINGFACE_ORG_SLUG: orgSlug,
});

type RawHuggingFaceEnv = Record<string, string | undefined>;

export type HuggingFaceEnv = z.infer<typeof schema>;

export type HuggingFaceConfigIssueCode =
  | 'HUGGINGFACE_ORG_SLUG_MISSING'
  | 'HUGGINGFACE_ORG_SLUG_INVALID'
  | 'HUGGINGFACE_PUBLIC_ENV_FORBIDDEN';

export type HuggingFaceConfigStatus = {
  ok: boolean;
  configured: boolean;
  orgSlugConfigured: boolean;
  issues: Array<{ code: HuggingFaceConfigIssueCode; message: string }>;
};

const FORBIDDEN_PUBLIC_HF_ENV_PREFIXES = ['NEXT_PUBLIC_HF', 'NEXT_PUBLIC_HUGGINGFACE'] as const;

function hasForbiddenPublicHuggingFaceEnv(rawEnv: RawHuggingFaceEnv) {
  return Object.keys(rawEnv).some((key) => FORBIDDEN_PUBLIC_HF_ENV_PREFIXES.some((prefix) => key.startsWith(prefix)));
}

export function parseHuggingFaceEnv(rawEnv: RawHuggingFaceEnv = process.env) {
  return schema.safeParse(rawEnv);
}

export function getHuggingFaceOrgSlug(rawEnv: RawHuggingFaceEnv = process.env) {
  const parsed = parseHuggingFaceEnv(rawEnv);
  return parsed.success ? parsed.data.HUGGINGFACE_ORG_SLUG : undefined;
}

export function getHuggingFaceConfigStatus(rawEnv: RawHuggingFaceEnv = process.env): HuggingFaceConfigStatus {
  const parsed = parseHuggingFaceEnv(rawEnv);
  const issues: HuggingFaceConfigStatus['issues'] = [];

  if (!parsed.success) {
    issues.push({
      code: 'HUGGINGFACE_ORG_SLUG_INVALID',
      message: 'HUGGINGFACE_ORG_SLUG must be a Hugging Face org/user slug, not a URL, token, or empty string.',
    });
  }

  const orgSlugConfigured = parsed.success && Boolean(parsed.data.HUGGINGFACE_ORG_SLUG);
  if (parsed.success && !orgSlugConfigured) {
    issues.push({
      code: 'HUGGINGFACE_ORG_SLUG_MISSING',
      message: 'Set server-only HUGGINGFACE_ORG_SLUG before enabling Hugging Face intelligence-layer workflows.',
    });
  }

  if (hasForbiddenPublicHuggingFaceEnv(rawEnv)) {
    issues.push({
      code: 'HUGGINGFACE_PUBLIC_ENV_FORBIDDEN',
      message: 'Do not expose Hugging Face configuration through NEXT_PUBLIC_HF* or NEXT_PUBLIC_HUGGINGFACE* variables.',
    });
  }

  return {
    ok: issues.length === 0,
    configured: orgSlugConfigured && issues.length === 0,
    orgSlugConfigured,
    issues,
  };
}
