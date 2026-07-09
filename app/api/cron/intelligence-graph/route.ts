// app/api/cron/intelligence-graph/route.ts
// Vercel Cron — promotes ia_signals into the cannabis_intelligence
// provenance chain: source_documents → evidence_claims → regulatory_authorities
//
// Pipeline: intelligence-embed (06:00) → intelligence-notify (07:00)
//           → intelligence-graph (09:00 UTC)
//
// Processes up to BATCH_SIZE signals per run. Fully idempotent via
// ia_signal_graph_log UNIQUE(signal_id).
//
// Required env vars:
//   CRON_SECRET
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  writeSignalToGraph,
  type GraphSignalInput,
} from '@/lib/intelligence-engine/graph-writer'

export const dynamic     = 'force-dynamic'
export const maxDuration = 300

const BATCH_SIZE = 25

// ── Market display name → ISO-2 ───────────────────────────────────────────────
// Mirrors COUNTRY_NAME in intelligence-notify but inverted.
// Extend as source_registry gains new country coverage.
const MARKET_TO_ISO: Record<string, string> = {
  'Canada':          'CA', 'Germany':         'DE', 'Australia':     'AU',
  'United Kingdom':  'GB', 'New Zealand':      'NZ', 'Netherlands':   'NL',
  'Israel':          'IL', 'United States':    'US', 'Portugal':      'PT',
  'Switzerland':     'CH', 'Czech Republic':   'CZ', 'South Africa':  'ZA',
  'Colombia':        'CO', 'Thailand':         'TH', 'Malta':         'MT',
  'Italy':           'IT', 'France':           'FR', 'Spain':         'ES',
  'Sweden':          'SE', 'Denmark':          'DK', 'Norway':        'NO',
  'Poland':          'PL', 'Austria':          'AT', 'Brazil':        'BR',
  'Mexico':          'MX',
}

interface RawSignal {
  id: string
  title: string
  type: string
  market: string | null
  source_name: string | null
  summary: string
  detected_at: string
  confidence: number
  notes: string | null
}

export async function GET(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // ── Fetch unprocessed signals ─────────────────────────────────────────────
  // Pull signals NOT already in ia_signal_graph_log.
  // Overselect then subtract in-memory to avoid NOT EXISTS subquery issues
  // with the Supabase JS client on cross-table checks.
  const { data: candidates, error: fetchErr } = await supabase
    .from('ia_signals')
    .select('id, title, type, market, source_name, summary, detected_at, confidence, notes')
    .order('detected_at', { ascending: true })  // oldest first → fill history forward
    .limit(BATCH_SIZE * 3)

  if (fetchErr) {
    console.error('intelligence_graph_cron: signal fetch error', fetchErr.message)
    return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })
  }

  const allCandidates = (candidates as RawSignal[] | null) ?? []
  if (allCandidates.length === 0)
    return NextResponse.json({ ok: true, processed: 0, written: 0, failed: 0 })

  // Check which are already logged
  const candidateIds = allCandidates.map(r => r.id)
  const { data: logged } = await supabase
    .from('ia_signal_graph_log')
    .select('signal_id')
    .in('signal_id', candidateIds)

  const alreadyLogged = new Set(
    (logged ?? []).map((r: { signal_id: string }) => r.signal_id),
  )

  const toProcess = allCandidates
    .filter(r => !alreadyLogged.has(r.id))
    .slice(0, BATCH_SIZE)

  console.info(
    `intelligence_graph_cron: ${toProcess.length} signals to promote`,
    `(${alreadyLogged.size} already logged)`,
  )

  if (toProcess.length === 0)
    return NextResponse.json({ ok: true, processed: 0, written: 0, failed: 0, skipped: allCandidates.length })

  // ── Process each signal ───────────────────────────────────────────────────
  let written = 0, failed = 0
  const logRows: Record<string, unknown>[] = []

  for (const raw of toProcess) {
    const countryIso = raw.market ? (MARKET_TO_ISO[raw.market] ?? null) : null

    const input: GraphSignalInput = {
      id:          raw.id,
      title:       raw.title,
      type:        raw.type,
      market:      raw.market,
      source_name: raw.source_name,
      summary:     raw.summary,
      detected_at: raw.detected_at,
      confidence:  raw.confidence,
      notes:       raw.notes,
      country_iso: countryIso,
    }

    const result = await writeSignalToGraph(supabase, input)

    logRows.push({
      signal_id:       result.signal_id,
      jurisdiction_id: result.jurisdiction_id,
      claims_written:  result.claims_written,
      entities_written: result.entities_written,
      sources_written: result.sources_written,
      error:           result.error ?? null,
    })

    if (result.error) {
      console.warn(`intelligence_graph_cron: signal ${raw.id} error:`, result.error)
      failed++
    } else {
      written++
    }
  }

  // Bulk insert log rows — UNIQUE(signal_id) prevents duplicates on re-run
  if (logRows.length > 0) {
    const { error: logErr } = await supabase
      .from('ia_signal_graph_log')
      .insert(logRows)
      .onConflict('signal_id') // ignore already-logged
    if (logErr) {
      console.warn('intelligence_graph_cron: log insert error:', logErr.message)
    }
  }

  const summary = {
    ok:        true,
    processed: toProcess.length,
    written,
    failed,
    skipped:   alreadyLogged.size,
  }
  console.info('intelligence_graph_cron: complete', summary)
  return NextResponse.json(summary)
}
