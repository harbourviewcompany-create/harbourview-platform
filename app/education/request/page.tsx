import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Education Request | Harbourview Education',
  description:
    'Submit an education request to Harbourview for professional briefings, topic reviews, institutional collaborations or controlled-topic handling.',
}

export default function EducationRequestPage() {
  return (
    <PublicSurfacePage
      eyebrow="Education request intake"
      title="Request professional education support, briefings or topic review."
      description="Use this route to submit a professional education request to Harbourview. Requests are reviewed for scope, audience fit, sensitivity and appropriate handling before any material is prepared or distributed."
      boundary="Education requests are reviewed before Harbourview responds. Submitting a request does not guarantee a response, create an education agreement or represent Harbourview's acceptance of the topic as appropriate for public education."
      primaryAction={{ label: 'Contact Harbourview', href: '/contact' }}
      secondaryAction={{ label: 'Speak Confidentially', href: '/intake', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'What you can request',
          title: 'Types of education request Harbourview accepts',
          description: 'Education requests should be specific about the professional context, intended audience and the purpose for which the education will be used.',
          items: [
            'Professional briefings on GMP, GACP, GDP, CoA literacy, quality standards or supply-chain documentation for operator or commercial teams.',
            'Regulatory and policy orientation for new market entrants, commercial teams or institutional participants approaching regulated cannabis markets.',
            'Pharmacy, clinical or dispensing channel education for professional audiences with appropriate scope and non-promotional framing.',
            'Import and export readiness support — structured preparation material to help teams organise evidence before qualified commercial or regulatory review.',
            'Institutional and research collaboration requests for associations, universities, professional bodies or policy organisations.',
            'Topic review requests for content where Harbourview needs to assess sensitivity, scope and appropriate handling before any response.',
          ],
        },
        {
          eyebrow: 'How requests are handled',
          title: 'What happens after you submit an education request',
          description: 'Harbourview reviews each request before responding. The response may confirm that the request can be handled through education, route it to a private intake, or decline if the topic falls outside what public or professional education can safely address.',
          items: [
            'Requests are reviewed for topic scope, professional audience fit, applicable sensitivity controls and appropriate distribution.',
            'Harbourview will confirm whether the request can be handled, how it will be scoped and whether additional information is needed.',
            'Higher-sensitivity topics — clinical, legal, counterparty-specific or transaction-specific — are routed to private intake rather than public education.',
            'Prepared education materials carry a scope statement, audience boundary, source basis and review date before distribution.',
          ],
        },
      ]}
      footerTitle="Education requests are reviewed before preparation begins."
      footerDescription="Use the contact route to describe the professional context, audience and purpose of your education request. Harbourview will confirm scope and handling before any material is prepared."
    />
  )
}
