export type AdminWorkSource =
  | 'admin_review_queue'
  | 'engine_signal'
  | 'regulatory_signal'
  | 'marketplace_inquiry'
  | 'marketplace_candidate'
  | 'intake'
  | 'operational_exception'

export type AdminWorkPriority = 'critical' | 'high' | 'normal' | 'low'
export type AdminWorkStatus = 'unassigned' | 'assigned' | 'in_progress' | 'blocked' | 'resolved' | 'escalated'

export type AdminWorkItemDTO = {
  id: string
  source: AdminWorkSource
  entity: {
    type: string
    id: string
  }
  title: string
  summary?: string
  priority: AdminWorkPriority
  status: AdminWorkStatus
  assignedTo?: {
    id: string
    label: string
  }
  reason: {
    code: string
    label: string
  }
  createdAt: string
  updatedAt?: string
  dueAt?: string
  href: string
  allowedActions: string[]
}

export type AdminWorkSourceState = {
  source: AdminWorkSource
  state: 'loaded' | 'degraded'
  count: number
  error?: string
}

export type AdminWorkSnapshot = {
  generatedAt: string
  items: AdminWorkItemDTO[]
  sources: AdminWorkSourceState[]
}

export function normalizeAdminPriority(value: string | number | null | undefined): AdminWorkPriority {
  if (typeof value === 'number') {
    if (value <= 10) return 'critical'
    if (value <= 40) return 'high'
    if (value >= 90) return 'low'
    return 'normal'
  }
  const normalized = String(value || '').toLowerCase()
  if (['critical', 'urgent', 'p0', 'blocker'].includes(normalized)) return 'critical'
  if (['high', 'p1'].includes(normalized)) return 'high'
  if (['low', 'p3'].includes(normalized)) return 'low'
  return 'normal'
}

export function normalizeAdminStatus(value: string | null | undefined, assignedTo?: string | null): AdminWorkStatus {
  const normalized = String(value || '').toLowerCase()
  if (['resolved', 'closed', 'completed', 'approved', 'rejected', 'published'].includes(normalized)) return 'resolved'
  if (normalized === 'escalated') return 'escalated'
  if (['blocked', 'failing', 'dead'].includes(normalized)) return 'blocked'
  if (['in_progress', 'in_review', 'pending_response', 'claimed'].includes(normalized)) return 'in_progress'
  return assignedTo ? 'assigned' : 'unassigned'
}

const priorityRank: Record<AdminWorkPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 }

export function sortAdminWorkItems(items: AdminWorkItemDTO[]) {
  return [...items].sort((a, b) => {
    const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority]
    if (priorityDelta) return priorityDelta
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

export function dedupeAdminWorkItems(items: AdminWorkItemDTO[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.entity.type}:${item.entity.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
