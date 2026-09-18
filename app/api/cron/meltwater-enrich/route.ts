// app/api/cron/meltwater-enrich/route.ts
// Vercel Cron — pulls fresh media mentions from Meltwater and stages them
// as source documents for the existing intelligence-extract / quality pipeline.
//
// Required env:
//   CRON_SECRET
//   MELTWATER_API_KEY
//   MELTWATER_SEARCH_IDS   (comma-separated saved-search IDs)
//
// Optional:
//   MELTWATER_LOOKBACK_HOURS  (default 48)

import { NextRequest, NextResponse } from 'next/server'
import { createMeltwaterClient, mentionToSourceDocument } from '@/lib/connectors/meltwater'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const DEFAULT_LOOKBACK_HOURS = 48
const MAX_MENTIONS_PER_SEARCH = 40

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin credentials missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(req.url).searchParams.get('dry') === '1'
  const lookbackHours = Number(process.env.MELTWATER_LOOKBACK_HOURS ?? DEFAULT_LOOKBACK_HOURS)
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)

  const searchIds = (process.env.MELTWATER_SEARCH_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (searchIds.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'MELTWATER_SEARCH_IDS not configured',
    })
  }

  const client = createMeltwaterClient()
  let totalMentions = 0
  let staged = 0
  const errors: string[] = []

  for (const searchId of searchIds) {
    try {
      const mentions = await client.fetchNewMentions({
        searchId,
        since,
        limit: MAX_MENTIONS_PER_SEARCH,
      })
      totalMentions += mentions.length

      if (dryRun || mentions.length === 0) continue

      // Stage into a lightweight holding table or source_documents.
      // Adjust table/columns to match the live schema (source_documents or
      // a dedicated connector_staging table).
      const supabase = getSupabaseAdmin()
      const rows = mentions.map((m) => ({
        ...mentionToSourceDocument(m),
        discovered_at: new Date().toISOString(),
        source_access_type: 'licensed_database',
        source_permission_status: 'allowed',
        status: 'staged_for_extract',
      }))

      // Best-effort insert; ignore unique violations on external_id.
      const { error } = await supabase.from('source_documents').upsert(rows, {
        onConflict: 'external_id',
        ignoreDuplicates: true,
      })

      if (error) {
        errors.push(`${searchId}: ${error.message}`)
      } else {
        staged += rows.length
      }
    } catch (e) {
      errors.push(`${searchId}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    searchIds: searchIds.length,
    totalMentions,
    staged,
    errors: errors.slice(0, 5),
  })
}
