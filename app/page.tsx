import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Intelligence and Commercial Advisory',
  description:
    'Harbourview provides commercial intelligence, strategic introductions, and market-access support for serious participants in regulated markets.',
  openGraph: {
    title: 'Harbourview | Market Access Intelligence and Commercial Advisory',
    description:
      'Harbourview provides commercial intelligence, strategic introductions, and market-access support for serious participants in regulated markets.',
  },
}

const capabilities = [
  {
    title: 'Commercial Intelligence',
    body: 'Market monitoring, pricing signals, and deal flow analysis across regulated markets.',
  },
  {
    title: 'Strategic Introductions',
    body: 'Facilitated counterparty introductions with pre-qualification and confidentiality controls.',
  },
  {
    title: 'Counterparty Screening',
    body: 'Background review and commercial assessment of buyers, sellers, and partners before introductions are made.',
  },
  {
    title: 'Controlled Marketplace Routing',
    body: 'Reviewed listings matched to qualified counterparties through a structured, managed process.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Section 1 — Hero */}
      <section className="bg-navy text-white py-24">
        <div className="page-container max-w-4xl">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            Market access backed by intelligence{' '}
            <span className="text-gold">and relationships.</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mb-10 leading-relaxed">
            Harbourview provides commercial intelligence, strategic introductions,
            and market-access support for serious participants in regulated markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/marketplace" className="btn-primary px-8 py-3 text-base">
              Explore Marketplace
            </Link>
            <Link
              href="/intake"
              className="btn-outline px-8 py-3 text-base border-gold text-gold hover:bg-gold hover:text-navy"
            >
              Request a Confidential Discussion
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2 — What Harbourview Does */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
            What Harbourview Does
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((item) => (
              <div key={item.title} className="border-t-2 border-gold pt-5">
                <h3 className="font-semibold text-navy text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Marketplace Entry */}
      <section className="bg-navy text-white py-20">
        <div className="page-container max-w-3xl">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
            Marketplace
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold mb-5">
            A controlled environment for reviewed commercial listings.
          </h3>
          <p className="text-gray-300 leading-relaxed mb-8">
            The Harbourview marketplace covers new and surplus equipment, cannabis
            inventory for licensed operators, wanted requests from active buyers,
            professional services, business opportunities, and supplier discovery.
            Listings are reviewed before publication. Introductions are managed.
          </p>
          <Link href="/marketplace" className="btn-primary px-8 py-3 text-base">
            Enter Marketplace
          </Link>
        </div>
      </section>

      {/* Section 4 — Buyer Pathway */}
      <section className="py-20 bg-gray-50">
        <div className="page-container grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
              For Buyers
            </h2>
            <h3 className="text-2xl font-bold text-navy mb-4">
              Source reviewed inventory, equipment, and opportunities.
            </h3>
            <p className="text-gray-500 leading-relaxed mb-6">
              Browse listings that have been reviewed before publication. Post wanted
              requests to reach sellers actively monitoring the marketplace. Request
              controlled introductions to screened counterparties. Confidentiality
              is maintained throughout.
            </p>
            <Link href="/marketplace/wanted" className="btn-secondary px-6 py-2.5 text-sm">
              Post a Wanted Request
            </Link>
          </div>

          {/* Section 5 — Seller Pathway */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
              For Sellers
            </h2>
            <h3 className="text-2xl font-bold text-navy mb-4">
              Reach qualified buyers through a managed channel.
            </h3>
            <p className="text-gray-500 leading-relaxed mb-6">
              Submit products, inventory, equipment, or services for review. Listings
              are assessed before reaching the marketplace. Introductions are made to
              qualified counterparties — not broadcast to unscreened audiences.
            </p>
            <Link href="/marketplace/sell" className="btn-secondary px-6 py-2.5 text-sm">
              Submit a Listing
            </Link>
          </div>
        </div>
      </section>

      {/* Section 6 — Signals and Intelligence */}
      <section className="bg-navy text-white py-20">
        <div className="page-container">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-10">
            Intelligence Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="border border-navy-light rounded-lg p-8">
              <div className="inline-block text-xs font-semibold uppercase tracking-widest bg-gold text-navy px-2 py-1 rounded mb-4">
                Coming Soon
              </div>
              <h3 className="text-xl font-bold mb-3">Signals</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Market monitoring and commercial signals for regulated industry
                participants — pricing trends, supply shifts, and deal flow indicators.
              </p>
              <Link
                href="/signals"
                className="text-gold text-sm font-medium hover:underline"
              >
                Learn more →
              </Link>
            </div>

            <div className="border border-navy-light rounded-lg p-8">
              <div className="inline-block text-xs font-semibold uppercase tracking-widest bg-gold text-navy px-2 py-1 rounded mb-4">
                Coming Soon
              </div>
              <h3 className="text-xl font-bold mb-3">Intelligence</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Commercial briefs, counterparty dossiers, and route-to-market analysis
                prepared for operators, investors, and advisors.
              </p>
              <Link
                href="/intelligence"
                className="text-gold text-sm font-medium hover:underline"
              >
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7 — Confidential Intake CTA */}
      <section className="py-20 bg-white">
        <div className="page-container max-w-2xl text-center mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
            Confidential Intake
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-navy mb-5">
            Begin a confidential conversation.
          </h3>
          <p className="text-gray-500 leading-relaxed mb-8">
            For buyers, sellers, operators, and partners seeking a confidential
            conversation, Harbourview manages the intake process. Submissions are
            reviewed and responses are handled directly.
          </p>
          <Link href="/intake" className="btn-primary px-8 py-3 text-base">
            Begin Confidential Intake
          </Link>
        </div>
      </section>
    </>
  )
}
