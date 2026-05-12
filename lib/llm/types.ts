export const LLM_PROVIDERS = ['gemini', 'moonshot', 'deepseek'] as const;

export type LlmProvider = (typeof LLM_PROVIDERS)[number];
export type LlmMessageRole = 'system' | 'user' | 'assistant';

export type LlmMessage = {
  role: LlmMessageRole;
  content: string;
};

export type LlmGatewayRequest = {
  provider?: LlmProvider;
  messages: LlmMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  requestId?: string;
};

export type LlmProviderConfig = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
};

export type LlmRuntimeConfig = {
  enabled: boolean;
  timeoutMs: number;
  rateLimitPerMinute: number;
  defaultProvider: LlmProvider | null;
  providers: Partial<Record<LlmProvider, LlmProviderConfig>>;
};

export type LlmUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type LlmGatewaySuccess = {
  ok: true;
  provider: LlmProvider;
  model: string;
  text: string;
  usage?: LlmUsage;
  requestId: string;
};

export type LlmErrorCode =
  | 'LLM_GATEWAY_DISABLED'
  | 'LLM_GATEWAY_CONFIG_MISSING'
  | 'LLM_GATEWAY_VALIDATION_FAILED'
  | 'LLM_GATEWAY_RATE_LIMITED'
  | 'LLM_GATEWAY_PROVIDER_ERROR'
  | 'LLM_GATEWAY_PROVIDER_TIMEOUT'
  | 'LLM_GATEWAY_EMPTY_RESPONSE'
  | 'LLM_GATEWAY_INTERNAL_ERROR';

export class LlmGatewayError extends Error {
  readonly code: LlmErrorCode;
  readonly status: number;
  readonly provider?: LlmProvider;

  constructor(code: LlmErrorCode, message: string, status: number, provider?: LlmProvider) {
    super(message);
    this.name = 'LlmGatewayError';
    this.code = code;
    this.status = status;
    this.provider = provider;
  }
}

export function isLlmProvider(value: string | null | undefined): value is LlmProvider {
  return Boolean(value && (LLM_PROVIDERS as readonly string[]).includes(value));
}
