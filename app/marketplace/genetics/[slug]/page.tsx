import { geneticsProfiles, toPublicGeneticsProfile } from '@/lib/marketplace/geneticsProfiles'

export default function GeneticsProfilePage({ params }: { params: { slug: string } }) {
  const profile = geneticsProfiles.find((p) => p.slug === params.slug)
  if (!profile) return <div>Not found</div>

  const p = toPublicGeneticsProfile(profile)

  return (
    <main className="min-h-screen bg-[#081423] text-[#F5F1E8] px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl text-[#C6A55A] font-semibold">{p.profileName}</h1>
        <p className="mt-3 text-[#F5F1E8]/70">{p.profileSummary}</p>

        <div className="mt-10">
          <h2 className="text-xl mb-4">Current Drops</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {p.currentDrops?.map((d) => (
              <div key={d.id} className="border border-[#C6A55A]/20 p-4 rounded-lg">
                <div className="text-sm text-[#C6A55A]">{d.dropType}</div>
                <h3 className="text-lg font-semibold mt-1">{d.title}</h3>
                <p className="text-sm mt-2 text-[#F5F1E8]/60">{d.shortPositioning}</p>
                <div className="mt-3 text-xs text-[#F5F1E8]/50">
                  {d.signals?.join(' • ')}
                </div>
                <div className="mt-4 text-sm text-[#C6A55A]">{d.ctaLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
