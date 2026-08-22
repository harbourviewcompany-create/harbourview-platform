/**
 * Ops autonomy loop — minimize human review on commercial intel pipelines.
 * - Auto-reject out-of-scope signals / staging (SEO noise)
 * - Auto-approve high-signal commercial rows (optional, default on)
 * - Country coverage floors + enrichment enqueue
 *
 * Clinical publish gates are NOT touched here.
 * Kill switch: OPS_AUTONOMY_ENABLED=false
 */
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { runCountryCoverageTick } from '@/lib/admin/countryCoverageLoop'
import { synthesiseJurisdictionBatch } from '@/lib/intelligence/jurisdictionSynthesis'

const SCOPE_RE =
  /cannab|cannabis|marijuana|thc|cbd|nabiximols|sativex|epidiolex|hemp|gacp|gmp.?cann|narcotic.?import|bfarm|health.?canada|tga|anvisa|mhra|medical.?cannabis|phytocannabinoid|eu.?gmp|btmg|narcotics.?act/i

const CONSUMER_SPAM_RE =
  /weedmaps|how to buy|order weed|buy weed|visitor'?s? guide|dispensary near|recreational tourism|delivery near me|strain review|best edibles|smoke shop|is weed legal in|is cannabis legal in|is marijuana legal in|business guide 20\d\d|cannabis laws? (in )?(cyprus|dominica|austria|malta|luxembourg)/i

export function isCommercialInScope(text: string | null | undefined): boolean {
  if (!text) return false
  const t = String(text)
  if (CONSUMER_SPAM_RE.test(t)) return false
  if (
    /\bis (weed|cannabis|marijuana) legal\b/i.test(t) &&
    !/\b(bfarm|tga|anvisa|mhra|health canada|eu-?gmp|import permit|narcotic)\b/i.test(t)
  ) {
    return false
  }
  return SCOPE_RE.test(t)
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

export type OpsAutonomyResult = {
  ok: boolean
  disabled?: boolean
  signals_oos_rejected: number
  signals_auto_approved: number
  staging_oos_rejected: number
  staging_auto_approved: number
  coverage?: Awaited<ReturnType<typeof runCountryCoverageTick>>
  briefs?: { iso2: string; ok: boolean; signal_count?: number; error?: string }[]
  at: string
  errors: string[]
}

const BATCH = 400

export async function runOpsAutonomyTick(opts?: {
  autoApproveInScope?: boolean
  runCoverage?: boolean
  runBriefs?: boolean
}): Promise<OpsAutonomyResult> {
  const at = new Date().toISOString()
  const errors: string[] = []

  if (process.env.OPS_AUTONOMY_ENABLED === 'false') {
    return {
      ok: true,
      disabled: true,
      signals_oos_rejected: 0,
      signals_auto_approved: 0,
      staging_oos_rejected: 0,
      staging_auto_approved: 0,
      at,
      errors: [],
    }
  }

  const autoApprove = opts?.autoApproveInScope !== false
  const runCoverage = opts?.runCoverage !== false
  const runBriefs = opts?.runBriefs !== false
  const supabase = serviceClient()

  let signals_oos_rejected = 0
  let signals_auto_approved = 0
  let staging_oos_rejected = 0
  let staging_auto_approved = 0

  // --- Signals: unreviewed batch ---
  try {
    const { data: sigs, error } = await supabase
      .from('signals')
      .select('id, headline, source, pri, reviewed')
      .or('reviewed.is.null,reviewed.eq.false')
      .order('created_at', { ascending: false })
      .limit(BATCH)

    if (error) throw error

    const oosIds: string[] = []
    const approveIds: string[] = []

    for (const s of sigs || []) {
      const text = `${s.headline || ''} ${s.source || ''}`
      if (!isCommercialInScope(text)) {
        oosIds.push(s.id)
      } else if (autoApprove && (s.pri === 'URGENT' || s.pri === 'HIGH')) {
        approveIds.push(s.id)
      }
    }

    if (oosIds.length) {
      const { error: e1 } = await supabase
        .from('signals')
        .update({ reviewed: true, action: 'rejected_oos_auto' })
        .in('id', oosIds)
      if (e1) errors.push(`signals oos: ${e1.message}`)
      else signals_oos_rejected = oosIds.length
    }

    if (approveIds.length) {
      const { error: e2 } = await supabase
        .from('signals')
        .update({ reviewed: true, action: 'approved_auto' })
        .in('id', approveIds)
      if (e2) errors.push(`signals approve: ${e2.message}`)
      else signals_auto_approved = approveIds.length
    }
  } catch (e) {
    errors.push(`signals: ${e instanceof Error ? e.message : String(e)}`)
  }

  // --- Staging: pending batch ---
  try {
    const { data: rows, error } = await supabase
      .from('hv_import_staging')
      .select('id, proposed_title, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(BATCH)

    if (error) throw error

    const oosIds: string[] = []
    const approveIds: string[] = []

    for (const r of rows || []) {
      const text = r.proposed_title || ''
      if (!isCommercialInScope(text)) oosIds.push(r.id)
      else if (autoApprove) approveIds.push(r.id)
    }

    if (oosIds.length) {
      const { error: e1 } = await supabase
        .from('hv_import_staging')
        .update({ status: 'rejected' })
        .in('id', oosIds)
      if (e1) errors.push(`staging oos: ${e1.message}`)
      else staging_oos_rejected = oosIds.length
    }

    if (approveIds.length) {
      const { error: e2 } = await supabase
        .from('hv_import_staging')
        .update({ status: 'approved' })
        .in('id', approveIds)
      if (e2) errors.push(`staging approve: ${e2.message}`)
      else staging_auto_approved = approveIds.length
    }
  } catch (e) {
    errors.push(`staging: ${e instanceof Error ? e.message : String(e)}`)
  }

  let coverage: Awaited<ReturnType<typeof runCountryCoverageTick>> | undefined
  if (runCoverage) {
    try {
      coverage = await runCountryCoverageTick({ applyPriority: true, enqueueEnrichment: true })
    } catch (e) {
      errors.push(`coverage: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  let briefs: OpsAutonomyResult['briefs']
  if (runBriefs && process.env.ANTHROPIC_API_KEY) {
    try {
      const batch = await synthesiseJurisdictionBatch({ limit: 4 })
      briefs = batch.results
    } catch (e) {
      errors.push(`briefs: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return {
    ok: errors.length === 0,
    signals_oos_rejected,
    signals_auto_approved,
    staging_oos_rejected,
    staging_auto_approved,
    coverage,
    briefs,
    at,
    errors,
  }
}

