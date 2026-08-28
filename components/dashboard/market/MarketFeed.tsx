'use client'

import type { MarketFeedRow } from './marketTypes'
import { MarketCard } from './MarketCard'
import { MarketCardSkeleton } from './MarketCardSkeleton'
import { MarketRelatedRail } from './MarketRelatedRail'

type Props = {
  rows: MarketFeedRow[]
  loading?: boolean
  onOpen: (id: string) => void
  onCta: (id: string) => void
}

export function MarketFeed({ rows, loading, onOpen, onCta }: Props) {
  return (
    <div className="cc-mkt-feed">
      {rows.map(row => {
        if (row.type === 'grid') {
          return (
            <div key={row.id} className="cc-mkt-grid">
              {row.items.map(item => (
                <MarketCard key={item.id} listing={item} onOpen={onOpen} onCta={onCta} />
              ))}
            </div>
          )
        }
        if (row.type === 'rail') {
          return (
            <MarketRelatedRail
              key={row.id}
              title={row.title}
              items={row.items}
              onOpen={onOpen}
            />
          )
        }
        if (row.type === 'featured') {
          return (
            <div key={row.id} className="cc-mkt-grid">
              <MarketCard listing={row.item} onOpen={onOpen} onCta={onCta} />
            </div>
          )
        }
        return null
      })}
      {loading ? <MarketCardSkeleton count={4} /> : null}
    </div>
  )
}
