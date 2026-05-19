import 'server-only';

import { z } from 'zod';

const bool = z.enum(['true', 'false']).default('false').transform((value) => value === 'true');
const intString = z.string().trim().regex(/^\d+$/).transform((value) => Number.parseInt(value, 10));
const optionalText = z.string().trim().optional().transform((value) => (value ? value : undefined));
const optionalUrl = optionalText.pipe(z.string().url().optional());
const reviewMode = z.enum(['draft', 'review_required', 'disabled']).default('draft');

const schema = z
  .object({
    UNIFIED_AI_GATEWAY_ENABLED: bool,
    UNIFIED_AI_GATEWAY_BASE_URL: optionalUrl,
    UNIFIED_AI_GATEWAY_API_KEY: optionalText,
    UNIFIED_AI_GATEWAY_TIMEOUT_MS: intString.default('30000'),
    UNIFIED_AI_GATEWAY_MAX_RETRIES: intString.default('2'),
    UNIFIED_AI_GATEWAY_DEFAULT_PROVIDER: optionalText,
    UNIFIED_AI_GATEWAY_DEFAULT_MODEL: optionalText,
    UNIFIED_AI_GATEWAY_EMBEDDING_MODEL: optionalText,
    HARBOURVIEW_AI_GATEWAY_SHARED_SECRET: optionalText,
    HARBOURVIEW_AI_GATEWAY_ALLOWED_ORIGINS: z.string().trim().default('http://localhost:3000'),
    HARBOURVIEW_MARKETPLACE_AI_ENABLED: bool,
    HARBOURVIEW_MARKETPLACE_AI_REVIEW_MODE: reviewMode,
    HARBOURVIEW_MARKETPLACE_AI_MAX_INPUT_CHARS: intString.default('12000'),
    OPENAI_API_KEY: optionalText,
    ANTHROPIC_API_KEY: optionalText,
    GOOGLE_GENERATIVE_AI_API_KEY: optionalText,
    MISTRAL_API_KEY: optionalText,
    PERPLEXITY_API_KEY: optionalText,
    NOTION_TOKEN: optionalText,
    LINEAR_API_KEY: optionalText,
  })
  .superRefine((env, context) => {
    if (!env.UNIFIED_AI_GATEWAY_ENABLED) return;
    if (!env.UNIFIED_AI_GATEWAY_BASE_URL) context.addIssue({ code: z.ZodIssueCode.custom, path: ['UNIFIED_AI_GATEWAY_BASE_URL'], message: 'Required when gateway is enabled.' });
    if (!env.UNIFIED_AI_GATEWAY_API_KEY) context.addIssue({ code: z.ZodIssueCode.custom, path: ['UNIFIED_AI_GATEWAY_API_KEY'], message: 'Required when gateway is enabled.' });
  });

export type UnifiedAiGatewayEnv = z.infer<typeof schema>;

export function parseUnifiedAiGatewayEnv(rawEnv: NodeJS.ProcessEnv = process.env) {
  return schema.safeParse(rawEnv);
}

export function getUnifiedAiGatewayHealth(rawEnv: NodeJS.ProcessEnv = process.env) {
  const parsed = parseUnifiedAiGatewayEnv(rawEnv);
  const issues = parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  const env = parsed.success ? parsed.data : undefined;
  if (env?.HARBOURVIEW_MARKETPLACE_AI_ENABLED && !env.UNIFIED_AI_GATEWAY_ENABLED) issues.push('Marketplace AI is enabled while the Unified AI Gateway is disabled.');

  return {
    ok: issues.length === 0,
    enabled: env?.UNIFIED_AI_GATEWAY_ENABLED ?? rawEnv.UNIFIED_AI_GATEWAY_ENABLED === 'true',
    marketplaceEnabled: env?.HARBOURVIEW_MARKETPLACE_AI_ENABLED ?? rawEnv.HARBOURVIEW_MARKETPLACE_AI_ENABLED === 'true',
    configured: {
      baseUrl: Boolean(rawEnv.UNIFIED_AI_GATEWAY_BASE_URL?.trim()),
      apiKey: Boolean(rawEnv.UNIFIED_AI_GATEWAY_API_KEY?.trim()),
      sharedSecret: Boolean(rawEnv.HARBOURVIEW_AI_GATEWAY_SHARED_SECRET?.trim()),
      defaultProvider: Boolean(rawEnv.UNIFIED_AI_GATEWAY_DEFAULT_PROVIDER?.trim()),
      defaultModel: Boolean(rawEnv.UNIFIED_AI_GATEWAY_DEFAULT_MODEL?.trim()),
      embeddingModel: Boolean(rawEnv.UNIFIED_AI_GATEWAY_EMBEDDING_MODEL?.trim()),
      notionToken: Boolean(rawEnv.NOTION_TOKEN?.trim()),
      linearApiKey: Boolean(rawEnv.LINEAR_API_KEY?.trim()),
    },
    limits: {
      timeoutMs: env?.UNIFIED_AI_GATEWAY_TIMEOUT_MS ?? Number.parseInt(rawEnv.UNIFIED_AI_GATEWAY_TIMEOUT_MS || '30000', 10),
      maxRetries: env?.UNIFIED_AI_GATEWAY_MAX_RETRIES ?? Number.parseInt(rawEnv.UNIFIED_AI_GATEWAY_MAX_RETRIES || '2', 10),
      marketplaceMaxInputChars: env?.HARBOURVIEW_MARKETPLACE_AI_MAX_INPUT_CHARS ?? Number.parseInt(rawEnv.HARBOURVIEW_MARKETPLACE_AI_MAX_INPUT_CHARS || '12000', 10),
      marketplaceReviewMode: env?.HARBOURVIEW_MARKETPLACE_AI_REVIEW_MODE ?? 'draft',
    },
    issues,
  };
}
