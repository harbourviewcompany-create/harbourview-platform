import Link from 'next/link'
import {
  commercialCounterparties,
  commercialFixtureNotice,
  commercialOpportunities,
  commercialSignals,
  confidentialIntroductions,
  dealFlowItems,
  documentPackets,
  routingSuggestions,
  sourcingIntakes,
} from '@/lib/commercial-os/fixtures'

const navItems = [
  ['Dashboard', '/admin/commercial'],
  ['Intelligence', '/admin/commercial/intelligence'],
  ['Sourcing', '/admin/commercial/sourcing'],
  ['Opportunities', '/admin/commercial/opportunities'],
  ['Relationships', '/admin/commercial/relationships'],
  ['Introductions', '/admin/commercial/introductions'],
  ['Deal flow', '/admin/commercial/deal-flow'],
  ['Importers / distributors', '/admin/commercial/importers-distributors'],
  ['Documents', '/admin/commercial/documents'],
  ['Routing', '/admin/commercial/routing'],
] as const

const shellClass = 'min-h-screen bg-[#03070d] text-[#f5f1e8]'
const panelClass = 'rounded-2xl border border-[#d8be76]/15 bg-[#07172a]/80 p-5 shadow-2xl shadow-black/20'
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c6a55a]'

type SectionKind =
  | 'dashboard'
  | 'intelligence'
  | 'sourcing'
  | 'opportunities'
  | 'relationships'
  | 'introductions'
  | 'deal-flow'
  | 'importers-distributors'
  | 'documents'
  | 'routing'

function CommercialShell({ children, title, eyebrow, description }: { children: React.ReactNode; title: string; eyebrow: string; description: string }) {
  return (
    <main className={shellClass}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 lg:px-8">
        <header className="rounded-3xl border border-[#d8be76]/20 bg-gradient-to-br from-[#07172a] to-[#020814] p-6 md:p-8">
          <p className={labelClass}>{eyebrow}</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="font-serif text-4xl leading-tight tracking-[-0.04em] text-[#f5f1e8] md:text-6xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#f5f1e8]/70">{description}</p>
            </div>
            <aside className="rounded-2xl border border-[#c6a55a]/20 bg-black/25 p-4 text-sm leading-6 text-[#f5f1e8]/70">
              <strong className="block text-[#f5f1e8]">Fixture boundary</strong>
              {commercialFixtureNotice}
            </aside>
          </div>
        </header>
        <nav aria-label="Commercial OS sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-2">
          {navItems.map(([label, href]) => (
            <Link key={href} href={href} className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5f1e8]/70 hover:border-[#c6a55a]/50 hover:text-[#f5f1e8] focus:outline-none focus:ring-2 focus:ring-[#c6a55a]/60">
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </main>
  )
}

function MetricCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <article className={panelClass}>
      <p className={labelClass}>{label}</p>
      <p className="mt-3 text-4xl font-semibold text-[#f5f1e8]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#f5f1e8]/60">{note}</p>
    </article>
  )
}

function TextCard({ kicker, title, body, meta }: { kicker: string; title: string; body: string; meta?: string }) {
  return (
    <article className={panelClass}>
      <p className={labelClass}>{kicker}</p>
      <h2 className="mt-3 text-xl font-semibold text-[#f5f1e8]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#f5f1e8]/65">{body}</p>
      {meta ? <p className="mt-4 rounded-full border border-[#c6a55a]/20 px-3 py-2 text-xs text-[#d8be76]">{meta}</p> : null}
    </article>
  )
}

function DashboardGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="New intake" value={sourcingIntakes.length} note="Fixture count from sourcing intake records." />
      <MetricCard label="Active opportunities" value={commercialOpportunities.length} note="Fixture count from opportunity records." />
      <MetricCard label="Signals needing review" value={commercialSignals.filter((item) => item.reviewStatus === 'needs_review').length} note="Fixture count, not live signal volume." />
      <MetricCard label="Documentation pending" value={documentPackets.filter((item) => item.readinessStatus === 'missing_documents').length} note="Fixture count from packet readiness records." />
    </div>
  )
}

function SignalsView() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {commercialSignals.map((signal) => (
        <TextCard key={signal.id} kicker={`${signal.market} · ${signal.confidence} confidence`} title={signal.category} body={signal.summary} meta={`Next action: ${signal.nextAction}`} />
      ))}
    </div>
  )
}

function SourcingView() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {sourcingIntakes.map((intake) => (
        <TextCard key={intake.id} kicker={`${intake.market} · ${intake.status.replaceAll('_', ' ')}`} title={intake.source} body={intake.summary} meta={intake.conversionActions.join(' → ')} />
      ))}
    </div>
  )
}

function OpportunitiesView() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {commercialOpportunities.map((opportunity) => (
        <TextCard key={opportunity.id} kicker={`${opportunity.market} · ${opportunity.stage.replaceAll('_', ' ')}`} title={opportunity.title} body={opportunity.summary} meta={opportunity.suggestedNextAction} />
      ))}
    </div>
  )
}

function RelationshipsView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {commercialCounterparties.map((counterparty) => (
        <article key={counterparty.id} className={panelClass}>
          <p className={labelClass}>{counterparty.counterpartyType.replaceAll('_', ' ')}</p>
          <h2 className="mt-3 text-2xl font-semibold">{counterparty.name}</h2>
          <p className="mt-3 text-sm text-[#f5f1e8]/65">Markets: {counterparty.marketsCovered.join(', ')}</p>
          <p className="mt-2 text-sm text-[#f5f1e8]/65">Requirements: {counterparty.documentationRequirements.join(', ')}</p>
          <div className="mt-4 grid gap-2">
            {counterparty.links.map((link) => (
              <p key={`${counterparty.id}-${link.label}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#f5f1e8]/70">{link.relationship}: {link.label}</p>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function IntroductionsView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {confidentialIntroductions.map((intro) => (
        <TextCard key={intro.id} kicker={`${intro.status.replaceAll('_', ' ')} · fit fixture ${intro.fitScore}`} title={intro.match} body={intro.summary} meta={intro.nextAction} />
      ))}
    </div>
  )
}

function DealFlowView() {
  const stages = ['qualified', 'docs_requested', 'in_discussion'] as const
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {stages.map((stage) => (
        <section key={stage} className={panelClass}>
          <p className={labelClass}>{stage.replaceAll('_', ' ')}</p>
          <div className="mt-4 grid gap-3">
            {dealFlowItems.filter((item) => item.stage === stage).map((item) => (
              <TextCard key={item.id} kicker={item.market} title={item.title} body={item.nextAction} meta={item.updatedLabel} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function DocumentsView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {documentPackets.map((packet) => (
        <TextCard key={packet.id} kicker={packet.readinessStatus.replaceAll('_', ' ')} title={packet.title} body={`Received: ${packet.receivedItems.join(', ') || 'none'}. Missing: ${packet.missingItems.join(', ') || 'none'}.`} meta={packet.nextAction} />
      ))}
    </div>
  )
}

function RoutingView() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {routingSuggestions.map((suggestion) => (
        <TextCard key={suggestion.id} kicker={`${suggestion.priority} priority · ${suggestion.suggestionType.replaceAll('_', ' ')}`} title={suggestion.title} body={suggestion.rationale} meta={`${suggestion.destination} · ${suggestion.internalNextAction}`} />
      ))}
    </div>
  )
}

function PublicConnectionPoints() {
  return (
    <section className={panelClass}>
      <p className={labelClass}>Public connection points</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {['marketplace card candidate to public card review', 'market-access pathway to related opportunity', 'buyer demand to wanted request summary', 'signal to public summary only after review'].map((item) => (
          <p key={item} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-[#f5f1e8]/70">{item}</p>
        ))}
      </div>
    </section>
  )
}

function SectionBody({ section }: { section: SectionKind }) {
  if (section === 'intelligence') return <SignalsView />
  if (section === 'sourcing') return <SourcingView />
  if (section === 'opportunities') return <OpportunitiesView />
  if (section === 'relationships') return <RelationshipsView />
  if (section === 'introductions') return <IntroductionsView />
  if (section === 'deal-flow') return <DealFlowView />
  if (section === 'importers-distributors') return <RelationshipsView />
  if (section === 'documents') return <DocumentsView />
  if (section === 'routing') return <RoutingView />

  return (
    <div className="grid gap-6">
      <DashboardGrid />
      <div className="grid gap-4 lg:grid-cols-2">
        <TextCard kicker="Operator workflow" title="Raw intake to controlled introduction" body="Fixture workflow covers raw intake, review, qualification, opportunity conversion, documentation readiness, introduction approval, deal-flow tracking, and routing suggestions." />
        <TextCard kicker="Internal boundary" title="Private workspace, public handoff only after review" body="Public connection points are represented as review checkpoints. No source evidence, private notes, or live counterparty records are exposed by these fixtures." />
      </div>
      <PublicConnectionPoints />
    </div>
  )
}

function CommercialOSPage({ section, title, eyebrow, description }: { section: SectionKind; title: string; eyebrow: string; description: string }) {
  return (
    <CommercialShell title={title} eyebrow={eyebrow} description={description}>
      <SectionBody section={section} />
    </CommercialShell>
  )
}

export function CommercialOSDashboard() {
  return <CommercialOSPage section="dashboard" title="Commercial OS" eyebrow="Harbourview internal operator layer" description="Commercial intelligence, sourcing, routing, documentation, relationship, introduction, and deal-flow workspace built from deterministic fixtures first." />
}

export function CommercialOSIntelligence() {
  return <CommercialOSPage section="intelligence" title="Commercial Intelligence Feed" eyebrow="Signal review" description="Fixture signal inbox for market, regulatory, buyer demand, importer/distributor, equipment, supplier, and conversion review." />
}

export function CommercialOSSourcing() {
  return <CommercialOSPage section="sourcing" title="Sourcing Workflow" eyebrow="Intake control" description="Fixture workflow for raw intake, review, qualification, opportunity conversion, public-card candidacy, and introduction/deal-flow routing." />
}

export function CommercialOSOpportunities() {
  return <CommercialOSPage section="opportunities" title="Opportunity Control" eyebrow="Commercial pipeline" description="Fixture opportunity workspace for public-card candidates, private opportunities, buyer demand, supplier opportunities, market access, and documentation follow-up." />
}

export function CommercialOSRelationships() {
  return <CommercialOSPage section="relationships" title="Relationship Graph" eyebrow="Counterparty workspace" description="Fixture card-and-link workspace for buyers, sellers, importers, distributors, suppliers, service providers, logistics partners, and market-access partners." />
}

export function CommercialOSIntroductions() {
  return <CommercialOSPage section="introductions" title="Confidential Introductions" eyebrow="Introduction workflow" description="Fixture workflow from access request and qualification to match review, documentation review, approval, intro sent, follow-up, and outcome tracking." />
}

export function CommercialOSDealFlow() {
  return <CommercialOSPage section="deal-flow" title="Deal Flow" eyebrow="Pipeline tracking" description="Fixture board grouped by commercial stages from intake and qualification through documentation, matching, introductions, discussion, won, lost, and dormant states." />
}

export function CommercialOSImportersDistributors() {
  return <CommercialOSPage section="importers-distributors" title="Importer and Distributor CRM" eyebrow="Route-to-market partners" description="Fixture CRM for importers, distributors, route-to-market partners, coverage, accepted formats, documentation requirements, active needs, contact status, and follow-ups." />
}

export function CommercialOSDocuments() {
  return <CommercialOSPage section="documents" title="Documentation Packet Workspace" eyebrow="Readiness control" description="Fixture workspace for required, received, missing, and ready-for-review packet states connected to opportunities and counterparties." />
}

export function CommercialOSRouting() {
  return <CommercialOSPage section="routing" title="Commercial Routing" eyebrow="Deterministic suggestions" description="Fixture routing suggestions for matches, pathways, missing documents, follow-up priorities, public-card candidates, intro candidates, and route-to-market review." />
}
