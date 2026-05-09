export default function HomePage() {
  return (
    <main className="bg-[#01050d] text-white">
      <section className="relative isolate overflow-hidden border-b border-gold/10 bg-[#01050d] py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_22%,rgba(198,165,90,0.18),transparent_34%),linear-gradient(135deg,rgba(11,26,47,0.92)_0%,rgba(1,5,13,1)_72%)]" />
        <HarbourviewGlobeClientLoader />

        <div className="page-container relative z-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.72fr)] lg:items-end">
            <div className="max-w-4xl">
              <p className="hero-eyebrow">
                Commercial intelligence and controlled market access
              </p>

              <h1 className="font-serif text-5xl leading-[0.96] tracking-[-0.055em] text-gold-pale sm:text-6xl lg:text-7xl">
                Market access backed by intelligence and relationships.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Harbourview connects controlled network access, reviewed intelligence,
                regulatory signals, compliance pathways, clinical education and confidential
                inquiry routes for serious participants in regulated cannabis markets.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">
                Public pages support discovery and context. Contact details, counterparties,
                route assessments and transaction-sensitive information are handled through
                reviewed private workflows.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/marketplace" className="btn-marketplace justify-center">
                  <span>Enter Network</span>
                  <span className="text-xl leading-none">→</span>
                </Link>

                <Link href="/intelligence" className="btn-intelligence justify-center">
                  <span>Request Intelligence</span>
                  <span className="text-xl leading-none">→</span>
                </Link>
              </div>
            </div>

            <aside className="rounded-sm border border-gold/14 bg-[#04101e]/78 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
                Public gateway
              </p>

              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f4f1eb]">
                Available sections are open for review.
              </h2>

              <div className="mt-6 grid gap-3">
                {guardrails.map((guardrail) => (
                  <div
                    key={guardrail}
                    className="rounded-sm border border-gold/10 bg-white/[0.035] px-4 py-3 text-sm text-white/66"
                  >
                    {guardrail}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Keep the remaining sections from the fix/main-syntax-typecheck-prereq-v2 side:
          Public sections
          Secondary sections
          How Harbourview works
          Who Harbourview serves
          Pathway steps
          PublicSection / PublicLinkCard gateway
          Final CTA section
      */}
    </main>
  )
}