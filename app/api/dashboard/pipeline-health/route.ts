/**
 * GET /api/dashboard/pipeline-health
 *
 * Operator-facing intelligence outcome metrics for Command Centre Briefing.
 * Uses the same RPC as cron/intelligence-health, but requires a logged-in user
 * (not CRON_SECRET) so the UI can render feed freshness without elevating cron.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { IntelligenceOutcome } from '@/lib/signals/intelligenceHealth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const userClient = await createServerClient()
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json(
        { ok: false, error: 'service_role_unavailable', status: 'unknown' },
        { status: 503 },
      )
    }

    const admin = createClient(url, key, {
      auth: { persistSession: false },
      db: { schema: SUPABASE_DB_SCHEMA },
    })

    const { data, error } = await admin.rpc('hv_intelligence_outcome_check')
    if (error) {
      console.error('pipeline-health: rpc failed', error.message)
      return NextResponse.json(
        { ok: false, error: error.message, status: 'unknown' },
        { status: 502 },
      )
    }

    const outcome = data as IntelligenceOutcome
    // Strip nothing sensitive — metrics are aggregate product health only.
    return NextResponse.json({
      ok: outcome.ok ?? true,
      status: outcome.status,
      checked_at: outcome.checked_at,
      metrics: outcome.metrics,
      alerts: outcome.alerts?.slice(0, 5) ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error'
    console.error('pipeline-health: unexpected', message)
    return NextResponse.json({ ok: false, error: message, status: 'unknown' }, { status: 500 })
  }
}
