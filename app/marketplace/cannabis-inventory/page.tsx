import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import { TRADING_CATEGORIES } from '@/lib/marketplace/tradingMarketplace'

export const metadata: Metadata = {
  title: 'Wholesale Cannabis Inventory | Harbourview Exchange',
  description: 'Reviewed wholesale flower, isolates, distillates, seeds, biomass, oils, terpenes, finished formats and related cannabis inventory.',
}

export default function CannabisInventoryCategoryPage() {
  const inventoryCategories = TRADING_CATEGORIES.filter((item) => item.kind === 'inventory' && item.key !== 'all')
  const controlled = TRADING_CATEGORIES.find((item) => item.kind === 'controlled')

  return (
    <>
      <PublicHero
        eyebrow="Exchange — Cannabis Inventory"
        title="Tradeable wholesale inventory with governed commercial detail."
        actions={[
          { label: 'Open Trading Board', href: '/marketplace/trading' },
          { label: 'Submit Cannabis Supply', href: '/marketplace/sell/cannabis', variant: 'secondary' },
          { label: 'Post Buyer Demand', href: '/marketplace/sell?type=wanted', variant: 'secondary' },
        ]}
      >
        <p>Browse reviewed lots with public-safe stock, cannabinoid results, volume pricing, shipping coverage, analytical documents, availability and activity status where approved.</p>
        <p className="mt-4 text-sm leading-7 text-white/54">Seller identity, private evidence, licence documentation and sensitive commercial context remain controlled until a qualified Harbourview introduction is appropriate.</p>
      </PublicHero>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Wholesale formats" title="The trading taxonomy buyers actually search." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {inventoryCategories.map((category) => (
            <Link key={category.key} href={`/marketplace/trading?category=${encodeURIComponent(category.key)}`} className="group rounded-2xl border border-white/8 bg-white/[0.025] p-5 transition hover:border-gold/30 hover:bg-white/[0.04]">
              <p className="text-sm font-semibold text-[#f5f1e8]">{category.label}</p>
              <p className="mt-2 text-xs leading-6 text-white/45">{category.description}</p>
              <p className="mt-4 text-xs font-semibold text-gold/80">Browse supply →</p>
            </Link>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="navy">
        <div className="grid gap-6 lg:grid-cols-2">
          <PublicCard className="p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Transaction-ready public dossier</p>
            <h2 className="mt-3 text-xl font-semibold text-[#f5f1e8]">Stock, testing, logistics and pricing are first-class marketplace data.</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">Approved listings can expose lot reference, available quantity, production origin, cultivation or processing method, cannabinoid profile, price tiers, MOQ, packaging, Incoterms, shipping territories, sample availability, public COAs/documents, publication date and market activity.</p>
          </PublicCard>
          <PublicCard className="p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{controlled?.label ?? 'Controlled supply'}</p>
            <h2 className="mt-3 text-xl font-semibold text-[#f5f1e8]">Restricted inventory stays off the open market.</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">Licensed buyers and suppliers can use qualified routing for non-public controlled inventory. Public merchandising never replaces jurisdiction, licence and counterparty qualification.</p>
            <Link href="/marketplace/trading?category=controlled" className="btn-outline mt-5 inline-flex">Qualified access pathway</Link>
          </PublicCard>
        </div>
      </PublicSection>
    </>
  )
}
