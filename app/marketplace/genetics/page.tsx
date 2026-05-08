import type { Metadata } from 'next'
import Link from 'next/link'
import { GeneticsSearchFilters } from '@/components/marketplace/genetics/GeneticsSearchFilters'
import { GeneticsProfileCard } from '@/components/marketplace/genetics/GeneticsProfileCard'
import { CurrentDropCard } from '@/components/marketplace/genetics/CurrentDropCard'
import {
  filterPublicGeneticsDrops,
  filterPublicGeneticsProfiles,
  getPublicGeneticsDropCards,
  getPublicGeneticsProfileCards,
  type GeneticsFilterSearchParams,
} from '@/lib/marketplace/genetics/publicProjection'

export const metadata: Metadata = {
  title: 'Genetics, Seeds & Tissue Culture | Harbourview Network',
  description:
    'A controlled Harbourview Network showcase for genetics, seed lines, tissue-culture programs, clean-stock services and licensing opportunities.',
}

export default function GeneticsShowcasePage({
  searchParams,
}: {
  searchParams?: GeneticsFilterSearchParams
}) {
  const filters = {
    q: searchParams?.q || '',
    type: searchParams?.type || '',
    pathway: searchParams?.pathway || '',
    region: searchParams?.region || '',
    access: searchParams?.access || '',
  }

  const profiles = filterPublicGeneticsProfiles(getPublicGeneticsProfileCards(), filters)
  const drops = filterPublicGeneticsDrops(getPublicGeneticsDropCards(), filters)

  return (
    <>
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="max-w-5xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              Genetics, Seeds & Tissue Culture
            </p>
            <h1 className="max-w-5xl font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              A controlled showcase for genetics, seed lines, tissue culture and licensing opportunities.
            </h1>
            <div className="mt-8 h-px w-20 bg-gradient-to-r from-gold to-gold-light" />
            <p className="mt-8 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              Harbourview Genetics gives selected breeders, seed companies and tissue-culture labs a practical way to present approved public opportunities while direct contacts, pricing, sensitive breeding information and introductions remain controlled through Harbourview review.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace/genetics/request-access" className="btn-marketplace">
                Request Genetics Access
              </Link>
              <Link href="/marketplace/genetics/submit-program" className="btn-intelligence">
                Submit Genetics Program
              </Link>
              <Link href="#current-drops" className="btn-intelligence">
                View Current Drops
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#020814] py-14 sm:py-18">
        <div className="page-container">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Controlled Access Model
            </p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Public visibility without uncontrolled disclosure.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              ['Showcase', 'Approved profiles and drops can be shown publicly as commercial opportunities.'],
              ['Privacy', 'Contacts, pricing, sensitive breeding information and private documents stay controlled.'],
              ['Review', 'Harbourview reviews each request before sharing identity, context or introduction opportunities.'],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6"
              >
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light" />
                <h3 className="mb-4 text-lg font-semibold text-[#f4f1eb]">{title}</h3>
                <p className="text-sm leading-7 text-white/58">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#020814] py-10">
        <div className="page-container">
          <GeneticsSearchFilters searchParams={filters} />
        </div>
      </section>

      <section className="bg-[#030b16] py-14 sm:py-20">
        <div className="page-container">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                Approved Showcase Profiles
              </p>
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                Genetics programs presented as controlled commercial opportunities.
              </h2>
            </div>

            <div className="text-sm text-white/48">
              {profiles.length} approved profile{profiles.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {profiles.map((profile) => (
              <GeneticsProfileCard key={profile.slug} profile={profile} />
            ))}
          </div>
        </div>
      </section>

      <section id="current-drops" className="border-t border-gold/10 bg-[#020814] py-14 sm:py-20">
        <div className="page-container">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                Current Drops
              </p>
              <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                Active genetics opportunities routed through Harbourview review.
              </h2>
            </div>

            <div className="text-sm text-white/48">
              {drops.length} active drop{drops.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {drops.map((drop) => (
              <CurrentDropCard key={`${drop.profileSlug}-${drop.id}`} drop={drop} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}