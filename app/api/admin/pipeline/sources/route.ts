// app/api/admin/pipeline/sources/route.ts
// Returns scraper source health data for the pipeline dashboard.
// Protected by admin auth (server-guarded, not client-side).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  // Verify admin role server-side
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

  const { data: states, error } = await supabase
    .from('scraper_source_state')
    .select(`
      source_id,
      last_success_at,
      last_run_at,
      consecutive_failures,
      last_error,
      cadence_hours,
      tier
    `)
    .order('consecutive_failures', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map to health status
  const sources = (states ?? []).map((s) => {
    let status: 'healthy' | 'degraded' | 'failing' = 'healthy'
    if (s.consecutive_failures >= 3) status = 'failing'
    else if (s.consecutive_failures >= 1) status = 'degraded'

    return {
      id: s.source_id,
      name: s.source_id, // Could join source_registry for display names
      status,
      consecutiveFailures: s.consecutive_failures ?? 0,
      lastSuccessAt: s.last_success_at,
      lastError: s.last_error,
      cadenceHours: s.cadence_hours ?? 24,
      tier: s.tier ?? 3,
    }
  })

  return NextResponse.json({ sources })
}
