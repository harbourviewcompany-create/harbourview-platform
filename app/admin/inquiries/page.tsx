import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Inquiries' }
export default function AdminInquiriesPage() {
  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 600, color: '#F5F1E8', marginBottom: '8px' }}>Marketplace Inquiries</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#C9C2B3' }}>
        API: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>GET /api/admin/inquiries?status=new</code><br/>
        Update: <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>PATCH /api/admin/inquiries</code> with <code style={{ backgroundColor: 'rgba(198,165,90,0.1)', padding: '2px 6px', borderRadius: '2px' }}>{'{"id":"...","status":"actioned"}'}</code>
      </p>
    </div>
  )
}
