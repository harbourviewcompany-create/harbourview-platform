/**
 * Simple in-memory rate limiter for Edge/Node route handlers.
 * For production at scale, replace with Redis-backed implementation.
 *
 * Limits: max LIMIT requests per WINDOW_MS per IP.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000 // 1 minute
const LIMIT = 5          // 5 inquiries per IP per minute

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(ip: string, limit = LIMIT, windowMs = WINDOW_MS): RateLimitResult {
  const now = Date.now()

  // Purge expired entries occasionally
  if (store.size > 10_000) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }

  const existing = store.get(ip)

  if (!existing || existing.resetAt < now) {
    const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs }
    store.set(ip, entry)
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt }
  }

  existing.count++
  const remaining = Math.max(0, limit - existing.count)
  return { allowed: existing.count <= limit, remaining, resetAt: existing.resetAt }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return 'unknown'
}
