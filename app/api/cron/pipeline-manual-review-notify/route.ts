// app/api/cron/pipeline-manual-review-notify/route.ts
// Vercel Cron — daily check of pipeline_manual_review_queue.
//
// Runs at 10:00 UTC, after the digest cron window (run_daily_digest /
// run_editorial_digest fire 06:00-09:00 UTC) has closed. Any pipeline row
// (daily_digest, editorial_digest, signal_extraction) that landed in the
// manual-review queue because every configured LLM provider was circuit-
// broken gets rolled into one email so it doesn't just sit silent in a
// table nobody queries.
//
// Idempotent — only picks up rows where notified_at is still null, then
// stamps them, so a duplicate cron fire or manual re-run can't double-send.
//
// Required env vars:
//   CRON_SECRET
//   RESEND_API_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   HARBOURVIEW_PIPELINE_REVIEW_NOTIFY_EMAIL (or HARBOURVIEW_TO_EMAIL)
//   HARBOURVIEW_FROM_EMAIL (optional, defaults to signals@harbourview.co)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { sendManualReviewDigest, type ManualReviewRow } from '@/lib/pipeline/manualReviewNotification'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )

  const { data, error } = await supabase
    .from('pipeline_manual_review_queue')
    .select('id, pipeline, reference_date, reason, detail, created_at')
    .is('notified_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('pipeline_manual_review_notify_cron: query error', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const rows = (data as ManualReviewRow[] | null) ?? []
  if (rows.length === 0)
    return NextResponse.json({ ok: true, pending: 0, sent: false })

  const result = await sendManualReviewDigest(rows)

  if (result.status !== 'sent') {
    console.warn('pipeline_manual_review_notify_cron: send skipped', result)
    return NextResponse.json({ ok: true, pending: rows.length, sent: false, result })
  }

  await supabase
    .from('pipeline_manual_review_queue')
    .update({ notified_at: new Date().toISOString() })
    .in('id', rows.map(r => r.id))

  console.info('pipeline_manual_review_notify_cron: sent', { to: result.to, count: result.count })
  return NextResponse.json({ ok: true, pending: rows.length, sent: true, to: result.to })
}
