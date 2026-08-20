import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { getAdminAuthCheck } from '@/lib/auth/adminGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import {
  ClinicalEvidenceReviewInputSchema,
  evaluatePublicationReadiness,
} from '@/lib/clinical/reviewGovernance'

export const dynamic = 'force-dynamic'

/**
 * Records a provenance, clinical or methodology review against an evidence record,
 * optionally with the GRADE assessment that produced its certainty rating.
 *
 * Control document: docs/control/CLINICAL_PUBLICATION_GATE_20260819.md
 *
 * Ordering note: `clinical_grade_assessments.review_id` is NOT NULL and
 * references the review, so an assessment cannot be staged ahead of the review
 * it belongs to. The reviewer records both together — the assessment is the
 * reviewer's reasoning, not preparation handed to them.
 *
 * This route never publishes. Publication stays with the existing review console,
 * and the database trigger remains the authority on whether it may proceed.
 */

const BodySchema = ClinicalEvidenceReviewInputSchema

async function writeAudit(input: {
  actorUserId?: string
  actorEmail?: string
  actorRoles: string[]
  action: string
  entityType: string
  entityId: string
  after: unknown
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
    before_state: null,
    after_state: input.after ?? null,
    notes: null,
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

  const { grade_assessment, ...review } = parsed.data
  const admin = await createSupabaseServiceClient()

  const reviewedAt = review.reviewed_at ?? new Date().toISOString()

  const { data: inserted, error: reviewError } = await admin
    .from('clinical_evidence_reviews')
    .insert({
      evidence_record_id: review.evidence_record_id,
      review_type: review.review_type,
      reviewer_type: review.reviewer_type,
      reviewer_identity: review.reviewer_identity,
      reviewer_user_id: review.reviewer_user_id ?? null,
      reviewer_credential_id: review.reviewer_credential_id ?? null,
      decision: review.decision,
      rationale: review.rationale,
      reviewed_at: reviewedAt,
    })
    .select('*')
    .maybeSingle()

  // The credential trigger raises here when the reviewer's credential is missing,
  // unverified or outside its validity window. Surface it rather than flattening
  // it into a generic failure — the message names which condition failed.
  if (reviewError || !inserted) {
    return NextResponse.json(
      { error: reviewError?.message ?? 'Review was not recorded', stage: 'review' },
      { status: 400 },
    )
  }

  let gradeRow: unknown = null
  if (grade_assessment) {
    const { data: grade, error: gradeError } = await admin
      .from('clinical_grade_assessments')
      .insert({ ...grade_assessment, evidence_record_id: review.evidence_record_id, review_id: inserted.id })
      .select('*')
      .maybeSingle()

    if (gradeError) {
      // Leave the review in place — it is a real, audited reviewer act. Report the
      // assessment failure explicitly so it can be re-submitted against this review.
      return NextResponse.json(
        { error: gradeError.message, stage: 'grade_assessment', review: inserted },
        { status: 400 },
      )
    }
    gradeRow = grade
  }

  await writeAudit({
    actorUserId: auth.auth.user.id,
    actorEmail: auth.auth.user.email,
    actorRoles: auth.auth.roles,
    action: `clinical.review.${review.review_type}.${review.decision}`,
    entityType: 'clinical_evidence_reviews',
    entityId: String(inserted.id),
    after: { review: inserted, grade: gradeRow },
  })

  const readiness = await publicationReadinessFor(review.evidence_record_id)

  return NextResponse.json({ ok: true, review: inserted, grade_assessment: gradeRow, readiness })
}

/** Explains, before anyone tries, why the publication trigger would still refuse. */
async function publicationReadinessFor(evidenceRecordId: string) {
  const admin = await createSupabaseServiceClient()

  const [{ data: record }, { data: reviews }] = await Promise.all([
    admin
      .from('clinical_evidence_records')
      .select('id,publication_scope,evidence_strength,review_status')
      .eq('id', evidenceRecordId)
      .maybeSingle(),
    admin
      .from('clinical_evidence_reviews')
      .select('review_type,decision,reviewer_type,reviewer_user_id,reviewer_credential_id')
      .eq('evidence_record_id', evidenceRecordId),
  ])

  const rows = reviews ?? []
  const hasApprovedProvenanceReview = rows.some(
    row => row.review_type === 'provenance' && row.decision === 'approved',
  )
  // Credential validity itself is decided by the database; this only reports the
  // shape of what exists, so a "ready" result is an expectation, never a grant.
  const hasValidCredentialedClinicalReview = rows.some(
    row =>
      row.review_type === 'clinical' &&
      row.decision === 'approved' &&
      (row.reviewer_type === 'clinician' || row.reviewer_type === 'pharmacist') &&
      Boolean(row.reviewer_user_id) &&
      Boolean(row.reviewer_credential_id),
  )

  return evaluatePublicationReadiness({
    publicationScope: record?.publication_scope ?? null,
    evidenceStrength: record?.evidence_strength ?? null,
    hasApprovedProvenanceReview,
    hasValidCredentialedClinicalReview,
  })
}

const QuerySchema = z.object({ evidence_record_id: z.string().uuid() })

export async function GET(req: Request) {
  const auth = await getAdminAuthCheck()
  if (!auth.ok) return authFailure(auth.reason)

  const url = new URL(req.url)
  const parsed = QuerySchema.safeParse({ evidence_record_id: url.searchParams.get('evidence_record_id') })
  if (!parsed.success) {
    return NextResponse.json({ error: 'evidence_record_id (uuid) is required' }, { status: 400 })
  }

  const admin = await createSupabaseServiceClient()
  const { data, error } = await admin
    .from('clinical_evidence_reviews')
    .select('id,review_type,reviewer_type,reviewer_identity,decision,reviewed_at,rationale')
    .eq('evidence_record_id', parsed.data.evidence_record_id)
    .order('reviewed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, reviews: [] }, { status: 400 })
  }

  return NextResponse.json({
    reviews: data ?? [],
    readiness: await publicationReadinessFor(parsed.data.evidence_record_id),
  })
}
