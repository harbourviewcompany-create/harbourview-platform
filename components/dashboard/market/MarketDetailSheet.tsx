'use client'

import type { MarketCardModel, MarketTier } from './marketTypes'
import { MarketRelatedRail } from './MarketRelatedRail'

type Spec = { label: string; value: string; icon?: string }

type Props = {
  listing: MarketCardModel
  description?: string | null
  specs?: Spec[]
  related: MarketCardModel[]
  complements: MarketCardModel[]
  tier: MarketTier
  onCta: () => void
  onAddToBasket?: () => void
  onOpenRelated: (id: string) => void
  onClose: () => void
}

export function MarketDetailSheet({
  listing,
  description,
  specs = [],
  related,
  complements,
  tier,
  onCta,
  onAddToBasket,
  onOpenRelated,
  onClose,
}: Props) {
  const secondary = tier === 'B' || listing.variant === 'catalogue'

  return (
    <div
      className="cc-mkt-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cc-mkt-sheet-title"
    >
      <div className="cc-mkt-sheet-handle" aria-hidden />
      <button type="button" className="cc-mkt-sheet-close" onClick={onClose}>
        ← Market
      </button>

      <div className="cc-mkt-sheet-scroll">
        <div className="cc-mkt-sheet-gallery">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.imageUrl} alt="" />
          ) : null}
        </div>

        <div className="cc-mkt-sheet-head">
          <h2 id="cc-mkt-sheet-title">{listing.title}</h2>
          <p className="cc-mkt-sheet-price">{listing.priceDisplay}</p>
          {specs.length > 0 ? (
            <div className="cc-mkt-sheet-specs">
              {specs.map(s => (
                <div key={s.label} className="cc-jx-field">
                  {s.icon ? <span className="cc-jx-field-icon">{s.icon}</span> : null}
                  <div>
                    <small>{s.label}</small>
                    <strong>{s.value}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {description ? <p className="cc-mkt-sheet-desc">{description}</p> : null}

        <MarketRelatedRail
          title="Often contacted with this"
          items={related}
          onOpen={onOpenRelated}
        />
        <div style={{ height: 16 }} />
        <MarketRelatedRail title="Complete the kit" items={complements} onOpen={onOpenRelated} />
      </div>

      <div className="cc-mkt-sheet-footer">
        <button
          type="button"
          className={`cc-mkt-cta cc-mkt-cta--block${secondary ? ' cc-mkt-cta--secondary' : ''}`}
          onClick={onCta}
        >
          {listing.ctaLabel}
        </button>
        {tier === 'A' && onAddToBasket ? (
          <button type="button" className="cc-mkt-add-basket" onClick={onAddToBasket}>
            Add to inquiry list
          </button>
        ) : null}
      </div>
    </div>
  )
}
