import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Laboratory & Testing Education | Harbourview Education',
  description:
    'Non-promotional laboratory and testing education for quality professionals, procurement teams and regulated cannabis supply-chain participants.',
}

export default function TestingPage() {
  return (
    <PublicSurfacePage
      eyebrow="Laboratory and testing education"
      title="Cannabis testing and CoA literacy for regulated supply chains."
      description="This route provides a public-safe orientation to laboratory testing concepts, certificate of analysis interpretation and quality evidence evaluation for cannabis supply-chain professionals. It does not provide analytical method validation, accreditation advice or batch release authority."
      boundary="This page is educational only. It does not provide laboratory accreditation advice, batch release authority, analytical method validation, regulatory approval or jurisdiction-specific testing requirement conclusions."
      primaryAction={{ label: 'Request Documentation Review', href: '/assessments' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Testing fundamentals',
          title: 'Laboratory testing concepts relevant to regulated cannabis quality',
          description: 'Understanding what tests mean, how they are performed and what their limitations are is foundational to evaluating cannabis product quality evidence.',
          items: [
            'Potency testing — cannabinoid profiling methods, reporting conventions, THC and CBD quantification and result interpretation considerations.',
            'Contaminant testing — pesticide residue, heavy metal, mycotoxin, microbial and solvent residue analysis and applicable limits.',
            'Terpene profiling, moisture content, foreign matter, water activity and physical characteristic testing relevant to product quality.',
            'Method validation concepts including accuracy, precision, specificity, linearity and detection limit for cannabis matrices.',
            'Reference standards, certified reference materials and calibration requirements for quantitative analytical methods.',
            'Laboratory accreditation models — ISO 17025, pharmacopoeial methods and regulatory body approval differences across jurisdictions.',
          ],
        },
        {
          eyebrow: 'CoA literacy',
          title: 'What to look for when evaluating cannabis quality documentation',
          description: 'A certificate of analysis is the primary quality document in a cannabis supply chain. Evaluating one requires understanding both the result and the context around how it was produced.',
          items: [
            'Laboratory identity, accreditation scope and sample receipt documentation that establishes chain of custody.',
            'Test method identification, version, applicable limit references and harmonisation with import country requirements.',
            'Result format, units, detection limits, qualifying statements and how to interpret results near the limit of quantification.',
            'Batch identifier, sample size, collection date and whether the CoA covers the full batch or a subset sample.',
            'Specification pass/fail statement, QP release sign-off scope and the distinction between internal and external release authority.',
            'Shelf life, retest date, storage conditions and stability data that supports the CoA claims for the relevant product form.',
          ],
        },
      ]}
      footerTitle="Quality documentation review belongs in a controlled workflow."
      footerDescription="Specific CoA evaluation, laboratory qualification, testing package assessment and batch documentation review should be handled through Harbourview intake for confidential, qualified handling."
    />
  )
}
