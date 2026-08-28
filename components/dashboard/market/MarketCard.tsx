'use client'

import type { MarketCardModel } from './marketTypes'

type Props = {
  listing: MarketCardModel
  onOpen: (id: string) => void
  onCta: (id: string) => void
}

export function MarketCard({ listing, onOpen, onCta }: Props) {
  const secondary =
    listing.variant === 'tierB-teaser' || listing.variant === 'catalogue'

  return (
    <article
      className={`cc-mkt-card cc-mkt-card--${listing.variant}`}
      onClick={() => onOpen(listing.id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(listing.id)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={listing.title}
    >
      <div className="cc-mkt-card-media">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cc-mkt-card-img" src={listing.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="cc-mkt-card-img" style={{ background: 'var(--cc-panel)' }} />
        )}
        {listing.badge ? (
          <span className={`cc-mkt-badge${listing.badgeTone ? ` cc-mkt-badge--${listing.badgeTone}` : ''}`}>
            {listing.badge}
          </span>
        ) : null}
      </div>
      <div className="cc-mkt-card-body">
        <h3 className="cc-mkt-card-title">{listing.title}</h3>
        <p className="cc-mkt-card-price">{listing.priceDisplay}</p>
        <div className="cc-mkt-card-meta">
          {listing.country ? <span>{listing.country}</span> : null}
          {listing.condition ? <span>{listing.condition}</span> : null}
        </div>
        <button
          type="button"
          className={`cc-mkt-cta${secondary ? ' cc-mkt-cta--secondary' : ''}`}
          onClick={e => {
            e.stopPropagation()
            onCta(listing.id)
          }}
        >
          {listing.ctaLabel}
        </button>
      </div>
    </article>
  )
}
