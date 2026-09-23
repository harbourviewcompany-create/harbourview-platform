// app/api/admin/intelligence-health/route.ts
// Operations dashboard for the intelligence pipeline.
// Infrastructure metrics + product-outcome check (Stage G).
// Secured by CRON_SECRET (ops-team access only).

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import {
  summarizeOutcome,
  type IntelligenceOutcome,
} from '@/lib/signals/intelligenceHealth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )

  // Product outcomes use public schema RPC (service role, no schema override).
  const publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const stale24h = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const stale7d  = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [
    { count: pendingExtraction },
    { count: staleExtraction },
    { count: totalSources },
    { count: activeSources },
    { count: offlineSources },
    { count: degradedSources },
    { data: topFailers },
    { data: circuitRows },
    { data: coverageRows },
    { data: trajectoryRows },
    { count: signalCount7d },
    outcomeRpc,
    { count: decisionEvents7d },
    { count: autonomyPoliciesCount },
    { count: sourceYieldMetricsCount },
  ] = await Promise.all([
    supabase.from('source_snapshots').select('*', { count: 'exact', head: true })
      .eq('processing_status', 'pending_extraction'),
    supabase.from('source_snapshots').select('*', { count: 'exact', head: true })
      .eq('processing_status', 'pending_extraction')
      .lt('captured_at', stale24h),
    supabase.from('source_registry').select('*', { count: 'exact', head: true }),
    supabase.from('source_registry').select('*', { count: 'exact', head: true })
      .eq('is_active', true).eq('crawl_allowed', true),
    supabase.from('source_registry').select('*', { count: 'exact', head: true })
      .eq('network_status', 'offline'),
    supabase.from('source_registry').select('*', { count: 'exact', head: true })
      .eq('network_status', 'degraded'),
    supabase.from('source_registry')
      .select('id, source_name, iso, consecutive_failures, last_error_log, next_crawl_at')
      .gt('consecutive_failures', 3)
      .order('consecutive_failures', { ascending: false })
      .limit(20),
    supabase.from('crawl_domain_circuit_state')
      .select('domain, failure_count, state, updated_at')
      .eq('state', 'open')
      .order('failure_count', { ascending: false })
      .limit(20),
    supabase.from('source_registry')
      .select('iso')
      .eq('is_active', true),
    supabase.from('hv_regulatory_trajectory')
      .select('iso, trajectory, sentiment_score, period_end')
      .order('period_end', { ascending: false })
      .limit(50),
    supabase.from('ia_signals').select('*', { count: 'exact', head: true })
      .gte('detected_at', stale7d.slice(0, 10)),
    publicClient.rpc('hv_intelligence_outcome_check'),
    publicClient
      .from('signal_decision_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', stale7d),
    publicClient
      .from('autonomy_policies')
      .select('*', { count: 'exact', head: true }),
    publicClient
      .from('source_yield_metrics')
      .select('*', { count: 'exact', head: true }),
  ])

  const isoSet = new Set((coverageRows ?? []).map((r: { iso: string | null }) => r.iso).filter(Boolean))

  const { data: crawlTimes } = await supabase
    .from('source_registry')
    .select('next_crawl_at, network_status')
    .eq('is_active', true)
    .not('next_crawl_at', 'is', null)
    .order('next_crawl_at', { ascending: false })
    .limit(1)

  const lastCrawlAt = crawlTimes?.[0]?.next_crawl_at ?? null

  let product_outcome: IntelligenceOutcome | null = null
  let product_summary: string | null = null
  if (!outcomeRpc.error && outcomeRpc.data) {
    product_outcome = outcomeRpc.data as IntelligenceOutcome
    product_summary = summarizeOutcome(product_outcome)
  }

  return NextResponse.json({
    ok: true,
    product_outcome,
    product_summary,
    product_outcome_error: outcomeRpc.error?.message ?? null,
    snapshot_backlog: {
      pending_extraction: pendingExtraction ?? 0,
      stale_over_24h:     staleExtraction ?? 0,
    },
    sources: {
      total:    totalSources ?? 0,
      active:   activeSources ?? 0,
      offline:  offlineSources ?? 0,
      degraded: degradedSources ?? 0,
      jurisdictions_covered: isoSet.size,
      last_crawl_scheduled:  lastCrawlAt,
    },
    top_failing_sources: (topFailers ?? []).map((r: {
      id: string; source_name: string; iso: string | null;
      consecutive_failures: number | null; last_error_log: string | null; next_crawl_at: string | null;
    }) => ({
      id:                   r.id,
      source_name:          r.source_name,
      iso:                  r.iso,
      consecutive_failures: r.consecutive_failures,
      last_error:           r.last_error_log?.slice(0, 200),
      next_crawl_at:        r.next_crawl_at,
    })),
    circuit_breakers_open: (circuitRows ?? []).map((r: {
      domain: string; failure_count: number | null; state: string; updated_at: string;
    }) => ({
      domain:        r.domain,
      failure_count: r.failure_count,
      updated_at:    r.updated_at,
    })),
    trajectory_summary: (trajectoryRows ?? []).reduce<Record<string, string>>((acc: Record<string, string>, r: {
      iso: string; trajectory: string; sentiment_score: number | null; period_end: string;
    }) => {
      if (!acc[r.iso]) acc[r.iso] = r.trajectory
      return acc
    }, {}),
    signals_last_7d: signalCount7d ?? 0,
    signal_engine: {
      decision_events_7d: decisionEvents7d ?? 0,
      autonomy_policies_count: autonomyPoliciesCount ?? 0,
      source_yield_metrics_count: sourceYieldMetricsCount ?? 0,
      note: 'Counts require migrations 20260923120000 / 20260923140000 / 20260923160000 applied.',
    },
    generated_at:    new Date().toISOString(),
  })
}
