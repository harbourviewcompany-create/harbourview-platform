// app/api/cron/intelligence-ingest/route.ts
// Vercel Cron — runs the Intelligence Engine ingest pipeline on a schedule.
// Pulls active, crawlable sources from source_registry, fetches their content,
// saves raw snapshots, and stages changed content for AI extraction.
//
// Required env vars (in addition to NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY):
//   CRON_SECRET            — already set (shared with other cron routes)
//   HF_INFERENCE_ENDPOINT  — HuggingFace endpoint for signal extraction
//   HF_TOKEN               — HF bearer token (shared with lib/hf/)
//   GEMINI_API_KEY         — optional; enables Gemini 2.5 Flash structured extraction
//
// Secured by CRON_SECRET so only Vercel Cron can trigger it.

import { NextResponse } from 'next/server'
import { IntelligenceOrchestrator } from '@/lib/intelligence-engine/orchestrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — Vercel Pro

// Conservative batch size per invocation — keeps run within maxDuration.
// source_registry.next_crawl_at / cadence_hours handles distribution across runs.
const TARGETS_PER_RUN = 25

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.info('intelligence_ingest_cron: starting run')

  try {
    const engine = new IntelligenceOrchestrator()
    const targets = await engine.getTargets(TARGETS_PER_RUN)

    console.info(`intelligence_ingest_cron: ${targets.length} targets due`)

    if (targets.length === 0) {
      return NextResponse.json({ ok: true, message: 'No targets due', targetsProcessed: 0 })
    }

    await engine.runExtraction(targets)

    console.info('intelligence_ingest_cron: run complete', { targetsProcessed: targets.length })

    return NextResponse.json({ ok: true, targetsProcessed: targets.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('intelligence_ingest_cron: fatal error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
