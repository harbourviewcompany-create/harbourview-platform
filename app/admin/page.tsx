import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'

const QUEUE_CARDS = [
  { label: 'Listing Review Queue', href: '/admin/listings', desc: 'Pending listings awaiting approval or rejection', color: '#FFC107' },
  { label: 'Wanted Requests', href: '/admin/wanted', desc: 'Buyer requests awaiting review', color: '#42A5F5' },
  { label: 'Inquiries', href: '/admin/inquiries', desc: 'New marketplace inquiries to action', color: '#66BB6A' },
  { label: 'Matches', href: '/admin/matches', desc: 'Active and proposed counterparty matches', color: '#9575CD' },
  { label: 'Disclosures', href: '/admin/disclosures', desc: 'Pending disclosure requests awaiting approval', color: '#FFA726' },
  { label: 'Audit Trail', href: '/admin/audit', desc: 'Full audit log of all admin actions', color: '#C6A55A' },
]

export default function AdminDashboard() {
  return (
    <>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#F5F1E8', margin: '0 0 8px' }}>
          Harbourview Admin
        </h1>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED, margin: 0 }}>
          Controlled-introduction workflow. All counterparty actions are logged.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {QUEUE_CARDS.map((card) => (
          <a
            key={card.href}
            href={card.href}
            style={{ textDecoration: 'none' }}
          >
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(198,165,90,0.12)', borderRadius: '3px', padding: '24px', cursor: 'pointer' }}>
              <div style={{ width: '4px', height: '32px', backgroundColor: card.color, borderRadius: '2px', marginBottom: '16px' }} />
              <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', fontWeight: 600, color: '#F5F1E8', margin: '0 0 8px' }}>
                {card.label}
              </h2>
              <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: MUTED, margin: 0, lineHeight: '1.5' }}>
                {card.desc}
              </p>
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: '48px', padding: '20px', backgroundColor: 'rgba(198,165,90,0.05)', border: '1px solid rgba(198,165,90,0.12)', borderRadius: '3px' }}>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: MUTED, margin: 0, lineHeight: '1.7' }}>
          <strong style={{ color: GOLD }}>Operational note:</strong> All listing approvals, match proposals, disclosure requests, and status changes
          are automatically written to the audit trail. No hard deletes — use archive or supersede
          lifecycle states. Admin actions require <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '1px 5px', borderRadius: '2px', fontSize: '11px' }}>Authorization: Bearer &lt;ADMIN_SECRET&gt;</code> on API calls.
        </p>
      </div>
    </>
  )
}
