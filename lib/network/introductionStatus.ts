/**
 * Network Command P1-A — introduction status transition matrix (client + server parity).
 * Authoritative enforcement remains in public.hv_network_introduction_transition_allowed
 * and public.hv_network_advance_introduction (SECURITY DEFINER).
 */

export const NETWORK_INTRODUCTION_STATUSES = [
  'draft',
  'review',
  'disclosure_pending',
  'consent_pending',
  'approved',
  'introduced',
  'converted',
  'declined',
  'expired',
  'closed',
] as const

export type NetworkIntroductionStatus = (typeof NETWORK_INTRODUCTION_STATUSES)[number]

export const NETWORK_INTRODUCTION_TERMINAL_STATUSES: readonly NetworkIntroductionStatus[] = [
  'converted',
  'declined',
  'expired',
  'closed',
]

const MEMBER_TRANSITIONS: Record<string, readonly NetworkIntroductionStatus[]> = {
  draft: ['review', 'closed'],
  review: ['closed'],
}

const STAFF_EXTRA_TRANSITIONS: Record<string, readonly NetworkIntroductionStatus[]> = {
  draft: ['declined'],
  review: ['disclosure_pending', 'declined', 'closed'],
  disclosure_pending: ['consent_pending', 'declined', 'closed'],
  consent_pending: ['approved', 'declined', 'closed'],
  approved: ['introduced', 'declined', 'closed'],
  introduced: ['converted', 'closed'],
}

export function isNetworkIntroductionStatus(value: string): value is NetworkIntroductionStatus {
  return (NETWORK_INTRODUCTION_STATUSES as readonly string[]).includes(value)
}

export function isTerminalIntroductionStatus(status: string): boolean {
  return (NETWORK_INTRODUCTION_TERMINAL_STATUSES as readonly string[]).includes(status)
}

/**
 * Returns allowed next statuses for a role class.
 * Mirrors public.hv_network_introduction_transition_allowed.
 */
export function allowedIntroductionTransitions(
  fromStatus: string,
  isStaff: boolean,
): NetworkIntroductionStatus[] {
  if (!isNetworkIntroductionStatus(fromStatus)) return []
  if (isTerminalIntroductionStatus(fromStatus)) return []

  const memberNext = MEMBER_TRANSITIONS[fromStatus] ?? []
  if (!isStaff) return [...memberNext]

  const staffExtra = STAFF_EXTRA_TRANSITIONS[fromStatus] ?? []
  return [...new Set([...memberNext, ...staffExtra])]
}

export function isIntroductionTransitionAllowed(
  fromStatus: string,
  toStatus: string,
  isStaff: boolean,
): boolean {
  if (fromStatus === toStatus) return false
  return allowedIntroductionTransitions(fromStatus, isStaff).includes(
    toStatus as NetworkIntroductionStatus,
  )
}
