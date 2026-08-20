import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { getAdminAuthCheck } from '@/lib/auth/adminGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { ClinicalCredentialInputSchema } from '@/lib/clinical/reviewGovernance'

export const dynamic = 'force-dynamic'

/**
 * Reviewer-credential registration for the clinical publication gate.
 *
 * Control document: docs/control/CLINICAL_PUBLICATION_GATE_20260819.md
 *
 * Until this route existed there was no application path to
 * `clinical_reviewer_credentials` at all — the two clinical verification routes
 * call RPCs that are absent from production, and the admin review console only
 * flips `review_status`. That left raw SQL as the only way to create the
 * credential the entire evidence corpus is gated behind, which is the wrong
 * instrument for a record whose whole purpose is to be auditable.
 */

const BodySchema = ClinicalCredentialInputSchema.extend({
  notes: z.string().max(2000).optional().nullable(),
})

async function writeAudit(input: {
  actorUserId?: string
  actorEmail?: string
  actorRoles: string[]
  action: string
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
    entity_type: 'clinical_reviewer_credentials',
    entity_id: input.entityId,
    before_state: input.before ?? null,
    after_state: input.after ?? null,
    notes: input.notes ?? null,
    ip_address: h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? null,
    user_agent: h.get('user-agent') ?? null,
  })
}

function authFailure(reason: string) {
  const status = reason === 'missing_access_token' || reason === 'invalid_access_token' ? 401 : 403
  return NextResponse.json({ error: 'Admin authentication required', reason }, { status })
}

export async function POST(req: Request) {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) return authFailure(auth.reason)

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

  const { notes, ...credential } = parsed.data

  // Self-verification is refused here as well as by the database constraint, so
  // the caller gets an explanation rather than a constraint-violation string.
  if (credential.verification_status === 'verified' && credential.user_id === auth.auth.user.id) {
    return NextResponse.json(
      {
        error:
          'A credential cannot be verified by its own holder. Register it as pending and have a ' +
          'second admin verify it against the register.',
      },
      { status: 422 },
    )
  }

  const admin = await createSupabaseServiceClient()

  const verified = credential.verification_status === 'verified'
  const payload = {
    ...credential,
    valid_from: credential.valid_from ?? null,
    valid_until: credential.valid_until ?? null,
    verified_at: verified ? new Date().toISOString() : null,
    verified_by_user_id: verified ? auth.auth.user.id : null,
    updated_at: new Date().toISOString(),
  }

  const { data: after, error } = await admin
    .from('clinical_reviewer_credentials')
    .upsert(payload, { onConflict: 'user_id,profession,jurisdiction,credential_reference' })
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await writeAudit({
    actorUserId: auth.auth.user.id,
    actorEmail: auth.auth.user.email,
    actorRoles: auth.auth.roles,
    action: `clinical.credential.${credential.verification_status}`,
    entityId: String(after?.id ?? credential.credential_reference),
    before: null,
    after,
    notes,
  })

  return NextResponse.json({ ok: true, credential: after })
}

export async function GET() {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) return authFailure(auth.reason)

  const admin = await createSupabaseServiceClient()
  const { data, error } = await admin
    .from('clinical_reviewer_credentials')
    .select(
      'id,user_id,profession,jurisdiction,credential_reference,verification_status,' +
        'verification_source_url,verified_at,verified_by_user_id,valid_from,valid_until,updated_at',
    )
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message, credentials: [] }, { status: 400 })
  }

  return NextResponse.json({ credentials: data ?? [] })
}
