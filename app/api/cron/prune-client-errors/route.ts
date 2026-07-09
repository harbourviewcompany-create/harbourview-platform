// app/api/cron/prune-client-errors/route.ts
// Vercel Cron route — deletes client_error_reports rows older than 30 days.
// anon/authenticated only have INSERT on this table (see
// 20260710160000_client_error_reports.sql), so pruning legitimately needs
// the service-role client. Keeps the table bounded on a public-facing
// insert endpoint without keeping indefinite visitor telemetry.
//
// Secured by CRON_SECRET so only Vercel can trigger it.

import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createSupabaseServiceClient()
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error, count } = await supabase
      .from('client_error_reports')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff)

    if (error) {
      console.error('prune_client_errors_cron: fatal error:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    console.info('prune_client_errors_cron: run complete', { rows_deleted: count ?? 0 })
    return NextResponse.json({ ok: true, rows_deleted: count ?? 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('prune_client_errors_cron: fatal error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
