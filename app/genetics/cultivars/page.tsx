import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCultivarPassports } from '@/lib/genetics/queries'
import type { CultivarCategory, ClaimStatus } from '@/lib/genetics/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Public Cultivar Passports | Harbourview' }

const CATEGORY_LABELS: Record<CultivarCategory, string> = {
  cannabis: 'Cannabis',
  hemp: 'Hemp',
  cbd: 'CBD',
  medical: 'Medical',
  adult_use: 'Adult use',
  research: 'Research',
  pharmaceutical: 'Pharmaceutical',
  industrial: 'Industrial',
  unknown: 'Unknown',
}

const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  claimed: 'Claimed',
  evidence_provided: 'Evidence provided',
  externally_verified: 'Externally verified',
  admin_reviewed: 'Admin reviewed',
  disputed: 'Disputed',
  expired: 'Expired',
  rejected: 'Rejected',
  not_assessed: 'Not assessed',
  private_only: 'Private only',
}

type SearchParams = Promise<{ q?: string; category?: string; status?: string }>

export default async function CultivarListPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = params.q?.trim().toLowerCase() ?? ''
  const categoryFilter = params.category ?? ''
  const statusFilter = params.status ?? ''

  const allPassports = await getPublicCultivarPassports()

  const passports = allPassports.filter((passport) => {
    if (q && !passport.displayName.toLowerCase().includes(q) && !passport.publicSummary?.toLowerCase().includes(q)) return false
    if (categoryFilter && passport.cultivarCategory !== categoryFilter) return false
    if (statusFilter && passport.claimStatus !== statusFilter) return false
    return true
  })

  const isFiltered = Boolean(q || categoryFilter || statusFilter)

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-12 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Cultivar passports</p>
          <h1 className="mt-2 text-3xl font-semibold">Public passport summaries</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#F5F1E8]/65">Only DTO-allowlisted public fields are shown. Private evidence, file paths, buyer diligence, and admin review notes stay out of this surface.</p>
        </div>

        {/* Search + filter form */}
        <form method="GET" className="flex flex-wrap gap-3">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search by name or summary…"
            className="flex-1 min-w-[200px] rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#F5F1E8] placeholder-[#F5F1E8]/30 outline-none focus:border-[#C6A55A]/60"
          />
          <select
            name="category"
            defaultValue={params.category ?? ''}
            className="rounded-full border border-white/15 bg-[#0B1A2F] px-4 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/60"
          >
            <option value="">All categories</option>
            {(Object.keys(CATEGORY_LABELS) as CultivarCategory[]).map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ''}
            className="rounded-full border border-white/15 bg-[#0B1A2F] px-4 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/60"
          >
            <option value="">All statuses</option>
            {(Object.keys(CLAIM_STATUS_LABELS) as ClaimStatus[]).map((s) => (
              <option key={s} value={s}>{CLAIM_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-[#C6A55A] px-5 py-2 text-sm font-medium text-[#081423] transition hover:bg-[#C6A55A]/80"
          >
            Filter
          </button>
          {isFiltered && (
            <Link
              href="/genetics/cultivars"
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-[#F5F1E8]/60 transition hover:bg-white/5"
            >
              Clear
            </Link>
          )}
        </form>

        {isFiltered && (
          <p className="text-xs text-[#F5F1E8]/45">
            {passports.length === 0 ? 'No results' : `${passports.length} of ${allPassports.length} passport${allPassports.length !== 1 ? 's' : ''}`}
          </p>
        )}

        {passports.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-8 text-sm text-[#F5F1E8]/45 text-center">
            No passports match your search.{' '}
            <Link href="/genetics/cultivars" className="text-[#C6A55A] underline underline-offset-2">Clear filters</Link>
          </p>
        ) : (
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
        )}
      </section>
    </main>
  )
}
