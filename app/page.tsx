import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Intelligence and Harbourview Network',
  description:
    'Harbourview supports controlled commercial intelligence, reviewed opportunities and network access for serious participants in regulated cannabis and adjacent supply chains.',
  openGraph: {
    title: 'Harbourview | Market Access Intelligence and Harbourview Network',
    description:
      'Harbourview supports controlled commercial intelligence, reviewed opportunities and network access for serious participants in regulated cannabis and adjacent supply chains.',
  },
}

const pathwaySteps = [
  {
    title: 'Discover',
    body: 'Identify relevant access signals, reviewed opportunity categories and country-specific commercial pathways.',
  },
  {
    title: 'Screen',
    body: 'Assess category fit, counterparty context, licence-sensitive requirements and route viability before engagement.',
  },
  {
    title: 'Connect',
    body: 'Route qualified inquiries, wanted requests and introductions through controlled Harbourview review without public contact disclosure.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#01050d] text-white">
        <Image
          src="/assets/harbourview-globe-hero-v2.svg"
          alt="Harbourview Globe"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />

        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,5,13,0.82)_0%,rgba(1,5,13,0.58)_44%,rgba(1,5,13,0.18)_76%),linear-gradient(180deg,rgba(1,5,13,0.04)_0%,rgba(1,5,13,0.22)_58%,rgba(1,5,13,0.82)_100%)]" />

        <div className="page-container relative z-10 flex min-h-[calc(100svh-72px)] items-center py-10 pt-16 sm:min-h-[calc(100svh-80px)] sm:py-14 lg:py-16">
          <div className="max-w-2xl rounded-sm border border-gold/18 bg-[#01060f]/70 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.52)] backdrop-blur-md sm:p-8 lg:mt-[5vh]">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-gold/82 sm:text-[11px]">
              Commercial Intelligence and Controlled Network Access
            </p>

            <h1 className="font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-gold-pale sm:text-5xl lg:text-6xl">
              Market access backed by intelligence and relationships.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/74 sm:text-base">
              Harbourview supports serious participants in regulated cannabis and adjacent supply
              chains through commercial intelligence, reviewed opportunities, counterparty access and
              country-specific market pathways.
            </p>

            <p className="mt-4 max-w-xl text-xs leading-6 text-white/56 sm:text-sm">
              Harbourview Network connects supply, buyer demand, services, wanted requests and
              qualified introductions through controlled inquiry review. Contact details remain private
              unless Harbourview coordinates a routed response.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/marketplace" className="btn-marketplace min-w-0 justify-center sm:min-w-[230px]">
                <span>Enter Harbourview Network</span>
                <span className="text-xl leading-none">→</span>
              </Link>

              <Link href="/intelligence" className="btn-intelligence min-w-0 justify-center sm:min-w-[210px]">
                <span>Request Intelligence</span>
                <span className="text-xl leading-none">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 bg-[#01050d] py-12 text-white sm:py-16">
        <div className="page-container grid gap-4 md:grid-cols-3">
          {pathwaySteps.map((step) => (
            <article key={step.title} className="rounded-sm border border-gold/12 bg-white/[0.025] p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/80">
                {step.title}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/60">{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
