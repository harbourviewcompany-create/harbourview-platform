import Link from 'next/link'
import type { Metadata } from 'next'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Professionals | Harbourview',
  description: 'Professional network entry points for clinical, legal, regulatory, commercial, scientific and institutional stakeholders.',
  openGraph: {
    title: 'Harbourview Professionals',
    description: 'Controlled intelligence, reviewed introductions and compliance support for regulated cannabis professionals, institutions and investors.',
  },
}

const roles = [
  ['Doctors & Clinicians', '/network/clinical-education'],
  ['Pharmacists', '/education'],
  ['Lawyers & Compliance Advisors', '/compliance'],
  ['QA & GMP Professionals', '/compliance'],
  ['Researchers', '/intelligence'],
  ['Policymakers & Regulators', '/institutional-partnerships'],
  ['Educators', '/education'],
  ['Advocates', '/signals'],
  ['Investors & Acquirers', '/opportunities'],
  ['Consultants', '/contact'],
  ['Associations & Institutions', '/institutional-partnerships'],
  ['Labs & Testing & Logistics', '/marketplace'],
  ['Universities', '/institutional-partnerships'],
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
            <p className="mt-4 text-sm leading-7 text-white/62">Harbourview professional resources are non-promotional. No medical advice, legal advice, investment recommendations or prescribing guidance is provided.</p>
          </PublicCard>
        }
      >
        Harbourview connects regulated-market professionals across all roles — clinical, legal, regulatory, commercial, scientific and institutional.
      </PublicHero>

      <PublicSection id="professional-role-grid" tone="navy">
        <SectionHeader eyebrow="Role grid" title="Professional pathways for regulated-market stakeholders.">
          Each path is public-safe by default and routes either to non-promotional resources or a reviewed inquiry path where professional, institutional or commercial context requires discretion.
        </SectionHeader>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map(([title, href]) => (
            <Link key={title} href={href} className="group rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-200 hover:border-gold/30 hover:bg-[#0b1626] sm:p-7">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/70">Professional path</p>
              <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-80 transition-opacity group-hover:opacity-100" />
              <h3 className="text-xl font-semibold text-[#f5f1e8]">{title}</h3>
              <p className="mt-6 text-sm font-semibold text-gold/80 transition-colors group-hover:text-gold-light">Open path <span aria-hidden="true">→</span></p>
            </Link>
          ))}
        </div>
      </PublicSection>

      <FooterCta eyebrow="Reviewed professional routing" title="Route the professional conversation through the right Harbourview pathway." actions={[{ label: 'Request Introduction', href: '/intake' }, { label: 'Join Network', href: '/contact', variant: 'secondary' }]}>Use intake for sensitive introductions, role-fit review, institutional collaboration or commercial context. Use contact for general professional-network participation.</FooterCta>
    </main>
  )
}
