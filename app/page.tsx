import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Harbourview | Opening Soon',
  description:
    'Harbourview is preparing controlled commercial intelligence and network access for serious participants in regulated cannabis and adjacent supply chains.',
  openGraph: {
    title: 'Harbourview | Opening Soon',
    description:
      'Harbourview is preparing controlled commercial intelligence and network access for serious participants in regulated cannabis and adjacent supply chains.',
  },
}

export default function HomePage() {
  return (
    <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#01050d] text-white sm:min-h-[calc(100svh-80px)]">
      <Image
        src="/assets/harbourview-globe-hero-realistic.webp"
        alt="Harbourview realistic dark navy and gold globe visual"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,5,13,0.72)_0%,rgba(1,5,13,0.42)_42%,rgba(1,5,13,0.12)_72%),linear-gradient(180deg,rgba(1,5,13,0.1)_0%,rgba(1,5,13,0.18)_58%,rgba(1,5,13,0.74)_100%)]" />

      <div className="page-container flex min-h-[calc(100svh-72px)] items-end pb-10 pt-20 sm:min-h-[calc(100svh-80px)] sm:pb-12 lg:items-center lg:pb-0 lg:pt-10">
        <div className="max-w-xl rounded-sm border border-gold/18 bg-[#01060f]/72 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.48)] backdrop-blur-md sm:p-7 lg:ml-0 lg:mt-[18vh]">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-gold/82 sm:text-[11px]">
            Harbourview platform staging
          </p>

          <h1 className="font-serif text-4xl leading-[0.98] tracking-[-0.045em] text-gold-pale sm:text-5xl lg:text-6xl">
            Full site opening soon.
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-white/72 sm:text-base">
            Harbourview is preparing controlled commercial intelligence, network access and reviewed
            inquiry pathways for serious participants in regulated cannabis and adjacent supply chains.
          </p>

          <p className="mt-4 max-w-lg text-xs leading-6 text-white/54 sm:text-sm">
            Inquiries are reviewed before routing. Contact details, counterparties and
            transaction-sensitive information are not published publicly.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="btn-marketplace min-w-0 justify-center sm:min-w-[210px]">
              <span>Contact Harbourview</span>
              <span className="text-xl leading-none">→</span>
            </Link>

            <Link href="/marketplace" className="btn-intelligence min-w-0 justify-center sm:min-w-[210px]">
              <span>Preview Network</span>
              <span className="text-xl leading-none">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
