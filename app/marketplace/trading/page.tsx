import type { Metadata } from 'next'
import Link from 'next/link'
import { TradingListingCard } from '@/components/marketplace/TradingListingCard'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import { TRADING_CATEGORIES } from '@/lib/marketplace/tradingMarketplace'
import { getTradingBoardPage } from '@/lib/server/tradingListingsQuery'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Wholesale Trading Board | Harbourview Exchange',
  description: 'Reviewed wholesale cannabis inventory, processing services, buyer routing, analytical documents and commercial terms through Harbourview.',
}

type SearchParams = Promise<{
  category?: string
  q?: string
  country?: string
  page?: string
}>

function hrefFor(params: { category?: string; q?: string; country?: string; page?: number }) {
  const next = new URLSearchParams()
  if (params.category && params.category !== 'all') next.set('category', params.category)
  if (params.q) next.set('q', params.q)
  if (params.country) next.set('country', params.country)
  if (params.page && params.page > 1) next.set('page', String(params.page))
  const query = next.toString()
  return `/marketplace/trading${query ? `?${query}` : ''}`
}

export default async function TradingBoardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const category = TRADING_CATEGORIES.some((item) => item.key === params.category) ? params.category! : 'all'
  const requestedPage = Number.parseInt(params.page ?? '1', 10)
  const board = await getTradingBoardPage({
    category,
    search: params.q,
    country: params.country,
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
  })
  const selectedCategory = TRADING_CATEGORIES.find((item) => item.key === category) ?? TRADING_CATEGORIES[0]
  const controlled = selectedCategory.kind === 'controlled'

  return (
    <>
      <PublicHero
        eyebrow="Harbourview Exchange — Trading Board"
        title="Wholesale supply with enough detail to make a commercial decision."
        actions={[
          { label: 'Submit Cannabis Supply', href: '/marketplace/sell/cannabis' },
          { label: 'Submit a Service', href: '/marketplace/sell/service', variant: 'secondary' },
          { label: 'Post Buyer Demand', href: '/marketplace/sell?type=wanted', variant: 'secondary' },
        ]}
      >
        <p>
          Review public-safe stock, specifications, analytical documents, volume pricing, shipping coverage, service capacity and availability before requesting a qualified introduction.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Counterparty identity, licences, private evidence and sensitive commercial context remain controlled until Harbourview review supports the introduction.
        </p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Market categories" title="Browse the complete wholesale supply surface." />
        <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {TRADING_CATEGORIES.map((item) => {
            const active = item.key === category
            return (
              <Link
                key={item.key}
                href={hrefFor({ category: item.key, q: params.q, country: params.country })}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${active
                  ? 'border-gold bg-gold text-navy'
                  : 'border-white/10 bg-white/[0.025] text-white/58 hover:border-gold/30 hover:text-white/80'}`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <PublicCard className="mt-5 p-5">
          <form method="get" action="/marketplace/trading" className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            {category !== 'all' ? <input type="hidden" name="category" value={category} /> : null}
            <label className="block">
              <span className="sr-only">Search inventory and services</span>
              <input
                name="q"
                defaultValue={params.q ?? ''}
                placeholder="Search flower, isolate, service, cannabinoid, market…"
                className="w-full rounded-xl border border-white/10 bg-[#061322] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/45"
              />
            </label>
            <label className="block">
              <span className="sr-only">Country</span>
              <select
                name="country"
                defaultValue={params.country ?? ''}
                className="w-full rounded-xl border border-white/10 bg-[#061322] px-4 py-3 text-sm text-white outline-none focus:border-gold/45"
              >
                <option value="">All countries</option>
                {board.countries.map((countryName) => <option key={countryName} value={countryName}>{countryName}</option>)}
              </select>
            </label>
            <button type="submit" className="btn-marketplace justify-center px-6">Search market</button>
          </form>
        </PublicCard>
      </PublicSection>

      <PublicSection tone="navy">
        <SectionHeader
          eyebrow={selectedCategory.label}
          title={selectedCategory.description}
        />

        {controlled ? (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <PublicCard className="p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Qualified access only</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#f5f1e8]">Controlled inventory is not exposed on the public board.</h2>
              <p className="mt-4 text-sm leading-7 text-white/60">
                Licensed buyers and suppliers can submit jurisdiction, licence, product, quantity and documentation requirements for private review and routing.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/marketplace/sell?type=qualified_access_request" className="btn-marketplace">Request qualified access</Link>
                <Link href="/intake" className="btn-outline">Confidential intake</Link>
              </div>
            </PublicCard>
            <PublicCard className="p-7 text-sm leading-7 text-white/58">
              <p className="font-semibold text-white/78">Public/private boundary</p>
              <p className="mt-3">Harbourview may show a public-safe opportunity summary only where publication is appropriate. Licence evidence, counterparties, private documents and controlled transaction terms remain off public routes.</p>
            </PublicCard>
          </div>
        ) : board.rows.length === 0 ? (
          <PublicCard className="p-8 text-center">
            <h2 className="text-xl font-semibold text-[#f5f1e8]">No reviewed listings match these filters.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/55">Create a buyer requirement or submit supply for Harbourview review instead of treating an empty public result as absence from the private network.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/marketplace/sell?type=wanted" className="btn-marketplace">Post buyer demand</Link>
              <Link href="/marketplace/sell/cannabis" className="btn-outline">Submit supply</Link>
            </div>
          </PublicCard>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/42">
              <p>{board.total} reviewed public {board.total === 1 ? 'listing' : 'listings'}</p>
              <p>Page {board.page} of {board.totalPages}</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {board.rows.map((listing) => <TradingListingCard key={listing.id} listing={listing} />)}
            </div>
            {board.totalPages > 1 ? (
              <nav aria-label="Trading board pagination" className="mt-8 flex items-center justify-center gap-3">
                {board.page > 1 ? (
                  <Link className="btn-outline px-5 py-2 text-sm" href={hrefFor({ category, q: params.q, country: params.country, page: board.page - 1 })}>Previous</Link>
                ) : null}
                <span className="text-xs text-white/42">{board.page} / {board.totalPages}</span>
                {board.page < board.totalPages ? (
                  <Link className="btn-outline px-5 py-2 text-sm" href={hrefFor({ category, q: params.q, country: params.country, page: board.page + 1 })}>Next</Link>
                ) : null}
              </nav>
            ) : null}
          </>
        )}
      </PublicSection>
    </>
  )
}
