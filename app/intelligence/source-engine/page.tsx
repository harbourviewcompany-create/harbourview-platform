import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Source Engine | Harbourview Intelligence',
  description:
    'Public-safe explanation of Harbourview source-engine request workflow, watchlist intake and intelligence review boundaries.',
}

export default function SourceEnginePage() {
  return (
    <PublicSurfacePage
      eyebrow="HAR-39 intelligence surface"
      title="Source-engine requests without exposing private evidence."
      description="Harbourview can receive market, company, policy, counterparty and route questions through a controlled public workflow while keeping raw evidence, analyst notes, private sources and sensitive counterparties out of public pages."
      boundary="This route explains request handling only. It does not publish raw source URLs, sourceEvidence, provenanceSummary, internal review notes, analyst conclusions, private contacts or live counterparty intelligence."
      primaryAction={{ label: 'Request Intelligence Review', href: '/contact' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Request workflow',
          title: 'How public requests enter review',
          description: 'The public page routes requests into a review queue without creating automated claims or publishing sensitive material.',
          items: [
            'Country, licensing, policy, company, category and route questions can be submitted for review before any private brief is prepared.',
            'Sensitive commercial context should move through confidential intake rather than public comments, public listings or open source pages.',
            'Requests can identify the market, role, product category, evidence need and decision deadline without exposing private documents publicly.',
            'Harbourview can decide whether a request belongs in public education, private intelligence, reviewed introduction, marketplace routing or no-action handling.',
          ],
        },
        {
          eyebrow: 'Watchlist structure',
          title: 'Watchlists stay controlled before publication',
          description: 'Watchlist concepts are exposed publicly, but operational watch records and sensitive evidence stay private.',
          items: [
            'Jurisdiction watch: policy movement, licensing model changes, import/export signals and market access changes.',
            'Counterparty watch: role fit, public claims, operating posture and review triggers without publishing private identities or dossiers.',
            'Category watch: supply, demand, equipment, services, distressed assets, quality claims and timing signals.',
            'Route watch: logistics, importer, distributor, QP, pharmacy, lab and documentation questions requiring qualified review.',
          ],
        },
        {
          eyebrow: 'Safety and leakage controls',
          title: 'What the public source engine must not expose',
          description: 'HAR-39 requires the public surface to explain the engine without leaking the engine.',
          items: [
            'No raw evidence records, unpublished analyst notes, source captures, source URLs or provenance summaries are published here.',
            'No page confirms live buyer demand, seller availability, legal eligibility, shipment clearance, licence validity or counterparty quality.',
            'No automated recommendation or legal, medical, investment, regulatory or compliance conclusion is produced by the public route.',
            'Private brief preparation, protected dealroom access and counterparty routing require separate reviewed handling.',
          ],
        },
      ]}
      footerTitle="Need a reviewed intelligence workflow?"
      footerDescription="Use public contact for general intelligence requests and confidential intake when the request includes private documents, sensitive counterparties, route strategy or non-public commercial context."
    />
  )
}
