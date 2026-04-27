import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Harbourview terms of service — conditions for using the Harbourview platform and marketplace.',
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'
const prose: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', lineHeight: '1.75', color: MUTED, marginBottom: '20px' }
const h2Style: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#F5F1E8', margin: '36px 0 12px' }

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px' }}>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: '12px' }}>Legal</p>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, color: '#F5F1E8', margin: '0 0 12px' }}>Terms of Service</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED, marginBottom: '48px', opacity: 0.6 }}>Last updated: April 2025</p>

      <p style={prose}>By using the Harbourview website and marketplace, you agree to these terms. If you do not agree, please do not use our services.</p>

      <h2 style={h2Style}>Nature of Service</h2>
      <p style={prose}>Harbourview provides commercial intelligence, market-access advisory, and controlled introduction services for participants in regulated cannabis markets. We are not a broker, dealer, or exchange. We do not buy or sell cannabis products. We facilitate introductions between qualified counterparties following a screening process.</p>

      <h2 style={h2Style}>Marketplace Use</h2>
      <p style={prose}>Marketplace listings and wanted requests are submitted for Harbourview review. By submitting a listing or request, you confirm that the information provided is accurate and that you are authorised to represent the entity named. Harbourview reserves the right to approve, reject, or remove any listing without notice. Listings are not guarantees of product availability or commercial readiness.</p>
      <p style={prose}>Inquiries submitted through the marketplace are received by Harbourview. Counterparty contact details are only shared following Harbourview review and mutual consent. Harbourview does not guarantee that an introduction will result in a transaction.</p>

      <h2 style={h2Style}>Prohibited Conduct</h2>
      <p style={prose}>You may not submit false or misleading information, impersonate any person or entity, submit listings for products or services that are not legally authorised in the relevant jurisdiction, use the platform to circumvent Harbourview’s introduction process, or attempt to contact counterparties identified through our platform without Harbourview’s facilitation.</p>

      <h2 style={h2Style}>No Legal or Regulatory Advice</h2>
      <p style={prose}>Nothing on this platform constitutes legal, regulatory, financial, or investment advice. Harbourview is not a licensed legal advisor, financial advisor, or compliance consultant. You are responsible for ensuring your activities comply with all applicable laws and regulations.</p>

      <h2 style={h2Style}>Limitation of Liability</h2>
      <p style={prose}>To the maximum extent permitted by law, Harbourview’s liability for any claim arising from use of this platform is limited to the fees paid to Harbourview in the three months preceding the claim. Harbourview is not liable for indirect, consequential, or incidental damages.</p>

      <h2 style={h2Style}>Governing Law</h2>
      <p style={prose}>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. Disputes shall be resolved in the courts of Ontario.</p>

      <h2 style={h2Style}>Contact</h2>
      <p style={prose}>Questions about these terms: <a href="mailto:harbourviewcompany@gmail.com" style={{ color: GOLD }}>harbourviewcompany@gmail.com</a></p>
    </div>
  )
}
