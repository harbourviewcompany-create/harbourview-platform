import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createClient } from '@/lib/server/supabaseRestClient'
import type { GeneticsRoutingExecutionStatus } from '@/lib/introduction-routing/geneticsExecution'

export const dynamic = 'force-dynamic'

type RoutingRecord = {
  id: string
  profile_slug: string
  drop_id: string
  requester_company: string
  requester_email: string
  requester_country?: string
  intent: string
  target_market?: string
  score: number
  score_band: string
  status: GeneticsRoutingExecutionStatus
  buyer_permission_approved: boolean
  holder_permission_approved: boolean
  introduction_ready: boolean
  next_action?: string
  stale_escalated?: boolean
  created_at: string
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function statusBadge(status: GeneticsRoutingExecutionStatus) {
  const map: Record<string, string> = {
    new_request: '#4A5E80',
    needs_qualification: '#8B6910',
    needs_buyer_permission: '#8B6910',
    needs_holder_permission: '#8B6910',
    ready_for_intro: '#3DA86E',
    introduced: '#2A6FBA',
    declined: '#8B2020',
    archived: '#3A4A5E',
  }
  return (
    <span
      style={{
        background: map[status] ?? '#4A5E80',
        color: '#F5F1E8',
        borderRadius: 12,
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.06em',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default async function GeneticsRoutingAdminPage() {
  await requireAdminAuth()

  const client = getClient()
  let records: RoutingRecord[] = []

  if (client) {
    const { data, error } = await client
      .from<RoutingRecord>('genetics_routing_records')
      .select(
        'id,profile_slug,drop_id,requester_company,requester_email,requester_country,intent,target_market,score,score_band,status,buyer_permission_approved,holder_permission_approved,introduction_ready,next_action,stale_escalated,created_at',
      )
    if (!error && Array.isArray(data)) {
      // Sort by created_at descending (newest first)
      records = (data as RoutingRecord[]).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    }
  }

  const readyForIntro = records.filter((r) => r.status === 'ready_for_intro').length
  const stalled = records.filter((r) => r.stale_escalated).length
  const pending = records.filter((r) =>
    ['needs_qualification', 'needs_buyer_permission', 'needs_holder_permission'].includes(r.status),
  ).length

  return (
    <section style={{ fontFamily: 'inherit' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C6A55A' }}>
          Genetics routing
        </p>
        <h2 style={{ marginTop: 4, fontSize: 24, fontWeight: 600 }}>Access request queue</h2>
        <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(245,241,232,0.6)', maxWidth: 560 }}>
          Live view of genetics access requests. Qualification scored by engine; controlled
          introductions require buyer + holder permission before any contact is revealed.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total requests', val: records.length, color: '#F5F1E8' },
          { label: 'Ready for intro', val: readyForIntro, color: '#3DA86E' },
          { label: 'Pending qualification', val: pending, color: '#C6A55A' },
          { label: 'Stalled / escalated', val: stalled, color: '#E05A5A' },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: '#0B1A2F',
              border: '1px solid rgba(198,165,90,0.2)',
              borderRadius: 14,
              padding: '16px 20px',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11, color: 'rgba(245,241,232,0.5)', marginTop: 4, letterSpacing: '0.06em' }}>
              {k.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Records table */}
      {records.length === 0 ? (
        <div
          style={{
            background: '#0B1A2F',
            border: '1px solid rgba(198,165,90,0.15)',
            borderRadius: 14,
            padding: '40px 24px',
            textAlign: 'center',
            color: 'rgba(245,241,232,0.45)',
            fontSize: 13,
          }}
        >
          No genetics access requests yet. Requests submitted via the marketplace intake form will appear here.
        </div>
      ) : (
        <div
          style={{
            background: '#0B1A2F',
            border: '1px solid rgba(198,165,90,0.15)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(198,165,90,0.15)' }}>
                {[
                  'ID',
                  'Requester',
                  'Profile / Drop',
                  'Intent → Market',
                  'Status',
                  'Score',
                  'Permissions',
                  'Next action',
                  'Created',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(245,241,232,0.4)',
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: i < records.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: r.stale_escalated ? 'rgba(224,90,90,0.06)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '10px 14px', color: 'rgba(245,241,232,0.4)', fontFamily: 'monospace', fontSize: 11 }}>
                    {r.id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ color: '#D4C9B8', fontSize: 12 }}>{r.requester_company || '—'}</div>
                    <div style={{ color: 'rgba(245,241,232,0.4)', fontSize: 10, marginTop: 2 }}>{r.requester_email}</div>
                    {r.requester_country && (
                      <div style={{ color: 'rgba(245,241,232,0.3)', fontSize: 10 }}>{r.requester_country}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#A0B0C8', fontSize: 11 }}>
                    <div>{r.profile_slug}</div>
                    <div style={{ color: 'rgba(245,241,232,0.35)', fontSize: 10 }}>{r.drop_id}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'rgba(245,241,232,0.6)', fontSize: 11 }}>
                    <div>{r.intent?.replace(/_/g, ' ') || '—'}</div>
                    {r.target_market && (
                      <div style={{ color: 'rgba(245,241,232,0.35)', fontSize: 10 }}>→ {r.target_market}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{statusBadge(r.status)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#C6A55A' }}>
                    {r.score ?? '—'}
                    {r.score_band ? (
                      <span style={{ color: 'rgba(245,241,232,0.35)', fontSize: 10, marginLeft: 4 }}>
                        ({r.score_band})
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11 }}>
                    <div style={{ color: r.buyer_permission_approved ? '#3DA86E' : 'rgba(245,241,232,0.3)' }}>
                      {r.buyer_permission_approved ? '✓' : '✗'} Buyer
                    </div>
                    <div style={{ color: r.holder_permission_approved ? '#3DA86E' : 'rgba(245,241,232,0.3)', marginTop: 2 }}>
                      {r.holder_permission_approved ? '✓' : '✗'} Holder
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'rgba(245,241,232,0.5)', fontSize: 11, maxWidth: 180 }}>
                    {r.next_action || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'rgba(245,241,232,0.3)', fontSize: 11 }}>
                    {new Date(r.created_at).toLocaleDateString('en-CA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
