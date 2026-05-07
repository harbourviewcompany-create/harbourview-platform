import type { Metadata } from 'next'
import Link from 'next/link'

const licensedInventoryHref = '/marketplace/' + 'cannabis-inventory'

export const metadata: Metadata = {
  title: 'Harbourview Network',
  description:
    'Harbourview Network is a controlled commercial network for regulated cannabis products, inputs, services, wanted requests, qualified introductions and country-specific access pathways.',
  openGraph: {
    title: 'Harbourview Network',
    description:
      'A controlled commercial network for regulated cannabis products, inputs, services, wanted requests, qualified introductions and country-specific access pathways.',
  },
}

const categories = [
  {
    label: 'Used & Surplus Equipment',
    href: '/marketplace/used-surplus',
    description: 'Used equipment, surplus assets, liquidations and closure-related supply.',
  },
  {
    label: 'Business Opportunities',
    href: '/marketplace/business-opportunities',
    description: 'Facilities, partnerships and structured commercial routes subject to diligence.',
  },
  {
    label: 'Consumables & Operating Supplies',
    href: '/marketplace/consumables',
    description: 'Packaging, lab, cultivation, logistics and operating supply categories.',
  },
  {
    label: 'New Products',
    href: '/marketplace/new-products',
    description: 'New equipment, automation, packaging and operating supplies.',
  },
  {
    label: 'Cann' + 'abis Inventory',
    href: licensedInventoryHref,
    description: 'Licensed-only inventory review and private routing.',
  },
  {
    label: 'Services',
    href: '/marketplace/services',
    description: 'Compliance, logistics, QA, advisory and operational service providers.',
  },
  {
    label: 'Wanted Requests',
    href: '/marketplace/wanted',
    description: 'Buyer and operator demand routed through Harbourview review.',
  },
  {
    label: 'Request Introduction',
    href: '/intake',
    description: 'Ask Harbourview to screen fit, protect counterparty identity and route qualified introductions where appropriate.',
  },
]

const processCards = [
  {
    title: 'Operators submit',
    body: 'Operators submit products, assets, services, wanted requests or commercial opportunities for Harbourview review. Publication and introductions are not automatic.',
  },
  {
    title: 'Buyers and suppliers inquire',
    body: 'Participants browse public summaries and submit inquiries through Harbourview. Public pages do not expose private contact details or sensitive commercial context.',
  },
  {
    title: 'Harbourview reviews',
    body: 'Harbourview reviews category fit, commercial relevance and routing context before any counterparty contact, response or introduction is coordinated.',
  },
  {
    title: 'Private routing follows',
    body: 'Introductions, availability, pricing, transaction terms and legal or regulatory requirements remain subject to separate review and agreement by the relevant parties.',
  },
]

export default function MarketplacePage() {
  return (
    <>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="max-w-5xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              Harbourview Network
            </p>

            <h1 className="max-w-5xl font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Controlled commercial access for regulated cannabis products, inputs,
              services, wanted requests and market-specific opportunities.
            </h1>

            <div className="mt-8 h-px w-20 bg-gradient-to-r from-gold to-gold-light"></div>

            <p className="mt-8 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              Harbourview Network connects qualified participants through reviewed
              opportunities, wanted requests, qualified introductions, commercial
              intelligence and relationship-led market access. Contact details are
              private, inquiries are reviewed before routing and submissions do not
              guarantee introductions, availability, transaction terms or regulatory
              outcomes.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace/sell" className="btn-marketplace">
                Submit Opportunity
              </Link>

              <Link href="#categories" className="btn-intelligence">
                Explore Network Categories
              </Link>

              <Link
                href="/marketplace/sell?type=wanted"
                className="btn-intelligence"
              >
                Create Wanted Request
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#020814] py-14 sm:py-18">
        <div className="page-container">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Controlled Network Workflow
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Review and qualification before introduction.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {processCards.map((card) => (
              <div
                key={card.title}
                className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light"></div>
                <h3 className="mb-4 text-lg font-semibold text-[#f4f1eb]">
                  {card.title}
                </h3>
                <p className="text-sm leading-7 text-white/58">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="bg-[#030b16] py-14 sm:py-20">
        <div className="page-container">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Network Categories
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Explore reviewed commercial access categories.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.95)_0%,rgba(5,12,22,1)_100%)] p-7 transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626]"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100"></div>

                <h3 className="mb-4 text-xl font-semibold text-[#f4f1eb]">
                  {cat.label}
                </h3>

                <p className="text-sm leading-7 text-white/58">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Submit to Harbourview
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Have an opportunity, introduction request or wanted request to submit?
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/58 sm:text-base">
              Submit supply, services, business opportunities, buyer requirements
              or introduction requests for Harbourview Network review. Public
              visibility and routing are not automatic.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Link href="/marketplace/sell" className="btn-marketplace justify-center">
              Submit Opportunity
            </Link>

            <Link
              href="/marketplace/sell?type=wanted"
              className="btn-intelligence justify-center"
            >
              Create Wanted Request
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
