'use server'

import { createHash } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireClinicalReviewAuth } from '@/lib/auth/clinicalReviewGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const WORKBENCH_PATH = '/clinical/review'
const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const optional = (form: FormData, key: string) => text(form, key) || null
const json = (form: FormData, key: string, fallback: unknown) => {
  const value = text(form, key)
  if (!value) return fallback
  return JSON.parse(value)
}
const array = (form: FormData, key: string) => text(form, key).split(',').map(v => v.trim()).filter(Boolean)

function requireEvidenceOperator(auth: Awaited<ReturnType<typeof requireClinicalReviewAuth>>) {
  if (!auth.canOperateEvidence) throw new Error('clinical_evidence_operation_requires_admin_operator_or_analyst')
}

function evidenceTypeForSource(sourceType: string) {
  const direct = new Set([
    'regulation','regulatory-guidance','clinical-guideline','systematic-review','meta-analysis',
    'randomized-trial','observational-study','product-monograph','other',
  ])
  if (direct.has(sourceType)) return sourceType
  if (sourceType === 'pharmacovigilance') return 'pharmacovigilance-signal'
  return 'other'
}

async function audit(entityType: string, entityId: string | null, eventType: string, payload: Record<string, unknown>, actorUserId: string) {
  const db = await createSupabaseServiceClient()
  const { error } = await db.schema('public').from('clinical_evidence_operation_events').insert({
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    actor_user_id: actorUserId,
    event_payload: payload,
  })
  if (error) throw new Error(`clinical_operation_audit_failed:${error.message}`)
}

export async function intakeSourceAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  requireEvidenceOperator(auth)
  const db = await createSupabaseServiceClient()
  const sourceKey = text(form, 'source_key')
  const sourceUrl = text(form, 'source_url')
  if (!sourceKey || !sourceUrl.startsWith('https://')) throw new Error('source_key_and_https_source_url_required')
  const { data: source, error } = await db.schema('public').from('clinical_evidence_sources').upsert({
    source_key: sourceKey,
    source_type: text(form, 'source_type') || 'other',
    title: text(form, 'title'),
    publisher: text(form, 'publisher'),
    source_url: sourceUrl,
    jurisdiction: array(form, 'jurisdictions'),
    doi: optional(form, 'doi'),
    pmid: optional(form, 'pmid'),
    din: optional(form, 'din'),
    notice_of_compliance_id: optional(form, 'notice_of_compliance_id'),
    source_version: optional(form, 'source_version'),
    retrieved_at: new Date().toISOString(),
    currentness: 'current',
    currentness_checked_at: new Date().toISOString(),
  }, { onConflict: 'source_key' }).select('id').single()
  if (error || !source) throw new Error(`clinical_source_intake_failed:${error?.message ?? 'missing_source'}`)
  const { error: queueError } = await db.schema('public').from('clinical_evidence_intake_queue').upsert({
    source_id: source.id,
    intake_status: 'snapshot-required',
    priority: text(form, 'priority') || 'normal',
    intended_conditions: array(form, 'intended_conditions'),
    intended_jurisdictions: array(form, 'intended_jurisdictions'),
    intended_publication_scope: text(form, 'publication_scope') || 'clinical-synthesis',
    coverage_status: 'source-identified',
    notes: optional(form, 'notes'),
    created_by_user_id: auth.user.id,
  }, { onConflict: 'source_id' })
  if (queueError) throw new Error(`clinical_intake_queue_failed:${queueError.message}`)
  await audit('source', source.id, 'source-intake', { sourceKey, sourceUrl }, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}

export async function captureSnapshotAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  requireEvidenceOperator(auth)
  const db = await createSupabaseServiceClient()
  const sourceId = text(form, 'source_id')
  const snapshotKey = text(form, 'snapshot_key')
  const hashScope = text(form, 'hash_scope') || 'normalized-reviewed-extract'
  const normalizedExtract = optional(form, 'normalized_extract')
  let contentSha256 = text(form, 'content_sha256').toLowerCase()
  let byteSize: number | null = null
  if (hashScope === 'normalized-reviewed-extract') {
    if (!normalizedExtract) throw new Error('normalized_extract_required_for_extract_hash')
    contentSha256 = createHash('sha256').update(normalizedExtract, 'utf8').digest('hex')
  } else {
    byteSize = Number(text(form, 'byte_size'))
    if (!/^[0-9a-f]{64}$/.test(contentSha256) || !Number.isFinite(byteSize) || byteSize < 1) throw new Error('source_byte_hash_and_size_required')
  }
  const { data: source, error: sourceError } = await db.schema('public').from('clinical_evidence_sources').select('source_url,source_version').eq('id', sourceId).single()
  if (sourceError || !source) throw new Error('clinical_source_not_found')
  const { data: snapshot, error } = await db.schema('public').from('clinical_evidence_source_snapshots').insert({
    source_id: sourceId,
    snapshot_key: snapshotKey,
    source_url: source.source_url,
    source_version: source.source_version,
    retrieved_at: new Date().toISOString(),
    media_type: text(form, 'media_type') || 'text/html',
    hash_scope: hashScope,
    content_sha256: contentSha256,
    byte_size: byteSize,
    storage_path: optional(form, 'storage_path'),
    locator_manifest: json(form, 'locator_manifest', {}),
    normalized_extract: normalizedExtract,
    created_by_user_id: auth.user.id,
  }).select('id').single()
  if (error || !snapshot) throw new Error(`clinical_snapshot_capture_failed:${error?.message ?? 'missing_snapshot'}`)
  const { error: updateError } = await db.schema('public').from('clinical_evidence_sources').update({ latest_snapshot_id: snapshot.id, updated_at: new Date().toISOString() }).eq('id', sourceId)
  if (updateError) throw new Error(`clinical_snapshot_source_link_failed:${updateError.message}`)
  await db.schema('public').from('clinical_evidence_intake_queue').update({ intake_status: 'extraction-required', coverage_status: 'snapshot-captured' }).eq('source_id', sourceId)
  await audit('snapshot', snapshot.id, 'snapshot-captured', { sourceId, snapshotKey, hashScope, contentSha256 }, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}

export async function createEvidenceDraftAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  requireEvidenceOperator(auth)
  const db = await createSupabaseServiceClient()
  const sourceId = text(form, 'source_id')
  const { data: source, error: sourceError } = await db.schema('public').from('clinical_evidence_sources').select('*').eq('id', sourceId).single()
  if (sourceError || !source) throw new Error('clinical_source_not_found')
  const { data: record, error } = await db.schema('public').from('clinical_evidence_records').insert({
    slug: text(form, 'slug'), title: text(form, 'title'), summary: text(form, 'summary'),
    condition_label: optional(form, 'condition_label'), population: optional(form, 'population'), intervention: optional(form, 'intervention'),
    formulation: optional(form, 'formulation'), cannabinoids: array(form, 'cannabinoids'), intervention_class: text(form, 'intervention_class') || 'not-applicable',
    comparator: optional(form, 'comparator'), outcome: optional(form, 'outcome'),
    evidence_type: text(form, 'evidence_type') || evidenceTypeForSource(String(source.source_type ?? 'other')),
    evidence_strength: 'ungraded',
    evidence_strength_method: 'Ungraded at intake; qualified review required before any Clinical certainty assignment.',
    uncertainty: text(form, 'uncertainty') || 'Draft evidence record. No clinical conclusion is approved until governed review is complete.',
    conflict_status: 'none', jurisdictions: array(form, 'jurisdictions'), profession_relevance: [],
    primary_source_title: source.title, primary_source_publisher: source.publisher, primary_source_url: source.source_url, primary_source_id: source.source_key,
    verified_at: new Date().toISOString(), supersession_state: 'current', review_status: 'under-review', primary_source_registry_id: sourceId,
    grading_method_key: 'harbourview-clinical-evidence-v1', publication_scope: text(form, 'publication_scope') || 'clinical-synthesis',
    freshness_status: 'current', source_currentness_checked_at: source.currentness_checked_at,
  }).select('id').single()
  if (error || !record) throw new Error(`clinical_evidence_draft_failed:${error?.message ?? 'missing_record'}`)
  await audit('evidence-record', record.id, 'draft-created', { sourceId, slug: text(form, 'slug') }, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}

export async function addStructuredExtractionAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  requireEvidenceOperator(auth)
  const db = await createSupabaseServiceClient()
  const sourceId = text(form, 'source_id')
  const evidenceRecordId = optional(form, 'evidence_record_id')
  const { data: extraction, error } = await db.schema('public').from('clinical_evidence_extractions').insert({
    evidence_record_id: evidenceRecordId, source_id: sourceId, source_snapshot_id: optional(form, 'source_snapshot_id'),
    extraction_type: text(form, 'extraction_type') || 'other', extracted_summary: text(form, 'extracted_summary'), source_locator: text(form, 'source_locator'),
    extraction_method: 'manual-structured', extractor_identity: auth.user.email || auth.user.id, extracted_at: new Date().toISOString(), verification_status: 'pending',
    population_json: json(form, 'population_json', null), intervention_json: json(form, 'intervention_json', null), comparator_json: json(form, 'comparator_json', null),
    outcomes_json: json(form, 'outcomes_json', null), study_design: optional(form, 'study_design'), sample_size: optional(form, 'sample_size') ? Number(text(form, 'sample_size')) : null,
    follow_up: optional(form, 'follow_up'), effect_estimates_json: json(form, 'effect_estimates_json', null), uncertainty_json: json(form, 'uncertainty_json', null), limitations_json: json(form, 'limitations_json', null),
  }).select('id').single()
  if (error || !extraction) throw new Error(`clinical_extraction_failed:${error?.message ?? 'missing_extraction'}`)
  await db.schema('public').from('clinical_evidence_intake_queue').update({ intake_status: 'provenance-review', coverage_status: 'extracted' }).eq('source_id', sourceId)
  await audit('extraction', extraction.id, 'structured-extraction-created', { sourceId, evidenceRecordId }, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}

export async function verifyCredentialAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  if (!auth.canVerifyCredentials) throw new Error('credential_verification_requires_admin_or_operator')
  const db = await createSupabaseServiceClient()
  const credentialId = text(form, 'credential_id')
  const status = text(form, 'verification_status')
  const { error } = await db.schema('public').from('clinical_reviewer_credentials').update({
    verification_status: status, verified_by_user_id: auth.user.id, verified_at: status === 'verified' ? new Date().toISOString() : null,
    valid_from: optional(form, 'valid_from'), valid_until: optional(form, 'valid_until'), updated_at: new Date().toISOString(),
  }).eq('id', credentialId)
  if (error) throw new Error(`clinical_credential_verification_failed:${error.message}`)
  await audit('credential', credentialId, `credential-${status}`, {}, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}

export async function addReviewAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  const db = await createSupabaseServiceClient()
  const reviewType = text(form, 'review_type')
  const credentialId = optional(form, 'reviewer_credential_id')
  let reviewerType = 'analyst'
  if (reviewType === 'provenance') {
    requireEvidenceOperator(auth)
  } else if (reviewType === 'clinical' || reviewType === 'methodology') {
    if (!credentialId || !auth.qualifiedCredentialIds.includes(credentialId)) throw new Error('qualified_review_requires_current_owned_credential')
    const { data: credential, error } = await db.schema('public').from('clinical_reviewer_credentials').select('profession').eq('id', credentialId).single()
    if (error || !credential) throw new Error('qualified_credential_not_found')
    reviewerType = String(credential.profession)
  } else {
    throw new Error('invalid_review_type')
  }
  const evidenceRecordId = text(form, 'evidence_record_id')
  const { data: review, error } = await db.schema('public').from('clinical_evidence_reviews').insert({
    evidence_record_id: evidenceRecordId, review_type: reviewType, reviewer_type: reviewerType, reviewer_user_id: auth.user.id,
    reviewer_credential_id: credentialId, reviewer_identity: auth.user.email || auth.user.id, decision: text(form, 'decision'),
    grading_method_key: reviewType === 'provenance' ? null : 'harbourview-clinical-evidence-v1', assigned_evidence_strength: optional(form, 'assigned_evidence_strength'),
    rationale: text(form, 'rationale'), reviewed_at: new Date().toISOString(),
  }).select('id').single()
  if (error || !review) throw new Error(`clinical_review_failed:${error?.message ?? 'missing_review'}`)
  await audit('review', review.id, `${reviewType}-${text(form, 'decision')}`, { evidenceRecordId }, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}

export async function addGradeAssessmentAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  const reviewId = text(form, 'review_id')
  const db = await createSupabaseServiceClient()
  const { data: review, error: reviewError } = await db.schema('public').from('clinical_evidence_reviews')
    .select('reviewer_user_id,reviewer_credential_id,review_type,decision').eq('id', reviewId).single()
  if (reviewError || !review || review.reviewer_user_id !== auth.user.id || !review.reviewer_credential_id || !auth.qualifiedCredentialIds.includes(String(review.reviewer_credential_id))) {
    throw new Error('grade_assessment_requires_owned_credentialed_review')
  }
  if (!['clinical','methodology'].includes(String(review.review_type)) || review.decision !== 'approved') throw new Error('grade_assessment_requires_approved_qualified_review')
  const evidenceRecordId = text(form, 'evidence_record_id')
  const { data: grade, error } = await db.schema('public').from('clinical_evidence_grade_assessments').insert({
    evidence_record_id: evidenceRecordId, review_id: reviewId, grading_method_key: 'harbourview-clinical-evidence-v1',
    starting_certainty: text(form, 'starting_certainty') || 'ungraded', risk_of_bias: text(form, 'risk_of_bias') || 'not-assessed',
    inconsistency: text(form, 'inconsistency') || 'not-assessed', indirectness: text(form, 'indirectness') || 'not-assessed',
    imprecision: text(form, 'imprecision') || 'not-assessed', publication_bias: text(form, 'publication_bias') || 'not-assessed',
    upgrade_factors: json(form, 'upgrade_factors', []), downgrade_rationale: optional(form, 'downgrade_rationale'),
    final_certainty: text(form, 'final_certainty') || 'ungraded', assessment_rationale: text(form, 'assessment_rationale'), assessed_at: new Date().toISOString(),
  }).select('id').single()
  if (error || !grade) throw new Error(`clinical_grade_failed:${error?.message ?? 'missing_grade'}`)
  await audit('grade', grade.id, 'grade-assessment-created', { evidenceRecordId, reviewId }, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}

export async function resolveConflictAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  requireEvidenceOperator(auth)
  const db = await createSupabaseServiceClient()
  const conflictId = text(form, 'conflict_id')
  const { error } = await db.schema('public').from('clinical_evidence_conflicts').update({
    resolution_status: text(form, 'resolution_status'), resolution_review_id: text(form, 'resolution_review_id'), resolution_notes: text(form, 'resolution_notes'),
    supersession_scope: optional(form, 'supersession_scope'), public_impact: text(form, 'public_impact') || 'none', reviewed_at: new Date().toISOString(),
  }).eq('id', conflictId)
  if (error) throw new Error(`clinical_conflict_resolution_failed:${error.message}`)
  await audit('conflict', conflictId, `conflict-${text(form, 'resolution_status')}`, {}, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}

export async function setPublicationStateAction(form: FormData) {
  const auth = await requireClinicalReviewAuth()
  if (!auth.canPublish) throw new Error('publication_requires_admin_or_operator')
  const db = await createSupabaseServiceClient()
  const evidenceRecordId = text(form, 'evidence_record_id')
  const action = text(form, 'publication_action')
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (action === 'publish') patch.review_status = 'published'
  else if (action === 'unpublish') patch.review_status = 'under-review'
  else if (action === 'supersede') {
    patch.review_status = 'under-review'; patch.supersession_state = 'superseded'; patch.freshness_status = 'review-required'
    patch.freshness_reason = text(form, 'reason') || 'Superseded through governed Clinical evidence operations workflow.'
  } else throw new Error('invalid_publication_action')
  const { error } = await db.schema('public').from('clinical_evidence_records').update(patch).eq('id', evidenceRecordId)
  if (error) throw new Error(`clinical_publication_state_failed:${error.message}`)
  await audit('publication', evidenceRecordId, action, { reason: optional(form, 'reason') }, auth.user.id)
  revalidatePath(WORKBENCH_PATH)
}
