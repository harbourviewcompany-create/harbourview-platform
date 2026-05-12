import type { Metadata } from 'next'
import Link from 'next/link'
import { cannabisInventoryListings } from '@/lib/fixtures/cannabis-inventory'
import CannabisInventoryDealroom from '@/components/CannabisInventoryDealroom'

export const metadata: Metadata = {
  title: 'Cannabis Inventory | Harbourview Network',
  description:
    'Licensed-only cannabis inventory review and private inquiry routing for regulated operators. Public summaries are not offers to sell or distribute regulated product.',
}

export default function CannabisInventoryPage() {
  const resultCount = cannabisInventoryListings.length

  return (
    <main className="min-h-screen bg-[#010711] text-white">
      <section className="relative isolate overflow-hidden border-b border-gold/10 bg-[#010711]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(198,165,90,0.18),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(50,75,112,0.2),transparent_34%),linear-gradient(135deg,rgba(1,7,17,1)_0%,rgba(8,21,38,0.98)_52%,rgba(1,5,13,1)_100%)]" />
        <div className="page-container py-10 sm:py-12 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/80">
                <Link href="/marketplace" className="hover:text-gold-pale">Harbourview Network</Link>
                <span className="mx-3 text-white/24">/</span>
                Licensed inventory
              </p>

              <h1 className="font-serif text-4xl leading-[0.98] tracking-[-0.045em] text-[#f4f1eb] sm:text-5xl lg:text-6xl">
                Cannabis Inventory
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/66 sm:text-lg">
                Reviewed public summaries for bulk flower, biomass, concentrates and genetics
                pathways. Harbourview routes qualified inquiries privately after licence and
                jurisdictional review.
              </p>

              <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/58">
                <span className="rounded-full border border-gold/18 bg-white/[0.035] px-4 py-2 text-gold/86">
                  {resultCount} reviewed summaries
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                  Public-safe inventory context
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                  Introduction routing only
                </span>
              </div>
            </div>

            <aside className="rounded-sm border border-gold/14 bg-[#061222]/82 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/74">
                Access control
              </p>
              <p className="mt-3 text-sm leading-6 text-white/64">
                Public listings are discovery summaries. Counterparty detail, documentation,
                source context and transaction terms stay inside reviewed private workflows.
              </p>
              <Link
                href="/intake"
                className="mt-5 inline-flex w-full items-center justify-between rounded-sm border border-gold/28 bg-gold/12 px-4 py-3 text-sm font-semibold text-gold-pale transition hover:border-gold/55 hover:bg-gold/18"
              >
                Request introduction
                <span aria-hidden="true">→</span>
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#07111f]">
        <div className="page-container py-4">
          <div className="rounded-sm border border-gold/16 bg-[#0d1724] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.22)] sm:flex sm:items-start sm:gap-4">
            <div className="mb-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/24 bg-gold/10 text-sm font-semibold text-gold sm:mb-0">
              HV
            </div>
            <p className="text-sm leading-7 text-white/68">
              <strong className="font-semibold text-gold-pale">For licensed operators only.</strong>{' '}
              Public summaries are not offers to sell, purchase or distribute regulated product.
              All activity requires appropriate licence documentation, jurisdictional review and
              direct agreement between parties. Harbourview facilitates reviewed introductions only
              and is not a party to any transaction.
            </p>
          </div>
        </div>
      </section>

      <CannabisInventoryDealroom listings={cannabisInventoryListings} />
    </main>
  )
}
