import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Pharmacy Education | Harbourview Education',
  description:
    'Non-promotional pharmacy education for dispensing professionals, pharmacy teams and regulated cannabis channel participants.',
}

export default function PharmacyPage() {
  return (
    <PublicSurfacePage
      eyebrow="Pharmacy channel education"
      title="Pharmacy dispensing education for regulated cannabis supply chains."
      description="This route provides a public-safe orientation to pharmacy channel concepts, dispensing controls and professional handling requirements for pharmacists, pharmacy teams and supply-chain participants operating in regulated medical cannabis markets. It does not provide patient-specific advice, prescribing guidance or jurisdiction-specific regulatory conclusions."
      boundary="This page is educational only. It does not provide medical advice, prescribing instructions, patient-specific guidance, dispensing authorisation, regulatory approval or jurisdiction-specific pharmacy compliance conclusions."
      primaryAction={{ label: 'Request Pharmacy Channel Review', href: '/contact' }}
      secondaryAction={{ label: 'Explore Clinical Education', href: '/network/clinical-education', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Pharmacy channel concepts',
          title: 'Dispensing and controlled-handling topics relevant to regulated cannabis',
          description: 'Medical cannabis dispensing sits inside existing pharmacy regulatory frameworks in most jurisdictions, with additional controlled-drug and product-specific requirements.',
          items: [
            'Prescription requirements, authorisation models and prescriber eligibility rules that vary across medical cannabis markets.',
            'Product form, packaging, labelling, storage temperature and controlled-drug handling requirements at the pharmacy level.',
            'Patient counselling principles, product format education and professional boundaries around dosing or treatment direction.',
            'Record-keeping, controlled drug balance reconciliation, dispensing log requirements and audit readiness.',
            'Supply continuity, product substitution constraints, out-of-stock handling and importer communication expectations.',
            'Adverse event awareness, complaint escalation and professional reporting obligations for pharmacy professionals.',
          ],
        },
        {
          eyebrow: 'Supply chain context',
          title: 'Pharmacy-level considerations for importers and distributors',
          description: 'Supply chain participants supporting pharmacy channels need to understand downstream requirements to structure compliant product, packaging and documentation.',
          items: [
            'Pharmacy-ready packaging and labelling requirements including child-resistant packaging, product identification and storage instructions.',
            'Product dossier completeness for pharmacy channel admission, including CoA format, specification documentation and stability data.',
            'Narcotics permit, import authorisation and controlled drug balance requirements at the pharmacy receiving end.',
            'Wholesaler-to-pharmacy GDP controls, temperature management, cold chain documentation and dispatch records.',
            'Country-specific pharmacy authorisation requirements for handling and dispensing imported medical cannabis products.',
          ],
        },
      ]}
      footerTitle="Pharmacy channel access requires qualified review."
      footerDescription="Pharmacy admission, product documentation, supply continuity matters and controlled-drug handling questions should be handled through Harbourview intake for confidential review."
    />
  )
}
