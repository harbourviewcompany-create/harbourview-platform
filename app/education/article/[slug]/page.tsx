import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Education Article | Harbourview Education',
  description: 'Professional education article from Harbourview. Non-promotional and subject to editorial review and source discipline.',
}

export default async function EducationArticlePage() {
  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <section className="py-20">
        <div className="page-container max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-6">Harbourview Education</p>
          <div className="rounded-2xl border border-gold/30 bg-white/[0.04] p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold/70 mb-4">Article pending publication review</p>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              This education article is pending review.
            </h1>
            <p className="mt-6 text-base leading-8 text-white/60">
              Harbourview education articles are prepared and reviewed before publication. This article has been assigned a route but has not yet been cleared for public access. Articles pending review may be available by request through the education intake.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/education/request"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition hover:bg-[#d6b76d]"
              >
                Request Article Access
              </a>
              <a
                href="/education"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/60 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy"
              >
                Return to Education Hub
              </a>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Education boundary</p>
            <p className="text-sm leading-7 text-white/50">
              Harbourview education articles are informational and non-promotional. They do not provide medical advice, prescribing instructions, legal advice, regulatory guidance, investment advice or compliance certification.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
