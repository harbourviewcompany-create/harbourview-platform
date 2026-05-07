import Link from 'next/link'
import { geneticsProfiles } from '@/lib/marketplace/geneticsShowcaseReset'
import { EditorialImagePlaceholder } from '@/components/marketplace/genetics/EditorialImagePlaceholder'
import { ProfilePrestigePlaque } from '@/components/marketplace/genetics/ProfilePrestigePlaque'

const signals = [
  'Genetics IP',
  'Current Drops',
  'Territory Rights',
  'Tissue Culture',
  'Clean Stock',
  'Licensing Windows',
  'Qualified Access',
]

export default function GeneticsPage() {
  const drops = geneticsProfiles.flatMap((profile) =>
    profile.drops.map((drop) => ({ ...drop, profileName: profile.name, profileSlug: profile.slug, region: profile.region }))
  )
  const featuredDrop = drops[0]

  return (
    <main className="min-h-screen bg-[#05070A] text-[#F5F1E8]">
      <section className="relative overflow-hidden border-b border-[#C6A55A]/20 px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(198,165,90,0.16),transparent_34%),linear-gradient(135deg,rgba(11,26,47,0.95),rgba(5,7,10,1))]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.34em] text-[#C6A55A]">
              Harbourview Genetics
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] md:text-7xl">
              Curated genetics access for serious commercial operators.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#F5F1E8]/72">
              A selective showcase for breeders, seed companies and tissue-culture labs presenting genetics programs, current drops and collaboration openings to qualified international participants.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/marketplace/genetics/request-access" className="rounded-full bg-[#C6A55A] px-6 py-3 text-sm font-semibold text-[#0B1A2F]">
                Request Genetics Access
              </Link>
              <Link href="/marketplace/genetics/submit-program" className="rounded-full border border-[#C6A55A]/60 px-6 py-3 text-sm text-[#C6A55A]">
                Submit Genetics Program
              </Link>
            </div>
          </div>

          <EditorialImagePlaceholder
            label="Editorial preview"
            mood="Dark botanical macro, laboratory glass, shadowed cultivar forms and restrained gold light. Built to feel closer to private allocation than public catalog."
          />
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#081423] px-6 py-5">
        <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto text-xs uppercase tracking-[0.24em] text-[#C6A55A]">
          {signals.map((signal) => (
            <span key={signal} className="shrink-0 border-r border-[#C6A55A]/25 pr-4 last:border-r-0">
              {signal}
            </span>
          ))}
        </div>
      </section>

      {featuredDrop ? (
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <EditorialImagePlaceholder label="Featured release" mood={featuredDrop.imageMood} />
            <div className="rounded-[2rem] border border-[#C6A55A]/25 bg-[#0B1A2F]/70 p-8">
              <div className="inline-flex rounded-full border border-[#C6A55A]/35 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[#C6A55A]">
                {featuredDrop.urgencySignal}
              </div>
              <h2 className="mt-6 text-5xl font-semibold leading-tight">{featuredDrop.name}</h2>
              <p className="mt-5 text-lg leading-8 text-[#F5F1E8]/70">{featuredDrop.thesis}</p>
              <div className="mt-8 grid gap-3 text-sm text-[#F5F1E8]/62 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 p-4">{featuredDrop.pathwayBadge}</div>
                <div className="rounded-2xl border border-white/10 p-4">{featuredDrop.territoryStatus}</div>
                <div className="rounded-2xl border border-white/10 p-4">{featuredDrop.accessStatus}</div>
              </div>
              <Link href="/marketplace/genetics/request-access" className="mt-8 inline-flex text-sm text-[#C6A55A]">{featuredDrop.cta}</Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-y border-white/10 bg-[#081423] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">Approved profiles</div>
            <h2 className="mt-3 text-4xl font-semibold">Commercial genetics programs presented as assets, not listings.</h2>
          </div>
          <div className="space-y-8">
            {geneticsProfiles.map((profile, index) => (
              <article key={profile.slug} className="grid gap-8 rounded-[2rem] border border-[#C6A55A]/18 bg-[#0B1A2F]/70 p-6 lg:grid-cols-[0.75fr_1.15fr_0.8fr] lg:items-center">
                <EditorialImagePlaceholder label={`Profile ${index + 1}`} mood={profile.imageMood} />
                <div>
                  <div className="text-xs uppercase tracking-wide text-[#C6A55A]">{profile.profileType} · {profile.region}</div>
                  <h3 className="mt-4 text-4xl font-semibold text-[#C6A55A]">{profile.name}</h3>
                  <p className="mt-5 text-sm leading-7 text-[#F5F1E8]/70">{profile.positioning}</p>
                  <div className="mt-7 flex flex-wrap gap-2 text-xs text-[#F5F1E8]/70">
                    {profile.focus.slice(0, 4).map((item) => (
                      <span key={item} className="rounded-full border border-white/10 px-3 py-1">{item}</span>
                    ))}
                  </div>
                  <Link href={`/marketplace/genetics/${profile.slug}`} className="mt-8 inline-flex text-sm text-[#C6A55A]">Enter profile</Link>
                </div>
                <ProfilePrestigePlaque prestigeSignal={profile.prestigeSignal} accessModel={profile.accessModel} pathwaySummary={profile.pathwaySummary} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">Current drops</div>
            <h2 className="mt-3 text-4xl font-semibold">Curated release windows for qualified commercial review.</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {drops.map((drop) => (
              <article key={`${drop.profileSlug}-${drop.id}`} className="rounded-[2rem] border border-white/10 bg-[#081423]/70 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xs uppercase tracking-wide text-[#C6A55A]">{drop.type}</div>
                  <div className="rounded-full border border-[#C6A55A]/25 px-3 py-1 text-[10px] uppercase tracking-wide text-[#C6A55A]">{drop.accessStatus}</div>
                </div>
                <h3 className="mt-4 text-2xl font-semibold">{drop.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/65">{drop.thesis}</p>
                <div className="mt-6 rounded-2xl border border-[#C6A55A]/20 bg-black/20 p-4 text-xs text-[#C6A55A]">{drop.urgencySignal}</div>
                <div className="mt-5 space-y-2 text-xs text-[#F5F1E8]/55">
                  <div>{drop.pathwayBadge}</div>
                  <div>{drop.territoryStatus}</div>
                  <div>Markets: {drop.targetMarkets.join(', ')}</div>
                </div>
                <Link href="/marketplace/genetics/request-access" className="mt-7 inline-flex text-sm text-[#C6A55A]">{drop.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
