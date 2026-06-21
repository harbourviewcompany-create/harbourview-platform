// POST /api/admin/intelligence/synthesize-trigger
// Admin-only endpoint to trigger briefing synthesis for one country or all markets on demand.
// Reuses the same synthesiseJurisdiction() function as the weekly cron and the
// project's standard admin auth check (lib/auth/adminGuard.ts).

import { NextResponse } from 'next/server'
import { getAdminAuthCheck } from '@/lib/auth/adminGuard'
import { synthesiseJurisdiction, SYNTHESIS_MARKETS } from '@/lib/intelligence/jurisdictionSynthesis'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  const authCheck = await getAdminAuthCheck()
  if (!authCheck.ok) {
    return NextResponse.json({ error: 'Forbidden', reason: authCheck.reason }, { status: 403 })
  }

  let body: { iso2?: string; all?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.all) {
    const results: { iso2: string; ok: boolean; signal_count?: number; error?: string }[] = []
    for (const market of SYNTHESIS_MARKETS) {
      try {
        const result = await synthesiseJurisdiction(market.iso2, market.name)
        results.push({
          iso2: market.iso2,
          ok: result.ok,
          signal_count: result.ok ? result.signal_count : undefined,
          error: result.ok ? undefined : result.error,
        })
      } catch (e) {
        results.push({ iso2: market.iso2, ok: false, error: e instanceof Error ? e.message : String(e) })
      }
    }
    return NextResponse.json({
      ok: true,
      mode: 'all',
      succeeded: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      results,
    })
  }

  if (body.iso2) {
    const iso2 = body.iso2.toUpperCase()
    const market = SYNTHESIS_MARKETS.find(m => m.iso2 === iso2)
    if (!market) {
      return NextResponse.json({ error: `${iso2} not in SYNTHESIS_MARKETS` }, { status: 400 })
    }
    try {
      const result = await synthesiseJurisdiction(market.iso2, market.name)
      return NextResponse.json({ iso2, ...result })
    } catch (e) {
      return NextResponse.json({ ok: false, iso2, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ error: 'Provide iso2 or all:true' }, { status: 400 })
}
