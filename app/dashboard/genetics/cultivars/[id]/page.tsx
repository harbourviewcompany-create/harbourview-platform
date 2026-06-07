import { notFound } from 'next/navigation'
import { getInternalCultivarPassports } from '@/lib/genetics/demoData'

export default async function DashboardCultivarPassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const passport = getInternalCultivarPassports().find((item) => item.id === id)
  if (!passport) notFound()
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-10 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-5xl space-y-4">
        <h1 className="text-3xl font-semibold">{passport.displayName}</h1>
        <p className="text-sm text-[#F5F1E8]/65">Internal passport view with private evidence metadata and request review fields. This route is not used by public DTO rendering.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5"><h2 className="font-semibold">Evidence metadata</h2><p className="mt-2 text-sm text-[#F5F1E8]/60">{passport.privateEvidenceMetadata.length} records, including private storage references only after permission checks.</p></div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5"><h2 className="font-semibold">Access requests</h2><p className="mt-2 text-sm text-[#F5F1E8]/60">{passport.accessRequests.length} requests awaiting status review.</p></div>
        </div>
      </section>
    </main>
  )
}
