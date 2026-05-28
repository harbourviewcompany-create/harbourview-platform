import type { DashboardPanelState, DashboardStatusBadge } from './contracts'

const statusTone: Record<DashboardPanelState, DashboardStatusBadge['tone']> = {
  live: 'green',
  partial: 'blue',
  'static-orientation': 'slate',
  'fallback-backed': 'gold',
  'request-only': 'amber',
  'review-required': 'amber',
  unavailable: 'red',
}

const statusLabel: Record<DashboardPanelState, string> = {
  live: 'Live dashboard',
  partial: 'Partial dashboard',
  'static-orientation': 'Static orientation',
  'fallback-backed': 'Fallback-backed',
  'request-only': 'Request only',
  'review-required': 'Review required',
  unavailable: 'Unavailable',
}

export function getDashboardStatusBadge(state: DashboardPanelState): DashboardStatusBadge {
  return { label: statusLabel[state], state, tone: statusTone[state] }
}
