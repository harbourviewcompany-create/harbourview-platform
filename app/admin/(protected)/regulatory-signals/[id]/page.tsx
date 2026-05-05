import { notFound, redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getRegulatorySignal, transitionRegulatorySignalStatus } from '@/lib/regulatory-signals/admin'

export const dynamic = 'force-dynamic'

async function transitionAction(formData: FormData) {
  'use server'
  const auth = await requireAdminAuth()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '')
  const note = String(formData.get('note') || '')
  const result = await transitionRegulatorySignalStatus(id, status, auth.user.id, note)
  if (!result.ok) throw new Error(result.error.message)
  redirect(`/admin/regulatory-signals/${id}`)
}

export default async function RegulatorySignalDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAuth()
  const { id } = await params
  const result = await getRegulatorySignal(id)
  if (!result.ok) throw new Error(result.error.message)
  if (!result.data) notFound()
  const signal = result.data

  return (
    <section className="max-w-3xl">
      <h2 className="text-2xl font-semibold">{signal.headline}</h2>
      <p className="mt-2 text-sm text-[#F5F1E8]/65">Status: {signal.review_status}</p>

      <div className="mt-6 space-y-4 text-sm">
        <p><strong>Country:</strong> {signal.country_name || 'Global'}</p>
        <p><strong>Type:</strong> {signal.signal_type}</p>
        <p><strong>Date:</strong> {signal.signal_date}</p>
        <p><strong>Private summary:</strong> {signal.private_summary}</p>
      </div>

      <form action={transitionAction} className="mt-8 grid gap-3">
        <input type="hidden" name="id" value={signal.id} />
        <select name="status" className="rounded bg-black/30 p-3">
          <option value="triaged">Triaged</option>
          <option value="in_review">In review</option>
          <option value="approved_public">Approved public</option>
          <option value="published">Publish</option>
          <option value="rejected">Reject</option>
        </select>
        <textarea name="note" placeholder="Optional note" className="rounded bg-black/30 p-3" />
        <button className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm text-[#081423]">Update Status</button>
      </form>
    </section>
  )
}
