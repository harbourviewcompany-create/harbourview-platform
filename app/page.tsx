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
    body: 'Harbourview monitors policy, regulatory, pathway, and market-access developments across regulated markets to support timing, route assessment, and commercial decision-making.',
  },
  {
    title: 'Strategic Introductions',
    body: 'Harbourview facilitates controlled introductions between qualified counterparties where relevance, seriousness, and confidentiality have been assessed.',
  },
  {
    title: 'Market-Access Support',
    body: 'Harbourview supports selected operators with pathway assessment, opportunity qualification, and structured commercial engagement across regulated markets.',
  },
]

const processSteps = [
  {
    title: 'Signal',
    body: 'We monitor policy, regulatory, pathway, and market-access developments across selected regulated markets.',
  },
  {
    title: 'Assess',
    body: 'We assess route viability, timing, jurisdictional context, and commercial relevance before engagement.',
  },
  {
    title: 'Qualify',
    body: 'Participants and opportunities are screened for seriousness, fit, and counterparty relevance.',
  },
  {
    title: 'Connect',
    body: 'Qualified parties are introduced through a controlled and confidential process.',
  },
]

const controls = [
  'Source-backed intelligence',
  'Reviewed market-access pathways',
  'Qualified counterparties',
  'Confidential introductions',
  'Compliance-aware routing',
  'Controlled intake workflows',
]

export default function HomePage() {
  return (
    <>
      <section className="bg-navy text-white py-24">
        <div className="page-container max-w-5xl">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6 max-w-4xl">
            Market access backed by<br className="hidden sm:block" />{' '}
            <span className="text-gold">intelligence and relationships.</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mb-10 leading-relaxed">
            Harbourview provides commercial intelligence, strategic introductions,
            and market-access support for serious participants in regulated markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/intake" className="btn-primary px-8 py-3 text-base">
              Request a Confidential Discussion
            </Link>
            <Link
              href="/marketplace"
              className="border border-gold/60 text-gold px-8 py-3 text-base rounded hover:bg-gold/10 transition-colors"
            >
              Explore Marketplace
            </Link>
          </div>
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

      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="page-container">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
              Process
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              How Harbourview works
            </h3>
            <p className="text-gray-500 leading-relaxed">
              Harbourview uses a controlled process to identify relevant signals,
              assess market-access pathways, qualify counterparties, and support
              confidential commercial engagement.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div key={step.title} className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                <h4 className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
                  {step.title}
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="page-container grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
              Controlled Access
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-navy mb-5">
              Built for regulated markets.
            </h3>
            <p className="text-gray-500 leading-relaxed">
              Harbourview is designed for commercial environments where access,
              timing, qualification, and confidentiality matter. Regulatory context,
              reviewed pathways, source-backed intelligence, and counterparty fit are
              considered before sensitive introductions or market-access discussions progress.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {controls.map((control) => (
              <div key={control} className="border border-gray-200 rounded-lg p-4 text-sm font-medium text-navy">
                {control}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="page-container">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">
              Structured Intake Workflows
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              Controlled paths for qualified commercial requests.
            </h3>
            <p className="text-gray-500 leading-relaxed">
              For qualified buyers, sellers, and operators, the Harbourview Network
              provides controlled intake paths for wanted requests, commercial opportunities,
              and review before public or private routing.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h3 className="text-xl font-bold text-navy mb-4">
                Submit a Wanted Request
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                For buyers seeking specific inventory, services, equipment, or commercial
                opportunities. Requests are reviewed before circulation or matching.
              </p>
              <Link href="/marketplace/wanted" className="btn-secondary px-6 py-2.5 text-sm">
                Submit Wanted Request
              </Link>
            </div>

            <div>
              <h3 className="text-xl font-bold text-navy mb-4">
                Submit an Opportunity
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                For sellers, operators, or service providers with relevant commercial
                opportunities. Submissions are reviewed before any public or private routing.
              </p>
              <Link href="/marketplace/sell" className="btn-secondary px-6 py-2.5 text-sm">
                Submit Opportunity
              </Link>
            </div>
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
            Request a Confidential Discussion
          </Link>
        </div>
      </section>
    </>
  )
}
