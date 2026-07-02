import type { LlmGatewayRequest, LlmGatewaySuccess, LlmProviderConfig, LlmUsage } from './types';
import { LlmGatewayError } from './types';

type FetchLike = typeof fetch;

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

async function postJson({
  url,
  headers,
  body,
  timeoutMs,
  provider,
  fetcher = fetch,
}: {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  timeoutMs: number;
  provider: LlmProviderConfig['provider'];
  fetcher?: FetchLike;
}) {
  const timeout = withTimeoutSignal(timeoutMs);

  try {
    const response = await fetcher(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: timeout.signal,
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) as unknown : null;

    if (!response.ok) {
      throw new LlmGatewayError(
        'LLM_GATEWAY_PROVIDER_ERROR',
        `${provider} provider request failed with status ${response.status}.`,
        502,
        provider,
      );
    }

    return json;
  } catch (error) {
    if (error instanceof LlmGatewayError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new LlmGatewayError('LLM_GATEWAY_PROVIDER_TIMEOUT', `${provider} provider request timed out.`, 504, provider);
    }

    throw new LlmGatewayError('LLM_GATEWAY_PROVIDER_ERROR', `${provider} provider request failed.`, 502, provider);
  } finally {
    timeout.clear();
  }
}

function messagesToPrompt(request: LlmGatewayRequest) {
  return request.messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n\n');
}

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

type ChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function normalizeAnthropicUsage(usage?: AnthropicResponse['usage']): LlmUsage | undefined {
  if (!usage) return undefined;
  const inputTokens = usage.input_tokens;
  const outputTokens = usage.output_tokens;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens !== undefined && outputTokens !== undefined ? inputTokens + outputTokens : undefined,
  };
}

function normalizeUsage(usage?: ChatCompletionsResponse['usage']): LlmUsage | undefined {
  if (!usage) return undefined;
  return {
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}

function normalizeGeminiUsage(usage?: GeminiResponse['usageMetadata']): LlmUsage | undefined {
  if (!usage) return undefined;
  return {
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
  };
}

function ensureText(text: string | undefined, provider: LlmProviderConfig['provider']) {
  const normalized = text?.trim();
  if (!normalized) {
    throw new LlmGatewayError('LLM_GATEWAY_EMPTY_RESPONSE', `${provider} returned an empty response.`, 502, provider);
  }
  return normalized;
}

function splitAnthropicMessages(request: LlmGatewayRequest) {
  const system = request.messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n') || undefined;

  const messages = request.messages
    .filter((message): message is LlmGatewayRequest['messages'][number] & { role: 'user' | 'assistant' } =>
      message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ role: message.role, content: message.content }));

  return { system, messages };
}

export async function callAnthropicProvider(
  config: LlmProviderConfig,
  request: LlmGatewayRequest,
  timeoutMs: number,
  requestId: string,
  fetcher?: FetchLike,
): Promise<LlmGatewaySuccess> {
  const { system, messages } = splitAnthropicMessages(request);

  const json = await postJson({
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: {
      model: config.model,
      system,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxOutputTokens ?? 1024,
    },
    timeoutMs,
    provider: config.provider,
    fetcher,
  }) as AnthropicResponse;

  const text = ensureText(
    json.content?.filter((block) => block.type === 'text').map((block) => block.text || '').join('').trim(),
    config.provider,
  );
  return {
    ok: true,
    provider: config.provider,
    model: config.model,
    text,
    usage: normalizeAnthropicUsage(json.usage),
    requestId,
  };
}

export async function callGeminiProvider(
  config: LlmProviderConfig,
  request: LlmGatewayRequest,
  timeoutMs: number,
  requestId: string,
  fetcher?: FetchLike,
): Promise<LlmGatewaySuccess> {
  const json = await postJson({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`,
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': config.apiKey,
    },
    body: {
      contents: [
        {
          parts: [{ text: messagesToPrompt(request) }],
        },
      ],
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
      },
    },
    timeoutMs,
    provider: config.provider,
    fetcher,
  }) as GeminiResponse;

  const text = ensureText(json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim(), config.provider);
  return { ok: true, provider: config.provider, model: config.model, text, usage: normalizeGeminiUsage(json.usageMetadata), requestId };
}

async function callChatCompletionsProvider({
  config,
  request,
  timeoutMs,
  requestId,
  url,
  fetcher,
}: {
  config: LlmProviderConfig;
  request: LlmGatewayRequest;
  timeoutMs: number;
  requestId: string;
  url: string;
  fetcher?: FetchLike;
}): Promise<LlmGatewaySuccess> {
  const json = await postJson({
    url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: {
      model: config.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxOutputTokens,
      stream: false,
    },
    timeoutMs,
    provider: config.provider,
    fetcher,
  }) as ChatCompletionsResponse;

  const text = ensureText(json.choices?.[0]?.message?.content, config.provider);
  return { ok: true, provider: config.provider, model: config.model, text, usage: normalizeUsage(json.usage), requestId };
}

export async function callLlmProvider(
  config: LlmProviderConfig,
  request: LlmGatewayRequest,
  timeoutMs: number,
  requestId: string,
  fetcher?: FetchLike,
): Promise<LlmGatewaySuccess> {
  if (config.provider === 'anthropic') return callAnthropicProvider(config, request, timeoutMs, requestId, fetcher);

  if (config.provider === 'gemini') return callGeminiProvider(config, request, timeoutMs, requestId, fetcher);

  if (config.provider === 'moonshot') {
    return callChatCompletionsProvider({
      config,
      request,
      timeoutMs,
      requestId,
      url: 'https://api.moonshot.cn/v1/chat/completions',
      fetcher,
    });
  }

  return callChatCompletionsProvider({
    config,
    request,
    timeoutMs,
    requestId,
    url: 'https://api.deepseek.com/v1/chat/completions',
    fetcher,
  });
}
