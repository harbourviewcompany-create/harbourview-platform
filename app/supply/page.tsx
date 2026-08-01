import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import {
  getSupplyCatalog,
  isSupplyCategory,
  SUPPLY_CATEGORY_LABELS,
  type SupplyCategory,
  type SupplyListing,
} from '@/lib/server/supplyQuery'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Supply Catalog | Harbourview',
  description:
    'Browse packaging, consumables and equipment formats available for Harbourview review and commercial quotation.',
  openGraph: {
    title: 'Supply Catalog | Harbourview',
    description:
      'Browse packaging, consumables and equipment formats available for reviewed commercial quotation.',
  },
}

type PageProps = { searchParams: Promise<{ category?: string; q?: string }> }

const FILTER_TABS: Array<{ label: string; value: 'all' | SupplyCategory }> = [
  { label: 'All Products', value: 'all' },
  { label: SUPPLY_CATEGORY_LABELS.packaging, value: 'packaging' },
  { label: SUPPLY_CATEGORY_LABELS.consumables, value: 'consumables' },
  { label: SUPPLY_CATEGORY_LABELS.cultivation_equipment, value: 'cultivation_equipment' },
  { label: SUPPLY_CATEGORY_LABELS.processing_equipment, value: 'processing_equipment' },
  { label: SUPPLY_CATEGORY_LABELS.labs_testing, value: 'labs_testing' },
]

function ProductCard({ listing }: { listing: SupplyListing }) {
  const categoryLabel = isSupplyCategory(listing.category)
    ? SUPPLY_CATEGORY_LABELS[listing.category]
    : listing.category.replace(/[_-]+/g, ' ')

  return (
    <article className="group flex h-full flex-col rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30">
      <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/76">
        <span>{categoryLabel}</span>
        {listing.is_featured ? (
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-gold">Featured</span>
        ) : null}
      </div>
      <h3 className="mb-2 text-lg font-semibold leading-snug text-[#f5f1e8]">{listing.title}</h3>
      <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-white/38">SKU {listing.sku}</p>
      <p className="flex-1 text-sm leading-7 text-white/58">{listing.description}</p>

      {listing.public_attributes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {listing.public_attributes.map((attribute) => (
            <span key={attribute.key} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/50">
              {attribute.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 border-t border-white/5 pt-4">
        <p className="text-base font-semibold text-[#f5f1e8]">{listing.price_display}</p>
        <p className="mt-2 text-[11px] text-white/44">{listing.availability_status}</p>
      </div>

      <Link href={`/supply/${encodeURIComponent(listing.slug)}`} className="btn-marketplace mt-6 justify-center text-center text-sm">
        Review Item & Request Quote
      </Link>
    </article>
  )
}

export default async function SupplyCatalogPage({ searchParams }: PageProps) {
  const { category, q } = await searchParams
  const activeCategory = category && isSupplyCategory(category) ? category : 'all'
  const listings = await getSupplyCatalog({ category: activeCategory, search: q })

  return (
    <>
      <PublicHero
        eyebrow="Harbourview Supply"
        title="Packaging, consumables and equipment for reviewed commercial procurement."
        actions={[
          { label: 'Request a Quote', href: '/marketplace/quote' },
          { label: 'Full Exchange', href: '/marketplace', variant: 'secondary' },
        ]}
      >
        <p>
          Browse unbranded product formats and equipment categories intended for licensed-operator procurement review.
          Pricing, availability, lead time, jurisdiction fit and final specifications are confirmed through Harbourview before reliance or purchase.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Browse the catalog" title="Filter by category." />

        <form action="/supply" method="get" className="mb-6 flex flex-col gap-3 sm:flex-row">
          {activeCategory !== 'all' ? <input type="hidden" name="category" value={activeCategory} /> : null}
          <input
            name="q"
            defaultValue={q ?? ''}
            aria-label="Search supply catalog"
            placeholder="Search by product title or SKU"
            className="min-h-12 flex-1 rounded-sm border border-white/10 bg-[#071425] px-4 text-sm text-white outline-none placeholder:text-white/32 focus:border-gold/40"
          />
          <button type="submit" className="btn-marketplace min-h-12 justify-center px-6 text-sm">Search</button>
        </form>

        <div className="mb-8 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const isActive = tab.value === activeCategory
            const params = new URLSearchParams()
            if (tab.value !== 'all') params.set('category', tab.value)
            if (q?.trim()) params.set('q', q.trim())
            const href = params.size ? `/supply?${params.toString()}` : '/supply'

            return (
              <Link
                key={tab.value}
                href={href}
                className={
                  isActive
                    ? 'rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold'
                    : 'rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/56 transition-colors hover:border-gold/30 hover:text-gold'
                }
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {listings.length === 0 ? (
          <EmptyState title="No catalog items match this search." action={{ label: 'View all products', href: '/supply' }}>
            <p>Try another category or submit a quote request for a reviewed sourcing response.</p>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => <ProductCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </PublicSection>

      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Catalog entries are commercial review records, not certifications or binding inventory commitments. Product attributes, rights to supply, pricing, availability, lead time and jurisdiction-specific requirements must be confirmed before reliance or purchase.
        </PublicCard>
      </PublicSection>
    </>
  )
}
