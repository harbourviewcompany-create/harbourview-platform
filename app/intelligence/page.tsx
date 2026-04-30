import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Intelligence',
  description:
    'Commercial briefs, counterparty dossiers, and route-to-market analysis for operators, investors, and advisors in regulated markets.',
}

export default function IntelligencePage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <div className="inline-block text-xs font-semibold uppercase tracking-widest bg-gold text-navy px-2 py-1 rounded mb-4">
            Coming Soon
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Intelligence</h1>
          <p className="text-gray-300 max-w-2xl">
            Commercial briefs, counterparty dossiers, and route-to-market analysis
            prepared for operators, investors, and advisors.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="page-container max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Commercial Briefs</h3>
              <p className="text-gray-500 text-sm">
                Structured analysis of market segments, regulatory environments,
                and commercial opportunity in targeted regulated markets.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Counterparty Dossiers</h3>
              <p className="text-gray-500 text-sm">
                Background and commercial assessment of prospective buyers,
                sellers, and partners prior to introduction.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Route-to-Market Analysis</h3>
              <p className="text-gray-500 text-sm">
                Assessment of market entry pathways, distribution channels, and
                commercial positioning for operators entering new markets.
              </p>
            </div>
            <div className="border-t-2 border-gold pt-5">
              <h3 className="font-semibold text-navy text-base mb-2">Bespoke Engagements</h3>
              <p className="text-gray-500 text-sm">
                Custom research and advisory engagements for investors, operators,
                and advisors with specific intelligence requirements.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-navy font-bold text-xl mb-3">Request a Briefing</h2>
            <p className="text-gray-500 text-sm mb-6">
              Intelligence engagements are handled on a confidential basis. Submit
              an intake request to describe your requirements and be contacted by
              the Harbourview team.
            </p>
            <Link href="/intake" className="btn-primary px-8 py-3">
              Request a Briefing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
