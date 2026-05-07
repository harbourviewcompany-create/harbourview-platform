import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intelligence',
  description:
    'Commercial briefs, counterparty dossiers, and route-to-market analysis for operators, investors, and advisors in regulated markets.',
}

const intelligenceCards = [
  {
    title: 'Commercial Briefs',
    body: 'Structured analysis of market segments, regulatory environments and commercial opportunity in targeted regulated markets.',
  },
  {
    title: 'Counterparty Dossiers',
    body: 'Background and commercial assessment of prospective buyers, sellers and partners prior to introduction.',
  },
  {
    title: 'Route-to-Market Analysis',
    body: 'Assessment of market entry pathways, distribution channels and commercial positioning for operators entering new markets.',
  },
  {
    title: 'Bespoke Engagements',
    body: 'Custom research and advisory engagements for investors, operators and advisors with specific intelligence requirements.',
  },
]

export default function IntelligencePage() {
  return (
    <>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20">
        <div className="page-container">
          <div className="max-w-3xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              Harbourview Intelligence
            </p>

            <h1 className="max-w-3xl font-serif text-4xl leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              Commercial intelligence designed for controlled market engagement.
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 sm:text-lg">
              Commercial briefs, counterparty dossiers and route-to-market analysis
              prepared for operators, investors and advisors.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#020814] py-14 sm:py-20">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-7">
            {intelligenceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-sm border border-gold/12 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light"></div>
                <h3 className="mb-4 text-lg font-semibold text-[#f3efe7]">
                  {card.title}
                </h3>
                <p className="text-sm leading-7 text-white/62">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-sm border border-gold/10 bg-[#071425] p-7 text-center shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:mt-16 sm:p-10">
            <h2 className="text-2xl font-semibold text-[#f4f1eb] sm:text-3xl">
              Request a Briefing
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
              Intelligence engagements are handled on a confidential basis.
              Submit your email to be notified when this access path is available.
            </p>

            <form className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
              <label htmlFor="intelligence-email" className="sr-only">
                Get notified when this launches
              </label>

              <input
                id="intelligence-email"
                name="email"
                type="email"
                placeholder="Get notified when this launches"
                className="min-h-[52px] w-full rounded-sm border border-gold/14 bg-[#030b16] px-4 py-3 text-sm text-white placeholder:text-white/34 focus:outline-none focus:ring-2 focus:ring-gold/40"
              />

              <button
                type="submit"
                className="btn-marketplace justify-center px-6 py-3 text-sm"
              >
                Notify Me
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
