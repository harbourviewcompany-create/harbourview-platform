import { redirect } from 'next/navigation'

import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { listRegulatoryReviewQueue, transitionRegulatorySignalStatus, updateRegulatorySignalReview } from '@/lib/regulatory-signals/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function saveReview(formData: FormData) {
  'use server'
  const auth = (await requireAdminAuth())!
  await updateRegulatorySignalReview(formData, auth.user.id)
  redirect('/admin/signals/review')
}

async function publishSignal(formData: FormData) {
  'use server'
  const auth = (await requireAdminAuth())!
  const id = String(formData.get('signal_id') || '')
  const note = String(formData.get('reviewer_note') || '')
  await transitionRegulatorySignalStatus(id, 'published', auth.user.id, note)
  redirect('/admin/signals/review')
}

function label(value: string | null | undefined) {
  return (value || 'unknown').replace(/_/g, ' ')
}

export default async function RegulatorySignalReviewPage() {
  await requireAdminAuth()
  const result = await listRegulatoryReviewQueue()
  const queue = result.ok ? result.data ?? [] : []

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Regulatory signal review queue</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">Draft watcher signals remain private until reviewed, marked public-safe, approved, and published.</p>
      </div>
      <div className="flex gap-3 text-sm"><a className="text-[#C6A55A] underline" href="/admin/signals">Summary</a><a className="text-[#C6A55A] underline" href="/admin/signals/sources">Sources</a></div>
      {queue.length === 0 ? <div className="rounded-2xl border border-[#C6A55A]/10 bg-[#0B1A2F] p-10 text-center"><p className="text-sm text-[#F5F1E8]/55">No regulatory signals pending review.</p></div> : (
        <div className="space-y-5">
          {queue.map((signal) => (
            <article key={signal.id} className="rounded-2xl border border-[#C6A55A]/10 bg-[#071423] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#C6A55A]">{label(signal.review_status)} · {label(signal.signal_type)} · {label(signal.confidence)}</p>
              <h3 className="mt-3 text-xl font-semibold">{signal.headline}</h3>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#F5F1E8]/42">{signal.country_name || 'Global'} · {signal.regulator_name || 'Unknown source'} · {signal.signal_date}</p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[#F5F1E8]/65">{signal.private_summary}</div>
              <form action={saveReview} className="mt-5 grid gap-4">
                <input type="hidden" name="signal_id" value={signal.id} />
                <textarea name="public_summary" defaultValue={signal.public_summary || ''} rows={3} className="rounded-xl border border-white/10 bg-black/30 p-3 text-[#F5F1E8]" placeholder="Public-safe summary" />
                <textarea name="public_implication" defaultValue={signal.public_implication || ''} rows={2} className="rounded-xl border border-white/10 bg-black/30 p-3 text-[#F5F1E8]" placeholder="Public-safe implication" />
                <input name="reviewer_note" className="rounded-xl border border-white/10 bg-black/30 p-3 text-[#F5F1E8]" placeholder="Internal review note" />
                <div className="flex flex-wrap gap-4 text-sm text-[#F5F1E8]/65"><label><input name="public_safe" type="checkbox" defaultChecked={signal.public_safe} /> Public safe</label><label><input name="publish_to_public" type="checkbox" defaultChecked={signal.publish_to_public} /> Eligible public feed</label></div>
                <div className="flex flex-wrap gap-3"><button name="review_status" value="in_review" className="rounded-full border border-white/15 px-4 py-2 text-sm">Save</button><button name="review_status" value="rejected" className="rounded-full border border-red-300/35 px-4 py-2 text-sm text-red-200">Reject</button></div>
              </form>
              <form action={publishSignal} className="mt-3"><input type="hidden" name="signal_id" value={signal.id} /><input type="hidden" name="reviewer_note" value="Published from regulatory signal review queue." /><button className="rounded-full bg-[#C6A55A] px-4 py-2 text-sm font-semibold text-[#071423]">Publish approved public signal</button></form>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
