/**
 * GET /api/dashboard/marketplace-funnel
 * Authenticated funnel metrics for Command Briefing.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { buildMarketplaceFunnelMetrics } from '@/lib/dashboard/marketplaceFunnelMetrics'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const userClient = await createServerClient()
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'service_role_unavailable' }, { status: 503 })
    }

    const admin = createClient(url, key, {
      auth: { persistSession: false },
      db: { schema: SUPABASE_DB_SCHEMA },
    })

    const [openRes, contactedRes, qualifiedRes, notFitRes, closedRes, wantedRes, listingsRes] =
      await Promise.all([
        admin
          .from('marketplace_inquiries')
          .select('*', { count: 'exact', head: true })
          .in('review_status', ['received', 'reviewing']),
        admin
          .from('marketplace_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('review_status', 'contacted'),
        admin
          .from('marketplace_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('review_status', 'qualified'),
        admin
          .from('marketplace_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('review_status', 'not_fit'),
        admin
          .from('marketplace_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('review_status', 'closed'),
        admin
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('marketplace_section', 'wanted_requests')
          .eq('status', 'approved'),
        admin
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .neq('marketplace_section', 'wanted_requests'),
      ])

    const metrics = buildMarketplaceFunnelMetrics({
      receivedReviewing: openRes.count ?? 0,
      contacted: contactedRes.count ?? 0,
      qualified: qualifiedRes.count ?? 0,
      notFit: notFitRes.count ?? 0,
      closed: closedRes.count ?? 0,
      wanted: wantedRes.count ?? 0,
      listings: listingsRes.count ?? 0,
    })

    return NextResponse.json({ ok: true, metrics })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error'
    console.error('marketplace-funnel:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
