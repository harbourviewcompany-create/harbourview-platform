import { geneticsProfiles, toPublicGeneticsProfile } from '@/lib/marketplace/geneticsProfiles'
import Link from 'next/link'

export default function GeneticsPage() {
  const profiles = geneticsProfiles.map(toPublicGeneticsProfile)

  return (
    <main className="min-h-screen bg-[#081423] text-[#F5F1E8] px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-semibold text-[#C6A55A]">Genetics, Seeds & Tissue Culture</h1>
        <p className="mt-4 text-[#F5F1E8]/70">
          Controlled showcase for genetics, licensing and tissue-culture programs. Access is managed through Harbourview.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {profiles.map((p) => (
            <Link key={p.slug} href={`/marketplace/genetics/${p.slug}`}>
              <div className="border border-[#C6A55A]/20 p-5 rounded-xl hover:border-[#C6A55A] transition">
                <h2 className="text-xl font-semibold">{p.profileName}</h2>
                <p className="text-sm mt-2 text-[#F5F1E8]/60">{p.positioningLine}</p>
                <div className="mt-4 text-sm text-[#C6A55A]">{p.primaryCta}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
