/**
 * lib/llm/rateLimit.ts
 *
 * Supabase-backed LLM rate limiting.
 *
 * Each user gets a per-minute window tracked in the `llm_rate_limits` table.
 * Uses an atomic upsert so concurrent requests across serverless instances
 * are correctly counted (replacing the previous in-memory Map approach).
 *
 * Falls back to in-memory if the DB is unreachable — that fallback is
 * per-instance only but prevents hard failures during DB outages.
 *
 * Note: `server-only` is intentionally omitted here so that tests can import
 * this module directly in Vitest. The service-role Supabase client (which
 * carries the secret) is only loaded inside `checkRateLimitDB` via a dynamic
 * import, and that module carries its own `server-only` guard.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number  // Unix ms timestamp when the current window resets
}

// ── Supabase-backed implementation ────────────────────────────────────────────

/**
 * Truncate a Date to the start of its UTC minute — the rate-limit window key.
 */
function windowStart(now: Date): string {
  const d = new Date(now)
  d.setUTCSeconds(0, 0)
  return d.toISOString()
}

/**
 * Atomic DB upsert — returns null on any failure so the caller can fall back.
 */
async function checkRateLimitDB(
  userId: string,
  limitPerMinute: number,
  now: Date,
): Promise<RateLimitResult | null> {
  try {
    const { createHarbourviewServiceRoleSupabaseClient } = await import(
      '@/lib/harbourview/supabase/service-role'
    )
    const supabase = createHarbourviewServiceRoleSupabaseClient()

    const window = windowStart(now)
    const resetAt = new Date(window)
    resetAt.setUTCMinutes(resetAt.getUTCMinutes() + 1)

    const { data, error } = await supabase.rpc('check_and_increment_llm_rate_limit', {
      p_user_id: userId,
      p_window_start: window,
      p_limit: limitPerMinute,
    })

    if (error) {
      console.warn('[llm:rateLimit] DB error, falling back to in-memory', error.message)
      return null
    }

    const count: number = data?.count ?? 1
    return {
      allowed: count <= limitPerMinute,
      remaining: Math.max(0, limitPerMinute - count),
      resetAt: resetAt.getTime(),
    }
  } catch (err) {
    console.warn('[llm:rateLimit] DB unreachable, falling back to in-memory', err)
    return null
  }
}

// ── In-memory fallback ────────────────────────────────────────────────────────

type RateLimitBucket = { resetAt: number; count: number }
const buckets = new Map<string, RateLimitBucket>()

function checkRateLimitMemory(
  key: string,
  limitPerMinute: number,
  nowMs: number,
): RateLimitResult {
  const safeLimit = Math.max(1, Math.floor(limitPerMinute))
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= nowMs) {
    const resetAt = nowMs + 60_000
    buckets.set(key, { resetAt, count: 1 })
    return { allowed: true, remaining: safeLimit - 1, resetAt }
  }

  if (existing.count >= safeLimit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { allowed: true, remaining: safeLimit - existing.count, resetAt: existing.resetAt }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check the per-user LLM rate limit.
 *
 * @param userId        The authenticated user's ID.
 * @param limitPerMinute  Maximum requests allowed per 60-second window.
 * @param now           Override the current time (for testing).
 */
export async function checkLlmRateLimit(
  userId: string,
  limitPerMinute: number,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const dbResult = await checkRateLimitDB(userId, limitPerMinute, now)
  if (dbResult !== null) return dbResult
  return checkRateLimitMemory(userId, limitPerMinute, now.getTime())
}

/** Reset in-memory buckets. Exported for use in unit tests only. */
export function resetLlmRateLimits() {
  buckets.clear()
}
