/**
 * tests/llm/rateLimit.test.ts
 *
 * Unit tests for the LLM rate limiter.
 *
 * The Supabase DB path is unavailable in Vitest (no service-role env vars),
 * so `checkRateLimitDB` returns null on every call and the tests exercise the
 * in-memory fallback, which is the correct path to unit-test in isolation.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { checkLlmRateLimit, resetLlmRateLimits } from '../../lib/llm/rateLimit';

describe('LLM gateway rate limiter', () => {
  afterEach(() => resetLlmRateLimits());

  it('allows requests up to the per-minute limit', async () => {
    const first  = await checkLlmRateLimit('user-1', 2, new Date(1_000));
    const second = await checkLlmRateLimit('user-1', 2, new Date(2_000));
    const third  = await checkLlmRateLimit('user-1', 2, new Date(3_000));

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it('resets after the window expires', async () => {
    expect((await checkLlmRateLimit('user-1', 1, new Date(1_000))).allowed).toBe(true);
    expect((await checkLlmRateLimit('user-1', 1, new Date(2_000))).allowed).toBe(false);
    // 61 001 ms is in the next 60-second window
    expect((await checkLlmRateLimit('user-1', 1, new Date(61_001))).allowed).toBe(true);
  });

  it('tracks different users independently', async () => {
    const t = new Date(1_000);
    expect((await checkLlmRateLimit('user-a', 1, t)).allowed).toBe(true);
    expect((await checkLlmRateLimit('user-b', 1, t)).allowed).toBe(true);
    expect((await checkLlmRateLimit('user-a', 1, t)).allowed).toBe(false);
    expect((await checkLlmRateLimit('user-b', 1, t)).allowed).toBe(false);
  });

  it('returns correct remaining count', async () => {
    const t = new Date(1_000);
    const first  = await checkLlmRateLimit('user-c', 3, t);
    const second = await checkLlmRateLimit('user-c', 3, t);
    const third  = await checkLlmRateLimit('user-c', 3, t);
    const fourth = await checkLlmRateLimit('user-c', 3, t);

    expect(first.remaining).toBe(2);
    expect(second.remaining).toBe(1);
    expect(third.remaining).toBe(0);
    expect(fourth.allowed).toBe(false);
  });
});
