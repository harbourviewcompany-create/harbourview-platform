import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicGeneticsProfile, getPublicGeneticsProfiles } from '@/lib/marketplace/geneticsShowcase'
import { FixtureBanner } from '@/components/admin/FixtureBanner'

type GeneticsProfilePageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: GeneticsProfilePageProps): Promise<Metadata> {
  const { slug } = await params
  const profile = await getPublicGeneticsProfile(slug)

  if (!profile) {
    return {
      title: 'Genetics Profile | Harbourview Network',
    }
  }

  return {
    title: `${profile.name} | Harbourview Genetics`,
    description: profile.summary,
  }
}

// Force dynamic rendering — page fetches live Supabase data at request time
export const dynamic = 'force-dynamic'

export default async function GeneticsProfilePage({ params }: GeneticsProfilePageProps) {
  const { slug } = await params
  const [profile, showcase] = await Promise.all([
    getPublicGeneticsProfile(slug),
    getPublicGeneticsProfiles(),
  ])

  if (!profile) return notFound()

  return (
    <>
      <FixtureBanner isFixture={showcase.source === 'fixture'} label="Fixture data — cultivar_passports table empty or service role not configured" />
      <section className="border-b border-gold/10 bg-[#061120] py-16 text-white sm:py-20 lg:py-24">
        <div className="page-container">
          <div className="max-w-5xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
              {profile.type} · {profile.region}
            </p>

            <h1 className="max-w-5xl font-serif text-4xl leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              {profile.name}
            </h1>

            <div className="mt-8 h-px w-20 bg-gradient-to-r from-gold to-gold-light"></div>

            <p className="mt-8 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
              {profile.summary}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace/genetics/request-access" className="btn-marketplace">
                Request Access
              </Link>

              <Link href="/marketplace/genetics/submit-program" className="btn-intelligence">
                Submit Related Program
              </Link>

              <Link href="/marketplace/genetics" className="btn-intelligence">
                Back to Genetics
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#020814] py-14 sm:py-18">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6 lg:col-span-2">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                Public Program Focus
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.publicFocus.map((focus) => (
                  <span key={focus} className="rounded-full border border-gold/10 px-3 py-1 text-xs text-white/58">
                    {focus}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
                Controlled Access
              </p>
              <p className="text-sm leading-7 text-white/58">
                {profile.privateFieldPolicy}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#030b16] py-14 sm:py-20">
        <div className="page-container">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Current Drops
            </p>

            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Approved opportunities connected to this profile.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {profile.drops.map((drop) => (
              <article key={drop.id} className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.95)_0%,rgba(5,12,22,1)_100%)] p-7">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/72">
                  {drop.type}
                </p>

                <h3 className="mb-4 text-2xl font-semibold text-[#f4f1eb]">
                  {drop.name}
                </h3>

                <p className="text-sm leading-7 text-white/58">
                  {drop.summary}
                </p>

                <div className="mt-5 text-xs leading-6 text-white/46">
                  <p>Target markets: {drop.targetMarkets.join(', ')}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {drop.signals.map((signal) => (
                    <span key={signal} className="rounded-full border border-gold/10 px-3 py-1 text-xs text-white/56">
                      {signal}
                    </span>
                  ))}
                </div>

                <Link href="/marketplace/genetics/request-access" className="mt-7 inline-flex text-sm font-medium text-gold/85 hover:text-gold-light">
                  {drop.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
              Harbourview Review
            </p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              Inquiries are reviewed before any introduction or private disclosure.
            </h2>
          </div>

          <Link href="/marketplace/genetics/request-access" className="btn-marketplace justify-center">
            Request Genetics Access
          </Link>
        </div>
      </section>
    </>
  )
}