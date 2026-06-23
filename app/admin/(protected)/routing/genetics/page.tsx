import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getGeneticsRoutingQueueLive } from '@/lib/introduction-routing/liveQueries'
import { FixtureBanner } from '@/components/admin/FixtureBanner'

export const dynamic = 'force-dynamic'

const STATUS_COLOUR: Record<string, string> = {
  new_request:              'bg-[#1E2D45] text-[#8AA4C8]',
  needs_qualification:      'bg-[#2D2010] text-[#C6A55A]',
  needs_buyer_permission:   'bg-[#2D2010] text-[#C6A55A]',
  needs_holder_permission:  'bg-[#2D2010] text-[#C6A55A]',
  ready_for_intro:          'bg-[#0F2D1E] text-[#3DA86E]',
  introduced:               'bg-[#0F1E2D] text-[#4A9FD4]',
  declined:                 'bg-[#2D0F0F] text-[#E05A5A]',
  archived:                 'bg-[#1A2030] text-[#4A5E80]',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLOUR[status] ?? 'bg-[#1E2D45] text-[#8AA4C8]'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? 'text-[#3DA86E]' : 'text-[#F5F1E8]/25'}>
      {ok ? '✓' : '✗'}
    </span>
  )
}

export default async function GeneticsRoutingAdminPage() {
  await requireAdminAuth()

  const { records, events, source } = await getGeneticsRoutingQueueLive()

  const readyForIntro = records.filter((r) => r.status === 'ready_for_intro').length
  const pending = records.filter((r) =>
    ['needs_qualification', 'needs_buyer_permission', 'needs_holder_permission'].includes(r.status),
  ).length
  const introduced = records.filter((r) => r.status === 'introduced').length

  return (
    <section className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Genetics routing</p>
        <h2 className="mt-1 text-2xl font-semibold">Access request queue</h2>
        <p className="mt-2 max-w-xl text-sm text-[#F5F1E8]/60">
          Live view of genetics access requests scored by the qualification engine.
          Introductions require explicit buyer + holder permission before any contact is revealed.
        </p>
      </div>

      <FixtureBanner isFixture={source === 'fixture'} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total requests',        val: records.length, colour: 'text-[#F5F1E8]' },
          { label: 'Ready for intro',       val: readyForIntro,  colour: 'text-[#3DA86E]' },
          { label: 'Pending qualification', val: pending,        colour: 'text-[#C6A55A]' },
          { label: 'Introduced',            val: introduced,     colour: 'text-[#4A9FD4]' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-5">
            <div className={`text-3xl font-bold ${k.colour}`}>{k.val}</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-[#F5F1E8]/40">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Records table */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1A2F]">
        <div className="border-b border-white/10 px-5 py-3">
          <h3 className="text-sm font-semibold">
            Routing records
            <span className="ml-2 text-xs font-normal text-[#F5F1E8]/40">({records.length})</span>
          </h3>
        </div>
        {records.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#F5F1E8]/40">
            No routing records yet. Records are created when access requests are submitted via the
            genetics marketplace intake form.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-[#F5F1E8]/35">
                  {['ID', 'Requester', 'Profile / Drop', 'Intent → Market', 'Status', 'Score', 'Permissions', 'Created'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {records.map((r) => (
                  <tr key={r.id} className={r.status === 'declined' ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 font-mono text-[#F5F1E8]/35">{r.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#D4C9B8]">{r.requester_company || '—'}</div>
                      <div className="mt-0.5 text-[10px] text-[#F5F1E8]/40">{r.requester_email}</div>
                      {r.requester_country && (
                        <div className="text-[10px] text-[#F5F1E8]/30">{r.requester_country}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#A0B0C8]">{r.profile_slug}</div>
                      <div className="mt-0.5 text-[10px] text-[#F5F1E8]/35">{r.drop_id}</div>
                    </td>
                    <td className="px-4 py-3 text-[#F5F1E8]/60">
                      <div>{r.intent?.replace(/_/g, ' ') || '—'}</div>
                      {r.target_market && (
                        <div className="mt-0.5 text-[10px] text-[#F5F1E8]/35">→ {r.target_market}</div>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 font-mono text-[#C6A55A]">
                      {r.score ?? '—'}
                      {r.score_band && (
                        <span className="ml-1 text-[10px] text-[#F5F1E8]/35">({r.score_band})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Check ok={r.buyer_permission_approved} /> Buyer
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Check ok={r.holder_permission_approved} /> Holder
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#F5F1E8]/30">
                      {new Date(r.created_at).toLocaleDateString('en-CA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Events log */}
      {events.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1A2F]">
          <div className="border-b border-white/10 px-5 py-3">
            <h3 className="text-sm font-semibold">
              Event log
              <span className="ml-2 text-xs font-normal text-[#F5F1E8]/40">({events.length})</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-[#F5F1E8]/35">
                  {['Record', 'Event type', 'Summary', 'Actor', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-mono text-[#F5F1E8]/35">
                      {e.routing_record_id?.slice(0, 8) ?? '—'}…
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#0F1E2D] px-2.5 py-0.5 text-[10px] text-[#4A9FD4]">
                        {e.event_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-[#F5F1E8]/60">{e.event_summary || '—'}</td>
                    <td className="px-4 py-3 text-[#F5F1E8]/40">{e.actor ?? 'system'}</td>
                    <td className="px-4 py-3 text-[#F5F1E8]/30">
                      {new Date(e.created_at).toLocaleDateString('en-CA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </section>
  )
}
