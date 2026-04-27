import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Audit Trail' }
export default function AdminAuditPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#F5F1E8', marginBottom: '8px' }}>Audit Trail</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#C9C2B3' }}>
        All events: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>GET /api/admin/audit</code><br/>
        Filter by entity: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>GET /api/admin/audit?entity_type=listing&entity_id=uuid</code>
      </p>
    </div>
  )
}
