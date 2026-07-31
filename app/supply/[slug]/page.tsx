import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'
import { getSupplyItemBySlug, isSupplyCategory, SUPPLY_CATEGORY_LABELS } from '@/lib/server/supplyQuery'

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
