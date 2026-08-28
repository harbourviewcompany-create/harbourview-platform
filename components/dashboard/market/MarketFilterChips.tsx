'use client'

import type { MarketFilterChip } from './marketTypes'

type Props = {
  chips: MarketFilterChip[]
  onToggle: (id: string) => void
}

export function MarketFilterChips({ chips, onToggle }: Props) {
  return (
    <div className="cc-mkt-chips" role="list" aria-label="Filters">
      {chips.map(c => (
        <button
          key={c.id}
          type="button"
          role="listitem"
          className={[
            'cc-mkt-chip',
            c.active ? 'cc-mkt-chip--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onToggle(c.id)}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}
