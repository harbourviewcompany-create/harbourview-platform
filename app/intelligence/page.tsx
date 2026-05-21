import Link from 'next/link'
import type { Metadata } from 'next'

import { PublicCard, PublicHero, PublicLinkCard, PublicSection, SectionHeader, FooterCta } from '@/components/PublicUi'
import { getPublicRegulatorySignals } from '@/lib/regulatory-signals/public'

export const metadata: Metadata = {
  title: 'Intelligence | Harbourview',
  description:
    'Country and regional intelligence for reviewed commercial pathways, opportunity categories and controlled market access requests.',
}

const intelligenceRegions = [
  {
    name: 'Europe',
    description:
      'Priority medical and pharmaceutical markets including Germany, the United Kingdom, the Netherlands, Portugal and Malta.',
    href: '/intelligence/markets',
  },
  {
    name: 'APAC',
    description:
      'Import, pharmacy, cultivation and clinical-access pathways across Australia, New Zealand, Thailand, Japan and adjacent markets.',
    href: '/intelligence/markets',
  },
  {
    name: 'MENA',
    description:
      'Controlled-market monitoring for medical access, import controls, policy movement and institutional pathway review.',
    href: '/intelligence/markets',
  },
  {
    name: 'Americas',
    description:
      'North American, Latin American and Caribbean jurisdiction context for supply, policy, licensing and commercial route review.',
    href: '/intelligence/markets',
  },
  {
    name: 'Africa',
    description:
      'Export, cultivation, medical access and regulatory-development monitoring across priority African jurisdictions.',
    href: '/intelligence/markets',
  },
  {
    name: 'Rest of World',
    description:
      'Jurisdiction watch coverage for emerging, restricted or low-visibility markets requiring controlled analyst review.',
    href: '/contact',
  },
] as const

const workflowRoutes = [
  {
    title: 'Source Engine',
    href: '/intelligence/source-engine',
    body: 'Submit market, company, policy, counterparty and route questions into a reviewed public-safe workflow without exposing private evidence.',
  },
  {
    title: 'Watchlists',
    href: '/intelligence/watchlists',
    body: 'Request monitoring for markets, counterparties, categories and routes while keeping operational watch records private.',
  },
  {
    title: 'Source Methodology',
    href: '/source-methodology',
    body: 'Review the public source discipline, confidence language, correction posture and private evidence boundaries.',
  },
]

export default async function IntelligencePage() {
  const [signals] = await Promise.all([getPublicRegulatorySignals()])
  const featuredSignals = signals.slice(0, 3)

  return (
    <main className="bg-[#020814] text-white">
      <PublicHero
        eyebrow="Harbourview Intelligence"
        title="Country intelligence built around reviewed market pathways."
        actions={[
          { label: 'Explore Regions', href: '#country-map' },
          { label: 'Request Intelligence Workflow', href: '/intelligence/source-engine', variant: 'secondary' },
        ]}
        aside={
          <PublicCard className="p-5 text-sm leading-7 text-white/58 backdrop-blur-sm">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/66">
              Public intelligence controls
            </p>
            <p>
              Public panels use controlled summaries and public-safe projection. They exclude raw evidence, private contacts, unpublished analyst notes and direct counterparty information.
            </p>
          </PublicCard>
        }
      >
        <p>
          Explore public-safe regional pathways for market context, review status, opportunity categories and controlled next actions.
        </p>
        <p className="mt-4 text-sm leading-7 text-white/54">
          Intelligence is presented as reviewed commercial context, not as legal advice, guaranteed access, confirmed counterparties, guaranteed route certainty or live buyer demand.
        </p>
      </PublicHero>

      <PublicSection id="country-map" tone="dark">
        <SectionHeader
          eyebrow="Jurisdiction coverage"
          title="A controlled regional view replaces unfinished map presentation."
        >
          Harbourview organizes country intelligence by region and pathway maturity. Public cards provide orientation only; deeper country, counterparty, route and evidence reviews are handled through controlled requests.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {intelligenceRegions.map((region) => (
            <PublicCard key={region.name} className="group flex min-h-[220px] flex-col justify-between overflow-hidden p-6">
              <div>
                <div className="mb-5 h-px w-16 bg-gold/60 transition-all group-hover:w-24" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/72">
                  Region
                </p>
                <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8]">
                  {region.name}
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/60">{region.description}</p>
              </div>

              <Link href={region.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-pale">
                <span>Request regional review</span>
                <span aria-hidden="true">→</span>
              </Link>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="dark">
        <SectionHeader eyebrow="HAR-39 workflow layer" title="Source-engine and watchlist requests now have public entry points.">
          These routes explain how intelligence requests enter review without publishing raw evidence, source URLs, provenance records, private counterparties or analyst notes.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {workflowRoutes.map((route) => (
            <PublicLinkCard key={route.href} href={route.href} title={route.title} eyebrow="Public-safe workflow">
              {route.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection tone="navy">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.4fr)] lg:items-end">
          <SectionHeader
            eyebrow="Signals inside Intelligence"
            title="Regulatory signals remain available as a focused subcategory."
            className="mb-0"
          />
          <p className="text-sm leading-7 text-white/56">
            The existing Signals route stays intact. Intelligence now uses a regional jurisdiction grid as the front-facing navigation layer while Signals continues to handle policy and regulatory change monitoring.
          </p>
        </div>

        {featuredSignals.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {featuredSignals.map((signal) => (
              <PublicCard key={signal.id} className="p-6">
                <div className="mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-gold/72">
                  <span>{signal.country_name}</span>
                  <span>•</span>
                  <span>{signal.signal_type.replace(/_/g, ' ')}</span>
                </div>

                <h3 className="text-xl font-semibold text-[#f4f1eb]">{signal.headline}</h3>

                <p className="mt-4 text-sm leading-7 text-white/62">{signal.public_summary}</p>

                <div className="mt-5 rounded-sm border border-gold/10 bg-black/20 p-4 text-xs leading-6 text-white/52">
                  {signal.public_implication}
                </div>
              </PublicCard>
            ))}
          </div>
        ) : (
          <PublicCard muted className="mt-8 p-6 text-sm leading-7 text-white/58">
            No public intelligence summaries are currently published. Harbourview can review country-specific regulatory movement, route viability and commercial-access signals on request before anything is made public.
          </PublicCard>
        )}

        <div className="mt-8">
          <Link href="/signals" className="btn-intelligence min-h-[56px] justify-center">
            <span>Open Signals</span>
            <span>→</span>
          </Link>
        </div>
      </PublicSection>

      <FooterCta
        eyebrow="Controlled country assessment"
        title="Need a country brief before entering a market?"
        actions={[{ label: 'Request Intelligence', href: '/contact' }]}
      >
        Harbourview can assess route viability, counterparty fit, opportunity categories and country-specific commercial access constraints before public listing, buyer outreach or wanted-request activation.
      </FooterCta>
    </main>
  )
}
