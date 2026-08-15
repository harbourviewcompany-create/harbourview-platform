import { NextResponse } from 'next/server'
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server'
import { talentFeatureEnabled } from '@/lib/talent/features'
import type { TalentCandidateDTO, TalentPeopleSearchResponse } from '@/lib/talent/contracts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function clampLimit(value: unknown) {
  const parsed = Number(value ?? 24)
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.trunc(parsed), 50)) : 24
}

function text(value: unknown, max: number) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

export async function POST(request: Request) {
  const started = performance.now()
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  if (!(await talentFeatureEnabled('find_talent'))) {
    return NextResponse.json({ error: 'TALENT_SEARCH_DISABLED' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  const identityDisclosureEnabled = await talentFeatureEnabled('candidate_identity_disclosure')

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const workspaceId = text(body.workspaceId, 36)
  if (!workspaceId || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
    return NextResponse.json({ error: 'WORKSPACE_REQUIRED' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const query = text(body.query, 160)
  const country = text(body.country, 2)?.toUpperCase() ?? null
  const cursor = text(body.cursor, 36)
  if (cursor && !/^[0-9a-f-]{36}$/i.test(cursor)) {
    return NextResponse.json({ error: 'INVALID_CURSOR' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_search_people', {
    p_workspace_id: workspaceId,
    p_query: query,
    p_country: country,
    p_limit: clampLimit(body.limit),
    p_cursor_person_id: cursor,
  })

  const duration = performance.now() - started
  if (error) {
    const denied = error.code === '42501' || error.message?.includes('TALENT_SEARCH_FORBIDDEN')
    console.info('harbourview_talent_search_executed', { mode: 'people', outcome: denied ? 'denied' : 'error', durationMs: Math.round(duration), code: error.code ?? 'unknown', workspaceId })
    return NextResponse.json(
      { error: denied ? 'TALENT_SEARCH_FORBIDDEN' : 'TALENT_SEARCH_UNAVAILABLE' },
      { status: denied ? 403 : 503, headers: { 'Cache-Control': 'no-store', 'Server-Timing': `talent;dur=${duration.toFixed(1)}` } },
    )
  }

  const rows = Array.isArray(data) ? data as Array<Record<string, unknown>> : []
  const candidates: TalentCandidateDTO[] = rows.map(row => ({
    personId: String(row.person_id),
    displayName: identityDisclosureEnabled && typeof row.display_name === 'string' ? row.display_name : null,
    headline: typeof row.headline === 'string' ? row.headline : null,
    countryIso2: typeof row.country_iso2 === 'string' ? row.country_iso2 : null,
    availabilityState: typeof row.availability_state === 'string' ? row.availability_state : null,
    visibilityMode: String(row.visibility_mode ?? 'anonymous_discoverable'),
    disclosureLevel: Number(row.disclosure_level ?? 0),
    capabilities: Array.isArray(row.capability_labels) ? row.capability_labels.filter((value): value is string => typeof value === 'string') : [],
    credentials: Array.isArray(row.credential_labels) ? row.credential_labels.filter((value): value is string => typeof value === 'string') : [],
    languages: Array.isArray(row.language_labels) ? row.language_labels.filter((value): value is string => typeof value === 'string') : [],
    verificationSummary: String(row.verification_summary ?? 'Claims require review'),
  }))

  const nextCursor = candidates.length === clampLimit(body.limit)
    ? candidates[candidates.length - 1]?.personId ?? null
    : null
  const state: TalentPeopleSearchResponse['state'] = candidates.length ? 'loaded' : query || country ? 'no_match' : 'empty'
  console.info('harbourview_talent_search_executed', { mode: 'people', outcome: state, durationMs: Math.round(duration), resultCount: candidates.length, workspaceId, hasQuery: Boolean(query), country })

  return NextResponse.json(
    { data: candidates, nextCursor, state } satisfies TalentPeopleSearchResponse,
    { headers: { 'Cache-Control': 'no-store, private', 'Server-Timing': `talent;dur=${duration.toFixed(1)}` } },
  )
}
