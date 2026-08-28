'use client'

type Props = { count?: number }

export function MarketCardSkeleton({ count = 4 }: Props) {
  return (
    <div className="cc-mkt-grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="cc-mkt-card">
          <div className="cc-mkt-card-media cc-mkt-skeleton-block" />
          <div className="cc-mkt-card-body">
            <div className="cc-mkt-skeleton-line" style={{ width: '80%' }} />
            <div className="cc-mkt-skeleton-line" style={{ width: '40%' }} />
            <div className="cc-mkt-skeleton-line" style={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
