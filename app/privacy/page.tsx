import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Harbourview privacy policy — how we collect, use, and protect your information.',
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'
const prose: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', lineHeight: '1.75', color: MUTED, marginBottom: '20px' }
const h2Style: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#F5F1E8', margin: '36px 0 12px' }

export default function PrivacyPage() {
  const updated = 'April 2025'
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px' }}>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: '12px' }}>Legal</p>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, color: '#F5F1E8', margin: '0 0 12px' }}>Privacy Policy</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED, marginBottom: '48px', opacity: 0.6 }}>Last updated: {updated}</p>

      <p style={prose}>Harbourview (operated by Wurx Ottawa) is committed to protecting the privacy of individuals who interact with our website and services. This policy describes how we collect, use, store, and protect your information.</p>

      <h2 style={h2Style}>Information We Collect</h2>
      <p style={prose}>We collect information you provide directly, including through intake forms, contact forms, listing submissions, and wanted request submissions. This may include your name, email address, phone number, company name, and details about your commercial interests or requirements. We also collect standard web analytics data such as page views, referrers, and general geographic region.</p>

      <h2 style={h2Style}>How We Use Your Information</h2>
      <p style={prose}>Information submitted through Harbourview is used to provide our market access, intelligence, and strategic introduction services. We use contact information to respond to inquiries and progress introductions. We do not sell, rent, or share your personal information with third parties except as required to fulfil your service request (for example, introducing you to a counterparty you have consented to meet), as required by law, or with service providers bound by confidentiality obligations.</p>

      <h2 style={h2Style}>Marketplace Submissions</h2>
      <p style={prose}>Listing submissions, wanted requests, and marketplace inquiries are stored in our secure database. Private fields — including your legal entity name, contact details, and private notes — are never displayed publicly. Public marketplace listings show only anonymised, category-level information. Counterparty identity is disclosed only following Harbourview review and mutual consent from both parties.</p>

      <h2 style={h2Style}>Data Retention</h2>
      <p style={prose}>We retain personal information for as long as necessary to deliver our services and comply with legal obligations. Marketplace records are archived rather than deleted to maintain audit integrity. You may request deletion of your personal information by contacting us at the address below, subject to legal retention requirements.</p>

      <h2 style={h2Style}>Cookies and Analytics</h2>
      <p style={prose}>Our website may use cookies and analytics tools to understand usage patterns and improve our services. We do not use advertising cookies or third-party tracking for commercial purposes. You can disable cookies in your browser settings.</p>

      <h2 style={h2Style}>Security</h2>
      <p style={prose}>We implement appropriate technical and organisational measures to protect your information against unauthorised access, disclosure, or loss. All data is stored on encrypted infrastructure. Admin access is protected by authentication controls and all admin actions are logged to an immutable audit trail.</p>

      <h2 style={h2Style}>Contact</h2>
      <p style={prose}>For privacy inquiries or requests, contact: <a href="mailto:harbourviewcompany@gmail.com" style={{ color: GOLD }}>harbourviewcompany@gmail.com</a></p>

      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED, opacity: 0.5, marginTop: '48px' }}>This policy may be updated from time to time. Material changes will be noted on this page.</p>
    </div>
  )
}
