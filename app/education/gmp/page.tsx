import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'GMP Education | Harbourview Education',
  description:
    'Non-promotional Good Manufacturing Practice education for cannabis operators, quality professionals, exporters and regulated supply-chain stakeholders.',
}

export default function GmpPage() {
  return (
    <PublicSurfacePage
      eyebrow="Quality systems education"
      title="Good Manufacturing Practice education for regulated cannabis supply chains."
      description="This route provides a public-safe orientation to GMP principles, documentation expectations and quality-system readiness for cannabis operators, exporters and professional supply-chain participants. It does not replace QP review, audits or jurisdiction-specific regulatory guidance."
      boundary="This page is educational only. It does not provide QP certification, audit opinion, batch release authority, regulatory approval, licensed manufacturing advice or jurisdiction-specific compliance conclusions."
      primaryAction={{ label: 'Request Quality Assessment', href: '/assessments' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'GMP foundations',
          title: 'Core principles that govern cannabis manufacturing quality',
          description: 'GMP establishes the minimum quality system requirements that licensed cannabis manufacturers must meet to produce consistent, safe and documented product.',
          items: [
            'Facility, equipment, personnel, hygiene and environmental controls that prevent contamination and cross-contamination.',
            'Standard Operating Procedures governing all manufacturing steps, cleaning, calibration, change control and deviation handling.',
            'Batch documentation, in-process testing, finished-product release and retained sample requirements.',
            'Qualification of premises, utilities, equipment and computerised systems used in the manufacturing process.',
            'Supplier qualification, raw material testing, packaging and labelling controls from intake through finished product.',
            'Recall readiness, complaint handling, adverse event awareness and CAPA documentation.',
          ],
        },
        {
          eyebrow: 'Documentation readiness',
          title: 'Evidence categories operators should organize before quality review',
          description: 'These categories help teams prepare for supplier qualification, export documentation review or regulatory inspection without treating this list as a jurisdiction-specific requirement.',
          items: [
            'Site Master File or equivalent facility documentation covering manufacturing scope, licence basis and key personnel.',
            'Quality Manual, SOP library, batch record templates and change-control register status.',
            'Equipment qualification, calibration and preventive maintenance records for critical manufacturing steps.',
            'Certificate of Analysis format, testing method validation status, reference standard handling and laboratory qualification.',
            'Deviation, OOS and CAPA log with resolution timelines and QP sign-off records where applicable.',
            'Finished product specification, stability data status and product dossier completeness for export routes under review.',
          ],
        },
      ]}
      footerTitle="Quality evidence belongs in reviewed handling."
      footerDescription="GMP documentation for specific shipments, supplier assessments or export routes should be handled through Harbourview intake rather than public self-assessment."
    />
  )
}
