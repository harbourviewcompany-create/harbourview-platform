import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicHero, PublicSection, SectionHeader, PublicCard, FooterCta } from '@/components/PublicUi'
import { getPlaybook, DIFFICULTY_LABEL } from '@/lib/intelligence/jurisdictionPlaybooks'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ country: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params
  const playbook = await getPlaybook(country)
  if (!playbook) return { title: 'Licensing Pathway | Harbourview Intelligence' }
  return {
    title: `${playbook.country_name} Licensing Pathway | Harbourview Intelligence`,
    description:
      playbook.legal_framework_summary?.slice(0, 155) ??
      `Cannabis licensing pathway context for ${playbook.country_name}.`,
  }
}

export default async function PlaybookDetailPage({ params }: Props) {
  const { country } = await params
  const playbook = await getPlaybook(country)
  if (!playbook) notFound()

  const lastVerifiedRaw = playbook.last_verified_at ?? playbook.last_reviewed
  const lastVerified = new Date(lastVerifiedRaw).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <>
      <PublicHero
        eyebrow={`Intelligence / Playbooks / ${playbook.country_name}`}
        title={`${playbook.country_name} licensing pathway`}
        actions={[{ label: 'All jurisdictions', href: '/intelligence/playbooks', variant: 'secondary' }]}
      >
        {playbook.legal_framework_summary ?? 'Detailed licensing pathway context for this jurisdiction.'}
      </PublicHero>

      <PublicSection tone="panel">
        <SectionHeader eyebrow={DIFFICULTY_LABEL[playbook.difficulty]} title="Pathway overview">
          {playbook.typical_timeline_months != null && `Typical timeline: ${playbook.typical_timeline_months} months. `}
          {playbook.estimated_cost_range && `Estimated cost range: ${playbook.estimated_cost_range}.`}
        </SectionHeader>
      </PublicSection>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="Sequence" title="Licensing steps">
          {playbook.steps.length} step{playbook.steps.length === 1 ? '' : 's'} mapped for this jurisdiction.
        </SectionHeader>
        <div className="flex flex-col gap-5">
          {playbook.steps.map((step) => (
            <PublicCard key={step.step} className="p-6 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-[#f5f1e8]">
                  {step.step}. {step.title}
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/70">
                  {step.required ? 'Required' : 'Optional'} · est. {step.estimated_weeks} wk
                  {step.estimated_weeks === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/62">{step.description}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      {playbook.key_regulators.length > 0 && (
        <PublicSection tone="panel">
          <SectionHeader eyebrow="Regulators" title="Key regulatory bodies">
            {playbook.key_regulators.length} regulator{playbook.key_regulators.length === 1 ? '' : 's'} mapped for
            this jurisdiction.
          </SectionHeader>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {playbook.key_regulators.map((reg) => (
              <PublicCard key={reg.name} className="p-6">
                <h3 className="text-base font-semibold text-[#f5f1e8]">{reg.name}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{reg.role}</p>
                {reg.website && (
                  <a
                    href={reg.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-gold/72 hover:text-gold"
                  >
                    Official site →
                  </a>
                )}
              </PublicCard>
            ))}
          </div>
        </PublicSection>
      )}

      {playbook.common_pitfalls.length > 0 && (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Diligence" title="Common pitfalls">
            Frequently seen missteps operators should account for in this jurisdiction.
          </SectionHeader>
          <ul className="flex flex-col gap-4">
            {playbook.common_pitfalls.map((pitfall, i) => (
              <li key={i} className="flex gap-3 text-sm leading-7 text-white/62">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden="true" />
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </PublicSection>
      )}

      <PublicSection tone="panel">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Last reviewed: {lastVerified}</p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
          This pathway summary is orientation-level only. It does not confirm licence eligibility or route
          viability for any specific operator. Verify current requirements with qualified local legal counsel
          and the relevant competent authority before acting.
        </p>
      </PublicSection>

      <FooterCta
        eyebrow="Go deeper"
        title="Need pathway intelligence for a specific transaction?"
        actions={[{ label: 'Request Licensing Pathway Intelligence', href: '/intelligence/licensing-pathways' }]}
      >
        Public pathway summaries are orientation-level. Operator-specific route analysis is handled through
        private intake.
      </FooterCta>
    </>
  )
}
