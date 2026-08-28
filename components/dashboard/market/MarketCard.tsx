'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { MarketCardMedia, MarketCardModel } from './marketTypes'

type Props = {
  listing: MarketCardModel
  onOpen: (id: string) => void
  onCta: (id: string) => void
}

type MediaStage = 'primary' | 'fallback'

function resolveCardMedia(listing: MarketCardModel, stage: MediaStage): MarketCardMedia | null {
  const media = listing.media
  if (media) {
    if (stage === 'fallback') {
      return {
        src: media.fallbackSrc,
        altText: media.fallbackAltText,
        kind: 'representative',
        badgeLabel: 'Representative image',
        caption: media.fallbackCaption,
        fallbackSrc: media.fallbackSrc,
        fallbackAltText: media.fallbackAltText,
        fallbackCaption: media.fallbackCaption,
      }
    }
    return media
  }

  if (!listing.imageUrl) return null
  return {
    src: listing.imageUrl,
    altText: listing.title,
    kind: 'actual',
    badgeLabel: null,
    caption: null,
    fallbackSrc: listing.imageUrl,
    fallbackAltText: listing.title,
    fallbackCaption: null,
  }
}

export function MarketCard({ listing, onOpen, onCta }: Props) {
  const secondary =
    listing.variant === 'tierB-teaser' || listing.variant === 'catalogue'
  const [mediaStage, setMediaStage] = useState<MediaStage>('primary')
  const mediaSignature = listing.media
    ? `${listing.media.src}|${listing.media.fallbackSrc}|${listing.media.kind}`
    : listing.imageUrl ?? 'none'

  useEffect(() => {
    setMediaStage('primary')
  }, [listing.id, mediaSignature])

  const media = resolveCardMedia(listing, mediaStage)

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
      <figure
        className="cc-mkt-card-media hvm2-listing-media"
        data-media-kind={media?.kind}
      >
        {media ? (
          <Image
            className="cc-mkt-card-img"
            src={media.src}
            alt={media.altText}
            width={640}
            height={480}
            sizes="(max-width: 640px) 50vw, 320px"
            quality={75}
            loading="lazy"
            onError={() => {
              if (mediaStage === 'primary' && media.fallbackSrc && media.fallbackSrc !== media.src) {
                setMediaStage('fallback')
              }
            }}
          />
        ) : (
          <div className="cc-mkt-card-img" style={{ background: 'var(--cc-panel)' }} />
        )}
        {media?.badgeLabel ? (
          <span className="hvm2-listing-media-badge">{media.badgeLabel}</span>
        ) : null}
        {media?.caption ? <figcaption>{media.caption}</figcaption> : null}
        {listing.badge ? (
          <span className={`cc-mkt-badge${listing.badgeTone ? ` cc-mkt-badge--${listing.badgeTone}` : ''}`}>
            {listing.badge}
          </span>
        ) : null}
      </figure>
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
