import Link from 'next/link'
import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Professionals | Harbourview',
  description: 'Professional network entry points for clinicians, pharmacists, lawyers, compliance advisors, quality professionals, researchers, policymakers, educators, advocates, investors, consultants, associations, labs, logistics providers and universities.',
}

const roles = [
  ['Doctors & Clinicians', 'Non-promotional orientation for clinical stakeholders seeking professional education, market context and reviewed collaboration pathways.', '/education'],
  ['Pharmacists', 'Education and routing context for dispensing models, controlled handling, product-format literacy and pharmacy-channel readiness.', '/education'],
  ['Lawyers & Compliance Advisors', 'Market, policy, standards and assessment pathways for advisors supporting regulated-market access and client readiness.', '/policy-standards'],
  ['QA & GMP Professionals', 'Quality-system, documentation, audit-readiness, batch-evidence and supply-chain education for regulated pathways.', '/education'],
  ['Researchers', 'Institutional collaboration entry points for research groups, evidence review, public-literacy work and source-grounded inquiry.', '/institutional-partnerships'],
  ['Policymakers & Regulators', 'Neutral public resources on access models, safeguards, source methodology, policy comparisons and standards development.', '/policy-standards'],
  ['Educators', 'Education partnership routes for curriculum, professional literacy, standards explainers and institutional resource development.', '/institutional-partnerships'],
  ['Advocates', 'Public-literacy and responsible-access pathways for advocates engaging with policy, access and market-conduct topics.', '/education'],
  ['Investors & Acquirers', 'Due-diligence orientation for market exposure, distressed assets, business opportunities and protected opportunity review.', '/marketplace/business-opportunities'],
  ['Consultants', 'Role-fit routing for specialists supporting market entry, operations, quality, documentation, logistics and commercial readiness.', '/reviewed-connections'],
  ['Associations & Institutions', 'Structured entry points for professional bodies, standards groups, associations and institutional collaboration partners.', '/institutional-partnerships'],
  ['Labs & Testing & Logistics', 'Professional pathways for testing, chain-of-custody, logistics, stability, CoA, transport and operational service stakeholders.', '/marketplace/services'],
  ['Universities', 'Research, education, source-review and public-knowledge collaboration paths for academic departments and university teams.', '/institutional-partnerships'],
] as const

const boundaries = [
  'No medical advice or prescribing guidance is provided.',
  'No legal, regulatory or compliance advice is provided.',
  'No investment recommendations are provided.',
  'Sensitive professional, institutional and commercial details route through reviewed private workflows.',
] as const

export default function ProfessionalsPage() {
  return (
    <main className="bg-[#01050d] text-white">
      <PublicHero
        eyebrow="Professional Network"
        title="Professionals"
        actions={[{ label: 'Request Introduction', href: '/intake' }, { label: 'Join Network', href: '/contact', variant: 'secondary' }]}
        aside={
          <PublicCard muted className="p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/72">Trust boundary</p>
            <h2 className="mt-4 font-serif text-2xl leading-tight tracking-[-0.03em] text-[#f5f1e8]">Non-promotional professional resources.</h2>
            <div className="mt-6 grid gap-3">
              {boundaries.map((item) => <div key={item} className="rounded-sm border border-gold/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white/62">{item}</div>)}
            </div>
          </PublicCard>
        }
      >
        Harbourview connects regulated-market professionals across clinical, pharmacy, legal, compliance, quality, research, policy, education, advocacy, investment, association, laboratory, logistics and university pathways.
      </PublicHero>

      <PublicSection id="professional-role-grid" tone="navy">
        <SectionHeader eyebrow="Role grid" title="Professional pathways for regulated-market stakeholders.">
          Each path is public-safe by default and routes either to non-promotional resources or a reviewed inquiry path where professional, institutional or commercial context requires discretion.
        </SectionHeader>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map(([title, description, href]) => (
            <Link key={title} href={href} className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626] sm:p-7">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/70">Professional path</p>
              <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
              <h3 className="text-xl font-semibold text-[#f5f1e8]">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/58">{description}</p>
              <p className="mt-6 text-sm font-semibold text-gold/80 transition-colors group-hover:text-gold-light">Open path <span aria-hidden="true">→</span></p>
            </Link>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader eyebrow="Professional access model" title="Public orientation first; reviewed routing when context becomes sensitive." className="mb-0">
            Harbourview does not operate as an open-contact directory. Professional resources explain role paths and capture qualified intent while protecting counterparties, institutions, route details and sensitive commercial material.
          </SectionHeader>
          <div className="grid gap-4">
            {boundaries.map((item) => <PublicCard key={item} className="p-5"><p className="text-sm leading-7 text-white/62">{item}</p></PublicCard>)}
          </div>
        </div>
      </PublicSection>

      <FooterCta eyebrow="Reviewed professional routing" title="Route the professional conversation through the right Harbourview pathway." actions={[{ label: 'Request Introduction', href: '/intake' }, { label: 'Join Network', href: '/contact', variant: 'secondary' }]}>Use intake for sensitive introductions, role-fit review, institutional collaboration or commercial context. Use contact for general professional-network participation.</FooterCta>
    </main>
  )
}
