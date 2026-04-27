import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Disclosures' }
export default function AdminDisclosuresPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#F5F1E8', marginBottom: '8px' }}>Disclosure Requests</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#C9C2B3' }}>
        List: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>GET /api/admin/disclosures?status=requested</code><br/>
        Approve/Decline: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>PATCH /api/admin/disclosures/:id</code> with <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>{'{"action":"approve","approved_by":"tyler"}'}</code>
      </p>
    </div>
  )
}
