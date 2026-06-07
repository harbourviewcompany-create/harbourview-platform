import type { Metadata } from 'next'
import Link from 'next/link'
import { getInternalCultivarPassports } from '@/lib/genetics/demoData'

export const metadata: Metadata = { title: 'Genetics Dashboard | Harbourview' }

export default function DashboardGeneticsPage() {
  const passports = getInternalCultivarPassports()
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-10 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">Cultivar Passport workspace</h1>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">Manage profiles, passports, private evidence metadata, access requests, and country opportunity review fields after permission checks.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/dashboard/genetics/cultivars/new" className="rounded-full bg-[#C6A55A] px-4 py-2 text-[#081423]">Create controlled passport</Link>
          <Link href="/dashboard/genetics/evidence" className="rounded-full border border-[#C6A55A]/40 px-4 py-2 text-[#C6A55A]">Evidence vault metadata</Link>
          <Link href="/dashboard/genetics/access-requests" className="rounded-full border border-[#C6A55A]/40 px-4 py-2 text-[#C6A55A]">Access requests</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {passports.map((passport) => (
            <article key={passport.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-[#C6A55A]">{passport.claimReviewStatus.replace(/_/g, ' ')}</p>
              <h2 className="mt-3 text-xl font-semibold">{passport.displayName}</h2>
              <p className="mt-2 text-sm text-[#F5F1E8]/65">{passport.privateEvidenceMetadata.length} evidence records · {passport.accessRequests.length} access requests</p>
              <Link href={`/dashboard/genetics/cultivars/${passport.id}`} className="mt-5 inline-flex rounded-full border border-[#C6A55A]/40 px-4 py-2 text-sm text-[#C6A55A]">Review passport</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
