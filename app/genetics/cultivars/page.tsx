import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCultivarPassports } from '@/lib/genetics/queries'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Public Cultivar Passports | Harbourview' }

export default async function CultivarListPage() {
  const passports = await getPublicCultivarPassports()
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-12 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Cultivar passports</p>
          <h1 className="mt-2 text-3xl font-semibold">Public passport summaries</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#F5F1E8]/65">Only DTO-allowlisted public fields are shown. Private evidence, file paths, buyer diligence, and admin review notes stay out of this surface.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {passports.map((passport) => (
            <article key={passport.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-6">
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]">
                <span>{passport.cultivarCategory}</span>
                <span>•</span>
                <span>{passport.claimStatus.replace(/_/g, ' ')}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold">{passport.displayName}</h2>
              <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{passport.publicSummary}</p>
              <p className="mt-3 text-xs text-[#F5F1E8]/50">Rights holder: {passport.rightsHolderDisplayName ?? 'Request access'}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <Link href={`/genetics/cultivars/${passport.slug}`} className="rounded-full bg-[#C6A55A] px-4 py-2 text-[#081423]">View public passport</Link>
                <Link href="/contact" className="rounded-full border border-[#C6A55A]/40 px-4 py-2 text-[#C6A55A]">Request access</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
