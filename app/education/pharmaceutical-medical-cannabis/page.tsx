import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Pharmaceutical & Medical Cannabis | Harbourview Education',
  description:
    'Non-promotional pharmaceutical and medical cannabis education for professional and institutional audiences.',
}

export default function PharmaceuticalMedicalCannabisPage() {
  return (
    <PublicSurfacePage
      eyebrow="HAR-40 medical knowledge spine"
      title="Pharmaceutical and medical cannabis education for professional context."
      description="This route frames medical cannabis through quality, documentation, patient-safety, pharmacy-channel and professional education concepts without offering treatment recommendations or promotional product claims."
      boundary="This page is informational and non-promotional. It does not provide medical advice, prescribing instructions, dosage guidance, treatment recommendations, patient-specific guidance or accredited continuing education unless separately stated."
      primaryAction={{ label: 'Request Education Partnership', href: '/institutional-partnerships' }}
      secondaryAction={{ label: 'Contact Harbourview', href: '/contact', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Professional context',
          title: 'Education areas that can be developed safely',
          description: 'The public route identifies knowledge areas without making product-specific clinical claims.',
          items: [
            'Pharmacy-channel context, dispensing workflow concepts, patient-safety controls and professional handling considerations.',
            'Quality-system concepts including GMP, GACP, GDP, CoA review, batch documentation and product-format discipline.',
            'Non-promotional clinical-literacy topics that separate evidence review, patient care and commercial positioning.',
            'Institutional education partnerships for associations, universities, pharmacies, labs, professional groups and standards bodies.',
          ],
        },
        {
          eyebrow: 'Claim discipline',
          title: 'What the page deliberately avoids',
          description: 'HAR-40 public surfaces must be useful without becoming medical advice or promotional material.',
          items: [
            'No condition-specific treatment instructions, dosing advice or patient-specific recommendations.',
            'No claims that a product is safe, effective, approved, reimbursed, substitutable or clinically preferred.',
            'No implication of accredited continuing education unless a formal accredited program exists and is documented.',
            'No substitution for physicians, pharmacists, regulators, QPs or qualified professional review.',
          ],
        },
      ]}
      footerTitle="Build professional education without overclaiming."
      footerDescription="Harbourview can route institutional education, association collaboration and professional-resource requests through controlled review before publication."
    />
  )
}
