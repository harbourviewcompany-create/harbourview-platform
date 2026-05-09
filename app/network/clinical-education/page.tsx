import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  clinicalEducationCountryReadiness,
  clinicalEducationModules,
  type ClinicalEducationModule,
} from '@/lib/fixtures/clinical-education'

export const metadata: Metadata = {
  title: 'Clinical Education | Harbourview Network',
  description:
    'Controlled professional education themes for regulated cannabis markets, product documentation literacy and market-readiness support.',
}

const requestHref = '/network/clinical-education/request'
const contactHref = '/contact'

const frameworkCards = [
  {
    title: 'Foundational Topic',
    copy:
      'General professional education suitable for broad regulated-market orientation. These topics explain terminology, documentation concepts and product categories without clinical instruction.',
  },
  {
    title: 'Professional Use',
    copy:
      'Topics intended for licensed operators, distributors, clinics, educators or market-access teams that require a working understanding of regulated cannabis products, documentation and commercial readiness.',
  },
  {
    title: 'Controlled Topic',
    copy:
      'Higher-sensitivity material where interpretation may depend on jurisdiction, product category, clinical context or applicable professional standards. These topics require review before external use.',
  },
  {
    title: 'In Development',
    copy:
      'Topics being structured, reviewed or prepared for controlled publication. Harbourview may assess these areas on request before publishing broader material.',
  },
]

const stakeholders = [
  'Licensed operators',
  'Distribution and import/export teams',
  'Clinics and professional educators',
  'Market-access and commercial teams',
  'Compliance and documentation reviewers',
]

const moduleGroups = [
  {
    title: 'Product & Format Literacy',
    intro:
      'Professional orientation around cannabis product formats, route terminology and controlled-use language.',
    moduleIds: ['dosage-forms'],
  },
  {
    title: 'Documentation & Quality Records',
    intro:
      'Education support for product documentation literacy, procurement readiness and internal review workflows.',
    moduleIds: ['product-documentation'],
  },
  {
    title: 'Controlled Topics Under Review',
    intro:
      'Higher-sensitivity subjects that may require private briefing, professional review or jurisdiction-specific assessment before external use.',
    moduleIds: ['formulas-ratios', 'onset-duration', 'effects-monitoring'],
  },
]

const supportTracks = [
  'Education theme structuring',
  'Documentation literacy briefings',
  'Professional-use language review',
  'Market-readiness education support',
]

function getPublicationLabel(status: ClinicalEducationModule['moduleStatus']) {
  switch (status) {
    case 'Live':
      return 'Published Overview'
    case 'Research in progress':
    case 'Future module':
      return 'In Development'
    case 'Professional review required':
      return 'Professional Review Required'
    case 'Available by request':
    case 'Admin-only':
    default:
      return 'Review Required'
  }
}

function getSensitivityLabel(riskLevel: ClinicalEducationModule['riskLevel']) {
  switch (riskLevel) {
    case 'low':
      return 'Foundational Topic'
    case 'medium':
      return 'Professional Use'
    case 'high':
    default:
      return 'Controlled Topic'
  }
}

function getModuleDescription(item: ClinicalEducationModule) {
  switch (item.id) {
    case 'dosage-forms':
      return 'An overview of cannabis product formats, administration-route terminology and professional considerations for regulated access environments. This topic is designed for orientation and documentation literacy, not patient-specific dosing or treatment guidance.'
    case 'product-documentation':
      return 'Professional education on certificates of analysis, potency references, batch documentation, testing records, storage conditions and product documentation standards. Designed to support procurement readiness, internal education and regulated-market review workflows.'
    case 'formulas-ratios':
      return 'A controlled topic area covering terminology and professional considerations around product ratios and formula references. This area is not intended to provide clinical direction, treatment advice or patient-specific recommendations.'
    case 'onset-duration':
      return 'A controlled topic area covering professional terminology around format timing, documentation context and review sensitivity. Public use may require qualified review because interpretation can depend on jurisdiction, product category and professional setting.'
    case 'effects-monitoring':
      return 'A controlled topic area covering professional-use terminology for reported effects, adverse-event awareness and documentation context. Public content is limited because external use may require clinical, regulatory or compliance review.'
    default:
      return item.publicSummary
  }
}

function getModuleTitle(item: ClinicalEducationModule) {
  if (item.id === 'effects-monitoring') return 'Reported Effects & Monitoring Context'
  return item.title
}

function getModuleAction(item: ClinicalEducationModule) {
  if (item.moduleStatus === 'Live') {
    return { label: 'View Overview', href: item.route }
  }

  if (item.moduleStatus === 'Professional review required') {
    return { label: 'Request Reviewed Briefing', href: requestHref }
  }

  if (item.moduleStatus === 'Research in progress' || item.moduleStatus === 'Future module') {
    return { label: 'Request Assessment', href: requestHref }
  }

  if (item.riskLevel === 'high') {
    return { label: 'Request Topic Review', href: requestHref }
  }

  return { label: 'Request Briefing', href: requestHref }
}

function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'gold' | 'neutral' | 'dark' }) {
  const toneClass =
    tone === 'gold'
      ? 'border-gold/40 bg-gold/10 text-gold'
      : tone === 'dark'
        ? 'border-white/10 bg-white/10 text-white/70'
        : 'border-navy/10 bg-navy/5 text-navy/70'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClass}`}>
      {label}
    </span>
  )
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{children}</p>
}

function ModuleCard({ item }: { item: ClinicalEducationModule }) {
  const action = getModuleAction(item)

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-navy/10 bg-[#fffdf8] p-6 shadow-[0_18px_45px_rgba(11,26,47,0.07)] transition duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_22px_60px_rgba(11,26,47,0.12)]">
      <div className="flex flex-wrap gap-2">
        <Badge label={getPublicationLabel(item.moduleStatus)} />
        <Badge label={getSensitivityLabel(item.riskLevel)} tone={item.riskLevel === 'high' ? 'gold' : 'neutral'} />
      </div>
      <h3 className="mt-5 text-xl font-semibold leading-tight text-navy">{getModuleTitle(item)}</h3>
      <p className="mt-4 flex-1 text-sm leading-7 text-gray-600">{getModuleDescription(item)}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.educationThemes.slice(0, 4).map((theme) => (
          <span key={theme} className="rounded-full border border-navy/10 bg-white px-3 py-1 text-xs text-navy/60">
            {theme}
          </span>
        ))}
      </div>
      <Link
        href={action.href}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-gold/60 px-5 py-2 text-sm font-semibold text-navy transition hover:bg-gold hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {action.label}
      </Link>
    </article>
  )
}

export default function ClinicalEducationHub() {
  const items = clinicalEducationModules.filter((item) => item.slug !== 'clinical-education')
  const modulesById = new Map(items.map((item) => [item.id, item]))

  return (
    <main className="bg-[#f5f1e8] text-navy">
      <section className="relative overflow-hidden bg-[#071326] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(198,165,90,0.20),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%)]" />
        <div className="page-container relative grid min-h-[620px] grid-cols-1 gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-24">
          <div>
            <SectionEyebrow>Harbourview Network / Clinical Education</SectionEyebrow>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge label="Controlled Education Library" tone="dark" />
              <Badge label="Professional Use" tone="dark" />
              <Badge label="Non-Prescriptive" tone="gold" />
            </div>
            <h1 className="mt-8 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              Clinical education themes for regulated cannabis markets.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/70 sm:text-lg">
              Harbourview Clinical Education organizes professional education topics, product documentation themes and market-readiness considerations for regulated cannabis stakeholders. The library is designed for commercial, clinical and access teams that need structured, non-promotional education support without crossing into medical, prescribing or promotional claims.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={requestHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-[0_12px_30px_rgba(198,165,90,0.20)] transition hover:bg-[#d6b76d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Request Education Support
              </Link>
              <Link
                href={requestHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/70 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Request Topic Review
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Library posture</p>
            <div className="mt-6 space-y-5">
              {[
                'Professional and commercial stakeholder education only.',
                'Publication status is kept separate from topic sensitivity.',
                'Controlled topics may be handled privately or held for qualified review.',
              ].map((item) => (
                <div key={item} className="border-l border-gold/40 pl-4 text-sm leading-7 text-white/70">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-gold/25 bg-gold/10 p-5 text-sm leading-7 text-white/70">
              Compliance-aware, non-prescriptive and review-ready education support for regulated cannabis markets.
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-gold/20 bg-[#0b1a2f] py-8 text-white">
        <div className="page-container grid grid-cols-1 gap-5 text-sm leading-7 text-white/70 lg:grid-cols-3">
          <p>
            Education materials are not jurisdiction-specific unless expressly stated. Local medical, legal, regulatory and promotional rules may apply.
          </p>
          <p>
            Materials should not be used as promotional, patient-facing, sales or clinical materials without appropriate review.
          </p>
          <p>
            Some controlled topics may be handled as private briefings rather than public modules.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
            <div>
              <SectionEyebrow>Controlled education framework</SectionEyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-4xl">A publication and sensitivity model for professional education.</h2>
              <p className="mt-5 text-sm leading-7 text-gray-600">
                Harbourview classifies education topics by publication status, professional-use context and review sensitivity. This keeps foundational education separate from material that may require clinical, regulatory, legal or market-specific review before use.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {frameworkCards.map((card) => (
                <article key={card.title} className="rounded-2xl border border-navy/10 bg-[#fffdf8] p-6 shadow-[0_16px_40px_rgba(11,26,47,0.06)]">
                  <h3 className="text-lg font-semibold text-navy">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{card.copy}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-gold/30 bg-[#10223b] p-6 text-white shadow-[0_20px_60px_rgba(11,26,47,0.14)] sm:p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
              <p className="text-base leading-8 text-white/70">
                Education topics are organized through a controlled review process before public use. Higher-sensitivity topics may remain unpublished, limited to briefing format or routed to qualified professional review where jurisdiction, clinical context or promotional rules apply.
              </p>
              <Link
                href={requestHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/70 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Request Topic Review
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf0] py-16 sm:py-20">
        <div className="page-container">
          <div className="max-w-3xl">
            <SectionEyebrow>Module library</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-4xl">Structured education modules with public-safe controls.</h2>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              Each module separates publication status from sensitivity level. Public labels are written for professional readers without exposing internal control language or implying complete open access where review is required.
            </p>
          </div>

          <div className="mt-10 space-y-10">
            {moduleGroups.map((group) => (
              <section key={group.title} className="rounded-3xl border border-navy/10 bg-white/70 p-5 shadow-[0_18px_55px_rgba(11,26,47,0.06)] sm:p-7">
                <div className="mb-6 border-b border-gold/25 pb-5">
                  <h3 className="text-2xl font-semibold text-navy">{group.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">{group.intro}</p>
                </div>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {group.moduleIds.map((id) => {
                    const item = modulesById.get(id)
                    if (!item) return null
                    return <ModuleCard key={item.id} item={item} />
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="page-container grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch">
          <div className="rounded-3xl border border-navy/10 bg-[#fffdf8] p-7 shadow-[0_18px_55px_rgba(11,26,47,0.06)] sm:p-8">
            <SectionEyebrow>Designed for regulated-market stakeholders</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-navy">Professional and commercial use context.</h2>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              The library is structured for professional stakeholders who need controlled education support around product formats, documentation, market readiness and professional-use considerations.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {stakeholders.map((stakeholder) => (
                <div key={stakeholder} className="rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm font-semibold text-navy/80">
                  {stakeholder}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gold/30 bg-[#0b1a2f] p-7 text-white shadow-[0_18px_55px_rgba(11,26,47,0.16)] sm:p-8">
            <SectionEyebrow>Why Harbourview organizes this</SectionEyebrow>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Education quality affects market readiness. Product formats, documentation standards and professional-use language influence how regulated stakeholders evaluate opportunities, prepare internal teams and avoid unsupported claims.
            </p>
            <div className="mt-7 grid grid-cols-1 gap-3">
              {supportTracks.map((track) => (
                <div key={track} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/70">
                  {track}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf0] py-16 sm:py-20">
        <div className="page-container">
          <div className="rounded-3xl border border-navy/10 bg-[#fffdf8] p-6 shadow-[0_18px_55px_rgba(11,26,47,0.06)] sm:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
              <div>
                <SectionEyebrow>Market-readiness context</SectionEyebrow>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-navy">Country education readiness is treated as review-sensitive.</h2>
                <p className="mt-5 text-sm leading-7 text-gray-600">
                  Country references are handled as education-readiness context, not legal conclusions. Jurisdiction-specific use should be reviewed before distribution or reliance.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {clinicalEducationCountryReadiness.map((country) => (
                  <article key={country.country} className="rounded-2xl border border-navy/10 bg-white p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-navy">{country.country}</h3>
                      <Badge label={country.briefAvailability} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-gray-600">{country.knownTrainingGap}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-navy/10 bg-navy/5 px-3 py-1 text-xs text-navy/60">{country.region}</span>
                      <span className="rounded-full border border-navy/10 bg-navy/5 px-3 py-1 text-xs text-navy/60">{country.professionalEducationReadiness}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="page-container grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-gold/30 bg-[#10223b] p-7 text-white shadow-[0_18px_55px_rgba(11,26,47,0.16)] sm:p-8">
            <SectionEyebrow>Use and review boundaries</SectionEyebrow>
            <p className="mt-5 text-sm leading-8 text-white/70">
              Harbourview Clinical Education is provided for professional information and market-readiness purposes only. It does not provide medical advice, prescribing guidance, patient-specific recommendations, legal advice, regulatory approvals or product efficacy claims. Any education material intended for clinical, commercial, promotional or jurisdiction-specific use should be reviewed by appropriately qualified medical, legal, regulatory or compliance professionals before distribution or reliance.
            </p>
          </article>

          <article className="rounded-3xl border border-navy/10 bg-[#fffdf8] p-7 shadow-[0_18px_55px_rgba(11,26,47,0.06)] sm:p-8">
            <SectionEyebrow>Not a prescribing or claims library</SectionEyebrow>
            <p className="mt-5 text-sm leading-8 text-gray-600">
              Harbourview does not use this section to provide care-pathway instructions, patient-specific recommendations, therapeutic claims, prescribing guidance or jurisdiction-specific legal conclusions. Higher-sensitivity topics are held for review before external use.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-[#071326] py-16 text-white sm:py-20">
        <div className="page-container">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <SectionEyebrow>Need a controlled education pathway?</SectionEyebrow>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Structure professional education without overstepping review boundaries.</h2>
                <p className="mt-5 max-w-3xl text-sm leading-8 text-white/70">
                  Harbourview can help structure education themes, documentation literacy, professional briefings and market-readiness materials for regulated cannabis stakeholders.
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-8 text-white/60">
                  Controlled topic requests may be routed to private discussion, held for professional review or declined if the requested use would require medical, legal or regulatory advice Harbourview does not provide.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href={requestHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition hover:bg-[#d6b76d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  Request Education Support
                </Link>
                <Link
                  href={contactHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/70 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  Contact Harbourview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
