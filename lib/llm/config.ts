import { isLlmProvider, type LlmProvider, type LlmProviderConfig, type LlmRuntimeConfig } from './types';

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 12;

function readIntegerEnv(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function providerConfig(provider: LlmProvider, apiKeyName: string, defaultModel: string): LlmProviderConfig | null {
  const apiKey = process.env[apiKeyName]?.trim();
  if (!apiKey) return null;

  return {
    provider,
    apiKey,
    model: process.env[`HARBOURVIEW_LLM_${provider.toUpperCase()}_MODEL`]?.trim() || defaultModel,
  };
}

export function getLlmRuntimeConfig(): LlmRuntimeConfig {
  const providers: LlmRuntimeConfig['providers'] = {};

  const anthropic = providerConfig('anthropic', 'ANTHROPIC_API_KEY', 'claude-sonnet-4-6');
  const gemini = providerConfig('gemini', 'GEMINI_API_KEY', 'gemini-flash-latest')
    || providerConfig('gemini', 'GOOGLE_API_KEY', 'gemini-flash-latest');
  const moonshot = providerConfig('moonshot', 'MOONSHOT_API_KEY', 'kimi-k2-5');
  const deepseek = providerConfig('deepseek', 'DEEPSEEK_API_KEY', 'deepseek-chat');

  if (anthropic) providers.anthropic = anthropic;
  if (gemini) providers.gemini = gemini;
  if (moonshot) providers.moonshot = moonshot;
  if (deepseek) providers.deepseek = deepseek;

  const requestedDefault = process.env.HARBOURVIEW_LLM_DEFAULT_PROVIDER?.trim().toLowerCase();
  const defaultProvider = isLlmProvider(requestedDefault) && providers[requestedDefault]
    ? requestedDefault
    : (Object.keys(providers)[0] as LlmProvider | undefined) || null;

  return {
    enabled: process.env.HARBOURVIEW_LLM_GATEWAY_ENABLED === '1',
    timeoutMs: readIntegerEnv('HARBOURVIEW_LLM_TIMEOUT_MS', DEFAULT_TIMEOUT_MS, 1_000, 60_000),
    rateLimitPerMinute: readIntegerEnv('HARBOURVIEW_LLM_RATE_LIMIT_PER_MINUTE', DEFAULT_RATE_LIMIT_PER_MINUTE, 1, 120),
    defaultProvider,
    providers,
  };
}

export function getConfiguredProvider(config: LlmRuntimeConfig, requestedProvider?: LlmProvider) {
  const provider = requestedProvider || config.defaultProvider;
  return provider ? config.providers[provider] || null : null;
}
