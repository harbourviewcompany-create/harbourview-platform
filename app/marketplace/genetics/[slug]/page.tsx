import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import { getPublicCultivarPassportBySlug } from '@/lib/genetics/queries'

// ISR: marketplace listing data
export const revalidate = 1800

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const passport = await getPublicCultivarPassportBySlug(slug)
  if (!passport) {
    return { title: 'Cultivar passport | Harbourview' }
  }
  return {
    title: `${passport.displayName} · Genetics | Harbourview`,
    description: passport.publicSummary.slice(0, 160),
  }
}

export default async function GeneticsPassportPage({ params }: { params: Params }) {
  const { slug } = await params
  const p = await getPublicCultivarPassportBySlug(slug)
  if (!p) notFound()

  return (
    <>
      <div className="bg-[#020814] px-4 pt-6 md:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/marketplace/genetics"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c6a55a]/70 hover:text-[#c6a55a]"
          >
            ← Genetics
          </Link>
        </div>
      </div>

      <PublicHero
        eyebrow="Cultivar passport"
        title={p.displayName}
        compact
        actions={[
          {
            label: 'Request access',
            href: `/marketplace/genetics/request-access?cultivar=${encodeURIComponent(p.slug)}`,
          },
          { label: 'Confidential intake', href: '/intake', variant: 'secondary' },
        ]}
      >
        <p className="text-sm text-white/55">
          {[p.originCountryCode, p.originJurisdictionLabel, p.cultivarCategory?.replace(/_/g, ' '), p.claimStatus.replace(/_/g, ' ')]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p className="mt-4">{p.publicSummary}</p>
        <p className="mt-4 text-xs leading-6 text-white/40">{p.publicDisclaimer}</p>
      </PublicHero>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <PublicCard className="p-6">
            <h3 className="text-xs uppercase tracking-[0.16em] text-white/45">Attribution</h3>
            <dl className="mt-3 space-y-2 text-sm text-white/70">
              <div>
                <dt className="text-white/40">Breeder (public)</dt>
                <dd>{p.breederDisplayName ?? 'Not published'}</dd>
              </div>
              <div>
                <dt className="text-white/40">Rights holder (public)</dt>
                <dd>{p.rightsHolderDisplayName ?? 'Not published'}</dd>
              </div>
              {p.aliasesPublic.length > 0 && (
                <div>
                  <dt className="text-white/40">Public aliases</dt>
                  <dd>{p.aliasesPublic.join(', ')}</dd>
                </div>
              )}
            </dl>
          </PublicCard>
          <PublicCard className="p-6">
            <h3 className="text-xs uppercase tracking-[0.16em] text-white/45">Evidence posture</h3>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {p.evidenceScoreSummary ?? 'No public evidence score summary published.'}
            </p>
            <p className="mt-2 text-sm leading-7 text-white/55">
              {p.verificationSummary ?? 'Verification summary not published on this passport.'}
            </p>
          </PublicCard>
        </div>
      </PublicSection>

      {p.publicEvidenceSummaries.length > 0 && (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Evidence" title="Public evidence summaries">
            Reviewed public summaries only — source files and private notes stay off this surface.
          </SectionHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {p.publicEvidenceSummaries.map((e) => (
              <PublicCard key={e.id} muted className="p-5">
                <p className="text-[10px] uppercase tracking-wide text-white/40">
                  {e.evidenceType.replace(/_/g, ' ')} · {e.claimStatus.replace(/_/g, ' ')}
                </p>
                <h4 className="mt-1 font-medium text-white">{e.title}</h4>
                {e.publicSummary && (
                  <p className="mt-2 text-sm leading-6 text-white/58">{e.publicSummary}</p>
                )}
                <p className="mt-2 text-xs text-white/35">
                  {[e.sourceLabel, e.sourceDate, e.jurisdictionLabel].filter(Boolean).join(' · ')}
                </p>
              </PublicCard>
            ))}
          </div>
        </PublicSection>
      )}

      {p.countryOpportunitiesPublic.length > 0 && (
        <PublicSection tone="navy">
          <SectionHeader eyebrow="Jurisdictions" title="Country opportunity pathways">
            Discussion and information pathways — not open tenders or material offers.
          </SectionHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {p.countryOpportunitiesPublic.map((o) => (
              <PublicCard key={`${o.countryCode}-${o.opportunityType}`} className="p-5">
                <p className="text-sm font-medium text-white">
                  {o.countryCode}
                  {o.jurisdictionLabel ? ` · ${o.jurisdictionLabel}` : ''}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-white/40">
                  {o.opportunityType.replace(/_/g, ' ')} · {o.status.replace(/_/g, ' ')}
                </p>
                {o.publicNote && (
                  <p className="mt-2 text-sm leading-6 text-white/58">{o.publicNote}</p>
                )}
                <p className="mt-2 text-xs text-white/35">
                  Material transfer: {o.materialTransferStatus.replace(/_/g, ' ')} · Gate:{' '}
                  {o.jurisdictionGateStatus.replace(/_/g, ' ')}
                </p>
                <Link
                  href={`/marketplace/genetics/request-access?cultivar=${encodeURIComponent(p.slug)}&country=${o.countryCode}`}
                  className="mt-3 inline-block text-sm text-[#C6A55A] hover:underline"
                >
                  {o.cta} →
                </Link>
              </PublicCard>
            ))}
          </div>
        </PublicSection>
      )}

      {p.publicCollaborationProjects.length > 0 && (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Collaboration" title="Public collaboration summaries" />
          <div className="grid grid-cols-1 gap-4">
            {p.publicCollaborationProjects.map((c) => (
              <PublicCard key={c.id} muted className="p-5">
                <h4 className="font-medium text-white">{c.title}</h4>
                <p className="mt-1 text-xs text-white/40">
                  {c.projectType.replace(/_/g, ' ')} · {c.status}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/58">{c.publicSummary}</p>
              </PublicCard>
            ))}
          </div>
        </PublicSection>
      )}
    </>
  )
}
