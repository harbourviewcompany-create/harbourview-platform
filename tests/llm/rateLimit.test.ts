import { afterEach, describe, expect, it } from 'vitest';
import { checkLlmRateLimit, resetLlmRateLimits } from '../../lib/llm/rateLimit';

describe('LLM gateway rate limiter', () => {
  afterEach(() => resetLlmRateLimits());

  it('allows requests up to the per-minute limit', () => {
    const first = checkLlmRateLimit('user-1', 2, 1_000);
    const second = checkLlmRateLimit('user-1', 2, 2_000);
    const third = checkLlmRateLimit('user-1', 2, 3_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it('resets after the window expires', () => {
    expect(checkLlmRateLimit('user-1', 1, 1_000).allowed).toBe(true);
    expect(checkLlmRateLimit('user-1', 1, 2_000).allowed).toBe(false);
    expect(checkLlmRateLimit('user-1', 1, 61_001).allowed).toBe(true);
  });
});
