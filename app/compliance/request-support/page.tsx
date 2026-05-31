import type { Metadata } from 'next'
import { requestSupportDisclaimer } from '@/lib/compliance/disclaimers'
import { PublicHero, PublicSection } from '@/components/PublicUi'
import ComplianceRequestForm from './ComplianceRequestForm'

export const metadata: Metadata = {
  title: 'Request Compliance Support | Harbourview',
  description: 'Submit a structured compliance support request for regulated cannabis market entry, routing and documentation review.',
}

export default function ComplianceRequestSupportPage() {
  return (
    <>
      <PublicHero eyebrow="Compliance" title="Request Compliance Support" compact>
        <p>Submit a structured request so Harbourview can assess your compliance requirements and determine whether specialist routing is appropriate.</p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="mx-auto max-w-xl space-y-6">
          <ComplianceRequestForm />
          <p className="text-xs leading-7 text-white/40">{requestSupportDisclaimer}</p>
        </div>
      </PublicSection>
    </>
  )
}
