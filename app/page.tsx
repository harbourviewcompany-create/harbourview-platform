import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harbourview | Coming Soon',
  description:
    'Harbourview is preparing a controlled commercial network and market-access intelligence platform.',
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#01040a] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-95"
        style={{ backgroundImage: "url('/assets/harbourview-coming-soon-placeholder.svg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/40" aria-hidden="true" />

      <section className="relative z-10 flex min-h-screen items-end px-6 pb-8 sm:px-10 lg:items-center lg:px-16 lg:pb-0">
        <div className="max-w-2xl rounded-[2rem] border border-[#C6A55A]/18 bg-black/18 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-[2px] sm:p-8 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.42em] text-[#D6A349] sm:text-xs">
            Global commercial intelligence
          </p>

          <h1 className="font-serif text-5xl leading-[0.98] tracking-[0.08em] text-[#F0D7A8] sm:text-7xl lg:text-8xl">
            HARBOURVIEW
          </h1>

          <p className="mt-5 max-w-xl font-serif text-3xl leading-tight text-[#EFD8AE] sm:text-4xl lg:text-5xl">
            Full site opening soon.
          </p>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
            Harbourview is staging its controlled commercial network, market-access intelligence and reviewed opportunity pathways.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-between rounded-[3px] border border-[#E6C170] bg-[#D7A84D] px-7 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#111319] transition hover:bg-[#E6C170]"
            >
              <span>Contact</span>
              <span className="ml-8 text-xl leading-none">→</span>
            </Link>

            <Link
              href="/marketplace"
              className="inline-flex items-center justify-between rounded-[3px] border border-[#C08F3A] bg-[#071120]/82 px-7 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#D7A84D] transition hover:border-[#E6C170] hover:text-[#E6C170]"
            >
              <span>Network</span>
              <span className="ml-8 text-xl leading-none">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
