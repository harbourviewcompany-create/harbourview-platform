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
    <section className="hero-shell min-h-[calc(100vh-64px)] border-b border-gold/10 text-white lg:min-h-screen">
      <div className="signal-beam"></div>

      <Image
        src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1600&auto=format&fit=crop"
        alt="Harbourview Globe"
        width={1600}
        height={1600}
        className="hero-globe"
        priority
      />

      <div className="page-container relative z-10 py-16 sm:py-24 lg:py-28">
        <div className="hero-grid min-h-[78vh] lg:min-h-[82vh]">
          <div className="max-w-[560px]">
            <p className="hero-eyebrow mb-10">
              Commercial Intelligence and Marketplace Access
            </p>

            <h1 className="hero-title mb-10">
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

            <div className="mb-10 h-px w-16 bg-gradient-to-r from-gold to-gold-light"></div>

            <p className="hero-body mb-14">
              Harbourview supports qualified operators with commercial intelligence,
              counterparty access and structured market-entry pathways across
              regulated markets.
            </p>

            <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/85">
              Select your entry point
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
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

        <div className="hidden border-t border-gold/10 pt-8 text-center text-[11px] uppercase tracking-[0.3em] text-gold/55 lg:block">
          Commercial Intelligence. Marketplace Access. Strategic Introductions.
        </div>
      </div>
    </section>
  )
}
