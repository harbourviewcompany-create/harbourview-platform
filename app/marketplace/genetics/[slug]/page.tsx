import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGeneticsProfile } from '@/lib/marketplace/geneticsShowcaseReset'
import { EditorialImagePlaceholder } from '@/components/marketplace/genetics/EditorialImagePlaceholder'
import { ProfilePrestigePlaque } from '@/components/marketplace/genetics/ProfilePrestigePlaque'

type GeneticsProfilePageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function GeneticsProfilePage({ params }: GeneticsProfilePageProps) {
  const { slug } = await params
  const profile = getGeneticsProfile(slug)

  if (!profile) return notFound()

  return (
    <main className="min-h-screen bg-[#05070A] text-[#F5F1E8]">
      <section className="relative overflow-hidden border-b border-[#C6A55A]/20 px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(198,165,90,0.18),transparent_32%),linear-gradient(135deg,#05070A,#0B1A2F_55%,#05070A)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.24em] text-[#C6A55A]">
              <span className="rounded-full border border-[#C6A55A]/30 px-3 py-2">{profile.rarityMarker}</span>
              <span className="rounded-full border border-white/10 px-3 py-2 text-[#F5F1E8]/55">{profile.releaseCycle}</span>
            </div>

            <div className="mt-8 text-xs uppercase tracking-[0.32em] text-[#C6A55A]">
              {profile.profileType} · {profile.region}
            </div>

            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] md:text-7xl">
              {profile.name}
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#F5F1E8]/70">
              {profile.positioning}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/marketplace/genetics/request-access" className="rounded-full bg-[#C6A55A] px-6 py-3 text-sm font-semibold text-[#0B1A2F]">
                Request Access
              </Link>
              <Link href="/marketplace/genetics/submit-program" className="rounded-full border border-[#C6A55A]/55 px-6 py-3 text-sm text-[#C6A55A]">
                Submit Collaboration Interest
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <EditorialImagePlaceholder label={profile.identityTone} mood={profile.imageMood} />
            <div className="rounded-[2rem] border border-[#C6A55A]/25 bg-black/35 p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">Program status</div>
              <div className="mt-3 text-2xl font-semibold">{profile.programStatus}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-6">
            <ProfilePrestigePlaque prestigeSignal={profile.prestigeSignal} accessModel={profile.accessModel} pathwaySummary={profile.pathwaySummary} />

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">Curator note</div>
              <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/70">{profile.curatorNote}</p>
            </div>
          </aside>

          <div className="space-y-10">
            <blockquote className="border-l border-[#C6A55A]/55 pl-8 text-3xl font-semibold leading-tight text-[#C6A55A] md:text-5xl">
              “{profile.editorialQuote}”
            </blockquote>

            <div className="grid gap-6 md:grid-cols-2">
              <NarrativeBlock title="Breeding philosophy" body={profile.breedingPhilosophy} />
              <NarrativeBlock title="Commercial positioning" body={profile.commercialNarrative} />
              <NarrativeBlock title="Market intent" body={profile.marketIntent} />
              <NarrativeBlock title="International context" body={profile.internationalContext} />
            </div>

            <div className="rounded-[2rem] border border-[#C6A55A]/20 bg-[#0B1A2F]/55 p-8">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">Program background</div>
              <p className="mt-5 text-sm leading-7 text-[#F5F1E8]/70">{profile.programBackground}</p>
              <p className="mt-5 text-sm leading-7 text-[#F5F1E8]/55">{profile.participationNote}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#081423] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">Current drops</div>
              <h2 className="mt-3 text-4xl font-semibold">Release cycle opportunities</h2>
            </div>
            <div className="text-sm text-[#F5F1E8]/55">{profile.releaseCycle}</div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {profile.drops.map((drop) => (
              <article key={drop.id} className="grid gap-6 rounded-[2rem] border border-white/10 bg-black/25 p-6 md:grid-cols-[0.9fr_1.1fr]">
                <EditorialImagePlaceholder label={drop.accessStatus} mood={drop.imageMood} />
                <div>
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-[#C6A55A]">
                    <span className="rounded-full border border-[#C6A55A]/25 px-3 py-1">{drop.type}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[#F5F1E8]/55">{drop.territoryStatus}</span>
                  </div>

                  <h3 className="mt-5 text-3xl font-semibold">{drop.name}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/68">{drop.thesis}</p>

                  <div className="mt-6 rounded-2xl border border-[#C6A55A]/20 bg-[#C6A55A]/8 p-4 text-xs leading-5 text-[#C6A55A]">
                    {drop.urgencySignal}
                  </div>

                  <div className="mt-6 space-y-2 text-xs text-[#F5F1E8]/55">
                    <div>{drop.pathwayBadge}</div>
                    <div>Target markets: {drop.targetMarkets.join(', ')}</div>
                  </div>

                  <Link href="/marketplace/genetics/request-access" className="mt-7 inline-flex text-sm text-[#C6A55A]">
                    {drop.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function NarrativeBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]">{title}</div>
      <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/68">{body}</p>
    </div>
  )
}
