/**
 * Org / workspace scoping helpers for marketplace deal rooms and inquiries.
 * Prevents cross-tenant access when a userId is not a party on the record.
 */

export type DealRoomParties = {
  initiatorId: string | null | undefined
  counterpartyId: string | null | undefined
  /** Optional workspace ids attached to the room */
  workspaceIds?: Array<string | null | undefined>
}

export type OrgScopeDecision =
  | { allowed: true; reason: 'party' | 'workspace' | 'admin' }
  | { allowed: false; reason: 'not_a_party' | 'missing_user' }

/**
 * User may access a deal room if they are initiator, counterparty,
 * or a member of an attached workspace (caller supplies membership ids).
 */
export function canAccessDealRoom(input: {
  userId: string | null | undefined
  room: DealRoomParties
  userWorkspaceIds?: string[]
  isAdmin?: boolean
}): OrgScopeDecision {
  if (!input.userId) return { allowed: false, reason: 'missing_user' }
  if (input.isAdmin) return { allowed: true, reason: 'admin' }

  const uid = input.userId
  if (input.room.initiatorId === uid || input.room.counterpartyId === uid) {
    return { allowed: true, reason: 'party' }
  }

  const roomWorkspaces = (input.room.workspaceIds ?? []).filter(
    (w): w is string => Boolean(w),
  )
  const userWs = input.userWorkspaceIds ?? []
  if (roomWorkspaces.some((w) => userWs.includes(w))) {
    return { allowed: true, reason: 'workspace' }
  }

  return { allowed: false, reason: 'not_a_party' }
}

/** Filter deal rooms to those the user may see. */
export function filterDealRoomsForUser<T extends DealRoomParties>(
  rooms: T[],
  userId: string,
  opts?: { userWorkspaceIds?: string[]; isAdmin?: boolean },
): T[] {
  return rooms.filter(
    (room) =>
      canAccessDealRoom({
        userId,
        room,
        userWorkspaceIds: opts?.userWorkspaceIds,
        isAdmin: opts?.isAdmin,
      }).allowed,
  )
}

/**
 * Creating a room where initiator and counterparty are the same user is not a
 * commercial negotiation — block unless admin tooling sets isAdmin.
 */
export function canCreateDealRoomBetweenParties(input: {
  initiatorId: string
  counterpartyId: string | null | undefined
  isAdmin?: boolean
}): OrgScopeDecision {
  if (input.isAdmin) return { allowed: true, reason: 'admin' }
  if (!input.counterpartyId) return { allowed: true, reason: 'party' }
  if (input.initiatorId === input.counterpartyId) {
    return { allowed: false, reason: 'not_a_party' }
  }
  return { allowed: true, reason: 'party' }
}

/** Map a DB deal_rooms row into DealRoomParties for scope checks. */
export function dealRoomPartiesFromRow(row: {
  initiator_id?: string | null
  counterparty_id?: string | null
  workspace_id?: string | null
  workspace_ids?: Array<string | null | undefined> | null
}): DealRoomParties {
  const workspaceIds = [
    ...(row.workspace_ids ?? []),
    row.workspace_id,
  ]
  return {
    initiatorId: row.initiator_id,
    counterpartyId: row.counterparty_id,
    workspaceIds,
  }
}
