import { describe, expect, it } from 'vitest';
import { parseLlmGatewayRequest } from '../../lib/llm/validation';

describe('LLM gateway request validation', () => {
  it('accepts a minimal valid request', () => {
    const parsed = parseLlmGatewayRequest({
      provider: 'gemini',
      messages: [{ role: 'user', content: 'Summarize this market signal.' }],
    });

    expect(parsed.provider).toBe('gemini');
    expect(parsed.messages).toHaveLength(1);
  });

  it('rejects unknown providers and unexpected fields', () => {
    expect(() => parseLlmGatewayRequest({
      provider: 'openai',
      messages: [{ role: 'user', content: 'Hello' }],
    })).toThrow();

    expect(() => parseLlmGatewayRequest({
      messages: [{ role: 'user', content: 'Hello' }],
      unexpectedField: true,
    })).toThrow();
  });

  it('rejects oversized content and unsafe request ids', () => {
    expect(() => parseLlmGatewayRequest({
      messages: [{ role: 'user', content: 'x'.repeat(6_001) }],
    })).toThrow();

    expect(() => parseLlmGatewayRequest({
      requestId: 'bad request id with spaces',
      messages: [{ role: 'user', content: 'Hello' }],
    })).toThrow();
  });
});
