import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron: promote pending market_access_events into countries.regulatory_tier.
 * Schedule every 10–15 minutes via vercel.json or pg_cron calling this route.
 *
 * Auth: CRON_SECRET bearer (same pattern as other Harbourview crons).
 */
export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'missing supabase env' }, { status: 500 })
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.rpc('promote_market_access_from_signals', {
    p_lookback_hours: 168,
  })

  // RPC lives in api schema; PostgREST may need schema hint depending on config
  if (error) {
    // Fallback: call via raw SQL if exposed only on api schema
    const { data: data2, error: error2 } = await supabase
      .schema('api')
      .rpc('promote_market_access_from_signals', { p_lookback_hours: 168 })

    if (error2) {
      return NextResponse.json(
        { ok: false, error: error.message, fallback: error2.message },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true, result: data2 })
  }

  return NextResponse.json({ ok: true, result: data })
}

export async function POST(request: Request) {
  return GET(request)
}
