import { describe, expect, it } from 'vitest'
import { adminSignalBatchRequestSchema } from '@/lib/admin/signals/contract'

describe('Admin Signal Review batch contract', () => {
  it('requires explicit IDs and deduplicates them deterministically', () => {
    const parsed = adminSignalBatchRequestSchema.parse({
      kind: 'engine',
      action: 'approve',
      ids: ['one', 'one', 'two'],
      idempotencyKey: 'engine-approve-123',
    })
    expect(parsed.ids).toEqual(['one', 'two'])
    expect(parsed.dryRun).toBe(false)
  })

  it('rejects empty and over-broad batches', () => {
    expect(adminSignalBatchRequestSchema.safeParse({ kind: 'engine', action: 'approve', ids: [], idempotencyKey: '12345678' }).success).toBe(false)
    expect(adminSignalBatchRequestSchema.safeParse({ kind: 'engine', action: 'approve', ids: Array.from({ length: 101 }, (_, index) => String(index)), idempotencyKey: '12345678' }).success).toBe(false)
  })

  it('keeps engine and regulatory lifecycles explicit', () => {
    expect(adminSignalBatchRequestSchema.safeParse({ kind: 'regulatory', action: 'reject', ids: ['one'], idempotencyKey: 'reg-reject-123' }).success).toBe(true)
    expect(adminSignalBatchRequestSchema.safeParse({ kind: 'curated', action: 'reject', ids: ['one'], idempotencyKey: 'bad-kind-123' }).success).toBe(false)
  })
})
