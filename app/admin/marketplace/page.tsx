import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { MARKETPLACE_TAXONOMY } from '@/lib/marketplace/taxonomy'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const lanes = ['Sources', 'Candidates', 'Verification', 'Publish Queue', 'Listings', 'Wanted Requests', 'Imports', 'Rejected / Archived']

export default async function AdminMarketplacePage() {
  await requireAdminAuth()

  return (
    <main className="min-h-screen bg-[#061322] px-6 py-10 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview operator</p>
          <h1 className="mt-2 text-3xl font-semibold">Marketplace Supply Engine</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#F5F1E8]/65">Review sources, candidates, public summaries, wanted requests and publish readiness. This surface is private and must not be used to display source evidence publicly.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-4">{lanes.map((lane) => <a key={lane} href={`/admin/marketplace/${lane.toLowerCase().replaceAll(' ', '-').replace('/', '')}`} className="rounded-2xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-4 text-sm text-[#F5F1E8]/70 hover:border-[#C6A55A]/45"><span className="block text-[#F5F1E8]">{lane}</span><span className="mt-2 block text-xs text-[#F5F1E8]/45">Private operator lane</span></a>)}</section>
        <section className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-5">
          <h2 className="text-lg font-semibold">Canonical category coverage</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {MARKETPLACE_TAXONOMY.map((category) => <div key={category.key} className="rounded-xl border border-[#C6A55A]/10 bg-[#061322] p-3"><div className="font-medium">{category.publicLabel}</div><div className="mt-1 text-xs text-[#F5F1E8]/45">{category.key} · {category.publicVisibilityMode} · {category.defaultMonetizationPath}</div></div>)}
          </div>
        </section>
      </div>
    </main>
  )
}
