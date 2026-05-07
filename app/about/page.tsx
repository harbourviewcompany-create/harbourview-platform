import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Harbourview',
  description:
    'Learn how Harbourview supports commercial intelligence, controlled network access, reviewed opportunities, and market-access pathways.',
}

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="page-container">
          <p className="mb-4 text-sm uppercase tracking-[0.22em] text-gold">
            About Harbourview
          </p>
          <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
            Commercial intelligence, controlled access, and disciplined market routing.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-gray-300 sm:text-lg">
            Harbourview supports serious participants in regulated cannabis and adjacent
            supply chains by combining market-access intelligence, reviewed opportunity
            pathways, qualified inquiry handling, and relationship-led commercial support.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="page-container grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="card p-6 sm:p-8">
            <h2 className="mb-4 text-2xl font-semibold text-navy">What Harbourview does</h2>
            <div className="space-y-5 text-sm leading-7 text-gray-600 sm:text-base">
              <p>
                Harbourview is built for operators, suppliers, service providers, buyers,
                investors, and strategic partners who need commercially useful visibility
                without public exposure or undisciplined brokerage.
              </p>
              <p>
                Harbourview Network provides a controlled commercial environment for
                regulated cannabis products, inputs, services, wanted requests, supplier
                discovery, qualified introductions, and country-specific access pathways.
              </p>
              <p>
                Inquiries and submissions are reviewed before routing. Contact details remain
                private unless Harbourview coordinates an appropriate response or introduction.
              </p>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="card p-6">
              <h2 className="mb-3 text-base font-semibold text-navy">Positioning</h2>
              <p className="text-sm leading-7 text-gray-500">
                Market access backed by intelligence and relationships.
              </p>
            </div>

            <div className="card p-6">
              <h2 className="mb-3 text-base font-semibold text-navy">Operating standard</h2>
              <p className="text-sm leading-7 text-gray-500">
                Reviewed inquiries. Private contact handling. No public counterparty exposure.
                No guaranteed transaction, availability, introduction, or regulatory outcome.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="page-container">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                Intelligence
              </p>
              <h3 className="mb-3 text-lg font-semibold text-navy">Commercial context</h3>
              <p className="text-sm leading-7 text-gray-500">
                Market signals, category fit, route considerations, and counterparty context
                are treated as decision inputs, not public claims.
              </p>
            </div>

            <div className="card p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                Network
              </p>
              <h3 className="mb-3 text-lg font-semibold text-navy">Controlled discovery</h3>
              <p className="text-sm leading-7 text-gray-500">
                Listings, wanted requests, supplier discovery, and service support are routed
                through review so public pages stay commercially useful and disclosure-safe.
              </p>
            </div>

            <div className="card p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                Access
              </p>
              <h3 className="mb-3 text-lg font-semibold text-navy">Relationship-led routing</h3>
              <p className="text-sm leading-7 text-gray-500">
                Harbourview prioritizes qualified pathways, serious counterparties, and
                disciplined follow-up over open marketplace exposure.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 bg-[#020814] py-12 text-white sm:py-16">
        <div className="page-container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.22em] text-gold">
              Next step
            </p>
            <h2 className="max-w-2xl text-2xl font-semibold sm:text-3xl">
              Use Harbourview Network or request intelligence support.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/marketplace" className="btn-marketplace">
              <span>Enter Harbourview Network</span>
              <span className="text-xl leading-none">→</span>
            </Link>
            <Link href="/intelligence" className="btn-intelligence">
              <span>Request Intelligence</span>
              <span className="text-xl leading-none">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
