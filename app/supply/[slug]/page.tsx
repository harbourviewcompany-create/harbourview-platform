import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'
import { getSupplyItemBySlug, isSupplyCategory, SUPPLY_CATEGORY_LABELS } from '@/lib/server/supplyQuery'
import { getSupplyCategoryMedia } from '@/lib/server/supplyMedia'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const listing = await getSupplyItemBySlug(slug).catch(() => null)
  if (!listing) {
    return { title: 'Product | Harbourview Supply' }
  }
  return {
    title: `${listing.title} | Harbourview Supply`,
    description: listing.description?.slice(0, 160) || 'Harbourview-direct supply catalog product.',
  }
}

function formatPrice(price_display: string | null, price_amount: number | null, price_currency: string): string {
  if (price_display) return price_display
  if (price_amount != null) return `${price_currency} ${price_amount}`
  return 'Price on request'
}

export default async function SupplyProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const listing = await getSupplyItemBySlug(slug).catch(() => null)
  if (!listing) notFound()

  const categoryLabel = isSupplyCategory(listing.category)
    ? SUPPLY_CATEGORY_LABELS[listing.category]
    : listing.category.replace(/[_-]+/g, ' ')
  const media = getSupplyCategoryMedia(listing.category)

  const complianceEntries = Object.entries(listing.compliance_flags || {})

  return (
    <>
      <PublicHero
        eyebrow={`Harbourview Supply — ${categoryLabel}`}
        title={listing.title}
        actions={[
          { label: 'Request a Quote', href: `/marketplace/quote?listing=${encodeURIComponent(listing.title)}` },
          { label: 'Back to Catalog', href: '/supply', variant: 'secondary' },
        ]}
      >
        <p>{listing.description}</p>
      </PublicHero>

      <PublicSection tone="navy">
        <figure className="relative mb-6 h-64 w-full overflow-hidden rounded-sm border border-gold/10 bg-black/20">
          <img src={media.src} alt={media.altText} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90" />
          <span className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold backdrop-blur-sm">
            {media.badgeLabel}
          </span>
          <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 text-xs leading-5 text-white/70">
            {media.caption}
          </figcaption>
        </figure>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PublicCard className="p-7 space-y-3 text-sm leading-7 text-white/62">
            <p className="text-lg font-semibold text-[#f5f1e8]">
              {formatPrice(listing.price_display, listing.price_amount, listing.price_currency)}
              {listing.unit ? <span className="ml-2 text-xs uppercase tracking-[0.1em] text-white/38">/ {listing.unit}</span> : null}
            </p>
            {listing.sku ? <p>SKU: {listing.sku}</p> : null}
            {listing.brand ? <p>Brand: {listing.brand}{listing.model ? ` — ${listing.model}` : ''}</p> : null}
            {listing.moq ? <p>Minimum order quantity: {listing.moq.toLocaleString()}</p> : null}
            {listing.lead_time_days ? <p>Lead time: {listing.lead_time_days} days</p> : null}
            {listing.stock_qty != null ? <p>Stock on hand: {listing.stock_qty.toLocaleString()}</p> : null}
            {listing.target_countries?.length ? <p>Available in: {listing.target_countries.join(', ')}</p> : null}
            <Link
              href={`/marketplace/quote?listing=${encodeURIComponent(listing.title)}`}
              className="btn-marketplace inline-flex mt-4"
            >
              Request a Quote
            </Link>
          </PublicCard>

          <PublicCard className="p-7 space-y-4 text-sm leading-7 text-white/62">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/76">Compliance</p>
            {complianceEntries.length === 0 ? (
              <p>No jurisdiction-specific compliance metadata attached to this item.</p>
            ) : (
              complianceEntries.map(([country, flags]) => (
                <div key={country}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{country}</p>
                  <ul className="space-y-1">
                    {Object.entries(flags as Record<string, unknown>).map(([key, value]) => (
                      <li key={key}>
                        {key.replace(/_/g, ' ')}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </PublicCard>
        </div>

        <PublicCard className="mt-6 p-7 text-sm leading-7 text-white/54">
          <p>
            Pricing shown is list pricing for planning purposes. Final unit economics depend on order volume,
            destination and current supplier terms — submit a quote request for a firm number and confirmed lead
            time.
          </p>
          <Link href="/supply" className="btn-marketplace inline-flex mt-5">
            Back to Supply Catalog
          </Link>
        </PublicCard>
      </PublicSection>
    </>
  )
}
