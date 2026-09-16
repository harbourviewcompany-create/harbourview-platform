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
  savedIds?: Set<string>
  comparedIds?: Set<string>
  onToggleSaved?: (id: string) => void
  onToggleCompare?: (id: string) => void
}

export function MarketFeed({ rows, loading, onOpen, onCta, savedIds = new Set(), comparedIds = new Set(), onToggleSaved, onToggleCompare }: Props) {
  return (
    <div className="cc-mkt-feed">
      {rows.map(row => {
        if (row.type === 'grid') {
          return (
            <div key={row.id} className="cc-mkt-grid">
              {row.items.map(item => (
                <MarketCard key={item.id} listing={item} onOpen={onOpen} onCta={onCta} isSaved={savedIds.has(item.id)} isCompared={comparedIds.has(item.id)} onToggleSaved={onToggleSaved} onToggleCompare={onToggleCompare} />
              ))}
            </div>
          )
        }
        if (row.type === 'rail') {
          return <MarketRelatedRail key={row.id} title={row.title} items={row.items} onOpen={onOpen} />
        }
        if (row.type === 'featured') {
          return (
            <div key={row.id} className="cc-mkt-grid">
              <MarketCard listing={row.item} onOpen={onOpen} onCta={onCta} isSaved={savedIds.has(row.item.id)} isCompared={comparedIds.has(row.item.id)} onToggleSaved={onToggleSaved} onToggleCompare={onToggleCompare} />
            </div>
          )
        }
        return null
      })}
      {loading ? <MarketCardSkeleton count={4} /> : null}
    </div>
  )
}
