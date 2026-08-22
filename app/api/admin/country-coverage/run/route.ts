/**
 * Admin-triggered country coverage refresh (same loop as cron).
 */
import { NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'
import { runCountryCoverageTick } from '@/lib/admin/countryCoverageLoop'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  let body: { applyPriority?: boolean; enqueueEnrichment?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  try {
    // Also hit seed-countries for fixture depth (best-effort)
    let seed: unknown = null
    try {
      const origin = new URL(request.url).origin
      const cookie = request.headers.get('cookie') || ''
      const seedRes = await fetch(`${origin}/api/admin/seed-countries`, {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json' },
      })
      seed = await seedRes.json().catch(() => ({ status: seedRes.status }))
    } catch (e) {
      seed = { error: e instanceof Error ? e.message : String(e) }
    }

    const result = await runCountryCoverageTick({
      applyPriority: body.applyPriority !== false,
      enqueueEnrichment: body.enqueueEnrichment !== false,
    })

    return NextResponse.json({ ok: true, result, seed })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET() {
  const authError = await requireAdminApiAuth()
  if (authError) return authError
  try {
    const result = await runCountryCoverageTick({
      applyPriority: false,
      enqueueEnrichment: false,
    })
    return NextResponse.json({ ok: true, coverage: result.coverage, at: result.at })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
