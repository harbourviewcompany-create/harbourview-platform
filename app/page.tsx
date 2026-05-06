import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Intelligence and Harbourview Network',
  description:
    'Harbourview is an intelligence-led market-access platform for serious participants in regulated cannabis and adjacent supply chains.',
}

export default function HomePage() {
  return (
    <>
      <section className="hero-shell min-h-[calc(100vh-64px)] border-b border-gold/10 text-white lg:min-h-screen">
        <div className="hero-gradient-shield"></div>
        <div className="hero-mobile-text-shield"></div>
        <div className="signal-beam"></div>

        <div className="lighthouse-wrap" aria-hidden="true">
          <div className="lighthouse-core"></div>
          <div className="lighthouse-glow"></div>
        </div>

        <Image
          src="/assets/harbourview-globe-hero.svg"
          alt="Harbourview Globe"
          width={1600}
          height={1600}
          className="hero-globe"
          priority
        />

        <div className="page-container relative z-10 py-10 sm:py-20 lg:py-28">
          <div className="hero-grid min-h-[78vh] lg:min-h-[82vh]">
            <div className="max-w-[560px]">
              <p className="hero-eyebrow">
                Commercial Intelligence and Controlled Network Access
              </p>

              <h1 className="hero-title">
                <span className="hero-title-gold">Market access</span>
                <br />
                <span className="hero-title-white">backed by</span>
                <br />
                <span className="hero-title-gold">intelligence</span>
                <br />
                <span className="hero-title-white">and</span>
                <br />
                <span className="hero-title-gold">relationships.</span>
              </h1>

              <div className="mb-7 h-px w-16 bg-gradient-to-r from-gold to-gold-light sm:mb-8"></div>

              <p className="hero-body">
                Harbourview supports serious participants in regulated cannabis and
                adjacent supply chains through commercial intelligence, reviewed
                opportunities, counterparty access and country-specific market pathways.
              </p>

              <p className="mb-7 max-w-xl text-sm leading-7 text-white/50">
                Harbourview Network connects supply, buyer demand, services, wanted
                requests and qualified introductions through controlled inquiry review.
                Contact details remain private unless Harbourview coordinates a routed
                response.
              </p>

              <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/78 sm:text-[11px]">
                Select your entry point
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
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

            <div aria-hidden="true"></div>
          </div>

          <div className="hidden border-t border-gold/10 pt-10 lg:block">
            <div className="mx-auto grid max-w-5xl grid-cols-3 gap-12 text-center">
              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
                  Discover
                </p>
                <p className="text-sm leading-7 text-white/52">
                  Identify relevant access signals, reviewed opportunity categories
                  and country-specific commercial pathways.
                </p>
              </div>

              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
                  Screen
                </p>
                <p className="text-sm leading-7 text-white/52">
                  Assess category fit, counterparty context, licence-sensitive
                  requirements and route viability before engagement.
                </p>
              </div>

              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
                  Connect
                </p>
                <p className="text-sm leading-7 text-white/52">
                  Route qualified inquiries, wanted requests and introductions through
                  controlled Harbourview review without public contact disclosure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
