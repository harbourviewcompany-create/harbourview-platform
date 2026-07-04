// app/api/cron/regulatory-enrichment/route.ts
// Vercel Cron route — calls api.enqueue_regulatory_enrichment(), which
// scans v_regulatory_format_stale (unverified/stale/verified-but-uncited
// pathways and rules, plus pending regulatory changes that have come due)
// and enqueues prioritized rows into public.intelligence_jobs with
// job_type='regulatory_format_enrichment'. Producer-only: this route does
// not process jobs, it just keeps the queue populated. Insertion is
// idempotent (skips entities that already have a pending/in_progress job),
// so re-running this early or on overlap is harmless.
//
// Secured by CRON_SECRET so only Vercel can trigger it.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // single INSERT...SELECT against an existing view; should be fast

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('regulatory_enrichment_cron: missing Supabase env vars')
    return NextResponse.json({ ok: false, error: 'Supabase env vars missing' }, { status: 503 })
  }

  console.info('regulatory_enrichment_cron: starting run')

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })

  try {
    const { data, error } = await supabase.rpc('enqueue_regulatory_enrichment')

    if (error) {
      console.error('regulatory_enrichment_cron: fatal error:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const jobsEnqueued = typeof data === 'number' ? data : 0
    console.info('regulatory_enrichment_cron: run complete', { jobs_enqueued: jobsEnqueued })

    return NextResponse.json({ ok: true, jobs_enqueued: jobsEnqueued })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('regulatory_enrichment_cron: fatal error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
