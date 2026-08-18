import { describe, expect, it } from 'vitest'
import {
  dedupeAdminWorkItems,
  normalizeAdminPriority,
  normalizeAdminStatus,
  sortAdminWorkItems,
  type AdminWorkItemDTO,
} from '@/lib/admin/work/types'

function item(overrides: Partial<AdminWorkItemDTO> = {}): AdminWorkItemDTO {
  return {
    id: 'work:1',
    source: 'engine_signal',
    entity: { type: 'engine_signal', id: 'entity-1' },
    title: 'Review signal',
    priority: 'normal',
    status: 'unassigned',
    reason: { code: 'review', label: 'Review' },
    createdAt: '2026-08-18T12:00:00.000Z',
    href: '/admin/signals',
    allowedActions: ['open'],
    ...overrides,
  }
}

describe('Admin work queue DTO normalization', () => {
  it('maps domain and numeric priorities without inventing a new priority universe', () => {
    expect(normalizeAdminPriority('urgent')).toBe('critical')
    expect(normalizeAdminPriority('HIGH')).toBe('high')
    expect(normalizeAdminPriority(5)).toBe('critical')
    expect(normalizeAdminPriority(35)).toBe('high')
    expect(normalizeAdminPriority(95)).toBe('low')
    expect(normalizeAdminPriority(null)).toBe('normal')
  })

  it('normalizes live workflow states while keeping blocked and escalated distinct', () => {
    expect(normalizeAdminStatus('in_review')).toBe('in_progress')
    expect(normalizeAdminStatus('pending', 'user-1')).toBe('assigned')
    expect(normalizeAdminStatus('blocked')).toBe('blocked')
    expect(normalizeAdminStatus('escalated')).toBe('escalated')
    expect(normalizeAdminStatus('published')).toBe('resolved')
  })

  it('keeps the persistent hv_admin_review_queue representation when a virtual adapter duplicates its entity', () => {
    const persistent = item({
      id: 'review:1',
      source: 'admin_review_queue',
      entity: { type: 'engine_signal', id: 'same-id' },
      assignedTo: { id: 'operator-1', label: 'operator-1' },
      status: 'assigned',
    })
    const virtual = item({ id: 'engine:same-id', entity: { type: 'engine_signal', id: 'same-id' } })
    expect(dedupeAdminWorkItems([persistent, virtual])).toEqual([persistent])
  })

  it('sorts critical work before high/normal/low and oldest first within a priority', () => {
    const rows = [
      item({ id: 'low', entity: { type: 'x', id: 'low' }, priority: 'low' }),
      item({ id: 'high-new', entity: { type: 'x', id: 'high-new' }, priority: 'high', createdAt: '2026-08-18T12:00:00Z' }),
      item({ id: 'critical', entity: { type: 'x', id: 'critical' }, priority: 'critical' }),
      item({ id: 'high-old', entity: { type: 'x', id: 'high-old' }, priority: 'high', createdAt: '2026-08-17T12:00:00Z' }),
    ]
    expect(sortAdminWorkItems(rows).map((row) => row.id)).toEqual(['critical', 'high-old', 'high-new', 'low'])
  })
})
