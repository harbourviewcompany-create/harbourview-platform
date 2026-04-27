import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Listing Queue' }
export default function AdminListingsPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#F5F1E8', marginBottom: '8px' }}>Listing Review Queue</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#C9C2B3', marginBottom: '32px' }}>
        Use the API: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>GET /api/admin/listings?status=pending_review</code><br/>
        Approve/reject: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>PATCH /api/admin/listings/:id</code> with <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>{'{"status":"approved","reason":"..."}'}</code>
      </p>
      <div style={{ padding: '32px', border: '1px solid rgba(198,165,90,0.12)', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#C9C2B3' }}>
          Admin UI data tables are served via authenticated API calls. Connect a frontend admin client or use the API directly with your ADMIN_SECRET bearer token.<br/><br/>
          All status changes are validated against allowed transitions and logged to status_history + audit_events automatically.
        </p>
      </div>
    </div>
  )
}
