import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'
import { resolveActiveNetworkContext } from '@/lib/network/server'

export const dynamic = 'force-dynamic'

const RequirementSchema = z.object({
  requirementType: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(240),
  description: z.string().trim().max(2000).optional().nullable(),
  hardRequirement: z.boolean().optional().default(true),
  capabilityCode: z.string().trim().max(120).optional().nullable(),
  licenceActivity: z.string().trim().max(160).optional().nullable(),
  countryIso2: z.string().trim().length(2).optional().nullable(),
  expectedValue: z.record(z.string(), z.unknown()).optional().default({}),
})

const MissionSchema = z.object({
  name: z.string().trim().min(1).max(160),
  objective: z.string().trim().min(1).max(2000),
  countryIso2: z.string().trim().length(2).optional().nullable(),
  targetCountryIso2s: z.array(z.string().trim().length(2)).max(30).optional().default([]),
  targetDate: z.string().date().optional().nullable(),
  confidentiality: z.enum(['workspace', 'restricted']).optional().default('workspace'),
  requirements: z.array(RequirementSchema).max(50).optional().default([]),
})

function mapMissionError(message: string | undefined): { status: number; error: string } {
  const text = message ?? ''
  if (text.includes('NETWORK_MISSION_UNAUTHENTICATED')) return { status: 401, error: 'Unauthorized' }
  if (text.includes('NETWORK_MISSION_FORBIDDEN')) return { status: 403, error: 'Active organization membership required.' }
  if (text.includes('NETWORK_MISSION_INVALID_NAME')) return { status: 400, error: 'Invalid mission name.' }
  if (text.includes('NETWORK_MISSION_INVALID_OBJECTIVE')) return { status: 400, error: 'Invalid mission objective.' }
  if (text.includes('NETWORK_MISSION_INVALID_COUNTRY') || text.includes('NETWORK_MISSION_INVALID_TARGET_COUNTRY')) {
    return { status: 400, error: 'Invalid mission jurisdiction.' }
  }
  if (text.includes('NETWORK_MISSION_INVALID_CONFIDENTIALITY')) return { status: 400, error: 'Invalid mission confidentiality.' }
  if (text.includes('NETWORK_MISSION_INVALID_REQUIREMENT')) return { status: 400, error: 'Invalid mission requirement.' }
  if (text.includes('NETWORK_MISSION_INVALID_REQUIREMENTS')) return { status: 400, error: 'Invalid mission requirements.' }
  return { status: 400, error: 'Mission creation failed.' }
}

export async function POST(req: NextRequest) {
  const context = await resolveActiveNetworkContext()
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!context.workspaceId) {
    return NextResponse.json({ error: 'Select an active organization before creating a Network mission.' }, { status: 409 })
  }

  const rateLimit = await enforceRateLimit({
    route: '/api/network/missions',
    ip: getClientIp(req),
    identity: context.userId,
    limit: 20,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = MissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid mission payload.', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await context.supabase.rpc('hv_network_create_mission', {
    p_workspace_id: context.workspaceId,
    p_name: parsed.data.name,
    p_objective: parsed.data.objective,
    p_country_iso2: parsed.data.countryIso2?.toUpperCase() ?? context.countryIso2,
    p_target_country_iso2s: parsed.data.targetCountryIso2s.map(value => value.toUpperCase()),
    p_target_date: parsed.data.targetDate ?? null,
    p_confidentiality: parsed.data.confidentiality,
    p_requirements: parsed.data.requirements,
  })

  if (error) {
    const mapped = mapMissionError(error.message)
    return NextResponse.json({ error: mapped.error }, { status: mapped.status })
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return NextResponse.json({ error: 'Mission creation returned no row.' }, { status: 500 })

  return NextResponse.json(
    { mission: row },
    { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
  )
}
