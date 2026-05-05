export type DealStatus =
  | 'not_started'
  | 'introduced'
  | 'engaged'
  | 'negotiating'
  | 'closed_won'
  | 'closed_lost'
  | 'archived'

export function nextDealStatus(current: DealStatus, action: string): DealStatus {
  if (action === 'mark_introduced') return 'introduced'
  if (action === 'mark_engaged') return 'engaged'
  if (action === 'mark_negotiating') return 'negotiating'
  if (action === 'mark_won') return 'closed_won'
  if (action === 'mark_lost') return 'closed_lost'
  if (action === 'archive') return 'archived'
  return current
}
