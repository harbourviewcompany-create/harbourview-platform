// POST /api/admin/intelligence/synthesize-trigger
// Admin-only endpoint to trigger briefing synthesis for one country or all markets on demand.
// Reuses the same synthesiseJurisdiction() function as the weekly cron.
// Auth: admin session cookie (same gate as all /admin/(protected) routes).

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { synthesiseJurisdiction, SYNTHESIS_MARKETS } from '@/lib/intelligence/jurisdictionSynthesis'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function verifyAdmin(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  const cookieStore = await cookies()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const client = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Cookie: cookieStore.toString() } },
  })

  const { data: { user } } = await client.auth.getUser()
  if (!user) return false

  const svc = createClient(url, key, { auth: { persistSession: false } })
  const { data } = await svc
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return data?.role === 'admin'
}

export async function POST(request: Request) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { iso2?: string; all?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.all) {
    // Synthesise all markets — same as cron
    const results: { iso2: string; ok: boolean; signal_count?: number; error?: string }[] = []
    for (const market of SYNTHESIS_MARKETS) {
      try {
        const result = await synthesiseJurisdiction(market.iso2, market.name)
        results.push({
          iso2: market.iso2,
          ok: result.ok,
          signal_count: result.ok ? result.signal_count : undefined,
          error: result.ok ? undefined : (result as { error: string }).error,
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
      return NextResponse.json({ ok: result.ok, iso2, ...result })
    } catch (e) {
      return NextResponse.json({ ok: false, iso2, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ error: 'Provide iso2 or all:true' }, { status: 400 })
}
