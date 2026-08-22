/**
 * Admin API: framework_alignment on evidence records + clinical_evidence_claim_map.
 * Additive operator tooling only. Does not change clinical conclusions, review gates,
 * or public search. Requires admin auth (same guard as clinical review).
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { getAdminAuthCheck } from '@/lib/auth/adminGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FrameworkAlignmentSchema = z
  .object({
    imdrfPillars: z.array(z.string()).optional(),
    dtaDomains: z.array(z.string()).optional(),
    dtaEcosystem: z.string().optional(),
    dtxRwePhases: z.array(z.string()).optional(),
    commercialStageGates: z.array(z.string()).optional(),
    fdaRweRelevance: z.string().optional(),
    fdaRweReliability: z.string().optional(),
    alcoaPlus: z.record(z.unknown()).optional(),
    notes: z.string().max(4000).optional(),
  })
  .passthrough()

const ClaimMapBodySchema = z.object({
  action: z.literal('upsert_claim_map'),
  slug: z.string().min(1).max(200),
  claimStatement: z.string().min(1).max(4000),
  conditionLabel: z.string().min(1).max(500),
  cannabinoidFocus: z.array(z.string()).default([]),
  evidenceRecordIds: z.array(z.string()).default([]),
  targetStageGates: z.array(z.string()).default([]),
  targetImdrfPillars: z.array(z.string()).default([]),
  targetDtaDomains: z.array(z.string()).default([]),
  status: z.enum(['supported', 'partial', 'gap', 'not_applicable']).default('gap'),
  gapSummary: z.string().max(4000).optional().nullable(),
})

const AlignmentBodySchema = z.object({
  action: z.literal('set_framework_alignment'),
  /** clinical_evidence_records.id (uuid) or slug */
  evidenceIdOrSlug: z.string().min(1),
  frameworkAlignment: FrameworkAlignmentSchema.nullable(),
})

const DeleteClaimSchema = z.object({
  action: z.literal('delete_claim_map'),
  slug: z.string().min(1),
})

const BodySchema = z.discriminatedUnion('action', [
  ClaimMapBodySchema,
  AlignmentBodySchema,
  DeleteClaimSchema,
])

async function writeAudit(input: {
  actorUserId?: string
  actorEmail?: string
  actorRoles: string[]
  action: string
  entityType: string
  entityId: string
  before: unknown
  after: unknown
  notes?: string | null
}) {
  const admin = await createSupabaseServiceClient()
  const h = await headers()
  try {
    await admin.from('clinical_admin_audit_log').insert({
      actor_user_id: input.actorUserId ?? null,
      actor_email: input.actorEmail ?? null,
      actor_roles: input.actorRoles,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      before_state: input.before ?? null,
      after_state: input.after ?? null,
      notes: input.notes ?? null,
      ip_address: h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? null,
      user_agent: h.get('user-agent') ?? null,
    })
  } catch {
    // non-fatal
  }
}

function rowToClaimEntry(row: Record<string, unknown>) {
  return {
    id: String(row.slug ?? row.id),
    claimStatement: String(row.claim_statement ?? ''),
    condition: String(row.condition_label ?? ''),
    cannabinoidFocus: (row.cannabinoid_focus as string[]) ?? [],
    evidenceRecordIds: (row.evidence_record_ids as string[]) ?? [],
    targetStageGates: (row.target_stage_gates as string[]) ?? [],
    targetImdrfPillars: (row.target_imdrf_pillars as string[]) ?? [],
    targetDtaDomains: (row.target_dta_domains as string[]) ?? [],
    status: (row.status as string) ?? 'gap',
    gapSummary: (row.gap_summary as string | null) ?? undefined,
    updatedAt: row.updated_at
      ? String(row.updated_at).slice(0, 10)
      : undefined,
  }
}

export async function GET() {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) {
    const status =
      auth.reason === 'missing_access_token' || auth.reason === 'invalid_access_token' ? 401 : 403
    return NextResponse.json({ error: 'Admin authentication required', reason: auth.reason }, { status })
  }

  const admin = await createSupabaseServiceClient()
  const [claimRes, alignedRes] = await Promise.all([
    admin
      .from('clinical_evidence_claim_map')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200),
    admin
      .from('clinical_evidence_records')
      .select('id,slug,title,framework_alignment,review_status,updated_at')
      .not('framework_alignment', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(100),
  ])

  // Table may not exist yet (migration pending) — return empty + flag
  const claimError = claimRes.error?.message ?? null
  const alignedError = alignedRes.error?.message ?? null

  return NextResponse.json({
    claimMap: (claimRes.data ?? []).map((r) => rowToClaimEntry(r as Record<string, unknown>)),
    alignedRecords: alignedRes.data ?? [],
    liveAvailable: !claimError && !alignedError,
    errors: { claimMap: claimError, aligned: alignedError },
  })
}

export async function POST(req: Request) {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) {
    const status =
      auth.reason === 'missing_access_token' || auth.reason === 'invalid_access_token' ? 401 : 403
    return NextResponse.json({ error: 'Admin authentication required', reason: auth.reason }, { status })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const admin = await createSupabaseServiceClient()
  const actor = {
    actorUserId: auth.auth.user.id,
    actorEmail: auth.auth.user.email,
    actorRoles: auth.auth.roles,
  }

  if (parsed.data.action === 'upsert_claim_map') {
    const d = parsed.data
    const { data: before } = await admin
      .from('clinical_evidence_claim_map')
      .select('*')
      .eq('slug', d.slug)
      .maybeSingle()

    const payload = {
      slug: d.slug,
      claim_statement: d.claimStatement,
      condition_label: d.conditionLabel,
      cannabinoid_focus: d.cannabinoidFocus,
      evidence_record_ids: d.evidenceRecordIds,
      target_stage_gates: d.targetStageGates,
      target_imdrf_pillars: d.targetImdrfPillars,
      target_dta_domains: d.targetDtaDomains,
      status: d.status,
      gap_summary: d.gapSummary ?? null,
      updated_at: new Date().toISOString(),
      updated_by: auth.auth.user.id,
    }

    const { data: after, error } = await admin
      .from('clinical_evidence_claim_map')
      .upsert(payload, { onConflict: 'slug' })
      .select('*')
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: 'Ensure migration 20260821190000_clinical_framework_alignment_optional.sql is applied.',
        },
        { status: 400 },
      )
    }

    await writeAudit({
      ...actor,
      action: before ? 'clinical.claim_map.update' : 'clinical.claim_map.create',
      entityType: 'clinical_evidence_claim_map',
      entityId: String(after?.id ?? d.slug),
      before,
      after,
    })

    return NextResponse.json({
      ok: true,
      action: 'upsert_claim_map',
      entry: after ? rowToClaimEntry(after as Record<string, unknown>) : null,
    })
  }

  if (parsed.data.action === 'delete_claim_map') {
    const { data: before } = await admin
      .from('clinical_evidence_claim_map')
      .select('*')
      .eq('slug', parsed.data.slug)
      .maybeSingle()

    const { error } = await admin
      .from('clinical_evidence_claim_map')
      .delete()
      .eq('slug', parsed.data.slug)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await writeAudit({
      ...actor,
      action: 'clinical.claim_map.delete',
      entityType: 'clinical_evidence_claim_map',
      entityId: String(before?.id ?? parsed.data.slug),
      before,
      after: null,
    })

    return NextResponse.json({ ok: true, action: 'delete_claim_map', slug: parsed.data.slug })
  }

  // set_framework_alignment
  const { evidenceIdOrSlug, frameworkAlignment } = parsed.data
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evidenceIdOrSlug)

  let q = admin.from('clinical_evidence_records').select('id,slug,title,framework_alignment')
  q = isUuid ? q.eq('id', evidenceIdOrSlug) : q.eq('slug', evidenceIdOrSlug)
  const { data: before } = await q.maybeSingle()

  if (!before) {
    return NextResponse.json({ error: 'Evidence record not found' }, { status: 404 })
  }

  const { data: after, error } = await admin
    .from('clinical_evidence_records')
    .update({
      framework_alignment: frameworkAlignment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', before.id)
    .select('id,slug,title,framework_alignment,updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        hint: 'Ensure framework_alignment column exists (migration 20260821190000).',
      },
      { status: 400 },
    )
  }

  await writeAudit({
    ...actor,
    action: 'clinical.framework_alignment.set',
    entityType: 'clinical_evidence_records',
    entityId: String(before.id),
    before,
    after,
  })

  return NextResponse.json({
    ok: true,
    action: 'set_framework_alignment',
    record: after,
  })
}
