import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'GDP Education | Harbourview Education',
  description:
    'Non-promotional Good Distribution Practice education for cannabis importers, distributors, logistics providers and regulated supply-chain stakeholders.',
}

export default function GdpPage() {
  return (
    <PublicSurfacePage
      eyebrow="Distribution quality education"
      title="Good Distribution Practice for regulated cannabis logistics and supply chains."
      description="This route provides a public-safe orientation to GDP principles, controlled storage requirements and distribution documentation expectations for cannabis importers, distributors and logistics professionals. It does not replace regulatory guidance, competent authority authorisation or qualified person review."
      boundary="This page is educational only. It does not provide import authorisation, distribution licence advice, controlled drug clearance, QP certification or jurisdiction-specific GDP compliance conclusions."
      primaryAction={{ label: 'Request Distribution Assessment', href: '/assessments' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'GDP foundations',
          title: 'Distribution controls that protect product integrity in regulated supply chains',
          description: 'GDP establishes the quality requirements that wholesalers, importers, distributors and logistics providers must maintain for medicinal cannabis and controlled product categories.',
          items: [
            'Authorised premises, qualified person responsibilities, personnel training and documented quality management systems.',
            'Temperature-controlled storage, cold chain management, environmental monitoring and alarm systems for applicable product categories.',
            'Receipt, quarantine, release, pick and dispatch controls with segregation of approved, rejected and returned stock.',
            'Transportation requirements covering vehicle qualification, temperature excursion management and chain-of-custody documentation.',
            'Controlled drug handling requirements, narcotics permit conditions, balance reconciliation and destruction or return procedures.',
            'Supplier and customer qualification, third-party logistics oversight, complaint handling and recall coordination.',
          ],
        },
        {
          eyebrow: 'Import and logistics readiness',
          title: 'Documentation categories distributors should organize before route review',
          description: 'International distribution of regulated cannabis requires layered documentation covering the product, the route, the parties and the applicable controlled-drug framework.',
          items: [
            'Wholesale distribution authorisation, import permit, narcotics licence and competent authority approvals for the receiving country.',
            'Qualified person identity, contact details and documented scope of authority for release and distribution decisions.',
            'GDP audit certificate, third-party logistics qualification records and temperature mapping for storage and transit.',
            'Product-specific import documentation including CoA, origin certificate, phytosanitary documentation and narcotics import order.',
            'Chain of custody records from exporting facility through border clearance to receiving site with batch reconciliation.',
            'Deviation, damage, excursion and complaint records covering the relevant distribution window.',
          ],
        },
      ]}
      footerTitle="Distribution documentation requires route-specific review."
      footerDescription="Import permits, logistics qualification, chain-of-custody packages and controlled-drug distribution matters should be handled through Harbourview intake for confidential, controlled handling."
    />
  )
}
