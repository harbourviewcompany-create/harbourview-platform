import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Trust, Safety & Governance | Harbourview',
  description:
    'How Harbourview maintains claim discipline, source review, confidentiality, public/private data boundaries, verification standards and marketplace conduct.',
  openGraph: {
    title: 'Harbourview Trust, Safety & Governance',
    description:
      'Verification model, public/private boundary, confidentiality standards, source discipline and marketplace conduct principles for Harbourview.',
  },
}

const accessStates = [
  {
    state: 'Public',
    icon: '🌐',
    description: 'Anonymous visitors. Open pages, sanitised summaries, role routing, education and trust context. No account required.',
    capabilities: ['Browse public marketplace summaries', 'Access education and policy resources', 'View intelligence orientation', 'Submit contact inquiries'],
    restrictions: ['No counterparty contact detail', 'No private listing detail', 'No evidence or analyst notes', 'No dealroom access'],
  },
  {
    state: 'Registered',
    icon: '📝',
    description: 'Account created. Saved interests, watchlist capability, draft submissions. No evidence or private commercial detail.',
    capabilities: ['Save market watchlists', 'Draft marketplace submissions', 'Track intelligence signals', 'Structured inquiry forms'],
    restrictions: ['No counterparty identity', 'No private pricing or availability', 'No reviewed introduction routing', 'No dealroom access'],
  },
  {
    state: 'Verified',
    icon: '✅',
    description: 'Industry credential confirmed by Harbourview. Expanded marketplace visibility, qualified request paths, structured profile capability.',
    capabilities: ['Expanded listing detail', 'Qualified request forms', 'Structured profile capability', 'Priority inquiry routing'],
    restrictions: ['No confidential counterparty detail', 'No protected dealroom access', 'No distressed asset disclosure'],
  },
  {
    state: 'Reviewed Commercial',
    icon: '🔐',
    description: 'Harbourview-reviewed for specific transactions. Confidential listings, counterparty disclosure, document exchange — per transaction.',
    capabilities: ['Confidential listing access', 'Counterparty introduction', 'Document exchange', 'Protected dealroom orientation'],
    restrictions: ['Per-transaction review required', 'NDA or equivalent required', 'Legal eligibility must be confirmed'],
  },
  {
    state: 'Admin / Analyst',
    icon: '⚙️',
    description: 'Internal Harbourview operators only. Raw evidence, provenance records, audit events, moderation and internal scoring.',
    capabilities: ['Raw source evidence', 'Full audit trail', 'Moderation controls', 'Internal scoring'],
    restrictions: ['Internal staff only — never accessible publicly'],
  },
]

const claimControls = [
  {
    title: 'No unreviewed claims',
    body: 'Public pages do not publish unreviewed market claims, pricing statements, counterparty identities or route-specific conclusions. All published content passes editorial review.',
  },
  {
    title: 'Evidence stays private',
    body: 'Source URLs, raw evidence captures, analyst notes, provenance summaries and internal review records are never published on public routes.',
  },
  {
    title: 'Confidence language',
    body: 'Public intelligence distinguishes confirmed facts, reviewed interpretation and weak signals. Harbourview does not present uncertain information as fact.',
  },
  {
    title: 'Correction policy',
    body: 'Published claims are constrained, attributed where possible and correctable when better public evidence becomes available. Corrections are handled without delay.',
  },
]

const confidentialityControls = [
  {
    title: 'Contact details stay private',
    body: 'No counterparty contact detail is published on public routes. Buyer, seller, operator and institutional contact information is handled exclusively through reviewed private workflows.',
  },
  {
    title: 'Submissions reviewed before routing',
    body: 'All marketplace submissions, inquiry forms, intake requests and introduction requests are reviewed by Harbourview before any routing, response or counterparty contact is coordinated.',
  },
  {
    title: 'Commercial terms excluded from public pages',
    body: 'Pricing, availability, transaction terms, diligence materials and counterparty-specific detail are never published publicly. These remain in controlled private workflows.',
  },
  {
    title: 'Distressed and sensitive submissions first-private',
    body: 'Distressed inventory, distressed businesses, M&A and sensitive commercial submissions begin with confidential intake. No public summary is published without submission review and approval.',
  },
]

const forbiddenStrings = [
  'sourceUrl', 'sourceName', 'Evidence captured', 'provenanceSummary',
  'sourceEvidence', 'verificationStatus', 'availabilityStatus',
  'internalReviewNotes', 'reviewedBy', 'lastReviewedAt', 'nextReviewDueAt',
  'View source listing', 'Raw source URLs in any format',
]

export default function TrustGovernancePage() {
  return (
    <main className="bg-[#020814] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Trust, Safety & Governance</p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            How Harbourview controls what is public and what is not.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            Harbourview is intentionally not an open-contact directory. Public pages give you enough to orient and decide.
            Sensitive commercial detail, counterparty information, evidence and reviewed introductions move through
            controlled private workflows — not public listings.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/access-states" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">View access state model</Link>
            <Link href="/source-methodology" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Source methodology</Link>
          </div>
        </div>
      </section>

      {/* Access state summary */}
      <section className="border-b border-gold/10 bg-[#030b16] py-12 sm:py-16">
        <div className="page-container">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Access model</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">Five access states. Each gate is explicit.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              Every Harbourview user operates in one of five access states. Movement between states requires explicit action by the user and Harbourview review. There is no automatic escalation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {accessStates.map((s) => (
              <div key={s.state} className="flex flex-col rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-semibold text-[#f5f1e8]">{s.state}</span>
                </div>
                <p className="mb-4 flex-1 text-xs leading-6 text-white/54">{s.description}</p>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/60">Can access</p>
                  <ul className="space-y-1">
                    {s.capabilities.map((c) => <li key={c} className="text-xs text-white/50 before:mr-2 before:text-gold/50 before:content-['—']">{c}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/access-states" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold underline decoration-gold/40 underline-offset-4">
              Full access state progression →
            </Link>
          </div>
        </div>
      </section>

      {/* Public/private boundary */}
      <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Public / private boundary</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">What is never on a public route.</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/72">Always excluded from public pages</p>
              <ul className="space-y-2">
                {[
                  'Counterparty contact details (buyers, sellers, operators, institutions)',
                  'Private pricing, availability, transaction terms or commercial offers',
                  'Source URLs, raw evidence captures or internal analyst notes',
                  'Provenance summaries, internal review records or moderation data',
                  'Verification status, seller authorisation or availability status fields',
                  'Diligence materials, NDA-protected documents or dealroom content',
                  'Internal review timestamps, reviewer identity or audit trail data',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/58">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/72">Forbidden field strings (leakage probe)</p>
              <p className="mb-4 text-xs leading-6 text-white/48">These strings must never appear on any public route. Used in automated leakage scans.</p>
              <div className="flex flex-wrap gap-2">
                {forbiddenStrings.map((s) => (
                  <code key={s} className="rounded border border-red-400/20 bg-red-900/20 px-2 py-1 text-[11px] text-red-300/80">{s}</code>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Claim controls */}
      <section className="border-b border-gold/10 bg-[#030b16] py-12 sm:py-16">
        <div className="page-container">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Claim discipline</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">How public claims are controlled.</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {claimControls.map((c) => (
              <div key={c.title} className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
                <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
                <h3 className="mb-3 text-base font-semibold text-[#f5f1e8]">{c.title}</h3>
                <p className="text-sm leading-7 text-white/56">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confidentiality controls */}
      <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Confidentiality model</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">How sensitive information is handled.</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {confidentialityControls.map((c) => (
              <div key={c.title} className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
                <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
                <h3 className="mb-3 text-base font-semibold text-[#f5f1e8]">{c.title}</h3>
                <p className="text-sm leading-7 text-white/56">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification model */}
      <section className="border-b border-gold/10 bg-[#030b16] py-12 sm:py-16">
        <div className="page-container">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Verification model</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">How participants are verified.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              Verification is role-specific and jurisdiction-aware. Harbourview does not auto-verify. Every verification request is reviewed manually before any access-state change is applied.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { role: 'Licensed operators', method: 'Licence number, issuing authority and operating jurisdiction confirmed against official registry where accessible.' },
              { role: 'Exporters and importers', method: 'Export licence, import permit and regulatory authorisation reviewed against jurisdiction-specific requirements.' },
              { role: 'Professionals', method: 'Credential, registration or institutional affiliation confirmed. Clinicians, pharmacists, lawyers and compliance advisors reviewed by role.' },
              { role: 'Institutions', method: 'Institutional affiliation, accreditation or regulatory status confirmed before institutional pathway access.' },
              { role: 'Investors and acquirers', method: 'Commercial context, fund structure or accreditation reviewed before distressed asset or dealroom access is considered.' },
              { role: 'Service providers', method: 'Service category, credentials, geographic scope and any applicable licences reviewed before marketplace listing.' },
            ].map((v) => (
              <div key={v.role} className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/70">{v.role}</p>
                <p className="text-sm leading-7 text-white/56">{v.method}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-sm border border-gold/20 bg-[rgba(10,20,35,0.8)] p-5">
            <p className="text-sm leading-7 text-white/54">
              Verification does not guarantee marketplace access, counterparty introduction, transaction clearance or regulatory approval.
              Harbourview verification confirms role context only. All commercial activity remains subject to applicable law and separate party agreement.
            </p>
          </div>
        </div>
      </section>

      {/* Marketplace conduct */}
      <section className="border-b border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Marketplace conduct</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">Standards for participants.</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { title: 'No misrepresentation', body: 'Participants must not misrepresent licence status, product certifications, available volumes, pricing, or commercial terms.' },
              { title: 'No circumvention', body: 'Participants must not attempt to bypass Harbourview review, directly contact counterparties identified through Harbourview, or share Harbourview-routed contact details outside the review process.' },
              { title: 'Compliance responsibility', body: 'All regulatory obligations, licences, permits, documentation and legal requirements for any commercial activity remain the exclusive responsibility of the relevant parties.' },
            ].map((c) => (
              <div key={c.title} className="rounded-sm border border-gold/10 bg-[rgba(10,20,35,0.6)] p-6">
                <div className="mb-4 h-px w-10 bg-gradient-to-r from-gold to-gold-light opacity-60" />
                <h3 className="mb-3 text-base font-semibold text-[#f5f1e8]">{c.title}</h3>
                <p className="text-sm leading-7 text-white/56">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#030b16] py-14 sm:py-18">
        <div className="page-container">
          <div className="rounded-sm border border-gold/12 bg-[linear-gradient(135deg,rgba(11,26,47,0.96)_0%,rgba(3,11,22,0.98)_100%)] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-10">
            <h2 className="font-serif text-3xl tracking-[-0.04em] text-[#f5f1e8] sm:text-4xl">Questions about how Harbourview works?</h2>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-white/62">
              Verification, access-state progression, marketplace conduct or confidentiality questions handled through confidential intake.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="btn-marketplace justify-center px-6 py-3 text-sm">Start a confidential conversation</Link>
              <Link href="/legal/privacy" className="btn-intelligence justify-center px-6 py-3 text-sm">Privacy policy</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
