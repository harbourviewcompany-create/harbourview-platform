import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicCard, PublicHero, PublicSection } from '@/components/PublicUi'
import { getPublicListingBySlug } from '@/lib/server/listingsQuery'

// ISR: marketplace listing data
export const revalidate = 1800

/**
 * Opts this dynamic segment into ISR. Exporting `revalidate` alone does not:
 * an unenumerated dynamic segment stays server-rendered per request with no
 * revalidation window. Returning no paths prerenders nothing at build time
 * while still letting each `slug` be rendered once and then cached for the
 * window above — getPublicListingBySlug() uses a non-cookie client.
 */
export async function generateStaticParams() {
  return []
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug).catch(() => null)
  if (!listing) {
    return { title: 'Listing | Harbourview Exchange' }
  }
  return {
    title: `${listing.title} | Harbourview Exchange`,
    description: listing.description?.slice(0, 160) || 'Reviewed public listing summary on Harbourview Exchange.',
  }
}

export default async function PublicListingDetailPage({ params }: PageProps) {
  const { slug } = await params
  const listing = await getPublicListingBySlug(slug).catch(() => null)
  if (!listing) notFound()

  return (
    <>
      <PublicHero
        eyebrow="Reviewed listing"
        title={listing.title}
        actions={[
          { label: 'Request review', href: `/marketplace/quote?listing=${encodeURIComponent(listing.title)}` },
          { label: 'All listings', href: '/marketplace/listings', variant: 'secondary' },
        ]}
      >
        <p>{listing.description}</p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Public summary only. Contact details, commercial terms and internal review context remain private unless a
          separate qualified introduction is appropriate.
        </p>
      </PublicHero>
      <PublicSection tone="navy">
        <PublicCard className="p-7 space-y-3 text-sm leading-7 text-white/62">
          {listing.category ? <p>Category: {listing.category.replace(/[_-]+/g, ' ')}</p> : null}
          {listing.product_type ? <p>Format: {listing.product_type}</p> : null}
          {listing.location_country || listing.region ? (
            <p>Region: {listing.location_country || listing.region}</p>
          ) : null}
          <Link href="/marketplace/listings" className="btn-marketplace inline-flex mt-4">
            Back to listings
          </Link>
        </PublicCard>
      </PublicSection>
    </>
  )
}
