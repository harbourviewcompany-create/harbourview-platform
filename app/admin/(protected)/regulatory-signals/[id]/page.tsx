import { notFound, redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getRegulatorySignal, transitionRegulatorySignalStatus } from '@/lib/regulatory-signals/admin'
import { listRegulatoryEvidenceOptions, linkRegulatoryEvidenceToSignal } from '@/lib/regulatory-signals/evidence'

export const dynamic = 'force-dynamic'

async function transitionAction(formData: FormData) {
  'use server'
  const auth = (await requireAdminAuth())!
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '')
  const note = String(formData.get('note') || '')
  const result = await transitionRegulatorySignalStatus(id, status, auth.user.id, note)
  if (!result.ok) throw new Error((result as any).error.message)
  redirect(`/admin/regulatory-signals/${id}`)
}

async function linkEvidenceAction(formData: FormData) {
  'use server'
  await requireAdminAuth()
  const signalId = String(formData.get('signal_id') || '')
  const evidenceId = String(formData.get('evidence_id') || '')
  const result = await linkRegulatoryEvidenceToSignal(signalId, evidenceId)
  if (!result.ok) throw new Error((result as any).error.message)
  redirect(`/admin/regulatory-signals/${signalId}`)
}

export default async function RegulatorySignalDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminAuth()
  const { id } = await params
  const result = await getRegulatorySignal(id)
  const evidence = await listRegulatoryEvidenceOptions()

  if (!result.ok) throw new Error((result as any).error.message)
  if (!result.data) return notFound()
  const signal = result.data as import('@/lib/regulatory-signals/types').RegulatorySignalRecord

  return (
    <section className="max-w-3xl">
      <h2 className="text-2xl font-semibold">{(signal as any).headline}</h2>
      <p className="mt-2 text-sm text-[#F5F1E8]/65">Status: {(signal as any).review_status}</p>

      <div className="mt-6 space-y-4 text-sm">
        <p><strong>Country:</strong> {(signal as any).country_name || 'Global'}</p>
        <p><strong>Type:</strong> {(signal as any).signal_type}</p>
        <p><strong>Date:</strong> {(signal as any).signal_date}</p>
        <p><strong>Private summary:</strong> {(signal as any).private_summary}</p>
      </div>

      <form action={transitionAction} className="mt-8 grid gap-3">
        <input type="hidden" name="id" value={(signal as any).id} />
        <select name="status" className="rounded bg-black/30 p-3">
          <option value="in_review">In review</option>
          <option value="published">Publish</option>
          <option value="rejected">Reject</option>
          <option value="archived">Archive</option>
        </select>
        <textarea name="note" placeholder="Optional note" className="rounded bg-black/30 p-3" />
        <button className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm text-[#081423]">Update Status</button>
      </form>

      <div className="mt-10 rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5">
        <h3 className="text-lg font-medium">Link Evidence</h3>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">Attach reviewed source evidence to this regulatory Signal. Raw evidence remains private.</p>
        {!evidence.ok ? (
          <div className="mt-4 text-sm text-red-300">{(evidence as any).error.message}</div>
        ) : evidence.data.length ? (
          <form action={linkEvidenceAction} className="mt-4 grid gap-3">
            <input type="hidden" name="signal_id" value={(signal as any).id} />
            <select name="evidence_id" className="rounded bg-black/30 p-3">
              {evidence.data.map((item) => (
                <option key={item.id} value={item.id}>{item.evidence_title}</option>
              ))}
            </select>
            <button className="rounded-full border border-[#C6A55A]/50 px-4 py-2 text-sm text-[#C6A55A]">Link Evidence</button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-[#F5F1E8]/55">No evidence records available.</p>
        )}
      </div>
    </section>
  )
}
