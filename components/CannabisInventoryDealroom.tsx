'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { CannabisInventoryListing } from '@/lib/fixtures/types'
import ListingCard from './ListingCard'

interface CannabisInventoryDealroomProps {
  listings: CannabisInventoryListing[]
}

const genericTags = new Set([
  'bulk',
  'bulk available',
  'bulk supply',
  'inquiry required',
  'licensed importers',
  'licensed retailers',
  'licensed producer',
  'lot available',
  'new stock',
  'wholesale',
])

const segments = [
  { value: 'all', label: 'All inventory', terms: [] },
  { value: 'flower', label: 'Flower', terms: ['flower'] },
  { value: 'extract', label: 'Extracts', terms: ['extract', 'concentrate', 'live resin', 'gmp'] },
  { value: 'biomass', label: 'Biomass', terms: ['biomass', 'hemp', 'cbd'] },
  { value: 'genetics', label: 'Genetics', terms: ['seed', 'genetics', 'feminised'] },
] as const

function uniqueValues(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
}

function formatTag(tag: string) {
  return tag
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function searchText(listing: CannabisInventoryListing) {
  return [
    listing.title,
    listing.description,
    listing.location,
    listing.price,
    listing.strain,
    listing.weightAvailable,
    ...listing.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function sortListings(listings: CannabisInventoryListing[], sort: string) {
  return [...listings].sort((first, second) => {
    if (sort === 'newest') {
      return new Date(second.postedDate).getTime() - new Date(first.postedDate).getTime()
    }

    if (sort === 'region') {
      return first.location.localeCompare(second.location)
    }

    if (sort === 'title') {
      return first.title.localeCompare(second.title)
    }

    return 0
  })
}

export default function CannabisInventoryDealroom({ listings }: CannabisInventoryDealroomProps) {
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState('all')
  const [region, setRegion] = useState('all')
  const [product, setProduct] = useState('all')
  const [orderSize, setOrderSize] = useState('all')
  const [access, setAccess] = useState('all')
  const [sort, setSort] = useState('reviewed')

  const regions = useMemo(() => uniqueValues(listings.map((listing) => listing.location)), [listings])
  const productTypes = useMemo(
    () =>
      uniqueValues(
        listings
          .flatMap((listing) => listing.tags)
          .filter((tag) => !genericTags.has(tag.toLowerCase()))
      ),
    [listings]
  )
  const orderSizes = useMemo(
    () => uniqueValues(listings.map((listing) => listing.weightAvailable || listing.price)),
    [listings]
  )

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const activeSegment = segments.find((item) => item.value === segment)

    const filtered = listings.filter((listing) => {
      const haystack = searchText(listing)

      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false
      if (region !== 'all' && listing.location !== region) return false
      if (product !== 'all' && !listing.tags.includes(product)) return false
      if (orderSize !== 'all' && listing.weightAvailable !== orderSize && listing.price !== orderSize) {
        return false
      }
      if (access === 'licensed' && !listing.licenseRequired) return false
      if (activeSegment && activeSegment.terms.length > 0 && !activeSegment.terms.some((term) => haystack.includes(term))) {
        return false
      }

      return true
    })

    return sortListings(filtered, sort)
  }, [access, listings, orderSize, product, query, region, segment, sort])

  function resetFilters() {
    setQuery('')
    setSegment('all')
    setRegion('all')
    setProduct('all')
    setOrderSize('all')
    setAccess('all')
    setSort('reviewed')
  }

  return (
    <>
      <section className="border-b border-gold/10 bg-[#020914]">
        <div className="page-container py-5">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
            {segments.map((item) => {
              const isActive = item.value === segment

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSegment(item.value)}
                  className={
                    isActive
                      ? 'shrink-0 rounded-full border border-gold/22 bg-gold/12 px-4 py-2 text-gold-pale'
                      : 'shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 transition hover:border-gold/22 hover:text-gold-pale'
                  }
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.1fr)_repeat(5,minmax(120px,0.52fr))]">
            <label className="block rounded-sm border border-gold/12 bg-white/[0.035] px-4 py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
                Search
              </span>
              <input
                aria-label="Search inventory summaries"
                className="mt-2 w-full bg-transparent text-sm text-white placeholder:text-white/34 focus:outline-none"
                placeholder="Product, state, order size"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <label className="block rounded-sm border border-gold/12 bg-white/[0.035] px-4 py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
                Region
              </span>
              <select
                aria-label="Region filter"
                className="mt-2 w-full bg-transparent text-sm text-white focus:outline-none"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                <option className="bg-[#07111f]" value="all">All regions</option>
                {regions.map((item) => (
                  <option key={item} className="bg-[#07111f]" value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="block rounded-sm border border-gold/12 bg-white/[0.035] px-4 py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
                Product
              </span>
              <select
                aria-label="Product type filter"
                className="mt-2 w-full bg-transparent text-sm text-white focus:outline-none"
                value={product}
                onChange={(event) => setProduct(event.target.value)}
              >
                <option className="bg-[#07111f]" value="all">All types</option>
                {productTypes.map((tag) => (
                  <option key={tag} className="bg-[#07111f]" value={tag}>{formatTag(tag)}</option>
                ))}
              </select>
            </label>

            <label className="block rounded-sm border border-gold/12 bg-white/[0.035] px-4 py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
                Order size
              </span>
              <select
                aria-label="Order size filter"
                className="mt-2 w-full bg-transparent text-sm text-white focus:outline-none"
                value={orderSize}
                onChange={(event) => setOrderSize(event.target.value)}
              >
                <option className="bg-[#07111f]" value="all">Any size</option>
                {orderSizes.map((size) => (
                  <option key={size} className="bg-[#07111f]" value={size}>{size}</option>
                ))}
              </select>
            </label>

            <label className="block rounded-sm border border-gold/12 bg-white/[0.035] px-4 py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
                Access
              </span>
              <select
                aria-label="Access filter"
                className="mt-2 w-full bg-transparent text-sm text-white focus:outline-none"
                value={access}
                onChange={(event) => setAccess(event.target.value)}
              >
                <option className="bg-[#07111f]" value="all">All routing</option>
                <option className="bg-[#07111f]" value="licensed">Licensed only</option>
              </select>
            </label>

            <label className="block rounded-sm border border-gold/12 bg-white/[0.035] px-4 py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">
                Sort
              </span>
              <select
                aria-label="Sort inventory"
                className="mt-2 w-full bg-transparent text-sm text-white focus:outline-none"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option className="bg-[#07111f]" value="reviewed">Reviewed first</option>
                <option className="bg-[#07111f]" value="newest">Newest summaries</option>
                <option className="bg-[#07111f]" value="region">Region A-Z</option>
                <option className="bg-[#07111f]" value="title">Title A-Z</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="bg-[#010711] py-8 sm:py-10 lg:py-12">
        <div className="page-container">
          <div className="mb-5 flex flex-col gap-3 border-b border-gold/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                Public marketplace view
              </p>
              <h2 className="mt-2 font-serif text-2xl tracking-[-0.035em] text-[#f4f1eb] sm:text-3xl">
                Available inventory summaries
              </h2>
            </div>
            <p className="text-sm leading-6 text-white/52">
              Showing {filteredListings.length} of {listings.length} summaries. Filters use public-safe listing fields only.
            </p>
          </div>

          {filteredListings.length === 0 ? (
            <div className="rounded-sm border border-gold/12 bg-[#061222] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold/72">No matching summaries</p>
              <h3 className="mt-3 font-serif text-2xl tracking-[-0.035em] text-[#f4f1eb]">Adjust the review filters.</h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/56">
                The public marketplace only exposes controlled summary fields. Use intake if the request requires a confidential review path.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-sm border border-gold/24 bg-gold/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-pale transition hover:border-gold/45 hover:bg-gold/16"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="mt-8 rounded-sm border border-gold/12 bg-[#061222] p-5 text-sm leading-7 text-white/58 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <p>
              Submitting licensed inventory or genetics context? Use the controlled intake path so
              Harbourview can review fit, documentation and routing requirements before any private
              introduction.
            </p>
            <Link href="/intake" className="mt-4 inline-flex shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:text-gold-pale sm:mt-0">
              Submit via Intake →
            </Link>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-20 border-t border-gold/14 bg-[#020914]/95 px-4 py-3 backdrop-blur sm:hidden">
        <Link href="/intake" className="flex items-center justify-between rounded-sm border border-gold/30 bg-gold/12 px-4 py-3 text-sm font-semibold text-gold-pale">
          Request introduction
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  )
}
