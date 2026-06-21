import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminGeneticsReviewQueueLive } from '@/lib/genetics/queries'
import { FixtureBanner } from '@/components/admin/FixtureBanner'

export const dynamic = 'force-dynamic'

export default async function AdminGeneticsReviewPage() {
  await requireAdminAuth()
  const queue = await getAdminGeneticsReviewQueueLive()
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Genetics admin</p>
        <h2 className="mt-1 text-2xl font-semibold">Claim review queue</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">Review public claims, restricted-claim flags, material-transfer gates, private evidence states, access requests, and audit events.</p>
        <div className="mt-3">
          <FixtureBanner isFixture={queue.source === 'fixture'} label="Fixture data — cultivar_passports empty or service role key not configured" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {queue.cultivars.map((cultivar) => (
          <article key={cultivar.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[#C6A55A]">{cultivar.claimReviewStatus.replace(/_/g, ' ')}</p>
            <h3 className="mt-2 text-lg font-semibold">{cultivar.displayName}</h3>
            <p className="mt-2 text-xs text-[#F5F1E8]/55">Restricted flags: {cultivar.restrictedClaimFlags.length ? cultivar.restrictedClaimFlags.join(', ') : 'none'}</p>
            <p className="mt-1 text-xs text-[#F5F1E8]/55">Material transfer flags: {cultivar.materialTransferFlags.length ? cultivar.materialTransferFlags.join(', ') : 'none'}</p>
          </article>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
        <h3 className="font-semibold">Evidence review states</h3>
        {queue.evidenceQueue.map((item) => <p key={item.id} className="mt-2 text-sm text-[#F5F1E8]/65">{item.title} · {item.visibility.replace(/_/g, ' ')} · {item.review_status.replace(/_/g, ' ')}</p>)}
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
        <h3 className="font-semibold">Audit events</h3>
        {queue.auditEvents.map((event) => <p key={event.id} className="mt-2 text-sm text-[#F5F1E8]/65">{event.event_type.replace(/_/g, ' ')} · {event.public_summary}</p>)}
      </div>
    </section>
  )
}
