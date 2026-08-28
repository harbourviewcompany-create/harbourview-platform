'use client'

import Link from 'next/link'
import type { MarketCardModel } from './marketTypes'

type Props = {
  title: string
  items: MarketCardModel[]
  href?: string
  onOpen: (id: string) => void
}

export function MarketRelatedRail({ title, items, href, onOpen }: Props) {
  if (!items.length) return null
  return (
    <section className="cc-mkt-rail">
      <header className="cc-mkt-rail-head">
        <h4>{title}</h4>
        {href ? (
          <Link href={href} className="cc-mkt-rail-more">
            See all
          </Link>
        ) : null}
      </header>
      <div className="cc-mkt-rail-track">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className="cc-mkt-rail-card"
            onClick={() => onOpen(item.id)}
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="cc-mkt-rail-img" src={item.imageUrl} alt="" loading="lazy" />
            ) : (
              <div className="cc-mkt-rail-img" />
            )}
            <span className="cc-mkt-rail-title">{item.title}</span>
            <span className="cc-mkt-rail-price">{item.priceDisplay}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
