'use client'

import type { MarketCardModel } from './marketTypes'
import { MarketRelatedRail } from './MarketRelatedRail'

type Props = {
  suggestions: MarketCardModel[]
  onOpen: (id: string) => void
  onCreateWanted: () => void
}

export function MarketEmptyState({ suggestions, onOpen, onCreateWanted }: Props) {
  return (
    <div className="cc-mkt-empty">
      <p className="cc-mkt-empty-title">No exact matches</p>
      <p className="cc-mkt-empty-body">
        Try these close alternatives or create a Wanted request.
      </p>
      <MarketRelatedRail title="Close alternatives" items={suggestions} onOpen={onOpen} />
      <button type="button" className="cc-mkt-cta cc-mkt-cta--block" onClick={onCreateWanted}>
        Create Wanted request
      </button>
    </div>
  )
}
