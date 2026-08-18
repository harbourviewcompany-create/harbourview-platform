import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'
import { getAdminAuth } from '@/lib/auth/adminGuard'
import { approveEngineSignal, rejectEngineSignal } from '@/lib/signals-engine/admin'
import { transitionRegulatorySignalStatus } from '@/lib/regulatory-signals/admin'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import {
  adminSignalBatchRequestSchema,
  type AdminSignalBatchItemResult,
  type AdminSignalBatchResult,
} from '@/lib/admin/signals/contract'

export const dynamic = 'force-dynamic'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function appendAuditEvent({
  targetId,
  kind,
  action,
  userId,
  idempotencyKey,
}: {
  targetId: string
  kind: string
  action: string
  userId: string
  idempotencyKey: string
}) {
  // audit_events.entity_id is UUID. Current signal IDs are expected to be UUIDs;
  // retain the target in metadata as well so an unexpected non-UUID identifier
  // is visible without constructing a false entity relationship.
  if (!isUuid(targetId)) {
    return { ok: false as const, message: 'signal identifier is not UUID-shaped; row-level review fields remain the audit fallback' }
  }

  try {
    const supabase = await createSupabaseServiceClient()
    const { error } = await supabase.from('audit_events').insert({
      entity_type: kind === 'engine' ? 'engine_signal' : 'regulatory_signal',
      entity_id: targetId,
      action: `admin.signal.${action}`,
      actor: userId,
      actor_user_id: userId,
      metadata: {
        target_id: targetId,
        signal_kind: kind,
        idempotency_key: idempotencyKey,
        surface: 'admin_command_center',
      },
    })
    return error
      ? { ok: false as const, message: error.message }
      : { ok: true as const }
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : 'Audit append failed' }
  }
}

export async function POST(request: NextRequest) {
  const authFailure = await requireAdminApiAuth(request)
  if (authFailure) return authFailure
  const auth = await getAdminAuth(request)
  if (!auth) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const parsed = adminSignalBatchRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request', issues: parsed.error.flatten() }, { status: 422 })
  }

  const input = parsed.data
  const results: AdminSignalBatchItemResult[] = []

  for (const id of input.ids) {
    if (input.kind === 'regulatory' && input.action === 'approve') {
      results.push({
        id,
        ok: false,
        errorCode: 'unsupported_action',
        message: 'Regulatory publication requires the curated public-safety workflow and cannot be bulk-approved.',
      })
      continue
    }

    if (input.dryRun) {
      results.push({
        id,
        ok: true,
        resultingState: input.action === 'approve' ? 'approved' : 'rejected',
        message: 'Dry run only; no mutation applied.',
      })
      continue
    }

    try {
      if (input.kind === 'engine') {
        const mutation = input.action === 'approve'
          ? await approveEngineSignal(id, auth.user.id)
          : await rejectEngineSignal(id, auth.user.id)
        if (!mutation.ok) {
          results.push({ id, ok: false, errorCode: 'mutation_failed', message: mutation.error.message })
          continue
        }
        if (!mutation.data) {
          results.push({ id, ok: false, errorCode: 'not_found_or_ineligible', message: 'Signal was not updated.' })
          continue
        }
      } else {
        const mutation = await transitionRegulatorySignalStatus(
          id,
          'rejected',
          auth.user.id,
          'Rejected from Admin Command Center Signal Review.',
        )
        if (!mutation.ok) {
          results.push({ id, ok: false, errorCode: 'mutation_failed', message: mutation.error.message })
          continue
        }
      }

      const audit = await appendAuditEvent({
        targetId: id,
        kind: input.kind,
        action: input.action,
        userId: auth.user.id,
        idempotencyKey: input.idempotencyKey,
      })
      results.push({
        id,
        ok: true,
        resultingState: input.action === 'approve' ? 'approved' : 'rejected',
        ...(!audit.ok ? { message: `Decision applied; audit append degraded: ${audit.message}` } : {}),
      })
    } catch (error) {
      results.push({
        id,
        ok: false,
        errorCode: 'unexpected_error',
        message: error instanceof Error ? error.message : 'Unexpected signal review error',
      })
    }
  }

  const response: AdminSignalBatchResult = {
    kind: input.kind,
    action: input.action,
    dryRun: input.dryRun,
    idempotencyKey: input.idempotencyKey,
    requested: results.length,
    succeeded: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok && result.errorCode !== 'unsupported_action').length,
    skipped: results.filter((result) => result.errorCode === 'unsupported_action').length,
    results,
  }

  return NextResponse.json(response, { status: 200 })
}
