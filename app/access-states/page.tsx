import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Access States | Harbourview',
  description:
    'How access-state progression works on Harbourview — five states from anonymous public visitor to reviewed commercial access. Each gate requires explicit action and Harbourview review.',
  openGraph: {
    title: 'Harbourview Access State Model',
    description:
      'Five access states. Each gate requires explicit user action and Harbourview review. No automatic escalation.',
  },
}

const states = [
  {
    icon: '🌐',
    state: 'Public',
    subtitle: 'Anonymous · open pages',
    description: 'Any visitor without an account. Full access to public pages: marketplace summaries, intelligence orientation, education, policy, trust and role routing.',
    gate: null,
    capabilities: [
      'All public marketplace categories (sanitised summaries only)',
      'Intelligence region orientation and public signals',
      'Education tracks, policy resources and trust pages',
      'Role routing and CTA flows',
      'Contact and intake forms',
    ],
    excludes: [
      'Counterparty contact or identity',
      'Private pricing, availability or commercial terms',
      'Source URLs, evidence or analyst notes',
      'Verified or reviewed routing',
    ],
  },
  {
    icon: '📝',
    state: 'Registered',
    subtitle: 'Account created',
    description: 'Account holder with no verification. Enables watchlists, saved interests, draft submissions and structured inquiry forms. No private commercial detail.',
    gate: 'Create account → email verification',
    capabilities: [
      'All Public capabilities',
      'Marketplace watchlist and saved interests',
      'Draft submission capability',
      'Intelligence signal tracking',
      'Structured inquiry and quote forms',
    ],
    excludes: [
      'Counterparty identity or contact',
      'Private listing detail beyond public summary',
      'Reviewed introduction routing',
      'Dealroom or distressed asset access',
    ],
  },
  {
    icon: '✅',
    state: 'Verified',
    subtitle: 'Industry credential confirmed',
    description: 'Industry role confirmed by Harbourview review. Enables expanded marketplace visibility, qualified request paths and structured profile capability.',
    gate: 'Submit verification request → Harbourview review → approval',
    capabilities: [
      'All Registered capabilities',
      'Expanded public-safe listing detail',
      'Qualified request forms (vs. general inquiry)',
      'Structured profile and credential display',
      'Priority inquiry routing',
    ],
    excludes: [
      'Confidential counterparty detail',
      'Protected dealroom access',
      'Distressed asset disclosure',
    ],
  },
  {
    icon: '🔐',
    state: 'Reviewed Commercial',
    subtitle: 'Harbourview-reviewed, per transaction',
    description: 'Approved for specific transaction context. Enables confidential listing detail, counterparty disclosure, document exchange and protected dealroom access — per transaction, not globally.',
    gate: 'Confidential intake → Harbourview commercial review → NDA or equivalent → approval',
    capabilities: [
      'All Verified capabilities',
      'Confidential listing detail for reviewed transactions',
      'Counterparty introduction (reviewed)',
      'Document exchange for approved transactions',
      'Protected dealroom orientation',
    ],
    excludes: [
      'Automatic access to all confidential listings',
      'Bypass of per-transaction review requirement',
      'Legal or regulatory clearance (party responsibility)',
    ],
  },
  {
    icon: '⚙️',
    state: 'Admin / Analyst',
    subtitle: 'Internal Harbourview operators only',
    description: 'Internal Harbourview staff only. Raw source evidence, provenance records, full audit trail, moderation controls, internal scoring and private commercial workflows.',
    gate: 'Internal staff only — never accessible through public registration',
    capabilities: [
      'Raw source evidence and provenance records',
      'Full audit trail and moderation controls',
      'Internal scoring and review workflows',
      'Private commercial routing and dealroom management',
    ],
    excludes: [
      'This state is not accessible to external participants under any circumstances',
    ],
  },
]

export default function AccessStatesPage() {
  return (
    <main className="bg-[#020814] text-white">
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/trust-governance" className="transition-colors hover:text-gold">Trust & Governance</Link>
            {' / Access States'}
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            Five access states. Each gate is explicit.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            Every Harbourview participant operates in one of five access states. Movement between states requires explicit action by the participant and manual review by Harbourview. There is no automatic escalation.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Start verification</Link>
            <Link href="/trust-governance" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Trust & governance overview</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#030b16] py-12 sm:py-16">
        <div className="page-container space-y-6">
          {states.map((s, i) => (
            <div key={s.state} className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                <div className="lg:w-64 lg:shrink-0">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/60">State {i + 1}</p>
                      <h2 className="text-xl font-semibold text-[#f5f1e8]">{s.state}</h2>
                    </div>
                  </div>
                  <p className="text-xs text-white/44">{s.subtitle}</p>
                  {s.gate && (
                    <div className="mt-4 rounded border border-gold/20 bg-gold/5 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/70">Gate to enter</p>
                      <p className="mt-1 text-xs leading-5 text-white/58">{s.gate}</p>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="mb-5 text-sm leading-7 text-white/62">{s.description}</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/60">Can access</p>
                      <ul className="space-y-2">
                        {s.capabilities.map((c) => (
                          <li key={c} className="flex items-start gap-2 text-xs text-white/54">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-green-400/60" />{c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-400/60">Excluded</p>
                      <ul className="space-y-2">
                        {s.excludes.map((e) => (
                          <li key={e} className="flex items-start gap-2 text-xs text-white/44">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-400/50" />{e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gold/10 bg-[#020814] py-12 sm:py-16">
        <div className="page-container">
          <div className="rounded-sm border border-gold/20 bg-[rgba(10,20,35,0.8)] p-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72">Access state disclaimer</p>
            <p className="text-sm leading-7 text-white/56">
              Access state changes do not guarantee marketplace access, counterparty introduction, transaction clearance or regulatory approval.
              Harbourview access states describe platform capability only. All commercial activity, licensing obligations and regulatory requirements remain the exclusive responsibility of the relevant parties.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Start verification</Link>
            <Link href="/trust-governance" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Trust & governance</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
