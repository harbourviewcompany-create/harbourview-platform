import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection, SectionHeader, EmptyState } from '@/components/PublicUi'
import {
  getSupplyCatalog,
  isSupplyCategory,
  SUPPLY_CATEGORY_LABELS,
  type SupplyCategory,
  type SupplyListing,
} from '@/lib/server/supplyQuery'
import { getSupplyCategoryMedia } from '@/lib/server/supplyMedia'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Supply Catalog | Harbourview',
  description:
    'Harbourview-direct consumables, packaging and equipment for licensed cannabis operators — in stock and ready to ship.',
  openGraph: {
    title: 'Supply Catalog | Harbourview',
    description:
      'Browse Harbourview-direct consumables, packaging and equipment for licensed cannabis operators.',
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

function getComplianceBadges(listing: SupplyListing): string[] {
  const badges: string[] = []
  const flagsByCountry = listing.compliance_flags || {}
  const seen = new Set<string>()
  for (const country of Object.keys(flagsByCountry)) {
    const flags = flagsByCountry[country] || {}
    if (flags.child_resistant && !seen.has('cr')) {
      badges.push('Child-Resistant')
      seen.add('cr')
    }
    if (flags.tamper_evident && !seen.has('te')) {
      badges.push('Tamper-Evident')
      seen.add('te')
    }
    if (flags.plain_packaging && !seen.has('pp')) {
      badges.push('Plain Packaging Compliant')
      seen.add('pp')
    }
    if (typeof flags.max_thc_mg_per_package === 'number' && !seen.has('thc')) {
      badges.push(`Max ${flags.max_thc_mg_per_package}mg THC/Package`)
      seen.add('thc')
    }
  }
  return badges
}

function formatPrice(listing: SupplyListing): string {
  if (listing.price_display) return listing.price_display
  if (listing.price_amount != null) return `${listing.price_currency} ${listing.price_amount}`
  return 'Price on request'
}

function ProductCard({ listing }: { listing: SupplyListing }) {
  const href = listing.slug ? `/supply/${encodeURIComponent(listing.slug)}` : '/marketplace/quote'
  const badges = getComplianceBadges(listing)
  const categoryLabel = isSupplyCategory(listing.category)
    ? SUPPLY_CATEGORY_LABELS[listing.category]
    : listing.category.replace(/[_-]+/g, ' ')
  const media = getSupplyCategoryMedia(listing.category)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30">
      <figure className="relative h-40 w-full overflow-hidden bg-black/20">
        <img src={media.src} alt={media.altText} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90" />
        <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold backdrop-blur-sm">
          {media.badgeLabel}
        </span>
      </figure>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/76">
          <span>{categoryLabel}</span>
          {listing.is_featured ? (
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-gold">Featured</span>
          ) : null}
        </div>
        <h3 className="mb-2 text-lg font-semibold leading-snug text-[#f5f1e8]">{listing.title}</h3>
        {listing.sku ? <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-white/38">SKU {listing.sku}</p> : null}
        <p className="flex-1 text-sm leading-7 text-white/58">{listing.description}</p>

        {badges.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/50">
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex items-baseline justify-between border-t border-white/5 pt-4">
          <span className="text-base font-semibold text-[#f5f1e8]">{formatPrice(listing)}</span>
          {listing.unit ? <span className="text-[11px] uppercase tracking-[0.1em] text-white/38">/ {listing.unit}</span> : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/44">
          {listing.moq ? <span>MOQ {listing.moq.toLocaleString()}</span> : null}
          {listing.lead_time_days ? <span>{listing.lead_time_days}-day lead time</span> : null}
          {listing.stock_qty != null ? <span>{listing.stock_qty.toLocaleString()} in stock</span> : null}
        </div>

        <Link href={href} className="btn-marketplace mt-6 justify-center text-center text-sm">
          View & Request Quote
        </Link>
      </div>
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
        title="Consumables, packaging and equipment — sourced and stocked by Harbourview."
        actions={[
          { label: 'Request a Quote', href: '/marketplace/quote' },
          { label: 'Full Exchange', href: '/marketplace', variant: 'secondary' },
        ]}
      >
        <p>
          A direct catalog for licensed operator procurement teams: jars, pouches, pre-roll tubes and cones, vape and
          tincture packaging, edible and topical formats, plus the machines to run them — all sourced and sold
          directly by Harbourview.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Currently available for Canada, with compliance metadata mapped to the Cannabis Act's plain-packaging and
          child-resistant requirements. Additional markets are rolling out on an ongoing basis.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Browse the catalog" title="Filter by category." />
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const isActive = tab.value === activeCategory
            const href = tab.value === 'all' ? '/supply' : `/supply?category=${tab.value}`
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

        <form action="/supply" method="get" className="mb-8 flex flex-wrap items-center gap-3">
          {activeCategory !== 'all' ? <input type="hidden" name="category" value={activeCategory} /> : null}
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search products, SKU, or brand"
            className="w-full max-w-sm rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white/80 placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
          />
          <button type="submit" className="btn-marketplace px-5 py-2 text-[10px]">
            Search
          </button>
          {q ? (
            <Link
              href={activeCategory === 'all' ? '/supply' : `/supply?category=${activeCategory}`}
              className="text-[11px] text-white/40 transition-colors hover:text-gold"
            >
              Clear search
            </Link>
          ) : null}
        </form>

        {listings.length === 0 ? (
          <EmptyState
            title="No catalog items match this filter yet."
            action={{ label: 'View all products', href: '/supply' }}
          >
            <p>Try a different category, or request a quote directly and our team will follow up with options.</p>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </PublicSection>

      <PublicSection tone="navy">
        <PublicCard className="p-7 text-sm leading-7 text-white/62">
          Pricing shown is list pricing for planning purposes; final pricing depends on order volume, destination and
          current supplier terms. Submit a quote request for a firm quote and lead time.
        </PublicCard>
      </PublicSection>
    </>
  )
}
