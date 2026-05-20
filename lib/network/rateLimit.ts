import { createHash } from 'node:crypto'

type LimitWindow = {
  count: number
  resetAt: number
}

const windows = new Map<string, LimitWindow>()

const EVICTION_INTERVAL_MS = 60_000
let lastEvictionAt = 0

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

function evictExpired(now: number) {
  if (now - lastEvictionAt < EVICTION_INTERVAL_MS) return
  lastEvictionAt = now
  for (const [key, window] of windows) {
    if (now >= window.resetAt) {
      windows.delete(key)
    }
  }
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

export function enforceRateLimit(options: RateLimitOptions): RateLimitResult {
  const identityKey = options.identity ? `:${hashIdentity(options.identity.toLowerCase())}` : ''
  const key = `${options.route}:${options.ip}${identityKey}`
  const now = Date.now()
  evictExpired(now)
  const current = windows.get(key)

  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + options.windowMs })
    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      remaining: options.limit - 1,
    }
  }

  if (current.count >= options.limit) {
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
    remaining: Math.max(0, options.limit - current.count),
  }
}
