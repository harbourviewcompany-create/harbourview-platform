import { describe, expect, it, vi } from 'vitest';
import { callLlmProvider } from '../../lib/llm/providers';
import type { LlmProviderConfig } from '../../lib/llm/types';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn(async (..._args: Parameters<typeof fetch>) => jsonResponse(body, status));
}

function firstFetchCall(fetcherMock: ReturnType<typeof mockFetch>) {
  const call = fetcherMock.mock.calls[0];
  if (!call) throw new Error('Expected fetch to be called.');
  return call;
}

const baseRequest = {
  messages: [{ role: 'user' as const, content: 'Hello' }],
  temperature: 0.2,
  maxOutputTokens: 128,
};

describe('LLM provider adapters', () => {
  it('calls Anthropic Messages API with system prompt split out', async () => {
    const fetcherMock = mockFetch({
      content: [{ type: 'text', text: 'Anthropic response' }],
      usage: { input_tokens: 10, output_tokens: 6 },
    });
    const fetcher = fetcherMock as unknown as typeof fetch;

    const config: LlmProviderConfig = { provider: 'anthropic', apiKey: 'test-anthropic-key', model: 'claude-sonnet-4-6' };
    const request = {
      messages: [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'Hello' },
      ],
      temperature: 0.2,
      maxOutputTokens: 128,
    };
    const result = await callLlmProvider(config, request, 1_000, 'req-anthropic', fetcher);
    const [url, init] = firstFetchCall(fetcherMock);

    expect(String(url)).toBe('https://api.anthropic.com/v1/messages');
    expect(init?.headers).toMatchObject({ 'x-api-key': 'test-anthropic-key', 'anthropic-version': '2023-06-01' });
    const body = JSON.parse(String(init?.body));
    expect(body.system).toBe('You are a helpful assistant.');
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(result.text).toBe('Anthropic response');
    expect(result.usage?.totalTokens).toBe(16);
  });

  it('calls Gemini without exposing the key in the URL', async () => {
    const fetcherMock = mockFetch({
      candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
      usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 2, totalTokenCount: 5 },
    });
    const fetcher = fetcherMock as unknown as typeof fetch;

    const config: LlmProviderConfig = { provider: 'gemini', apiKey: 'test-gemini-key', model: 'gemini-flash-latest' };
    const result = await callLlmProvider(config, baseRequest, 1_000, 'req-1', fetcher);
    const [url, init] = firstFetchCall(fetcherMock);

    expect(String(url)).toContain('/models/gemini-flash-latest:generateContent');
    expect(String(url)).not.toContain('test-gemini-key');
    expect(init?.headers).toMatchObject({ 'X-goog-api-key': 'test-gemini-key' });
    expect(result.text).toBe('Gemini response');
    expect(result.usage?.totalTokens).toBe(5);
  });

  it('calls Moonshot through chat completions', async () => {
    const fetcherMock = mockFetch({
      choices: [{ message: { content: 'Moonshot response' } }],
      usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
    });
    const fetcher = fetcherMock as unknown as typeof fetch;

    const config: LlmProviderConfig = { provider: 'moonshot', apiKey: 'test-moonshot-key', model: 'kimi-k2-5' };
    const result = await callLlmProvider(config, baseRequest, 1_000, 'req-2', fetcher);
    const [url, init] = firstFetchCall(fetcherMock);

    expect(String(url)).toBe('https://api.moonshot.cn/v1/chat/completions');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-moonshot-key' });
    expect(result.text).toBe('Moonshot response');
    expect(result.usage?.totalTokens).toBe(7);
  });

  it('calls DeepSeek through chat completions', async () => {
    const fetcherMock = mockFetch({
      choices: [{ message: { content: 'DeepSeek response' } }],
    });
    const fetcher = fetcherMock as unknown as typeof fetch;

    const config: LlmProviderConfig = { provider: 'deepseek', apiKey: 'test-deepseek-key', model: 'deepseek-chat' };
    const result = await callLlmProvider(config, baseRequest, 1_000, 'req-3', fetcher);
    const [url, init] = firstFetchCall(fetcherMock);

    expect(String(url)).toBe('https://api.deepseek.com/v1/chat/completions');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-deepseek-key' });
    expect(result.text).toBe('DeepSeek response');
  });

  it('returns sanitized provider errors', async () => {
    const fetcher = mockFetch({ error: { message: 'provider detail' } }, 500) as unknown as typeof fetch;
    const config: LlmProviderConfig = { provider: 'deepseek', apiKey: 'test-key', model: 'deepseek-chat' };

    await expect(callLlmProvider(config, baseRequest, 1_000, 'req-4', fetcher)).rejects.toMatchObject({
      code: 'LLM_GATEWAY_PROVIDER_ERROR',
      status: 502,
      provider: 'deepseek',
    });
  });
});
