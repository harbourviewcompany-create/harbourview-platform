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

  const countryIso2 = parsed.data.countryIso2?.toUpperCase() ?? context.countryIso2
  const { data: mission, error: missionError } = await context.supabase
    .from('network_missions')
    .insert({
      workspace_id: context.workspaceId,
      created_by: context.userId,
      name: parsed.data.name,
      objective: parsed.data.objective,
      country_iso2: countryIso2,
      target_country_iso2s: parsed.data.targetCountryIso2s.map(value => value.toUpperCase()),
      target_date: parsed.data.targetDate ?? null,
      confidentiality: parsed.data.confidentiality,
      status: 'active',
    })
    .select('id,name,objective,status,country_iso2,target_country_iso2s,target_date,confidentiality,created_at,updated_at')
    .single()

  if (missionError || !mission) {
    return NextResponse.json({ error: missionError?.message ?? 'Mission creation failed.' }, { status: 400 })
  }

  if (parsed.data.requirements.length > 0) {
    const rows = parsed.data.requirements.map((requirement, index) => ({
      mission_id: mission.id,
      created_by: context.userId,
      requirement_type: requirement.requirementType,
      label: requirement.label,
      description: requirement.description ?? null,
      hard_requirement: requirement.hardRequirement,
      capability_code: requirement.capabilityCode ?? null,
      licence_activity: requirement.licenceActivity ?? null,
      country_iso2: requirement.countryIso2?.toUpperCase() ?? null,
      expected_value: requirement.expectedValue,
      status: 'active',
      sort_order: index,
    }))

    const { error: requirementError } = await context.supabase
      .from('network_mission_requirements')
      .insert(rows)

    if (requirementError) {
      await context.supabase
        .from('network_missions')
        .update({ status: 'archived' })
        .eq('id', mission.id)
        .eq('workspace_id', context.workspaceId)
      return NextResponse.json({ error: requirementError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ mission }, { status: 201 })
}
