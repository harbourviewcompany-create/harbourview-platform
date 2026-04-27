// lib/marketplace/rate-limit.ts
// Harbourview Marketplace v1 — sliding-window rate limiter
// In-process store — sufficient for v1. Replace with Upstash Redis for multi-instance.

type RateLimitStore = Map<string, { count: number; windowStart: number }>;
const store: RateLimitStore = new Map();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Check rate limit for a key.
 * Default: 5 requests per 60 seconds.
 */
export function checkRateLimit(
  key: string,
  options: { maxRequests?: number; windowSeconds?: number } = {}
): RateLimitResult {
  const { maxRequests = 5, windowSeconds = 60 } = options;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

/** Extract client IP from Next.js request headers. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Standard rate-limit response headers. */
export function rateLimitHeaders(retryAfterSeconds: number): Record<string, string> {
  return {
    'Retry-After': String(retryAfterSeconds),
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '0',
  };
}
