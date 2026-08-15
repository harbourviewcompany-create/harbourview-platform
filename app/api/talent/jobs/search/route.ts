import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encodeTalentCursor, decodeTalentCursor, type TalentJobDTO, type TalentJobSearchResponse } from '@/lib/talent/contracts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const WORKPLACE = new Set(['remote', 'hybrid', 'on_site', 'flexible', 'unknown'])

function clampLimit(raw: string | null) {
  const value = Number(raw ?? 24)
  return Number.isFinite(value) ? Math.max(1, Math.min(Math.trunc(value), 50)) : 24
}

function clean(value: string | null, max = 120) {
  const trimmed = value?.trim() ?? ''
  return trimmed ? trimmed.slice(0, max) : null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = clean(url.searchParams.get('q'), 160)
  const country = clean(url.searchParams.get('country'), 2)?.toUpperCase() ?? null
  const workplaceRaw = clean(url.searchParams.get('workplace'), 20)
  const workplace = workplaceRaw && WORKPLACE.has(workplaceRaw) ? workplaceRaw : null
  const employment = clean(url.searchParams.get('employment'), 40)
  const verifiedOnly = url.searchParams.get('verified') === '1'
  const limit = clampLimit(url.searchParams.get('limit'))
  const cursorRaw = url.searchParams.get('cursor')
  const cursor = decodeTalentCursor(cursorRaw)
  if (cursorRaw && !cursor) {
    return NextResponse.json({ error: 'INVALID_CURSOR' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('talent_search_jobs', {
    p_query: q,
    p_country: country,
    p_workplace: workplace,
    p_employment: employment,
    p_verified_only: verifiedOnly,
    p_limit: limit,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
  })

  if (error) {
    console.info('harbourview_talent_jobs_search_failed', { code: error.code ?? 'unknown' })
    return NextResponse.json(
      { data: [], nextCursor: null, state: 'degraded' } satisfies TalentJobSearchResponse,
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const rows = Array.isArray(data) ? data as Array<Record<string, unknown>> : []
  const jobs: TalentJobDTO[] = rows.map(row => ({
    id: String(row.id),
    title: String(row.title ?? ''),
    department: typeof row.department === 'string' ? row.department : null,
    description: typeof row.description === 'string' ? row.description : null,
    countryIso2: typeof row.country_iso2 === 'string' ? row.country_iso2 : null,
    regionCode: typeof row.region_code === 'string' ? row.region_code : null,
    locality: typeof row.locality === 'string' ? row.locality : null,
    locationText: typeof row.location_text === 'string' ? row.location_text : null,
    employmentType: typeof row.employment_type === 'string' ? row.employment_type : null,
    workplaceType: typeof row.workplace_type === 'string' ? row.workplace_type : null,
    applicationMethod: (typeof row.application_method === 'string' ? row.application_method : 'harbourview_direct') as TalentJobDTO['applicationMethod'],
    applicationUrl: typeof row.application_url === 'string' ? row.application_url : null,
    freshnessState: typeof row.freshness_state === 'string' ? row.freshness_state : 'unknown',
    lastConfirmedAt: typeof row.last_confirmed_at === 'string' ? row.last_confirmed_at : null,
    publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
    employer: {
      workspaceId: String(row.workspace_id),
      name: String(row.employer_name ?? 'Harbourview network operator'),
      verificationStatus: typeof row.employer_verification_status === 'string' ? row.employer_verification_status : null,
    },
  }))

  const cursorAt = rows[0]?.next_cursor_created_at
  const cursorId = rows[0]?.next_cursor_id
  const nextCursor = jobs.length === limit && typeof cursorAt === 'string' && typeof cursorId === 'string'
    ? encodeTalentCursor(cursorAt, cursorId)
    : null

  const state: TalentJobSearchResponse['state'] = jobs.length
    ? 'loaded'
    : q || country || workplace || employment || verifiedOnly
      ? 'no_match'
      : 'empty'

  return NextResponse.json(
    { data: jobs, nextCursor, state } satisfies TalentJobSearchResponse,
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
