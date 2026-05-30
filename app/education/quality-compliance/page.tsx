import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Quality & Compliance Education | Harbourview Education',
  description:
    'Non-promotional quality and compliance education covering GMP, GACP, GDP, CoA review and audit readiness for regulated cannabis operators.',
}

export default function QualityCompliancePage() {
  return (
    <PublicSurfacePage
      eyebrow="Quality and compliance education"
      title="Quality systems and compliance education for regulated cannabis operators."
      description="This route provides a public-safe orientation to the quality and compliance landscape for regulated cannabis — covering manufacturing, cultivation, distribution, documentation and audit readiness across the supply chain. It does not provide audit opinions, QP certification or jurisdiction-specific regulatory conclusions."
      boundary="This page is educational only. It does not provide audit opinion, QP certification, regulatory approval, batch release authority or jurisdiction-specific compliance conclusions."
      primaryAction={{ label: 'Request Quality Assessment', href: '/assessments' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Quality system map',
          title: 'The quality framework layers in a regulated cannabis supply chain',
          description: 'Regulated cannabis supply chains require overlapping quality certifications at each stage — from cultivation through manufacturing, distribution and dispensing.',
          items: [
            'GACP at the cultivation and primary processing stage — agricultural controls, input documentation, harvest records and traceability.',
            'GMP at the manufacturing and secondary processing stage — facility qualification, batch documentation, testing, release and CAPA.',
            'GDP at the distribution, import and wholesale stage — storage controls, chain of custody, temperature management and controlled-drug handling.',
            'Laboratory testing and CoA integrity across all stages — accreditation, method validation, result interpretation and documentation standards.',
            'Quality Management System integration — the documented procedures, training records, deviation management and audit trail that connects each stage.',
          ],
        },
        {
          eyebrow: 'Audit and inspection readiness',
          title: 'Preparing for regulatory inspection or supplier qualification audits',
          description: 'Both regulatory inspections and commercial qualification audits follow documented procedures. Understanding what auditors look for helps operators prepare evidence systematically.',
          items: [
            'Document control readiness — version-controlled SOPs, controlled copies, review schedules and training records.',
            'Facility and equipment qualification records — IQ, OQ, PQ evidence, calibration logs and preventive maintenance schedules.',
            'Batch record completeness — every manufacturing or processing step documented, every deviation recorded and every out-of-specification result investigated.',
            'CAPA record discipline — identified root causes, corrective actions implemented, effectiveness checks completed and records retained.',
            'Supplier qualification files — qualification audits, CoA review records, approved supplier lists and re-qualification schedules.',
          ],
        },
      ]}
      footerTitle="Quality assessments require controlled handling."
      footerDescription="Specific quality gap assessments, supplier qualification reviews and audit preparation support should be handled through Harbourview intake for confidential, qualified review."
    />
  )
}
