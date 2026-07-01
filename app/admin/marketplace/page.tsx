import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminDataClient } from '@/lib/supabase/adminDataClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCounts() {
  const client = getAdminDataClient()
  if (!client.ok) return { pending: 0, total_listings: 0, total_inquiries: 0 }

  const headers = {
    apikey: client.data.serviceRoleKey,
    Authorization: `Bearer ${client.data.serviceRoleKey}`,
    Accept: 'application/json',
    Prefer: 'count=exact',
  }

  const [pendingRes, listingsRes, inquiriesRes] = await Promise.all([
    fetch(`${client.data.url}/rest/v1/marketplace_inquiries?inquiry_type=in.(listing_submission,wanted_request_submission)&review_status=in.(received,)&select=id`, { headers, cache: 'no-store' }),
    fetch(`${client.data.url}/rest/v1/listings?status=eq.approved&public_visibility=eq.true&select=id`, { headers, cache: 'no-store' }),
    fetch(`${client.data.url}/rest/v1/marketplace_inquiries?select=id`, { headers, cache: 'no-store' }),
  ])

  const pending = parseInt(pendingRes.headers.get('content-range')?.split('/')[1] ?? '0')
  const total_listings = parseInt(listingsRes.headers.get('content-range')?.split('/')[1] ?? '0')
  const total_inquiries = parseInt(inquiriesRes.headers.get('content-range')?.split('/')[1] ?? '0')

  return { pending, total_listings, total_inquiries }
}

export default async function AdminMarketplacePage() {
  await requireAdminAuth()
  const counts = await getCounts()

  return (
    <main className="min-h-screen bg-[#061322] px-6 py-10 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview operator</p>
          <h1 className="mt-2 text-3xl font-semibold">Marketplace Supply Engine</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F5F1E8]/65">
            Review seller submissions, publish live listings, and manage the supply catalogue.
          </p>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending submissions', count: counts.pending, color: counts.pending > 0 ? 'text-amber-400' : 'text-[#F5F1E8]/40' },
            { label: 'Live listings', count: counts.total_listings, color: 'text-green-400' },
            { label: 'Total inquiries', count: counts.total_inquiries, color: 'text-[#F5F1E8]/70' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
              <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
              <div className="mt-1 text-xs text-[#F5F1E8]/50">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Primary action */}
        <Link
          href="/admin/marketplace/intake"
          className="flex items-center justify-between rounded-2xl border border-[#C6A55A]/30 bg-[#0B1A2F] px-6 py-5 hover:border-[#C6A55A]/60 transition group"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#C6A55A]">Primary action</p>
            <p className="mt-1 text-lg font-semibold text-[#F5F1E8]">Review intake queue</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/55">
              Seller submissions awaiting review. Edit, enrich and publish directly to the live marketplace.
            </p>
          </div>
          {counts.pending > 0 && (
            <span className="ml-6 flex-shrink-0 rounded-full bg-amber-500 px-3 py-1 text-sm font-bold text-black">
              {counts.pending} pending
            </span>
          )}
        </Link>

        {/* Other lanes */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { href: '/marketplace/consumables', label: 'Live consumables page', desc: 'View the public marketplace as a buyer sees it', external: true },
            { href: '/marketplace/sell', label: 'Seller intake form', desc: 'The form sellers use to submit listings', external: true },
            { href: '/admin/marketplace/intake', label: 'All submissions', desc: 'Full history including rejected and published', external: false },
            { href: '/admin/marketplace/matches', label: 'Matches', desc: 'Listing ↔ buyer request pairs with AI-generated rationale', external: false },
          ].map(lane => (
            <Link
              key={lane.href}
              href={lane.href}
              target={lane.external ? '_blank' : undefined}
              className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-4 text-sm hover:border-[#C6A55A]/35 transition"
            >
              <span className="block font-semibold text-[#F5F1E8]">{lane.label}</span>
              <span className="mt-1 block text-xs text-[#F5F1E8]/45">{lane.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
