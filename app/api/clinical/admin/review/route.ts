import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { getAdminAuthCheck } from '@/lib/auth/adminGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  entity: z.enum(['evidence', 'formulary', 'formulary_sku', 'jurisdiction']),
  id: z.string().min(1),
  review_status: z.enum(['published', 'under-review', 'retired']),
  notes: z.string().max(2000).optional().nullable(),
})

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
  try {
    await admin.from('audit_events').insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      actor: input.actorEmail ?? input.actorUserId ?? 'clinical-admin',
      actor_user_id: input.actorUserId ?? null,
      metadata: {
        before: input.before,
        after: input.after,
        notes: input.notes,
        roles: input.actorRoles,
      },
    })
  } catch {
    // non-fatal
  }
}

export async function POST(req: Request) {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) {
    const status =
      auth.reason === 'missing_access_token' || auth.reason === 'invalid_access_token' ? 401 : 403
    return NextResponse.json(
      { error: 'Admin authentication required', reason: auth.reason },
      { status }
    )
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

  const { entity, id, review_status, notes } = parsed.data
  const evidenceStatus = review_status === 'retired' ? 'under-review' : review_status
  const admin = await createSupabaseServiceClient()

  const table =
    entity === 'evidence'
      ? 'clinical_evidence_records'
      : entity === 'formulary'
        ? 'clinical_formulary_products'
        : entity === 'formulary_sku'
          ? 'clinical_formulary_skus'
          : 'clinical_jurisdiction_profiles'

  const { data: before } = await admin.from(table).select('*').eq('id', id).maybeSingle()

  const updatePayload: Record<string, unknown> = {
    review_status: entity === 'evidence' ? evidenceStatus : review_status,
    updated_at: new Date().toISOString(),
  }
  if (entity === 'formulary' || entity === 'jurisdiction') {
    updatePayload.reviewed_by = auth.auth.user.id
  }

  const { data: after, error } = await admin
    .from(table)
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await writeAudit({
    actorUserId: auth.auth.user.id,
    actorEmail: auth.auth.user.email,
    actorRoles: auth.auth.roles,
    action: `clinical.review.${review_status}`,
    entityType: table,
    entityId: id,
    before,
    after,
    notes,
  })

  return NextResponse.json({
    ok: true,
    entity,
    id,
    review_status: entity === 'evidence' ? evidenceStatus : review_status,
    actor: auth.auth.user.id,
    roles: auth.auth.roles,
  })
}

export async function GET() {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) {
    const status =
      auth.reason === 'missing_access_token' || auth.reason === 'invalid_access_token' ? 401 : 403
    return NextResponse.json(
      { error: 'Admin authentication required', reason: auth.reason },
      { status }
    )
  }

  const admin = await createSupabaseServiceClient()
  const loadErrors: string[] = []

  async function q(
    label: string,
    run: () => Promise<{ data: unknown; error: { message: string } | null }>
  ) {
    try {
      const res = await run()
      if (res.error) {
        loadErrors.push(`${label}: ${res.error.message}`)
        return []
      }
      return Array.isArray(res.data) ? res.data : []
    } catch (err) {
      loadErrors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`)
      return []
    }
  }

  const [evidence, formulary, skus, jurisdictions, audit] = await Promise.all([
    q('evidence', async () =>
      admin
        .from('clinical_evidence_records')
        .select('id,slug,title,review_status,evidence_strength,jurisdictions,verified_at,updated_at')
        .order('updated_at', { ascending: false })
        .limit(100)
    ),
    q('formulary', async () =>
      admin
        .from('clinical_formulary_products')
        .select('id,slug,name,country_iso2,authorization_status,review_status,last_reviewed,updated_at')
        .order('updated_at', { ascending: false })
        .limit(100)
    ),
    q('skus', async () =>
      admin
        .from('clinical_formulary_skus')
        .select(
          'id,product_name,country_iso2,authority,registration_code,review_status,source_type,updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(100)
    ),
    q('jurisdictions', async () =>
      admin
        .from('clinical_jurisdiction_profiles')
        .select('id,country_iso2,country_name,review_status,last_reviewed,updated_at')
        .order('country_iso2', { ascending: true })
    ),
    q('audit', async () =>
      admin
        .from('clinical_admin_audit_log')
        .select('id,actor_email,action,entity_type,entity_id,created_at,notes')
        .order('created_at', { ascending: false })
        .limit(50)
    ),
  ])

  return NextResponse.json({
    evidence,
    formulary,
    skus,
    jurisdictions,
    audit,
    loadErrors,
  })
}
