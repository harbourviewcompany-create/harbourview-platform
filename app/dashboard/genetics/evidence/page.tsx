import { getInternalCultivarPassports } from '@/lib/genetics/queries'

export const dynamic = 'force-dynamic'

export default async function GeneticsEvidenceDashboardPage() {
  const passports = await getInternalCultivarPassports()
  const evidence = passports.flatMap((passport) => passport.privateEvidenceMetadata.map((item) => ({ ...item, cultivar: passport.displayName })))
  return <main className="min-h-screen bg-[#081423] px-6 py-10 text-[#F5F1E8] md:px-10"><section className="mx-auto max-w-5xl space-y-4"><h1 className="text-3xl font-semibold">Evidence Vault metadata</h1>{evidence.map((item) => <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[#F5F1E8]/55">{item.cultivar} · {item.visibility.replace(/_/g, ' ')} · {item.review_status.replace(/_/g, ' ')}</p></div>)}</section></main>
}
