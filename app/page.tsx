import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

const entryPoints = [
  {
    title: 'Network',
    href: '/network',
    body: 'Controlled commercial discovery across listings, wanted requests, suppliers and reviewed inquiry pathways.',
  },
  {
    title: 'Opportunities',
    href: '/opportunities',
    body: 'Reviewed commercial openings, country access opportunities, distribution mandates and strategic partnerships.',
  },
  {
    title: 'Intelligence',
    href: '/intelligence',
    body: 'Country, pathway, category and public-safe intelligence for disciplined market-access decisions.',
  },
  {
    title: 'Education',
    href: '/education',
    body: 'Non-promotional education for clinical, pharmacy, quality, commercial and regulatory stakeholders.',
  },
  {
    title: 'Policy & Standards',
    href: '/policy-standards',
    body: 'Regulator-facing policy resources, standards context, public-health safeguards and market conduct principles.',
  },
  {
    title: 'Assessments',
    href: '/assessments',
    body: 'Controlled intake pathways for readiness, route feasibility, documentation and due diligence preparedness.',
  },
  {
    title: 'Institutional Partnerships',
    href: '/institutional-partnerships',
    body: 'Collaboration paths for regulators, associations, universities, pharmacy groups, labs and standards bodies.',
  },
]

const workflowSteps = [
  'Discover public context and available pathways.',
  'Submit a request, listing, opportunity or institutional inquiry.',
  'Harbourview reviews fit, sensitivity and routing requirements.',
  'Sensitive commercial, regulatory and counterparty details remain private.',
  'Qualified introductions, assessments or intelligence requests proceed only after review.',
]

const audiences = [
  'Doctors and pharmacists',
  'Importers and distributors',
  'Cultivators and operators',
  'QA, labs and compliance teams',
  'Procurement and buyers',
  'Regulators and institutions',
  'Investors and acquirers',
]

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Backed by Intelligence and Relationships',
  description:
    'Harbourview provides controlled network access, reviewed intelligence, professional education and institutional pathways for serious participants in regulated cannabis markets.',
  openGraph: {
    title: 'Harbourview | Market Access Backed by Intelligence and Relationships',
    description:
      'Controlled network access, reviewed intelligence, education and institutional pathways for regulated cannabis markets.',
  },
}

export default function HomePage() {
  return (
    <main className="bg-[#01050d] text-white">
      <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden border-b border-gold/10 sm:min-h-[calc(100svh-80px)]">
        <Image
          src="/assets/harbourview-coming-soon-placeholder.svg"
          alt="Harbourview gold globe and lighthouse visual"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,5,13,0.82)_0%,rgba(1,5,13,0.56)_42%,rgba(1,5,13,0.16)_72%),linear-gradient(180deg,rgba(1,5,13,0.1)_0%,rgba(1,5,13,0.24)_58%,rgba(1,5,13,0.84)_100%)]" />

        <div className="page-container flex min-h-[calc(100svh-72px)] items-end pb-10 pt-20 sm:min-h-[calc(100svh-80px)] sm:pb-12 lg:items-center lg:pb-0 lg:pt-10">
          <div className="max-w-3xl rounded-sm border border-gold/18 bg-[#01060f]/76 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.48)] backdrop-blur-md sm:p-8 lg:ml-0 lg:mt-[12vh]">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-gold/82 sm:text-[11px]">
              Commercial intelligence and controlled market access
            </p>

            <h1 className="font-serif text-4xl leading-[0.98] tracking-[-0.045em] text-gold-pale sm:text-5xl lg:text-6xl">
              Market access backed by intelligence and relationships.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
              Harbourview connects controlled network access, reviewed intelligence,
              professional education, policy resources and institutional pathways for
              serious participants in regulated cannabis markets.
            </p>

            <p className="mt-4 max-w-2xl text-xs leading-6 text-white/54 sm:text-sm">
              Public pages support discovery and context. Contact details,
              counterparties, route assessments and transaction-sensitive information
              are handled through reviewed private workflows.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/network" className="btn-marketplace min-w-0 justify-center sm:min-w-[210px]">
                <span>Enter Network</span>
                <span className="text-xl leading-none">→</span>
              </Link>

              <Link href="/intelligence" className="btn-intelligence min-w-0 justify-center sm:min-w-[210px]">
                <span>Explore Intelligence</span>
                <span className="text-xl leading-none">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 py-14 sm:py-18 lg:py-20">
        <div className="page-container">
          <div className="max-w-3xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/72">
              Institutional platform
            </p>
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
              Available Harbourview pathways
            </h2>
            <p className="mt-5 text-base leading-8 text-white/60">
              Harbourview is organized around controlled discovery, reviewed intelligence,
              professional education, policy resources, assessments and institutional collaboration.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {entryPoints.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-sm border border-gold/12 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)] transition-colors hover:border-gold/28"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
                <h3 className="text-lg font-semibold text-[#f4f1eb]">{entry.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/60">{entry.body}</p>
                <span className="mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Open pathway
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#030b16] py-14 sm:py-18 lg:py-20">
        <div className="page-container grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-sm border border-gold/12 bg-[#071425] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:p-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/72">
              How Harbourview works
            </p>
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
              Reviewed access, not open-contact routing.
            </h2>
            <ol className="mt-7 space-y-4 text-sm leading-7 text-white/62">
              {workflowSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/24 text-[11px] text-gold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-sm border border-gold/12 bg-[#071425] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:p-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/72">
              Who Harbourview serves
            </p>
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
              Built for serious regulated-market stakeholders.
            </h2>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {audiences.map((audience) => (
                <div
                  key={audience}
                  className="rounded-sm border border-gold/10 bg-black/20 px-4 py-3 text-sm text-white/66"
                >
                  {audience}
                </div>
              ))}
            </div>
            <p className="mt-7 text-sm leading-7 text-white/54">
              Harbourview does not publish confidential counterparty, source or transaction-sensitive
              information on public pages. Inquiries are reviewed before routing.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="page-container">
          <div className="rounded-sm border border-gold/12 bg-[linear-gradient(135deg,rgba(11,26,47,0.96)_0%,rgba(3,11,22,0.98)_100%)] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-10">
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
              Start with the right Harbourview pathway.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
              Request access, submit an opportunity, ask for intelligence or begin an institutional conversation.
              Harbourview reviews fit and handles sensitive information through controlled private workflows.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="btn-marketplace justify-center px-6 py-3 text-sm">
                Request Access
              </Link>
              <Link href="/opportunities" className="btn-intelligence justify-center px-6 py-3 text-sm">
                View Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
