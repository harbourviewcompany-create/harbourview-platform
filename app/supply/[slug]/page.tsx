import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'
import { getSupplyItemBySlug, isSupplyCategory, SUPPLY_CATEGORY_LABELS } from '@/lib/server/supplyQuery'

export const revalidate = 300

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const listing = await getSupplyItemBySlug(slug).catch(() => null)
  if (!listing) return { title: 'Product | Harbourview Supply' }

  return {
    title: `${listing.title} | Harbourview Supply`,
    description: listing.description.slice(0, 160),
  }
}

export default async function SupplyProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const listing = await getSupplyItemBySlug(slug).catch(() => null)
  if (!listing) notFound()

  const categoryLabel = isSupplyCategory(listing.category)
    ? SUPPLY_CATEGORY_LABELS[listing.category]
    : listing.category.replace(/[_-]+/g, ' ')
  const quoteHref = `/marketplace/quote?listing=${encodeURIComponent(listing.title)}`

  return (
    <>
      <PublicHero
        eyebrow={`Harbourview Supply — ${categoryLabel}`}
        title={listing.title}
        actions={[
          { label: 'Request a Quote', href: quoteHref },
          { label: 'Back to Catalog', href: '/supply', variant: 'secondary' },
        ]}
      >
        <p>{listing.description}</p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PublicCard className="space-y-3 p-7 text-sm leading-7 text-white/62">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/76">Commercial review</p>
            <p className="text-lg font-semibold text-[#f5f1e8]">{listing.price_display}</p>
            <p>SKU: {listing.sku}</p>
            {listing.unit ? <p>Unit format: {listing.unit}</p> : null}
            <p>Availability: {listing.availability_status}</p>
            {listing.target_countries.length > 0 ? (
              <p>Jurisdictions listed for review: {listing.target_countries.join(', ')}</p>
            ) : null}
            <Link href={quoteHref} className="btn-marketplace mt-4 inline-flex">
              Request a Quote
            </Link>
          </PublicCard>

          <PublicCard className="space-y-4 p-7 text-sm leading-7 text-white/62">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/76">Product attributes</p>
            {listing.public_attributes.length === 0 ? (
              <p>No public product attributes are currently attached to this item.</p>
            ) : (
              <ul className="space-y-3">
                {listing.public_attributes.map((attribute) => (
                  <li key={attribute.key} className="rounded-sm border border-white/8 bg-white/[0.02] p-3">
                    <p className="font-medium text-[#f5f1e8]">{attribute.label}</p>
                    <p className="mt-1 text-xs text-white/45">{attribute.value}</p>
                  </li>
                ))}
              </ul>
            )}
          </PublicCard>
        </div>

        <PublicCard className="mt-6 p-7 text-sm leading-7 text-white/54">
          <p>{listing.review_note}</p>
          <p className="mt-3">
            Public attributes are orientation data only. They are not certifications, legal conclusions, supplier proof,
            inventory commitments or confirmations that a finished product meets all applicable requirements.
          </p>
          <Link href="/supply" className="btn-marketplace mt-5 inline-flex">
            Back to Supply Catalog
          </Link>
        </PublicCard>
      </PublicSection>
    </>
  )
}
