import { getGeneticsRoutingQueueLive } from '@/lib/introduction-routing/liveQueries'
import { FixtureBanner } from '@/components/admin/FixtureBanner'

export const dynamic = 'force-dynamic'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function GeneticsRoutingAdminPage() {
  const queue = await getGeneticsRoutingQueueLive()

  return (
    <main className="p-6 text-sm">
      <h1 className="text-xl font-semibold">Genetics Routing Queue</h1>
      <p className="mt-1 text-xs text-white/55">
        Scored access requests captured by /api/genetics/access-request, written to
        genetics_routing_records/events. Generic (non-drop-specific) requests never
        auto-set introduction_ready — every row here requires operator review.
      </p>
      <div className="mt-3">
        <FixtureBanner isFixture={queue.source === 'fixture'} label="Could not reach Supabase — check SUPABASE_SERVICE_ROLE_KEY" />
      </div>

      {queue.records.length === 0 && queue.source === 'db' && (
        <p className="mt-6 text-white/55">No routing records yet. They will appear here once someone submits the genetics access-request form.</p>
      )}

      <div className="mt-6 space-y-3">
        {queue.records.map((record) => (
          <article key={record.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{record.requester_company}</h2>
              <span className="text-xs uppercase tracking-wide text-[#C6A55A]">
                score {record.score} · {record.score_band} · {record.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/55">
              {record.requester_email} · {record.requester_country ?? 'country unknown'} · target market: {record.target_market ?? 'n/a'}
            </p>
            <p className="mt-1 text-xs text-white/55">
              profile of interest: {record.profile_slug} · intent: {record.intent}
            </p>
            <p className="mt-2 text-xs text-white/70">{record.next_action}</p>
            <p className="mt-2 text-[11px] text-white/35">{formatDate(record.created_at)}</p>
          </article>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Routing events</h2>
      <div className="mt-3 space-y-2">
        {queue.events.map((event) => (
          <p key={event.id} className="text-xs text-white/60">
            {formatDate(event.created_at)} · {event.event_type.replace(/_/g, ' ')} · {event.event_summary}
          </p>
        ))}
      </div>
    </main>
  )
}
