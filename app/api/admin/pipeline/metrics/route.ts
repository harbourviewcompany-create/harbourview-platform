// app/api/admin/pipeline/metrics/route.ts
// Returns recent scraper run metrics for the pipeline dashboard.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // For now, return mock/empty data until a metrics table is created
  // In production, this would query a scraper_run_metrics table
  const runs = [
    {
      runId: 'run_latest',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
      totalCandidates: 0,
      totalInserted: 0,
      totalSkipped: 0,
      totalFailed: 0,
      budgetExceeded: false,
      avgFetchLatencyMs: 0,
      avgNormaliseLatencyMs: 0,
      aiApiCalls: 0,
      passthroughRate: 0,
      topErrors: [],
    },
  ]

  return NextResponse.json({ runs })
}
