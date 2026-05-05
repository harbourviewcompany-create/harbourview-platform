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
    body: 'Facilitated counterparty introductions with pre-qualification, background review, and confidentiality controls built into every engagement.',
  },
  {
    title: 'Managed Deal Access',
    body: 'Opportunities are matched to qualified counterparties through a structured process — buyers and sellers only engage with screened, relevant matches.',
  },
]

export default function HomePage() {
  return (
    <>
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
            <Link href="/intake" className="btn-primary px-8 py-3 text-base">
              Request a Confidential Discussion
            </Link>
            <Link
              href="/marketplace"
              className="btn-outline px-8 py-3 text-base border-gold text-gold hover:bg-gold hover:text-navy"
            >
              Explore Network
            </Link>
          </div>
        </div>
      </section>


      <section className="bg-navy text-white py-20">
        <div className="page-container max-w-3xl">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">Harbourview Network</h2>
          <h3 className="text-2xl sm:text-3xl font-bold mb-5">A controlled commercial network for regulated cannabis products, inputs, genetics, services and market-specific opportunities.</h3>
          <p className="text-gray-300 leading-relaxed mb-8">Harbourview Network covers reviewed supply, buyer demand, commercial opportunities and market-specific pathways. Contact details are not public. Harbourview reviews inquiries before coordinating introductions or transaction follow-up.</p>
          <Link href="/marketplace" className="btn-primary px-8 py-3 text-base">Enter Network</Link>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="page-container">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
            What Harbourview Does
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {capabilities.map((item) => (
              <div key={item.title} className="border-t-2 border-gold pt-5">
                <h3 className="font-semibold text-navy text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              requests to reach sellers actively monitoring the Network. Request
              controlled introductions to screened counterparties. Confidentiality
              is maintained throughout.
            </p>
            <Link href="/marketplace/wanted" className="btn-secondary px-6 py-2.5 text-sm">
              Post What You Want to Buy
            </Link>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
              For Sellers
            </h2>
            <h3 className="text-2xl font-bold text-navy mb-4">
              Reach qualified buyers through a managed channel.
            </h3>
            <p className="text-gray-500 leading-relaxed mb-6">
              Submit products, inventory, equipment, or services for review. Listings
              are assessed before reaching the Network. Introductions are made to
              qualified counterparties — not broadcast to unscreened audiences.
            </p>
            <Link href="/marketplace/sell" className="btn-secondary px-6 py-2.5 text-sm">
              Submit Opportunity
            </Link>
          </div>
        </div>
      </section>

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
