import { describe, expect, it } from 'vitest'
import {
  canAccessDealRoom,
  canCreateDealRoomBetweenParties,
  dealRoomPartiesFromRow,
  filterDealRoomsForUser,
} from '@/lib/marketplace/orgScope'

describe('canAccessDealRoom', () => {
  it('allows initiator and counterparty', () => {
    const room = { initiatorId: 'u1', counterpartyId: 'u2' }
    expect(canAccessDealRoom({ userId: 'u1', room }).allowed).toBe(true)
    expect(canAccessDealRoom({ userId: 'u2', room }).allowed).toBe(true)
    expect(canAccessDealRoom({ userId: 'u3', room }).allowed).toBe(false)
  })

  it('allows workspace membership', () => {
    const room = { initiatorId: 'u1', counterpartyId: null, workspaceIds: ['ws-a'] }
    expect(
      canAccessDealRoom({ userId: 'u9', room, userWorkspaceIds: ['ws-a'] }).reason,
    ).toBe('workspace')
  })

  it('allows admin override', () => {
    const room = { initiatorId: 'u1', counterpartyId: 'u2' }
    expect(canAccessDealRoom({ userId: 'admin', room, isAdmin: true }).reason).toBe('admin')
  })
})

describe('filterDealRoomsForUser', () => {
  it('drops cross-tenant rooms', () => {
    const rooms = [
      { initiatorId: 'u1', counterpartyId: 'u2' },
      { initiatorId: 'u9', counterpartyId: 'u8' },
    ]
    expect(filterDealRoomsForUser(rooms, 'u1')).toHaveLength(1)
  })
})

describe('canCreateDealRoomBetweenParties', () => {
  it('blocks self-deal rooms', () => {
    expect(
      canCreateDealRoomBetweenParties({ initiatorId: 'u1', counterpartyId: 'u1' }).allowed,
    ).toBe(false)
  })

  it('allows open counterparty and distinct parties', () => {
    expect(
      canCreateDealRoomBetweenParties({ initiatorId: 'u1', counterpartyId: null }).allowed,
    ).toBe(true)
    expect(
      canCreateDealRoomBetweenParties({ initiatorId: 'u1', counterpartyId: 'u2' }).allowed,
    ).toBe(true)
  })
})

describe('dealRoomPartiesFromRow', () => {
  it('maps snake_case columns', () => {
    const parties = dealRoomPartiesFromRow({
      initiator_id: 'a',
      counterparty_id: 'b',
      workspace_id: 'ws-1',
    })
    expect(parties.initiatorId).toBe('a')
    expect(parties.counterpartyId).toBe('b')
    expect(parties.workspaceIds).toContain('ws-1')
  })
})
