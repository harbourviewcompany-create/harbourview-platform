import type { Metadata } from 'next'
import IntelligenceModulePage from '../IntelligenceModulePage'

export const metadata: Metadata = {
  title: 'Counterparty Intelligence',
  description:
    'Public-safe framing for reviewed commercial party discovery, confidential routing and private evidence handling.',
}

export default function CounterpartyIntelligencePage() {
  return (
    <IntelligenceModulePage
      content={{
        eyebrow: 'Counterparty intelligence',
        title: 'Counterparty Intelligence',
        description:
          'Counterparty intelligence frames reviewed discovery, role fit, commercial seriousness and confidentiality controls without exposing private parties or evidence records.',
        requestLabel: 'Request Counterparty Review',
        reviewItems: [
          'Public pages can explain the review model for buyer, seller, exporter, importer, distributor, professional and institutional counterparties.',
          'Harbourview can route qualified requests toward private review without displaying private contact details, document materials or sensitive relationship context.',
          'Counterparty pages do not imply guaranteed buyers, guaranteed sellers, verified availability or automatic introductions.',
          'Sensitive counterparty questions should move through intake before any protected routing, disclosure or dealroom consideration.',
        ],
        boundaryItems: [
          'Private identities are not public directory content.',
          'Review records and evidence remain controlled.',
          'Introductions require fit and sensitivity review.',
        ],
      }}
    />
  )
}
