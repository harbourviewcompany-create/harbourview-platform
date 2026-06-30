// app/api/cron/intelligence-extract/route.ts
// Vercel Cron — reads hv_import_staging rows with status='staged' and runs
// IntelligenceProcessor (Gemini 2.5 Flash) to extract structured signals,
// writing results to ia_signals (admin review queue) AND hv_artifacts
// (canonical searchable store, consumed by public.hv_search_artifacts()).
//
// Pipeline: intelligence-ingest (02:00 UTC) → intelligence-extract (04:00 UTC)
//           → embed-artifacts (05:00 UTC)
// Processes up to BATCH_SIZE staged rows per invocation.
//
// CHANGE (2026-06-17): added hv_artifacts insert. Previously this route only
// wrote to ia_signals, so even successful extractions never became
// semantically searchable — hv_search_artifacts() has nothing to query
// against without a matching hv_artifacts + hv_embeddings row.
//
// Required env vars:
//   CRON_SECRET                     — shared cron bearer token
//   GEMINI_API_KEY                  — Gemini 2.5 Flash structured extraction (free tier)
//   NEXT_PUBLIC_SUPABASE_URL        — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY       — service-role key (bypasses RLS)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { IntelligenceProcessor } from '@/lib/ai/intelligence-processor'
import type { IntelligenceRecord } from '@/lib/scraper/types'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — Vercel Pro

const BATCH_SIZE = 50

// Canonical Harbourview workspace — matches the default param in
// public.hv_search_artifacts() and every existing hv_artifacts row.
const HV_WORKSPACE_ID = 'a85840b4-c522-4cb8-9097-2f6c30a78417'

// ── Country code → market display name ───────────────────────────────────────
// iso_code column in source_registry uses 2-char ISO; proposed_country_iso may
// be 2-char or 3-char depending on the trigger backfill. Both sets included.
const COUNTRY_NAME: Record<string, string> = {
  // ISO-2
  CA: 'Canada', DE: 'Germany', AU: 'Australia', GB: 'United Kingdom',
  NZ: 'New Zealand', NL: 'Netherlands', PT: 'Portugal', IL: 'Israel',
  CO: 'Colombia', BR: 'Brazil', MX: 'Mexico', US: 'United States',
  CH: 'Switzerland', AT: 'Austria', CZ: 'Czech Republic', DK: 'Denmark',
  SE: 'Sweden', NO: 'Norway', PL: 'Poland', ZA: 'South Africa',
  TH: 'Thailand', MT: 'Malta', IT: 'Italy', FR: 'France', ES: 'Spain',
  // ISO-3 (from ScrapeTargetSchema)
  CAN: 'Canada', DEU: 'Germany', AUS: 'Australia', GBR: 'United Kingdom',
  NZL: 'New Zealand', NLD: 'Netherlands', PRT: 'Portugal', ISR: 'Israel',
  COL: 'Colombia', BRA: 'Brazil', MEX: 'Mexico', USA: 'United States',
  CHE: 'Switzerland', AUT: 'Austria', CZE: 'Czech Republic', DNK: 'Denmark',
  SWE: 'Sweden', NOR: 'Norway', POL: 'Poland', ZAF: 'South Africa',
  THA: 'Thailand', MLT: 'Malta', ITA: 'Italy', FRA: 'France', ESP: 'Spain',
}

// ── IntelligenceRecord.signal_type → ia_signals.type ────────────────────────
const SIGNAL_TYPE_MAP: Record<string, string> = {
  regulatory: 'regulatory_change',
  trade:      'trade_signal',
  market:     'market_entry_opportunity',
  scientific: 'research_update',
  other:      'general',
  Watchlist:  'watchlist',
}

// ── impact_level → confidence integer (0-100) ────────────────────────────────
const IMPACT_CONFIDENCE: Record<string, number> = {
  Low: 40, Medium: 65, High: 85, Critical: 95,
}

// ── impact_level → ia_signals.commercial_impact ──────────────────────────────
const IMPACT_COMMERCIAL: Record<string, 'low' | 'medium' | 'high'> = {
  Low: 'low', Medium: 'medium', High: 'high', Critical: 'high',
}

interface StagingRow {
  id: string
  source_record_id: string
  source_url: string | null
  proposed_country_iso: string | null
  raw_payload: { text?: string } | null
  status: string
  created_at: string
}

/** Map an IntelligenceRecord to an ia_signals insert row. */
function toSignalRow(
  record: IntelligenceRecord,
  sourceName: string,
  countryIso: string,
): Record<string, unknown> {
  const market = COUNTRY_NAME[countryIso] ?? countryIso

  const category =
    record.industrial_impact ? 'hemp' :
    'cannabis inventory'

  const notesParts: string[] = []
  if (record.entities_mentioned.length > 0)
    notesParts.push(`Entities: ${record.entities_mentioned.slice(0, 10).join(', ')}`)
  if (record.regulatory_changes?.length)
    notesParts.push(`Regulatory: ${record.regulatory_changes.slice(0, 5).join(' | ')}`)
  if (record.licensing_updates?.length)
    notesParts.push(`Licensing: ${record.licensing_updates.slice(0, 5).join(' | ')}`)
  if (record.trade_route_information?.length)
    notesParts.push(`Trade: ${record.trade_route_information.slice(0, 5).join(' | ')}`)

  return {
    id:                crypto.randomUUID(),
    title:             record.title.slice(0, 500),
    type:              SIGNAL_TYPE_MAP[record.signal_type] ?? 'general',
    stage:             'new' as const,
    source_id:         null, // ia_sources uses a separate ID space; manual linkage
    source_name:       sourceName.slice(0, 300),
    market,
    category,
    confidence:        IMPACT_CONFIDENCE[record.impact_level] ?? 60,
    commercial_impact: IMPACT_COMMERCIAL[record.impact_level] ?? 'medium',
    summary:           record.summary.slice(0, 5000),
    detected_at:       new Date().toISOString().slice(0, 10),
    notes:             notesParts.length > 0 ? notesParts.join('\n') : null,
  }
}

/**
 * Map an IntelligenceRecord to an hv_artifacts insert row.
 * object_class='ai_summary' — the enum has no dedicated regulatory/trade/
 * market buckets, so all Gemini-extracted records land here uniformly with
 * the original signal_type/impact_level preserved in structured_data.
 * lifecycle_stage='normalized' and review_status='pending' — extracted
 * content needs an analyst pass before it is publication-eligible.
 */
function toArtifactRow(
  record: IntelligenceRecord,
  sourceUrl: string,
  countryIso: string,
): Record<string, unknown> {
  return {
    workspace_id:      HV_WORKSPACE_ID,
    object_class:      'ai_summary',
    classification:    'internal',
    title:             record.title.slice(0, 500),
    body:              record.summary,
    structured_data: {
      signal_type:             record.signal_type,
      impact_level:            record.impact_level,
      entities_mentioned:      record.entities_mentioned,
      medical_impact:          record.medical_impact ?? null,
      adult_use_impact:        record.adult_use_impact ?? null,
      industrial_impact:       record.industrial_impact ?? null,
      regulatory_changes:      record.regulatory_changes ?? [],
      licensing_updates:       record.licensing_updates ?? [],
      trade_route_information: record.trade_route_information ?? [],
      extracted_by:            'gemini-2.5-flash',
    },
    source_system:     'intelligence_engine_extract',
    source_record_id:  record.source_id,
    source_url:        sourceUrl || null,
    content_hash:      record.raw_content_reference,
    lifecycle_stage:   'normalized',
    review_status:     'pending',
    jurisdiction_code: countryIso,
    country_iso:       countryIso.length === 2 ? countryIso : null,
    public_eligible:   false,
  }
}

export async function GET(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Gate on Gemini key (GEMINI_API_KEY takes priority; GOOGLE_API_KEY is the fallback) ─
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.warn('intelligence_extract_cron: neither GEMINI_API_KEY nor GOOGLE_API_KEY set — skipping run')
    return NextResponse.json({
      ok:        false,
      reason:    'GEMINI_API_KEY (or GOOGLE_API_KEY) not configured',
      staged:    0,
      extracted: 0,
      failed:    0,
    })
  }

  // ── Supabase client (service-role) ──────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )

  // ── Pull staged rows ────────────────────────────────────────────────────────
  const { data: rows, error: fetchErr } = await supabase
    .from('hv_import_staging')
    .select('id, source_record_id, source_url, proposed_country_iso, raw_payload, status, created_at')
    .eq('status', 'staged')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchErr) {
    console.error('intelligence_extract_cron: fetch error', fetchErr.message)
    return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 })
  }

  const staged = (rows as StagingRow[] | null) ?? []
  console.info(`intelligence_extract_cron: ${staged.length} staged rows`)

  if (staged.length === 0)
    return NextResponse.json({ ok: true, staged: 0, extracted: 0, failed: 0, skipped: 0 })

  // ── Bulk-fetch source names from source_registry ────────────────────────────
  const sourceIds = [...new Set(staged.map(r => r.source_record_id).filter(Boolean))]
  const { data: sourceRows } = await supabase
    .from('source_registry')
    .select('id, source_name')
    .in('id', sourceIds)

  const sourceNameMap = new Map<string, string>(
    (sourceRows ?? []).map((s: { id: string; source_name: string }) => [s.id, s.source_name]),
  )

  // ── Process each row ────────────────────────────────────────────────────────
  const processor = new IntelligenceProcessor()
  let extracted = 0, failed = 0, skipped = 0, artifactsCreated = 0

  for (const row of staged) {
    const rawText    = row.raw_payload?.text ?? ''
    const countryIso = row.proposed_country_iso ?? 'GLOBAL'
    const sourceName = sourceNameMap.get(row.source_record_id) ?? row.source_url ?? 'Unknown Source'

    // Skip rows with insufficient content
    if (!rawText || rawText.trim().length < 100) {
      await supabase
        .from('hv_import_staging')
        .update({ status: 'extraction_skipped' })
        .eq('id', row.id)
      skipped++
      continue
    }

    try {
      const record = await processor.processContent(
        row.source_record_id,
        countryIso,
        rawText,
      )

      if (!record) {
        await supabase
          .from('hv_import_staging')
          .update({ status: 'extraction_failed' })
          .eq('id', row.id)
        failed++
        continue
      }

      const signalRow = toSignalRow(record, sourceName, countryIso)

      const { error: insertErr } = await supabase
        .from('ia_signals')
        .insert(signalRow)

      if (insertErr) {
        console.error(
          `intelligence_extract_cron: ia_signals insert failed (staging_id=${row.id}):`,
          insertErr.message,
        )
        await supabase
          .from('hv_import_staging')
          .update({ status: 'extraction_failed' })
          .eq('id', row.id)
        failed++
        continue
      }

      // Also write to hv_artifacts so this content becomes semantically
      // searchable once embed-artifacts cron picks it up. Best-effort —
      // an hv_artifacts failure doesn't roll back the ia_signals write,
      // since the admin review queue is the more critical path.
      const artifactRow = toArtifactRow(record, row.source_url ?? '', countryIso)
      const { error: artifactErr } = await supabase
        .from('hv_artifacts')
        .insert(artifactRow)

      if (artifactErr) {
        console.error(
          `intelligence_extract_cron: hv_artifacts insert failed (staging_id=${row.id}):`,
          artifactErr.message,
        )
      } else {
        artifactsCreated++
      }

      // Mark staging row done
      await supabase
        .from('hv_import_staging')
        .update({ status: 'extracted' })
        .eq('id', row.id)

      // Advance source_snapshot processing status so the snapshot dashboard
      // correctly reflects completion rather than hanging in pending_extraction.
      await supabase
        .from('source_snapshots')
        .update({ processing_status: 'extraction_complete' })
        .eq('source_id', row.source_record_id)
        .eq('processing_status', 'pending_extraction')

      extracted++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`intelligence_extract_cron: unhandled error (staging_id=${row.id}):`, msg)
      await supabase
        .from('hv_import_staging')
        .update({ status: 'extraction_failed' })
        .eq('id', row.id)
      failed++
    }
  }

  // ── ALSO process source_snapshots with pending_extraction ────────────────────
  // IntelligenceOrchestrator writes directly to source_snapshots (not
  // hv_import_staging) — bridge those into the extraction pipeline here.
  const { data: snapRows } = await supabase
    .from('source_snapshots')
    .select('id, source_id, captured_url, captured_text, captured_at')
    .eq('processing_status', 'pending_extraction')
    .not('captured_text', 'is', null)
    .order('captured_at', { ascending: true })
    .limit(BATCH_SIZE)

  let snapExtracted = 0, snapFailed = 0, snapSkipped = 0

  if (snapRows && snapRows.length > 0) {
    const snapSourceIds = [...new Set(snapRows.map((r: { source_id: string }) => r.source_id).filter(Boolean))]
    const { data: snapSources } = await supabase
      .from('source_registry')
      .select('id, source_name, iso')
      .in('id', snapSourceIds)

    const snapSourceMap = new Map<string, { source_name: string; iso: string }>(
      ((snapSources ?? []) as Array<{ id: string; source_name: string; iso: string }>)
        .map(s => [s.id, { source_name: s.source_name, iso: s.iso }])
    )

    for (const snap of snapRows as Array<{ id: string; source_id: string; captured_url: string | null; captured_text: string | null; captured_at: string }>) {
      const rawText    = snap.captured_text ?? ''
      const src        = snapSourceMap.get(snap.source_id)
      const countryIso = src?.iso ?? 'GLOBAL'
      const sourceName = src?.source_name ?? snap.captured_url ?? 'Unknown Source'

      if (!rawText || rawText.trim().length < 100) {
        await supabase
          .from('source_snapshots')
          .update({ processing_status: 'extraction_skipped' })
          .eq('id', snap.id)
        snapSkipped++
        continue
      }

      // Dedup: skip if an artifact with this content hash already exists
      const contentHash = crypto.createHash('sha256').update(rawText).digest('hex')
      const { data: existingArtifact } = await supabase
        .from('hv_artifacts')
        .select('id')
        .eq('content_hash', contentHash)
        .limit(1)
        .maybeSingle()

      if (existingArtifact) {
        await supabase
          .from('source_snapshots')
          .update({ processing_status: 'extraction_complete' })
          .eq('id', snap.id)
        snapSkipped++
        continue
      }

      try {
        const record = await processor.processContent(snap.source_id, countryIso, rawText)

        if (!record) {
          await supabase
            .from('source_snapshots')
            .update({ processing_status: 'extraction_failed' })
            .eq('id', snap.id)
          snapFailed++
          continue
        }

        const signalRow   = toSignalRow(record, sourceName, countryIso)
        const artifactRow = toArtifactRow(record, snap.captured_url ?? '', countryIso)

        const { error: sigErr } = await supabase.from('ia_signals').insert(signalRow)
        if (sigErr) {
          console.error(`intelligence_extract_cron: ia_signals insert failed (snapshot=${snap.id}):`, sigErr.message)
          await supabase.from('source_snapshots').update({ processing_status: 'extraction_failed' }).eq('id', snap.id)
          snapFailed++
          continue
        }

        const { error: artErr } = await supabase.from('hv_artifacts').insert(artifactRow)
        if (artErr) {
          console.error(`intelligence_extract_cron: hv_artifacts insert failed (snapshot=${snap.id}):`, artErr.message)
        } else {
          artifactsCreated++
        }

        await supabase
          .from('source_snapshots')
          .update({ processing_status: 'extraction_complete' })
          .eq('id', snap.id)

        snapExtracted++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`intelligence_extract_cron: unhandled error (snapshot=${snap.id}):`, msg)
        await supabase.from('source_snapshots').update({ processing_status: 'extraction_failed' }).eq('id', snap.id)
        snapFailed++
      }
    }
  }

  // ── Dead letter: requeue failed snapshots older than 1 h ────────────────────
  // Snapshots stuck in extraction_failed for >1 h are eligible for a retry.
  // We only requeue (not re-extract) here — the next cron invocation picks them up.
  const stale1h = new Date(Date.now() - 3_600_000).toISOString()
  const { data: dlRows } = await supabase
    .from('source_snapshots')
    .select('id')
    .eq('processing_status', 'extraction_failed')
    .lt('captured_at', stale1h)
    .not('captured_text', 'is', null)
    .limit(10)

  let requeued = 0
  if (dlRows?.length) {
    const { error: requeueErr } = await supabase
      .from('source_snapshots')
      .update({ processing_status: 'pending_extraction' })
      .in('id', dlRows.map((r: { id: string }) => r.id))
    if (!requeueErr) requeued = dlRows.length
  }

  const summary = {
    ok: true,
    // hv_import_staging pipeline
    staged: staged.length, extracted, artifactsCreated, failed, skipped,
    // source_snapshots pipeline
    snapshots_queued:    snapRows?.length ?? 0,
    snapshots_extracted: snapExtracted,
    snapshots_failed:    snapFailed,
    snapshots_skipped:   snapSkipped,
    // dead letter
    dead_letter_requeued: requeued,
  }
  console.info('intelligence_extract_cron: run complete', summary)
  return NextResponse.json(summary)
}
