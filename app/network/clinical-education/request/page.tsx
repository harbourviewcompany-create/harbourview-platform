import type { Metadata } from 'next'
import { ClinicalEducationDisclaimer } from '@/components/clinical-education/ClinicalEducationComponents'
import { PublicHero, PublicSection } from '@/components/PublicUi'
import ClinicalEducationRequestForm from './ClinicalEducationRequestForm'

export const metadata: Metadata = {
  title: 'Request Education Support | Harbourview Clinical Education',
  description: 'Submit a professional education request for product formats, country readiness, documentation or professional education support.',
}

export default function ClinicalEducationRequestPage() {
  return (
    <>
      <PublicHero
        eyebrow="Clinical Education / Request"
        title="Request Education Support"
        compact
      >
        <p>
          Submit a professional education request related to product formats, country readiness,
          documentation or professional education support.
        </p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-2xl space-y-8">
          <ClinicalEducationRequestForm />
          <ClinicalEducationDisclaimer type="patient-boundary" />
        </div>
      </PublicSection>
    </>
  )
}
