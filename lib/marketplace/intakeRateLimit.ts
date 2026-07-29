// lib/marketplace/intakeRateLimit.ts
// IP-based rate limiting for all public intake forms.
// Uses Upstash Redis (edge-compatible) or in-memory fallback.

import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW_SECONDS = 3600 // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() ?? 'unknown'
}

/** In-memory fallback when Redis is unavailable */
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function memoryCheck(ip: string): { allowed: boolean; remaining: number } {
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

  try {
    // Use Upstash REST API
    const response = await fetch(`${REDIS_URL}/eval`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: `
          local key = KEYS[1]
          local window = tonumber(ARGV[1])
          local limit = tonumber(ARGV[2])
          local now = tonumber(ARGV[3])
          redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
          local count = redis.call('ZCARD', key)
          if count < limit then
            redis.call('ZADD', key, now, now)
            redis.call('EXPIRE', key, window)
            return {1, limit - count - 1}
          end
          return {0, 0}
        `,
        keys: [key],
        args: [RATE_LIMIT_WINDOW_SECONDS.toString(), MAX_REQUESTS_PER_WINDOW.toString(), now.toString()],
      }),
    })

    if (!response.ok) throw new Error('Redis error')

    const [allowed, remaining] = await response.json() as [number, number]
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
