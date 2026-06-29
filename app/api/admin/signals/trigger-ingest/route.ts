// POST /api/admin/signals/trigger-ingest
// Admin-only endpoint to run the full ingest → extract pipeline for one regulatory source.
// Calls the ingest-source Edge Function (fetch + snapshot), then if content changed,
// calls the extract-signals Edge Function (Claude Haiku → draft signals).
//
// Body: { source_id: string }

import { NextResponse } from 'next/server'
import { getAdminAuthCheck } from '@/lib/auth/adminGuard'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const SUPABASE_URL            = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function callEdgeFunction(fnName: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return { ok: res.ok, status: res.status, data }
}

export async function POST(request: Request) {
  const authCheck = await getAdminAuthCheck()
  if (!authCheck.ok) {
    return NextResponse.json({ error: 'Forbidden', reason: authCheck.reason }, { status: 403 })
  }

  let body: { source_id?: string } = {}
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { source_id } = body
  if (!source_id) return NextResponse.json({ error: 'source_id required' }, { status: 400 })

  // Step 1: ingest-source (fetch URL, detect changes, create snapshot)
  const ingest = await callEdgeFunction('ingest-source', { source_id }).catch(err => ({
    ok: false as const, status: 0, data: { error: String(err) }
  }))

  if (!ingest.ok || !ingest.data?.ok) {
    return NextResponse.json({
      ok: false,
      source_id,
      stage: 'ingest',
      error: ingest.data?.error ?? `Edge function returned ${ingest.status}`,
    }, { status: 502 })
  }

  const { changed, snapshot_id, response_time_ms } = ingest.data

  // Step 2: extract-signals (only if content changed and a snapshot was created)
  let extractResult: { signals_created?: number; signals_extracted?: number; reason?: string } | null = null
  if (changed && snapshot_id) {
    const extract = await callEdgeFunction('extract-signals', { snapshot_id }).catch(err => ({
      ok: false as const, status: 0, data: { error: String(err) }
    }))
    if (extract.ok && extract.data?.ok) {
      extractResult = {
        signals_created: extract.data.signals_created,
        signals_extracted: extract.data.signals_extracted,
      }
    } else {
      extractResult = { reason: extract.data?.error ?? `extract-signals returned ${extract.status}` }
    }
  } else if (!changed) {
    extractResult = { reason: 'Content unchanged — no new signals extracted' }
  }

  return NextResponse.json({
    ok: true,
    source_id,
    changed,
    snapshot_id: snapshot_id ?? null,
    response_time_ms: response_time_ms ?? null,
    extract: extractResult,
  })
}
