// Landing zone for the best-effort error beacon fired from
// app/country/[country]/error.tsx and app/global-error.tsx. Those boundaries
// previously only reached console.error, which nobody watches in production —
// this route gives the next occurrence an actual queryable record instead of
// requiring a fresh multi-hour forensic sweep.
//
// Public, no auth required: unauthenticated visitors crash too. Writes go
// through the normal session-aware client so the same RLS policy that
// protects a direct-to-Supabase caller also applies here — this route adds
// no privilege the anon key doesn't already have.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

export const dynamic = 'force-dynamic'

const ROUTE_ID = '/api/client-errors'
const MAX_MESSAGE_LENGTH = 2000
const MAX_STACK_LENGTH = 4000
const MAX_ROUTE_LENGTH = 500
const MAX_DIGEST_LENGTH = 200
const MAX_USER_AGENT_LENGTH = 500

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipLimit = await enforceRateLimit({ route: ROUTE_ID, ip, limit: 20, windowMs: 60_000 })
  if (!ipLimit.allowed) {
    // Still 200, not 429: a rate-limited beacon is exactly the kind of
    // failure this route must never surface back to the caller.
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const { boundary, route, digest, message, stack, viewportWidth, extra } = body as Record<string, unknown>

    if (boundary !== 'country_role' && boundary !== 'global') {
      return NextResponse.json({ ok: false }, { status: 200 })
    }
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const normalizedViewportWidth =
      typeof viewportWidth === 'number' && Number.isFinite(viewportWidth) ? Math.round(viewportWidth) : null

    const supabase = await createClient()
    const { error } = await supabase.from('client_error_reports').insert({
      boundary,
      route: typeof route === 'string' ? route.slice(0, MAX_ROUTE_LENGTH) : null,
      digest: typeof digest === 'string' ? digest.slice(0, MAX_DIGEST_LENGTH) : null,
      message: message.slice(0, MAX_MESSAGE_LENGTH),
      stack: typeof stack === 'string' ? stack.slice(0, MAX_STACK_LENGTH) : null,
      user_agent: request.headers.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
      // RLS requires 1..20000 (see 20260710160000_client_error_reports.sql) — a
      // value outside that range would fail the WITH CHECK and drop the whole
      // insert, not just this optional field.
      viewport_width:
        normalizedViewportWidth !== null && normalizedViewportWidth > 0 && normalizedViewportWidth <= 20000
          ? normalizedViewportWidth
          : null,
      extra: extra && typeof extra === 'object' ? extra : null,
    })
    if (error) {
      // Ingestion failure on the one route whose job is making failures
      // visible — log it, but still never surface it to the caller.
      console.error('[client-errors] insert failed', error.message)
    }
  } catch {
    // Best-effort telemetry. A broken reporter must never surface its own
    // failure to the visitor or the calling boundary.
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
