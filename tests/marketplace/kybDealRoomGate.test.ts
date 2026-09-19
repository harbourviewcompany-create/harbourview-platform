import { describe, expect, it, vi } from 'vitest'

describe('kybDealRoomGate module contract', () => {
  it('exports assertPartiesKybVerified', async () => {
    const mod = await import('@/lib/marketplace/kybDealRoomGate')
    expect(typeof mod.assertPartiesKybVerified).toBe('function')
  })

  it('returns ok when no party user ids are provided', async () => {
    const { assertPartiesKybVerified } = await import('@/lib/marketplace/kybDealRoomGate')
    const db = { from: vi.fn() } as any
    const result = await assertPartiesKybVerified(db, [
      { userId: null, role: 'listing_owner' },
      { userId: undefined, role: 'buyer' },
    ])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.checked).toBe(0)
    }
  })
})
