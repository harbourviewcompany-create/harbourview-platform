import Link from 'next/link'
import type { Metadata } from 'next'
import { HarbourviewGlobeClientLoader } from '@/components/harbourview/globe/HarbourviewGlobeClientLoader'
import { PublicCard, PublicLinkCard, PublicSection, SectionHeader } from '@/components/PublicUi'

export const metadata: Metadata = {
  title: 'Harbourview | Global Cannabis Industry Connector',
  description:
    'Harbourview connects regulated cannabis operators, buyers, sellers, exporters, importers, distributors, professionals, institutions and adjacent stakeholders through reviewed network access, intelligence, education and confidential routing.',
  openGraph: {
    title: 'Harbourview | Global Cannabis Industry Connector',
    description:
      'A full-platform connector for regulated cannabis commerce, intelligence, education and reviewed commercial access.',
  },
}

const platformPillars = [
  {
    title: 'Network',
    href: '/network',
    eyebrow: 'Participant graph',
    body: 'Role-specific pathways for operators, buyers, sellers, exporters, importers, distributors, professionals, institutions, advocates and adjacent stakeholders.',
  },
  {
    title: 'Exchange',
    href: '/marketplace',
    eyebrow: 'Commercial layer',
    body: 'Reviewed access to supply, demand, equipment, infrastructure, consumables, services, genetics, logistics, labs, distressed assets and business opportunities.',
  },
  {
    title: 'Intelligence',
    href: '/intelligence',
    eyebrow: 'Market context',
    body: 'Public-safe country, pathway, company, category, trade-route and timing intelligence with private evidence kept out of public pages.',
  },
  {
    title: 'Source Methodology',
    href: '/source-methodology',
    eyebrow: 'Evidence discipline',
    body: 'A public explanation of source classes, review discipline, confidence language, local-language monitoring and private evidence boundaries.',
  },
  {
    title: 'Markets',
    href: '/markets',
    eyebrow: 'Jurisdiction hubs',
    body: 'Market-entry orientation, import/export pathways, public-safe opportunity categories, active signals and brief-request paths.',
  },
  {
    title: 'Education',
    href: '/education',
    eyebrow: 'Knowledge spine',
    body: 'Compliance, pharmaceutical, clinical, pharmacy, cultivation, post-harvest, processing, GMP, GACP, GDP, law, policy, history and advocacy resources.',
  },
  {
    title: 'Professionals',
    href: '/professionals',
    eyebrow: 'Expert network',
    body: 'Entry points for clinicians, pharmacists, lawyers, QA and GMP professionals, researchers, policymakers, regulators, educators, investors and associations.',
  },
  {
    title: 'Trust & Governance',
    href: '/trust-governance',
    eyebrow: 'Control layer',
    body: 'Verification, confidentiality, correction policy, marketplace rules, public/private boundaries and reporting standards.',
  },
  {
    title: 'Reviewed Connections',
    href: '/reviewed-connections',
    eyebrow: 'Qualified routing',
    body: 'Buyer/seller matching, exporter/importer review, equipment sourcing, distressed asset access and protected dealroom orientation.',
  },
] as const

const rolePaths = [
  ['Operators', 'Exchange → equipment, services, compliance and reviewed connections'],
  ['Buyers', 'Find supply → wanted request → reviewed supplier routing'],
  ['Sellers', 'Sell or export → submission review → public-safe listing or private route'],
  ['Exporters', 'Markets → export orientation → importer/distributor matching'],
  ['Importers', 'Markets → demand review → supply and counterparty qualification'],
  ['Distributors', 'Network → supply channels → route feasibility review'],
  ['Pharmacists', 'Education → pharmacy track → qualified supply or market inquiry'],
  ['Clinicians and doctors', 'Education → clinical track → professional network resources'],
  ['Lawyers and compliance advisors', 'Professionals → policy, standards and market-intelligence paths'],
  ['Regulators and policymakers', 'Policy, source methodology and institutional collaboration paths'],
  ['Investors and acquirers', 'Distressed assets, business opportunities and protected dealroom review'],
  ['Vendors and service providers', 'Exchange → vendor capability profile → reviewed lead routing'],
  ['Labs, logistics and testing providers', 'Professionals and Exchange service paths'],
  ['Advocates, educators and enthusiasts', 'Education, history, policy and public literacy paths'],
  ['Associations, institutions and universities', 'Institutional partnerships and source/research collaboration'],
] as const

const ctaCards = [
  { title: 'Explore Platform', href: '/platform', body: 'See the whole Harbourview system and how the public surfaces connect.' },
  { title: 'Find Supply', href: '/marketplace/wanted', body: 'Submit buyer demand for reviewed routing without public contact exposure.' },
  { title: 'Sell or Export', href: '/marketplace/sell', body: 'Submit supply, capability or export-readiness context for review.' },
  { title: 'Source Equipment/Services', href: '/marketplace/services', body: 'Route equipment, infrastructure, consumables, lab, logistics or operating needs.' },
  { title: 'List Distressed Asset', href: '/marketplace/business-opportunities', body: 'Start with confidential intake for inventory, equipment, facilities or businesses.' },
  { title: 'Track a Market', href: '/markets', body: 'Follow jurisdiction, policy and access context before requesting deeper review.' },
  { title: 'Request Intelligence', href: '/intelligence', body: 'Ask for a market, pathway, company, category or counterparty brief.' },
  { title: 'Learn Compliance', href: '/compliance', body: 'Start with public-safe compliance orientation before route-specific review.' },
  { title: 'Join Network', href: '/network', body: 'Find the right role path before submitting a profile or inquiry.' },
  { title: 'Request Introduction', href: '/reviewed-connections', body: 'Understand how Harbourview reviews and routes qualified introductions.' },
  { title: 'Speak Confidentially', href: '/intake', body: 'Use controlled intake for sensitive commercial or market-access context.' },
] as const

const accessStates = [
  ['Public discovery', 'Open pages, role routing, category previews, market orientation, education and non-sensitive calls to action.'],
  ['Registered account', 'Saved interests, profile drafts, watchlist intent and user-owned submissions when enabled.'],
  ['Verified industry user', 'Expanded public-safe detail, qualified request paths and structured profile/listing capability.'],
  ['Reviewed commercial access', 'Protected counterparty, asset, document, dealroom and route information after Harbourview review.'],
  ['Admin/operator/analyst', 'Private evidence, provenance, internal review, audit events, sensitive intelligence and moderation controls.'],
] as const

const boundaryControls = [
  'Public pages are discovery and orientation surfaces only.',
  'Sensitive source, evidence, provenance, review and counterparty information stays private.',
  'Commercial introductions, asset access and intelligence requests are reviewed before routing.',
  'Education is informational and non-promotional; it is not legal, medical, investment or compliance advice.',
] as const

export default function HomePage() {
  return (
    <main className="bg-[#01050d] text-white">
      <section className="relative isolate overflow-hidden border-b border-gold/10 bg-[#01050d] py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_22%,rgba(198,165,90,0.18),transparent_34%),linear-gradient(135deg,rgba(11,26,47,0.92)_0%,rgba(1,5,13,1)_72%)]" />
        <HarbourviewGlobeClientLoader />

        <div className="page-container relative z-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-end">
            <div className="max-w-5xl">
              <p className="hero-eyebrow">Global cannabis industry connector</p>

              <h1 className="font-serif text-5xl leading-[0.96] tracking-[-0.055em] text-gold-pale sm:text-6xl lg:text-7xl">
                Market access backed by intelligence and relationships.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                Harbourview is the reviewed network, exchange, intelligence, source, education and connection layer for the regulated cannabis industry: from seed to sale, from roots to suits, and from public discovery to protected commercial access.
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/54 sm:text-base">
                Public routes explain the platform and collect intent. Sensitive source evidence, counterparty detail, route analysis, commercial terms and internal review material remain behind controlled workflows.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/platform" className="btn-marketplace justify-center">
                  <span>Explore Platform</span>
                  <span className="text-xl leading-none">→</span>
                </Link>

                <Link href="/reviewed-connections" className="btn-intelligence justify-center">
                  <span>Request Reviewed Connection</span>
                  <span className="text-xl leading-none">→</span>
                </Link>
              </div>
            </div>

            <aside className="rounded-sm border border-gold/14 bg-[#04101e]/78 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-md sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/78">
                Platform spine
              </p>

              <h2 className="mt-4 font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f4f1eb]">
                One system for commerce, intelligence, education and qualified routing.
              </h2>

              <div className="mt-6 grid gap-3">
                {boundaryControls.map((control) => (
                  <div key={control} className="rounded-sm border border-gold/10 bg-white/[0.035] px-4 py-3 text-sm text-white/66">
                    {control}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PublicSection id="platform-map" tone="navy">
        <SectionHeader
          eyebrow="Full-platform map"
          title="The public site now routes into every major Harbourview pillar."
        >
          HAR-37 establishes the visible skeleton. Later tickets deepen marketplace categories, intelligence surfaces, education, governance, visual polish and deployment proof without shrinking the platform universe.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {platformPillars.map((pillar) => (
            <PublicLinkCard key={pillar.href} href={pillar.href} eyebrow={pillar.eyebrow} title={pillar.title}>
              {pillar.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection id="role-router" tone="dark">
        <SectionHeader eyebrow="Role router" title="Every serious industry participant has a visible path.">
          Operators, buyers, sellers, exporters, importers, distributors, professionals, institutions and adjacent stakeholders can now orient from the homepage before entering a reviewed workflow.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rolePaths.map(([role, path]) => (
            <PublicCard key={role} muted className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72">{role}</p>
              <p className="mt-3 text-sm leading-7 text-white/62">{path}</p>
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection id="cta-decision-tree" tone="navy">
        <SectionHeader eyebrow="CTA decision tree" title="Start with intent, then route into the right review path.">
          Each action resolves to an implemented public route or a polished placeholder, avoiding dead links while the deeper platform layers are built.
        </SectionHeader>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ctaCards.map((card) => (
            <PublicLinkCard key={card.href + card.title} href={card.href} title={card.title}>
              {card.body}
            </PublicLinkCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection id="access-states" tone="dark">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader eyebrow="Access model" title="Public discovery is separated from protected commercial access." className="mb-0">
            The platform must be broad on scope and strict on exposure. The public site explains the system; reviewed workflows control sensitive commercial, regulatory, source and counterparty information.
          </SectionHeader>

          <div className="grid gap-4">
            {accessStates.map(([state, description]) => (
              <PublicCard key={state} className="p-5">
                <h3 className="font-serif text-2xl tracking-[-0.03em] text-[#f5f1e8]">{state}</h3>
                <p className="mt-3 text-sm leading-7 text-white/58">{description}</p>
              </PublicCard>
            ))}
          </div>
        </div>
      </PublicSection>

      <section className="py-14 sm:py-18">
        <div className="page-container">
          <div className="rounded-sm border border-gold/12 bg-[linear-gradient(135deg,rgba(11,26,47,0.96)_0%,rgba(3,11,22,0.98)_100%)] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-10">
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">
              Start with the right Harbourview pathway.
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">
              Use the public platform map for orientation, the network and exchange for commercial intent, intelligence and markets for context, education for readiness, and confidential intake when the request involves sensitive counterparties, assets or route questions.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/marketplace" className="btn-marketplace justify-center px-6 py-3 text-sm">
                Enter Exchange
              </Link>

              <Link href="/intake" className="btn-intelligence justify-center px-6 py-3 text-sm">
                Speak Confidentially
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
