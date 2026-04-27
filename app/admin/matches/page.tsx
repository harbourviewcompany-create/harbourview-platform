import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Matches' }
export default function AdminMatchesPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#F5F1E8', marginBottom: '8px' }}>Matches</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#C9C2B3' }}>
        Create: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>POST /api/admin/matches</code><br/>
        Advance: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>PATCH /api/admin/matches/:id</code> — status transitions: proposed → inquiry_received → disclosure_requested → disclosure_approved → introduced → closed_won/lost
      </p>
    </div>
  )
}
