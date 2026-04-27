import type { ListingStatus, BuyerRequestStatus, MatchStatus } from '@/lib/supabase/types'

/**
 * Allowed status transitions for each entity type.
 * A missing key means no transitions are permitted from that status.
 */

export const LISTING_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  pending_review: ['approved', 'rejected'],
  approved: ['archived', 'superseded'],
  rejected: ['pending_review', 'archived'],
  archived: [],
  superseded: [],
}

export const BUYER_REQUEST_TRANSITIONS: Record<BuyerRequestStatus, BuyerRequestStatus[]> = {
  pending_review: ['approved', 'rejected'],
  approved: ['archived'],
  rejected: ['pending_review', 'archived'],
  archived: [],
}

export const MATCH_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
  proposed: ['inquiry_received', 'closed_lost'],
  inquiry_received: ['disclosure_requested', 'closed_lost'],
  disclosure_requested: ['disclosure_approved', 'closed_lost'],
  disclosure_approved: ['introduced', 'closed_lost'],
  introduced: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
}

export function canTransitionListing(from: ListingStatus, to: ListingStatus): boolean {
  return LISTING_TRANSITIONS[from]?.includes(to) ?? false
}

export function canTransitionBuyerRequest(from: BuyerRequestStatus, to: BuyerRequestStatus): boolean {
  return BUYER_REQUEST_TRANSITIONS[from]?.includes(to) ?? false
}

export function canTransitionMatch(from: MatchStatus, to: MatchStatus): boolean {
  return MATCH_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertListingTransition(from: ListingStatus, to: ListingStatus): void {
  if (!canTransitionListing(from, to)) {
    throw new Error(`Invalid listing status transition: ${from} → ${to}`)
  }
}

export function assertMatchTransition(from: MatchStatus, to: MatchStatus): void {
  if (!canTransitionMatch(from, to)) {
    throw new Error(`Invalid match status transition: ${from} → ${to}`)
  }
}
