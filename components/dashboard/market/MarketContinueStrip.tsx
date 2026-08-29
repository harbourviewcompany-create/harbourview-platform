'use client'

import type { MarketCardModel } from './marketTypes'

type Props = {
  recent: MarketCardModel[]
  onOpen: (id: string) => void
}

export function MarketContinueStrip({ recent, onOpen }: Props) {
  if (!recent.length) return null
  return (
    <div className="cc-mkt-continue">
      <span className="cc-mkt-continue-label">Continue</span>
      <div className="cc-mkt-continue-track">
        {recent.map(r => (
          <button
            key={r.id}
            type="button"
            className="cc-mkt-continue-item"
            onClick={() => onOpen(r.id)}
          >
            {r.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.media?.src ?? r.imageUrl}
                alt={r.media?.altText ?? r.title}
                data-media-kind={r.media?.kind}
              />
            ) : (
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: 'var(--cc-panel)',
                  display: 'inline-block',
                }}
              />
            )}
            <span>{r.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
