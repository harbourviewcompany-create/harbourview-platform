import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminDataClient } from '@/lib/supabase/adminDataClient'
import IntakeQueueClient from './IntakeQueueClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export type InquiryRow = {
  id: string
  inquiry_type: string
  contact_name: string | null
  contact_email: string | null
  contact_company: string | null
  contact_phone: string | null
  message: string | null
  review_status: string | null
  priority: string | null
  internal_notes: string | null
  created_at: string
}

async function getInquiries(): Promise<InquiryRow[]> {
  const client = getAdminDataClient()
  if (!client.ok) return []

  const res = await fetch(
    `${client.data.url}/rest/v1/marketplace_inquiries?inquiry_type=in.(listing_submission,wanted_request_submission)&order=created_at.desc&limit=200`,
    {
      headers: {
        apikey: client.data.serviceRoleKey,
        Authorization: `Bearer ${client.data.serviceRoleKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  )
  if (!res.ok) return []
  return res.json()
}

export default async function AdminIntakeQueuePage() {
  await requireAdminAuth()
  const inquiries = await getInquiries()

  const pending = inquiries.filter(r => !r.review_status || r.review_status === 'received')
  const inReview = inquiries.filter(r => r.review_status === 'in_review')
  const published = inquiries.filter(r => r.review_status === 'published')
  const rejected = inquiries.filter(r => r.review_status === 'rejected' || r.review_status === 'closed')

  return (
    <main className="min-h-screen bg-[#061322] px-6 py-10 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview operator · Marketplace</p>
          <h1 className="mt-2 text-3xl font-semibold">Intake Queue</h1>
          <p className="mt-2 text-sm text-[#F5F1E8]/60">
            Seller listing submissions and wanted requests. Review, annotate and publish to the live marketplace.
          </p>
        </section>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Pending review', count: pending.length, color: 'text-amber-400' },
            { label: 'In review', count: inReview.length, color: 'text-blue-400' },
            { label: 'Published', count: published.length, color: 'text-green-400' },
            { label: 'Rejected / closed', count: rejected.length, color: 'text-[#F5F1E8]/40' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="mt-1 text-xs text-[#F5F1E8]/50">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active queue */}
        <IntakeQueueClient
          pending={pending}
          inReview={inReview}
          published={published}
          rejected={rejected}
        />
      </div>
    </main>
  )
}
