import type { Metadata } from 'next'
import PublicSurfacePage from '@/components/PublicSurfacePage'

export const metadata: Metadata = {
  title: 'Professional Briefings | Harbourview Education',
  description:
    'Controlled professional briefings for regulated cannabis operators, quality teams, compliance professionals and institutional stakeholders.',
}

export default function BriefingsPage() {
  return (
    <PublicSurfacePage
      eyebrow="Controlled professional briefings"
      title="Structured briefings for regulated cannabis professionals and institutions."
      description="Harbourview Professional Briefings are controlled education outputs prepared for specific professional contexts — quality teams, compliance reviews, institutional onboarding or market-access preparation. They are not public articles. Briefings are routed through review before distribution."
      boundary="Professional briefings are not public marketing material, medical advice, legal advice, regulatory guidance or accredited continuing education unless expressly stated. Each briefing carries its own scope and audience boundary."
      primaryAction={{ label: 'Request a Briefing', href: '/education/request' }}
      secondaryAction={{ label: 'Contact Harbourview', href: '/contact', variant: 'secondary' }}
      sections={[
        {
          eyebrow: 'Briefing categories',
          title: 'Types of professional briefing Harbourview can support',
          description: 'Briefing scope depends on the professional context, the audience and the review sensitivity of the topic. Higher-sensitivity topics require qualified review before distribution.',
          items: [
            'Quality system orientation briefings — GMP, GACP, GDP, CoA literacy and documentation standards for operator teams or new market entrants.',
            'Regulatory pathway briefings — public-safe country context, licensing model comparisons and market-access framework summaries for commercial and BD teams.',
            'Pharmacy and clinical channel briefings — product format education, dispensing channel context and professional-use framing for healthcare-adjacent audiences.',
            'Import and export readiness briefings — route-preparation context for teams approaching new markets, structured around the categories required for qualified review.',
            'Institutional and investor briefings — market maturity, quality standards, supply-chain structure and due diligence context for institutional audiences.',
          ],
        },
        {
          eyebrow: 'How briefings are handled',
          title: 'The review and distribution model for Harbourview briefings',
          description: 'Briefings are not automated. Requests are reviewed for scope, audience fit, sensitivity and appropriate handling before preparation or distribution.',
          items: [
            'Briefing requests are submitted through the education request route and reviewed before any material is prepared.',
            'Higher-sensitivity topics — clinical, medical, legal, regulatory or counterparty-specific — are handled privately and not published publicly.',
            'Approved briefings carry a scope statement, audience boundary, source basis and review date.',
            'Distribution of prepared briefings outside the intended audience requires a separate review request.',
          ],
        },
      ]}
      footerTitle="Briefings are prepared for reviewed use, not broadcast."
      footerDescription="Submit a briefing request through the education intake and Harbourview will confirm scope, audience fit and appropriate handling before preparation begins."
    />
  )
}
