// lib/marketplace/intakeRateLimit.ts
// IP-based rate limiting for all public intake forms.
// Uses Upstash Redis (edge-compatible) or in-memory fallback.

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

const RATE_LIMIT_WINDOW_SECONDS = 3600 // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() ?? 'unknown'
}

/** In-memory fallback when Redis is unavailable. Bounded via periodic eviction below. */
const memoryStore = new Map<string, { count: number; resetAt: number }>()
const MAX_MEMORY_STORE_SIZE = 10_000
let lastEviction = Date.now()

function evictExpired(): void {
  const now = Date.now()
  if (now - lastEviction < 60_000) return // at most once/minute
  lastEviction = now
  for (const [ip, record] of memoryStore) {
    if (now > record.resetAt) memoryStore.delete(ip)
  }
  // Extreme-traffic fallback: if still over the cap after evicting expired
  // entries, drop the oldest (Map preserves insertion order).
  if (memoryStore.size > MAX_MEMORY_STORE_SIZE) {
    const overBy = memoryStore.size - MAX_MEMORY_STORE_SIZE
    let i = 0
    for (const ip of memoryStore.keys()) {
      if (i++ >= overBy) break
      memoryStore.delete(ip)
    }
  }
}

function memoryCheck(ip: string): { allowed: boolean; remaining: number } {
  evictExpired()
  const now = Date.now()
  const record = memoryStore.get(ip)

  if (!record || now > record.resetAt) {
    memoryStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000 })
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 }
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count }
}

/** Redis-based rate limit check */
async function redisCheck(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    return memoryCheck(ip)
  }

  const key = `intake:ratelimit:${ip}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - RATE_LIMIT_WINDOW_SECONDS

  const script = `
    local key = KEYS[1]
    local window = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local member = ARGV[4]
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
    local count = redis.call('ZCARD', key)
    if count < limit then
      redis.call('ZADD', key, now, member)
      redis.call('EXPIRE', key, window)
      return {1, limit - count - 1}
    end
    return {0, 0}
  `

  try {
    // Upstash's REST API takes the raw Redis command as a JSON array in the
    // body (e.g. ["EVAL", script, numkeys, key, ...args]) -- it does not
    // accept {script, keys, args} as an object. The prior object-shaped body
    // meant every call here failed and silently fell back to memoryCheck,
    // so distributed rate limiting across instances never actually ran.
    const uniqueMember = `${now}:${crypto.randomUUID()}`
    const response = await fetch(REDIS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        script,
        '1',
        key,
        RATE_LIMIT_WINDOW_SECONDS.toString(),
        MAX_REQUESTS_PER_WINDOW.toString(),
        now.toString(),
        uniqueMember,
      ]),
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) throw new Error('Redis error')

    const { result } = (await response.json()) as { result: [number, number] }
    const [allowed, remaining] = result
    return { allowed: allowed === 1, remaining }
  } catch {
    return memoryCheck(ip)
  }
}

/** Middleware-compatible rate limit check */
export async function checkIntakeRateLimit(
  request: NextRequest,
): Promise<{ allowed: boolean; remaining: number; response?: NextResponse }> {
  const ip = getClientIP(request)
  const result = await redisCheck(ip)

  if (!result.allowed) {
    return {
      ...result,
      response: NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': RATE_LIMIT_WINDOW_SECONDS.toString() } },
      ),
    }
  }

  return result
}

/** Route handler wrapper */
export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const { allowed, response } = await checkIntakeRateLimit(request)
    if (!allowed) return response!
    return handler(request)
  }
}
