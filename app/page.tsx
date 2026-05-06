import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harbourview | Market Access Intelligence and Commercial Advisory',
  description:
    'Harbourview provides commercial intelligence, strategic introductions, and market-access support for serious participants in regulated markets.',
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
            <div className="max-w-[540px]">
              <p className="hero-eyebrow">
                Commercial Intelligence and Marketplace Access
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
                Harbourview supports qualified operators with commercial intelligence,
                counterparty access and structured market-entry pathways across
                regulated markets.
              </p>

              <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/78 sm:text-[11px]">
                Select your entry point
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link href="/marketplace" className="btn-marketplace">
                  <span>Marketplace</span>
                  <span className="text-xl leading-none">→</span>
                </Link>

                <Link href="/intelligence" className="btn-intelligence">
                  <span>Intelligence</span>
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
                  Identify relevant market signals, qualified opportunities and
                  commercial pathways.
                </p>
              </div>

              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
                  Screen
                </p>
                <p className="text-sm leading-7 text-white/52">
                  Evaluate counterparties, route viability and jurisdictional fit
                  before engagement.
                </p>
              </div>

              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold/72">
                  Connect
                </p>
                <p className="text-sm leading-7 text-white/52">
                  Structured introductions and controlled commercial discussions
                  for serious operators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
