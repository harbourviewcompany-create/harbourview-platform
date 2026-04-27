import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Wanted Requests' }
export default function AdminWantedPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#F5F1E8', marginBottom: '8px' }}>Wanted Request Queue</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#C9C2B3' }}>
        API: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>GET /api/admin/listings?status=pending_review</code> — buyer requests use the same status flow as listings.
      </p>
    </div>
  )
}
