import { describe, expect, it, vi } from 'vitest';
import { callLlmProvider } from '../../lib/llm/providers';
import type { LlmProviderConfig } from '../../lib/llm/types';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const baseRequest = {
  messages: [{ role: 'user' as const, content: 'Hello' }],
  temperature: 0.2,
  maxOutputTokens: 128,
};

describe('LLM provider adapters', () => {
  it('calls Gemini without exposing the key in the URL', async () => {
    const fetcherMock = vi.fn(async () => jsonResponse({
      candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
      usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 2, totalTokenCount: 5 },
    }));
    const fetcher = fetcherMock as unknown as typeof fetch;

    const config: LlmProviderConfig = { provider: 'gemini', apiKey: 'test-gemini-key', model: 'gemini-flash-latest' };
    const result = await callLlmProvider(config, baseRequest, 1_000, 'req-1', fetcher);
    const [url, init] = fetcherMock.mock.calls[0]!;

    expect(String(url)).toContain('/models/gemini-flash-latest:generateContent');
    expect(String(url)).not.toContain('test-gemini-key');
    expect((init as RequestInit).headers).toMatchObject({ 'X-goog-api-key': 'test-gemini-key' });
    expect(result.text).toBe('Gemini response');
    expect(result.usage?.totalTokens).toBe(5);
  });

  it('calls Moonshot through chat completions', async () => {
    const fetcherMock = vi.fn(async () => jsonResponse({
      choices: [{ message: { content: 'Moonshot response' } }],
      usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
    }));
    const fetcher = fetcherMock as unknown as typeof fetch;

    const config: LlmProviderConfig = { provider: 'moonshot', apiKey: 'test-moonshot-key', model: 'kimi-k2-5' };
    const result = await callLlmProvider(config, baseRequest, 1_000, 'req-2', fetcher);
    const [url, init] = fetcherMock.mock.calls[0]!;

    expect(String(url)).toBe('https://api.moonshot.cn/v1/chat/completions');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer test-moonshot-key' });
    expect(result.text).toBe('Moonshot response');
    expect(result.usage?.totalTokens).toBe(7);
  });

  it('calls DeepSeek through chat completions', async () => {
    const fetcherMock = vi.fn(async () => jsonResponse({
      choices: [{ message: { content: 'DeepSeek response' } }],
    }));
    const fetcher = fetcherMock as unknown as typeof fetch;

    const config: LlmProviderConfig = { provider: 'deepseek', apiKey: 'test-deepseek-key', model: 'deepseek-chat' };
    const result = await callLlmProvider(config, baseRequest, 1_000, 'req-3', fetcher);
    const [url, init] = fetcherMock.mock.calls[0]!;

    expect(String(url)).toBe('https://api.deepseek.com/v1/chat/completions');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer test-deepseek-key' });
    expect(result.text).toBe('DeepSeek response');
  });

  it('returns sanitized provider errors', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ error: { message: 'provider detail' } }, 500)) as unknown as typeof fetch;
    const config: LlmProviderConfig = { provider: 'deepseek', apiKey: 'test-key', model: 'deepseek-chat' };

    await expect(callLlmProvider(config, baseRequest, 1_000, 'req-4', fetcher)).rejects.toMatchObject({
      code: 'LLM_GATEWAY_PROVIDER_ERROR',
      status: 502,
      provider: 'deepseek',
    });
  });
});
