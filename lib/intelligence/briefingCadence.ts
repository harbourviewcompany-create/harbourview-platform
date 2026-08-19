import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

/**
 * Briefing cadence preferences re-use signal_subscriptions (markets + frequency)
 * to avoid a new table / migration drift. One row per user (onConflict user_id).
 */

export type BriefingCadence = {
  markets: string[]
  frequency: 'daily' | 'weekly'
  active: boolean
  min_confidence: number
  subscriptionId: string | null
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )
}

const ISO2 = /^[A-Z]{2}$/

export function normalizeMarkets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out = new Set<string>()
  for (const m of raw) {
    if (typeof m !== 'string') continue
    const t = m.trim().toUpperCase()
    if (ISO2.test(t)) out.add(t)
  }
  return Array.from(out).slice(0, 12)
}

export async function getBriefingCadence(userId: string): Promise<BriefingCadence> {
  const svc = serviceClient()
  const { data } = await svc
    .from('signal_subscriptions')
    .select('id, markets, frequency, active, min_confidence')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) {
    return {
      markets: [],
      frequency: 'daily',
      active: false,
      min_confidence: 50,
      subscriptionId: null,
    }
  }

  return {
    markets: normalizeMarkets(data.markets),
    frequency: data.frequency === 'weekly' ? 'weekly' : 'daily',
    active: Boolean(data.active),
    min_confidence:
      typeof data.min_confidence === 'number'
        ? Math.min(100, Math.max(0, data.min_confidence))
        : 50,
    subscriptionId: typeof data.id === 'string' ? data.id : null,
  }
}

export async function upsertBriefingCadence(
  userId: string,
  email: string,
  patch: {
    markets?: string[]
    frequency?: 'daily' | 'weekly'
    active?: boolean
    min_confidence?: number
  },
): Promise<BriefingCadence> {
  const current = await getBriefingCadence(userId)
  const markets = patch.markets !== undefined ? normalizeMarkets(patch.markets) : current.markets
  const frequency = patch.frequency ?? current.frequency
  const active = patch.active ?? current.active
  const min_confidence =
    patch.min_confidence !== undefined
      ? Math.min(100, Math.max(0, patch.min_confidence))
      : current.min_confidence

  const svc = serviceClient()
  const { data, error } = await svc
    .from('signal_subscriptions')
    .upsert(
      {
        user_id: userId,
        email,
        markets,
        types: [],
        min_confidence,
        frequency,
        active,
      },
      { onConflict: 'user_id' },
    )
    .select('id, markets, frequency, active, min_confidence')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to save briefing cadence')
  }

  return {
    markets: normalizeMarkets(data.markets),
    frequency: data.frequency === 'weekly' ? 'weekly' : 'daily',
    active: Boolean(data.active),
    min_confidence:
      typeof data.min_confidence === 'number' ? data.min_confidence : 50,
    subscriptionId: data.id,
  }
}

/** Active daily (or weekly on Mondays) subscribers for cron synthesis warm path. */
export async function listCadenceSubscribersForTick(opts: {
  todayUtc: Date
  limit?: number
}): Promise<{ user_id: string; email: string; markets: string[]; frequency: string }[]> {
  const svc = serviceClient()
  const isMonday = opts.todayUtc.getUTCDay() === 1
  const { data, error } = await svc
    .from('signal_subscriptions')
    .select('user_id, email, markets, frequency')
    .eq('active', true)
    .limit(opts.limit ?? 100)

  if (error || !data) return []

  return data
    .filter((row) => {
      if (row.frequency === 'weekly') return isMonday
      return true
    })
    .map((row) => ({
      user_id: row.user_id as string,
      email: (row.email as string) ?? '',
      markets: normalizeMarkets(row.markets),
      frequency: row.frequency === 'weekly' ? 'weekly' : 'daily',
    }))
}
