import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGeneticsProfile } from '@/lib/marketplace/geneticsShowcaseReset'

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
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10">
          <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">
            {profile.profileType}
          </div>

          <h1 className="mt-4 text-5xl font-semibold">{profile.name}</h1>

          <div className="mt-3 text-sm text-gray-400">{profile.region}</div>

          <p className="mt-8 max-w-3xl text-lg text-gray-300">
            {profile.overview}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {profile.focus.map((item) => (
              <span key={item} className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/marketplace/genetics/request-access" className="rounded-full border border-[#C6A55A] px-5 py-3 text-sm text-[#C6A55A]">
              Request Access
            </Link>
            <Link href="/marketplace/genetics/submit-program" className="rounded-full border border-white/20 px-5 py-3 text-sm">
              Submit Collaboration Interest
            </Link>
          </div>
        </div>

        <section className="mt-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-semibold">Current Drops</h2>
            <div className="text-sm text-gray-400">
              Controlled commercial opportunities
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {profile.drops.map((drop) => (
              <article key={drop.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs uppercase tracking-wide text-[#C6A55A]">
                  {drop.type}
                </div>

                <h3 className="mt-3 text-2xl font-semibold">{drop.name}</h3>

                <p className="mt-4 text-sm text-gray-300">
                  {drop.thesis}
                </p>

                <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-300">
                  {drop.signals.map((signal) => (
                    <span key={signal} className="rounded-full border border-white/10 px-3 py-1">
                      {signal}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Target markets: {drop.targetMarkets.join(', ')}
                  </div>

                  <Link href="/marketplace/genetics/request-access" className="text-sm text-[#C6A55A]">
                    {drop.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
