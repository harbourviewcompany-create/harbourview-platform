import 'server-only'
import { fetchAdminSupabaseJson, type AdminDataResult } from '@/lib/supabase/adminDataClient'
import { listEngineReviewQueue, type EngineSignal } from '@/lib/signals-engine/admin'
import { listRegulatoryReviewQueue } from '@/lib/regulatory-signals/admin'
import type { RegulatorySignalRecord } from '@/lib/regulatory-signals/types'
import {
  dedupeAdminWorkItems,
  normalizeAdminPriority,
  normalizeAdminStatus,
  sortAdminWorkItems,
  type AdminWorkItemDTO,
  type AdminWorkSnapshot,
  type AdminWorkSource,
  type AdminWorkSourceState,
} from './types'

type ReviewQueueRow = {
  id: string
  queue_type: string
  target_entity_type: string
  target_entity_id: string
  assigned_to: string | null
  priority: number | string | null
  status: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
  resolved_at: string | null
}

type InquiryRow = {
  id: string
  created_at: string
  inquiry_type?: string | null
  contact_company?: string | null
  contact_name?: string | null
  message?: string | null
  review_status?: string | null
  priority?: string | null
  next_follow_up_at?: string | null
}

type CandidateRow = {
  id: string
  created_at?: string | null
  discovered_at?: string | null
  candidate_type?: string | null
  status?: string | null
  title?: string | null
  title_internal?: string | null
  title_public_draft?: string | null
  country?: string | null
  region?: string | null
  jurisdiction?: string | null
}

type SourceStateRow = {
  source_id: string
  consecutive_failures?: number | null
  last_error?: string | null
  last_success_at?: string | null
  last_run_at?: string | null
}

type PipelineTaskRow = {
  id: string
  queue_name?: string | null
  task_type?: string | null
  status?: string | null
  priority?: number | null
  attempts?: number | null
  max_attempts?: number | null
  last_error?: string | null
  created_at?: string | null
  available_at?: string | null
}

function nowIso() {
  return new Date().toISOString()
}

function safeDate(value: string | null | undefined) {
  if (!value) return nowIso()
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? new Date(time).toISOString() : nowIso()
}

function signalPriority(signal: EngineSignal) {
  if (signal.pri === 'URGENT') return 'critical' as const
  if (signal.pri === 'HIGH' || (signal.score ?? 0) >= 70) return 'high' as const
  if (signal.pri === 'LOW') return 'low' as const
  return 'normal' as const
}

function regulatoryPriority(signal: RegulatorySignalRecord) {
  if (signal.impact_level === 'critical') return 'critical' as const
  if (signal.impact_level === 'high') return 'high' as const
  if (signal.impact_level === 'low') return 'low' as const
  return 'normal' as const
}

function resultError(result: AdminDataResult<unknown>) {
  return result.ok ? undefined : result.error.message
}

function pushSourceState(
  target: AdminWorkSourceState[],
  source: AdminWorkSource,
  count: number,
  error?: string,
) {
  target.push({ source, state: error ? 'degraded' : 'loaded', count, ...(error ? { error } : {}) })
}

export async function getAdminWorkSnapshot(): Promise<AdminWorkSnapshot> {
  const items: AdminWorkItemDTO[] = []
  const sources: AdminWorkSourceState[] = []

  const [reviewQueue, engine, regulatory, inquiries, candidates, sourceStates, pipelineTasks] = await Promise.all([
    fetchAdminSupabaseJson<ReviewQueueRow[]>('/rest/v1/hv_admin_review_queue?select=id,queue_type,target_entity_type,target_entity_id,assigned_to,priority,status,notes,created_at,updated_at,resolved_at&status=not.in.(resolved)&order=priority.asc,created_at.asc&limit=250'),
    listEngineReviewQueue({ minScore: 0, limit: 200 }),
    listRegulatoryReviewQueue(),
    fetchAdminSupabaseJson<InquiryRow[]>('/rest/v1/marketplace_inquiries?select=id,created_at,inquiry_type,contact_company,contact_name,message,review_status,priority,next_follow_up_at&review_status=in.(new,open,pending_response)&order=created_at.asc&limit=200'),
    fetchAdminSupabaseJson<CandidateRow[]>('/rest/v1/marketplace_candidates?select=*&status=in.(needs_review,draft)&order=created_at.asc&limit=200'),
    fetchAdminSupabaseJson<SourceStateRow[]>('/rest/v1/scraper_source_state?select=source_id,consecutive_failures,last_error,last_success_at,last_run_at&consecutive_failures=gt.0&order=consecutive_failures.desc&limit=100'),
    fetchAdminSupabaseJson<PipelineTaskRow[]>('/rest/v1/pipeline_tasks?select=id,queue_name,task_type,status,priority,attempts,max_attempts,last_error,created_at,available_at&status=in.(failed,dead)&order=created_at.asc&limit=100'),
  ])

  if (reviewQueue.ok) {
    for (const row of reviewQueue.data) {
      items.push({
        id: `review:${row.id}`,
        source: 'admin_review_queue',
        entity: { type: row.target_entity_type, id: row.target_entity_id },
        title: row.notes?.trim() || `${row.queue_type.replace(/_/g, ' ')} review`,
        summary: `Persistent review queue · ${row.target_entity_type.replace(/_/g, ' ')}`,
        priority: normalizeAdminPriority(row.priority),
        status: normalizeAdminStatus(row.status, row.assigned_to),
        ...(row.assigned_to ? { assignedTo: { id: row.assigned_to, label: row.assigned_to } } : {}),
        reason: { code: row.queue_type, label: row.queue_type.replace(/_/g, ' ') },
        createdAt: safeDate(row.created_at),
        ...(row.updated_at ? { updatedAt: safeDate(row.updated_at) } : {}),
        href: `/admin/work?queue=${encodeURIComponent(row.id)}`,
        allowedActions: ['open', 'assign', 'resolve', 'escalate'],
      })
    }
  }
  pushSourceState(sources, 'admin_review_queue', reviewQueue.ok ? reviewQueue.data.length : 0, resultError(reviewQueue))

  if (engine.ok) {
    for (const signal of engine.data ?? []) {
      items.push({
        id: `engine:${signal.id}`,
        source: 'engine_signal',
        entity: { type: 'engine_signal', id: signal.id },
        title: signal.headline || 'Untitled engine signal',
        summary: signal.summary || `${signal.source || 'Unknown source'} · ${signal.country || 'Unattributed'}`,
        priority: signalPriority(signal),
        status: 'unassigned',
        reason: { code: 'signal_review', label: 'Engine signal review' },
        createdAt: safeDate(signal.created_at || signal.date),
        href: `/admin/signals?selected=${encodeURIComponent(`engine:${signal.id}`)}`,
        allowedActions: ['open', 'approve', 'reject'],
      })
    }
  }
  pushSourceState(sources, 'engine_signal', engine.ok ? (engine.data ?? []).length : 0, engine.ok ? undefined : engine.error.message)

  if (regulatory.ok) {
    for (const signal of regulatory.data ?? []) {
      items.push({
        id: `regulatory:${signal.id}`,
        source: 'regulatory_signal',
        entity: { type: 'regulatory_signal', id: signal.id },
        title: signal.headline,
        summary: signal.private_summary,
        priority: regulatoryPriority(signal),
        status: normalizeAdminStatus(signal.review_status),
        reason: { code: 'regulatory_review', label: 'Regulatory signal review' },
        createdAt: safeDate(signal.created_at || signal.signal_date),
        updatedAt: safeDate(signal.updated_at),
        href: `/admin/signals?selected=${encodeURIComponent(`regulatory:${signal.id}`)}`,
        allowedActions: ['open', 'reject', 'open_curated_review'],
      })
    }
  }
  pushSourceState(sources, 'regulatory_signal', regulatory.ok ? (regulatory.data ?? []).length : 0, regulatory.ok ? undefined : regulatory.error.message)

  if (inquiries.ok) {
    for (const inquiry of inquiries.data) {
      items.push({
        id: `inquiry:${inquiry.id}`,
        source: 'marketplace_inquiry',
        entity: { type: 'marketplace_inquiry', id: inquiry.id },
        title: inquiry.contact_company || inquiry.contact_name || 'Marketplace inquiry',
        summary: inquiry.message || inquiry.inquiry_type || 'Inbound marketplace inquiry',
        priority: normalizeAdminPriority(inquiry.priority),
        status: normalizeAdminStatus(inquiry.review_status),
        reason: { code: inquiry.inquiry_type || 'marketplace_inquiry', label: 'Marketplace inquiry' },
        createdAt: safeDate(inquiry.created_at),
        ...(inquiry.next_follow_up_at ? { dueAt: safeDate(inquiry.next_follow_up_at) } : {}),
        href: `/admin/inquiries/${inquiry.id}`,
        allowedActions: ['open'],
      })
    }
  }
  pushSourceState(sources, 'marketplace_inquiry', inquiries.ok ? inquiries.data.length : 0, resultError(inquiries))

  if (candidates.ok) {
    const intakeRows = candidates.data.filter((row) => row.candidate_type === 'intake_form')
    const candidateRows = candidates.data.filter((row) => row.candidate_type !== 'intake_form')
    for (const candidate of candidateRows) {
      items.push({
        id: `candidate:${candidate.id}`,
        source: 'marketplace_candidate',
        entity: { type: 'marketplace_candidate', id: candidate.id },
        title: candidate.title_internal || candidate.title_public_draft || candidate.title || 'Marketplace candidate',
        summary: [candidate.country, candidate.region, candidate.jurisdiction].filter(Boolean).join(' · ') || 'Candidate requires review',
        priority: 'normal',
        status: normalizeAdminStatus(candidate.status),
        reason: { code: 'candidate_review', label: 'Marketplace candidate review' },
        createdAt: safeDate(candidate.discovered_at || candidate.created_at),
        href: `/admin/candidates/${candidate.id}`,
        allowedActions: ['open'],
      })
    }
    for (const candidate of intakeRows) {
      items.push({
        id: `intake:${candidate.id}`,
        source: 'intake',
        entity: { type: 'marketplace_candidate', id: candidate.id },
        title: candidate.title_internal || candidate.title_public_draft || candidate.title || 'Marketplace intake submission',
        summary: [candidate.country, candidate.region, candidate.jurisdiction].filter(Boolean).join(' · ') || 'Intake submission requires review',
        priority: 'high',
        status: normalizeAdminStatus(candidate.status),
        reason: { code: 'intake_review', label: 'Marketplace intake review' },
        createdAt: safeDate(candidate.discovered_at || candidate.created_at),
        href: '/admin/marketplace/intake-queue',
        allowedActions: ['open'],
      })
    }
    pushSourceState(sources, 'marketplace_candidate', candidateRows.length)
    pushSourceState(sources, 'intake', intakeRows.length)
  } else {
    pushSourceState(sources, 'marketplace_candidate', 0, resultError(candidates))
    pushSourceState(sources, 'intake', 0, resultError(candidates))
  }

  let operationalCount = 0
  if (sourceStates.ok) {
    for (const row of sourceStates.data) {
      const failures = row.consecutive_failures ?? 0
      operationalCount += 1
      items.push({
        id: `source-health:${row.source_id}`,
        source: 'operational_exception',
        entity: { type: 'source_health', id: row.source_id },
        title: `${row.source_id} source health`,
        summary: row.last_error || `${failures} consecutive source failure${failures === 1 ? '' : 's'}`,
        priority: failures >= 3 ? 'critical' : 'high',
        status: failures >= 3 ? 'blocked' : 'in_progress',
        reason: { code: 'source_failure', label: 'Source health exception' },
        createdAt: safeDate(row.last_run_at || row.last_success_at),
        href: '/admin/pipeline-health',
        allowedActions: ['open'],
      })
    }
  }
  if (pipelineTasks.ok) {
    for (const task of pipelineTasks.data) {
      operationalCount += 1
      items.push({
        id: `pipeline-task:${task.id}`,
        source: 'operational_exception',
        entity: { type: 'pipeline_task', id: task.id },
        title: task.task_type || task.queue_name || 'Pipeline task failure',
        summary: task.last_error || `${task.status || 'failed'} after ${task.attempts ?? 0}/${task.max_attempts ?? 0} attempts`,
        priority: task.status === 'dead' ? 'critical' : normalizeAdminPriority(task.priority),
        status: task.status === 'dead' ? 'blocked' : 'in_progress',
        reason: { code: task.status === 'dead' ? 'dead_letter' : 'pipeline_failure', label: task.status === 'dead' ? 'Dead-letter task' : 'Pipeline failure' },
        createdAt: safeDate(task.created_at || task.available_at),
        href: '/admin/pipeline-health',
        allowedActions: ['open'],
      })
    }
  }
  const operationalErrors = [resultError(sourceStates), resultError(pipelineTasks)].filter(Boolean)
  pushSourceState(sources, 'operational_exception', operationalCount, operationalErrors.length ? operationalErrors.join(' · ') : undefined)

  // The persistent queue is the assignment/escalation layer. Place it first so
  // a persisted work record suppresses a virtual adapter record for the same entity.
  const ordered = sortAdminWorkItems(dedupeAdminWorkItems(items))
  return { generatedAt: nowIso(), items: ordered, sources }
}
