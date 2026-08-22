/**
 * Country coverage continuous maintenance loop.
 * Keeps registry metadata fresh and enqueues enrichment jobs for agents.
 * Does not invent legal advice — only coverage flags + job queue pressure.
 */
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'

export const PRIORITY_BASELINE: Record<
  string,
  {
    data_completeness: string
    market_access_status: string
    medical_status: string
    opportunity_score: number
  }
> = {
  DE: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 85 },
  CA: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 82 },
  AU: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 78 },
  GB: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 75 },
  UK: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 75 },
  US: { data_completeness: 'partial', market_access_status: 'limited', medical_status: 'limited', opportunity_score: 70 },
  NL: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 72 },
  PT: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 68 },
  ES: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 65 },
  IT: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 64 },
  FR: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 66 },
  PL: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 60 },
  CZ: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 58 },
  IL: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 74 },
  TH: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 62 },
  NZ: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 70 },
  CH: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 71 },
  DK: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 69 },
  SE: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 67 },
  NO: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 66 },
  ZA: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 55 },
  BR: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 58 },
  CO: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 63 },
  MX: { data_completeness: 'seed', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 52 },
  JP: { data_completeness: 'seed', market_access_status: 'limited', medical_status: 'limited', opportunity_score: 48 },
  KR: { data_completeness: 'seed', market_access_status: 'limited', medical_status: 'limited', opportunity_score: 45 },
  MT: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 64 },
  AT: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 61 },
  BE: { data_completeness: 'partial', market_access_status: 'emerging', medical_status: 'emerging', opportunity_score: 60 },
  IE: { data_completeness: 'partial', market_access_status: 'regulated', medical_status: 'regulated', opportunity_score: 63 },
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service credentials missing')
  return createClient(url, key, {
    db: { schema: SUPABASE_DB_SCHEMA || 'public' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export type CoverageTickResult = {
  ok: boolean
  priority_updated: number
  priority_skipped: number
  enrichment_enqueued: boolean
  enrichment_error?: string
  seed_triggered?: boolean
  coverage: Record<string, number>
  at: string
}

export async function runCountryCoverageTick(opts?: {
  applyPriority?: boolean
  enqueueEnrichment?: boolean
}): Promise<CoverageTickResult> {
  const applyPriority = opts?.applyPriority !== false
  const enqueueEnrichment = opts?.enqueueEnrichment !== false
  const supabase = serviceClient()
  const at = new Date().toISOString()

  let priority_updated = 0
  let priority_skipped = 0

  if (applyPriority) {
    const { data: rows, error } = await supabase
      .from('countries')
      .select('id, iso_alpha2, data_completeness, opportunity_score')
      .in('iso_alpha2', Object.keys(PRIORITY_BASELINE))

    if (error) throw new Error(error.message)

    for (const row of rows || []) {
      const iso = String(row.iso_alpha2 || '').toUpperCase()
      const pack = PRIORITY_BASELINE[iso]
      if (!pack) {
        priority_skipped++
        continue
      }
      // Only lift floors — never downgrade full → partial
      const current = String(row.data_completeness || '').toLowerCase()
      if (current === 'full') {
        priority_skipped++
        continue
      }
      const { error: upErr } = await supabase
        .from('countries')
        .update({
          data_completeness: pack.data_completeness,
          market_access_status: pack.market_access_status,
          medical_status: pack.medical_status,
          opportunity_score: Math.max(Number(row.opportunity_score) || 0, pack.opportunity_score),
          updated_at: at,
        })
        .eq('id', row.id)
      if (upErr) priority_skipped++
      else priority_updated++
    }
  }

  let enrichment_enqueued = false
  let enrichment_error: string | undefined
  if (enqueueEnrichment) {
    try {
      const { error } = await supabase.rpc('enqueue_regulatory_enrichment')
      if (error) enrichment_error = error.message
      else enrichment_enqueued = true
    } catch (e) {
      enrichment_error = e instanceof Error ? e.message : String(e)
    }
  }

  // Coverage histogram
  const { data: all } = await supabase.from('countries').select('data_completeness')
  const coverage: Record<string, number> = { stub: 0, seed: 0, partial: 0, full: 0, other: 0, total: 0 }
  for (const r of all || []) {
    coverage.total++
    const k = String(r.data_completeness || '').toLowerCase()
    if (k in coverage) coverage[k]++
    else coverage.other++
  }

  return {
    ok: true,
    priority_updated,
    priority_skipped,
    enrichment_enqueued,
    enrichment_error,
    coverage,
    at,
  }
}
