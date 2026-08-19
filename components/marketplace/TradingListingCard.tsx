import Link from 'next/link'
import type { PublicListing } from '@/lib/server/listingsQuery'
import { formatTradeDate, getTradeSpec } from '@/lib/marketplace/tradingMarketplace'

function firstPrice(listing: PublicListing) {
  const spec = getTradeSpec(listing.high_level_specs)
  const tier = spec.priceTiers[0]
  if (tier?.price != null) {
    const currency = tier.currency ?? listing.price_currency ?? ''
    const unit = tier.unit ? `/${tier.unit}` : ''
    return `${currency} ${tier.price.toLocaleString()}${unit}`.trim()
  }
  return listing.price_display ?? (listing.price_amount != null
    ? `${listing.price_currency ?? ''} ${listing.price_amount.toLocaleString()}`.trim()
    : null)
}

export function TradingListingCard({ listing }: { listing: PublicListing }) {
  const spec = getTradeSpec(listing.high_level_specs)
  const hero = spec.images[0]
  const price = firstPrice(listing)
  const location = spec.stockLocation ?? listing.location_country ?? listing.location_region ?? null
  const published = formatTradeDate(spec.updatedAt ?? spec.publishedAt ?? listing.created_at)
  const status = spec.activityStatus ?? spec.availabilityStatus
  const detailHref = listing.slug
    ? `/marketplace/trading/${encodeURIComponent(listing.slug)}`
    : `/marketplace/quote?listing=${encodeURIComponent(listing.title)}`

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gold/15 bg-[linear-gradient(180deg,rgba(11,26,47,0.98),rgba(5,14,26,0.98))] shadow-[0_22px_60px_rgba(0,0,0,0.28)] transition hover:border-gold/35">
      {hero ? (
        <div
          className="h-44 bg-cover bg-center"
          role="img"
          aria-label={hero.alt}
          style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(5,14,26,.35)),url(${JSON.stringify(hero.url).slice(1, -1)})` }}
        />
      ) : (
        <div className="flex h-28 items-end bg-[radial-gradient(circle_at_top_right,rgba(198,165,90,.22),transparent_46%),linear-gradient(135deg,#0b1a2f,#061322)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">Harbourview reviewed supply</p>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/75">
          <span>{spec.inventoryForm ?? spec.serviceCategory ?? listing.product_type ?? 'Commercial supply'}</span>
          {status ? <span className="rounded-full border border-gold/20 bg-gold/8 px-2 py-0.5 text-gold">{status}</span> : null}
        </div>

        <h2 className="text-lg font-semibold leading-snug text-[#f5f1e8]">{listing.title}</h2>
        {spec.reference ? <p className="mt-1 font-mono text-xs text-white/35">{spec.reference}</p> : null}

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/56">{listing.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {location ? (
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
              <p className="text-white/35">Stock / service</p>
              <p className="mt-1 font-medium text-white/75">{location}</p>
            </div>
          ) : null}
          {spec.stockQuantity ? (
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
              <p className="text-white/35">Available</p>
              <p className="mt-1 font-medium text-white/75">{spec.stockQuantity}</p>
            </div>
          ) : null}
          {spec.serviceCapacity ? (
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
              <p className="text-white/35">Capacity</p>
              <p className="mt-1 font-medium text-white/75">{spec.serviceCapacity}</p>
            </div>
          ) : null}
          {spec.turnaroundTime ? (
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
              <p className="text-white/35">Turnaround</p>
              <p className="mt-1 font-medium text-white/75">{spec.turnaroundTime}</p>
            </div>
          ) : null}
        </div>

        {spec.cannabinoids.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {spec.cannabinoids.slice(0, 4).map((item) => (
              <span key={`${item.name}-${item.value}`} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60">
                {item.name} {item.value}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="mb-4 flex items-end justify-between gap-4 border-t border-white/8 pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30">From / public price</p>
              <p className="mt-1 text-base font-semibold text-[#f5f1e8]">{price ?? 'Terms on request'}</p>
            </div>
            {published ? <p className="text-right text-[10px] text-white/30">Updated<br />{published}</p> : null}
          </div>
          <Link href={detailHref} className="btn-marketplace flex w-full justify-center text-sm">
            {listing.slug ? 'View trade dossier' : 'Request Harbourview review'}
          </Link>
        </div>
      </div>
    </article>
  )
}
