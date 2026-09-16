'use client'

import { useMemo, useState } from 'react'
import type { MarketCardModel } from './marketTypes'

type Props = {
  listings: MarketCardModel[]
  savedIds: Set<string>
  onToggleSaved: (id: string) => void
  onClearCompare: () => void
  onOpen: (id: string) => void
}

export function MarketplaceSelectionBar({ listings, savedIds, onToggleSaved, onClearCompare, onOpen }: Props) {
  const [showSaved, setShowSaved] = useState(false)
  const saved = useMemo(() => listings.filter(item => savedIds.has(item.id)), [listings, savedIds])

  if (!listings.length && !saved.length) return null

  return (
    <div className="hvm2-selection-bar" aria-label="Marketplace workspace tools">
      <div className="hvm2-selection-actions">
        <button type="button" className="hvm2-selection-button" onClick={() => setShowSaved(value => !value)} aria-expanded={showSaved}>
          Saved <span>{saved.length}</span>
        </button>
        {listings.length ? (
          <button type="button" className="hvm2-selection-button hvm2-selection-button--active" onClick={() => setShowSaved(false)}>
            Compare <span>{listings.length}/3</span>
          </button>
        ) : null}
        {listings.length ? (
          <button type="button" className="hvm2-selection-clear" onClick={onClearCompare}>Clear compare</button>
        ) : null}
      </div>

      {showSaved ? (
        <div className="hvm2-selection-panel">
          <div>
            <strong>Saved procurement list</strong>
            <span>Stored on this device; no supplier or availability claims are created.</span>
          </div>
          {saved.length ? (
            <div className="hvm2-selection-list">
              {saved.map(item => (
                <button key={item.id} type="button" onClick={() => onOpen(item.id)}>
                  <span>{item.title}</span>
                  <small>{item.category} · {item.priceDisplay}</small>
                </button>
              ))}
            </div>
          ) : (
            <p>No saved items yet. Use Save on a listing to keep a shortlist.</p>
          )}
        </div>
      ) : listings.length ? (
        <div className="hvm2-selection-panel">
          <div>
            <strong>Compare selected listings</strong>
            <span>Select up to three listings to compare the commercial basics.</span>
          </div>
          <div className="hvm2-compare-grid">
            {listings.map(item => (
              <button key={item.id} type="button" onClick={() => onOpen(item.id)}>
                <strong>{item.title}</strong>
                <span>{item.category}</span>
                <span>{item.country || 'Jurisdiction not specified'}</span>
                <span>{item.priceDisplay}</span>
                <span>{item.badge || item.condition || 'Status not specified'}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
