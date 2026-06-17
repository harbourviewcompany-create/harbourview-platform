// app/api/cron/embed-signals/route.ts
//
// Vercel cron: embeds the curated `signals` corpus (816 rows) with BGE-M3.
// Mirrors intelligence-embed/route.ts which covers ia_signals.
//
// Schedule: 09:00 UTC daily (after scrape at 08:00 UTC).
// Processes 20 signals per run — full corpus embedded in ~41 runs (~6 weeks
// with daily cron, or trigger manually to backfill immediately).
//
// Required env vars:
//   CRON_SECRET, HF_TOKEN_SERVER, HF_ENDPOINT_EMBED_BGE_M3,
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseHfEnv } from '@/lib/hf/env'
import { embedUnprocessedSignals } from '@/lib/hf/pipeline/signalEmbedder'

export const dynamic    = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Gate on HF endpoint ──────────────────────────────────────────────────────
  const hfParse = parseHfEnv()
  if (!hfParse.success || !hfParse.data.HF_ENDPOINT_EMBED_BGE_M3) {
    console.warn('[embed-signals] HF_ENDPOINT_EMBED_BGE_M3 not configured — skipping')
    return NextResponse.json({ ok: false, reason: 'HF_ENDPOINT_EMBED_BGE_M3 not configured', embedded: 0 })
  }

  // ── Run pipeline ─────────────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  try {
    const result = await embedUnprocessedSignals(supabase)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[embed-signals] fatal:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
