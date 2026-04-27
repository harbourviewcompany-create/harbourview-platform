import type { SupabaseClient } from '@supabase/supabase-js'
import type { EntityType, AuditEventInsert } from '@/lib/supabase/types'

interface WriteAuditEventParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>
  entityType: EntityType
  entityId: string
  action: string
  actor: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Write an audit event row.
 * Errors are logged but never thrown — audit failure must not block the core operation.
 */
export async function writeAuditEvent({
  db,
  entityType,
  entityId,
  action,
  actor,
  metadata,
  ipAddress,
}: WriteAuditEventParams): Promise<void> {
  const event: AuditEventInsert = {
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor,
    metadata: metadata ?? null,
    ip_address: ipAddress ?? null,
  }

  const { error } = await db.from('audit_events').insert(event)

  if (error) {
    console.error('[AuditEvent] Failed to write audit event:', {
      entityType,
      entityId,
      action,
      error: error.message,
    })
  }
}

/**
 * Write a status history row.
 * Called alongside every status transition.
 */
export async function writeStatusHistory({
  db,
  entityType,
  entityId,
  fromStatus,
  toStatus,
  changedBy,
  reason,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>
  entityType: EntityType
  entityId: string
  fromStatus: string | null
  toStatus: string
  changedBy: string
  reason?: string
}): Promise<void> {
  const { error } = await db.from('status_history').insert({
    entity_type: entityType,
    entity_id: entityId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: changedBy,
    reason: reason ?? null,
  })

  if (error) {
    console.error('[StatusHistory] Failed to write status history:', {
      entityType,
      entityId,
      fromStatus,
      toStatus,
      error: error.message,
    })
  }
}
