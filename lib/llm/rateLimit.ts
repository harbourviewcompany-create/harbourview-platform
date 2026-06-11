/**
 * lib/llm/rateLimit.ts
 *
 * Supabase-backed LLM rate limiting.
 *
 * Each user gets a per-minute window tracked in the `llm_rate_limits` table.
 * Uses an atomic upsert so concurrent requests don't race.
 *
 * Falls back to the previous in-memory approach if the DB is unreachable —
 * that fallback is per-instance only (serverless limitation), but it prevents
 * hard failures when the DB is temporarily unavailable.
 */
import 'server-only'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
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
 * Check and increment the per-user rate limit using an atomic Supabase upsert.
 * Returns null if the DB call fails (caller should fall back).
 */
async function checkRateLimitDB(
  userId: string,
  limitPerMinute: number,
  now: Date,
): Promise<RateLimitResult | null> {
  try {
    // Import lazily to avoid bundling server-only code in unexpected contexts
    const { createHarbourviewServiceRoleSupabaseClient } = await import(
      '@/lib/harbourview/supabase/service-role'
    )
    const supabase = createHarbourviewServiceRoleSupabaseClient()

    const window = windowStart(now)
    const resetAt = new Date(window)
    resetAt.setUTCMinutes(resetAt.getUTCMinutes() + 1)

    // Atomic upsert: insert count=1, or increment on conflict
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
    const allowed: boolean = count <= limitPerMinute

    return {
      allowed,
      remaining: Math.max(0, limitPerMinute - count),
      resetAt: resetAt.getTime(),
    }
  } catch (err) {
    console.warn('[llm:rateLimit] DB unreachable, falling back to in-memory', err)
    return null
  }
}

// ── In-memory fallback (per-instance only — use only when DB is unavailable) ──

type RateLimitBucket = { resetAt: number; count: number }
const buckets = new Map<string, RateLimitBucket>()

function checkRateLimitMemory(
  key: string,
  limitPerMinute: number,
  now: number,
): RateLimitResult {
  const safeLimit = Math.max(1, Math.floor(limitPerMinute))
  const bucketKey = key.trim() || 'unknown'
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + 60_000
    buckets.set(bucketKey, { resetAt, count: 1 })
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
 * Uses Supabase for cross-instance accuracy; falls back to in-memory if the
 * DB is unavailable (in-memory is per-instance and resets on cold start).
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

/** Reset in-memory buckets (test helper only). */
export function resetLlmRateLimits() {
  buckets.clear()
}
