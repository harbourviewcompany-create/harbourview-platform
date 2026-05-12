type RateLimitBucket = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, RateLimitBucket>();

function nowMs() {
  return Date.now();
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkLlmRateLimit(key: string, limitPerMinute: number, now = nowMs()): RateLimitResult {
  const safeLimit = Math.max(1, Math.floor(limitPerMinute));
  const bucketKey = key.trim() || 'unknown';
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + 60_000;
    buckets.set(bucketKey, { resetAt, count: 1 });
    return { allowed: true, remaining: safeLimit - 1, resetAt };
  }

  if (existing.count >= safeLimit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: safeLimit - existing.count, resetAt: existing.resetAt };
}

export function resetLlmRateLimits() {
  buckets.clear();
}
