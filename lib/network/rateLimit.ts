import { createHash } from 'node:crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Backing store ────────────────────────────────────────────────────────────
// PREVIOUSLY: this module tracked rate-limit windows in a process-local Map.
// That is not a real rate limit on Vercel — each serverless invocation can
// land on a different lambda instance with its own empty Map (and a cold
// start wipes it entirely), so a caller retrying against a fresh instance
// sails straight through. This silently undermined every call site,
// including admin login brute-force protection (app/admin/login/submit).
//
// FIX: back the same limit/window/identity API with Upstash Redis (HTTP-based,
// works from serverless/edge, shared across all instances). Falls back to the
// old in-memory behavior ONLY when UPSTASH_REDIS_REST_URL/TOKEN are unset, so
// local dev with no Upstash project configured still works — but production
// must have these env vars set (see .env.example) or this degrades silently
// back to the broken per-instance behavior.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

if (!redis && process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
  // Don't throw — a missing rate limiter shouldn't take down checkout or
  // login — but make it loud in Sentry/logs so it doesn't go unnoticed like
  // the in-memory version did.
  console.error(
    '[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set in production. ' +
      'Rate limiting is falling back to per-instance in-memory tracking, ' +
      'which does not enforce a real limit across serverless instances.',
  )
}

// Cache one Ratelimit instance per (limit, windowMs) pair actually requested,
// since Upstash's Ratelimit constructor is meant to be reused, not built
// fresh per-request. Call sites already pass consistent (limit, windowMs)
// per route, so this cache stays small in practice.
const ratelimiters = new Map<string, Ratelimit>()

function getRatelimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null
  const key = `${limit}:${windowMs}`
  let limiter = ratelimiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: 'harbourview:ratelimit',
      analytics: true,
    })
    ratelimiters.set(key, limiter)
  }
  return limiter
}

// ── In-memory fallback (dev-only path; see note above) ──────────────────────
type LimitWindow = {
  count: number
  resetAt: number
}

const windows = new Map<string, LimitWindow>()

const EVICTION_INTERVAL_MS = 60_000
let lastEvictionAt = 0

function evictExpired(now: number) {
  if (now - lastEvictionAt < EVICTION_INTERVAL_MS) return
  lastEvictionAt = now
  for (const [key, window] of windows) {
    if (now >= window.resetAt) {
      windows.delete(key)
    }
  }
}

function enforceRateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  evictExpired(now)
  const current = windows.get(key)

  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      remaining: limit - 1,
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      remaining: 0,
    }
  }

  current.count += 1
  windows.set(key, current)
  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    remaining: Math.max(0, limit - current.count),
  }
}

// ── Public API (unchanged signature — every existing call site keeps working) ─
export type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
  remaining: number
}

export type RateLimitOptions = {
  route: string
  ip: string
  limit: number
  windowMs: number
  identity?: string | null
}

function hashIdentity(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

/**
 * Enforce a rate limit for (route, ip, identity). Backed by Upstash Redis
 * when configured (shared across all serverless instances — the real fix);
 * falls back to process-local in-memory tracking otherwise (dev-only path,
 * NOT safe as the only protection in production).
 *
 * NOTE: this is now async (previously synchronous) because the Redis path
 * requires a network round trip. All 5 existing call sites have been updated
 * to `await` it as part of this change.
 */
export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const identityKey = options.identity ? `:${hashIdentity(options.identity.toLowerCase())}` : ''
  const key = `${options.route}:${options.ip}${identityKey}`

  const limiter = getRatelimiter(options.limit, options.windowMs)

  if (!limiter) {
    // No Upstash configured — old behavior, scoped per-instance only.
    return enforceRateLimitInMemory(key, options.limit, options.windowMs)
  }

  const { success, remaining, reset } = await limiter.limit(key)
  return {
    allowed: success,
    retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    remaining,
  }
}
