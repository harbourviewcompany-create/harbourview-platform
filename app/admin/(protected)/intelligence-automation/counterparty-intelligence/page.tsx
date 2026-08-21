import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import {
  counterpartyIntelligencePathways,
  type AccessPosture,
  type ClaimState,
} from '@/lib/intelligence-automation/counterparty-pathways'

export const dynamic = 'force-dynamic'

const postureClasses: Record<AccessPosture, string> = {
  open_gateway: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  selective_gateway: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  vertically_controlled: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  regulator: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  competitor: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  watch: 'border-white/15 bg-white/5 text-[#F5F1E8]/55',
}

const claimClasses: Record<ClaimState, string> = {
  verified: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  inference: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  unresolved: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
}

function label(value: string) {
  return value.replace(/_/g, ' ')
}

function SourceLinks({ sourceIds, sourceMap }: { sourceIds: string[]; sourceMap: Map<string, { label: string; url: string }> }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sourceIds.map(id => {
        const source = sourceMap.get(id)
        if (!source) return null
        return (
          <a
            key={id}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/[0.025] px-2 py-0.5 text-[10px] text-[#F5F1E8]/45 transition hover:border-[#C6A55A]/35 hover:text-[#C6A55A]"
          >
            {source.label}
          </a>
        )
      })}
    </div>
  )
}

export default async function CounterpartyIntelligencePage() {
  await requireAdminAuth()

  const totalCounterparties = counterpartyIntelligencePathways.reduce(
    (sum, pathway) => sum + pathway.counterparties.length,
    0,
  )
  const totalOpenGateways = counterpartyIntelligencePathways.reduce(
    (sum, pathway) => sum + pathway.counterparties.filter(counterparty => counterparty.accessPosture === 'open_gateway').length,
    0,
  )
  const totalTriggers = counterpartyIntelligencePathways.reduce(
    (sum, pathway) => sum + pathway.nextTriggers.length,
    0,
  )
  const unresolvedNotes = counterpartyIntelligencePathways.reduce(
    (sum, pathway) => sum + pathway.dataQualityNotes.length,
    0,
  )

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Counterparty intelligence</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              European market-access pathways · Aug 21
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/68">
              Verified company, licence, ownership, regulator and distribution relationships for the three highest-value
              developments in today&apos;s intelligence cycle. Commercial winners, losers and openings are kept separate from
              verified facts so operator decisions never inherit inference as evidence.
            </p>
          </div>
          <Link
            href="/admin/intelligence-automation"
            className="shrink-0 text-sm text-[#C6A55A] underline-offset-4 hover:underline"
          >
            ← Intelligence hub
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Material pathways', value: counterpartyIntelligencePathways.length },
            { label: 'Mapped counterparties', value: totalCounterparties },
            { label: 'Verified open gateways', value: totalOpenGateways },
            { label: 'Concrete watch triggers', value: totalTriggers },
          ].map(metric => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-semibold text-[#F5F1E8]">{metric.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#C6A55A]/80">{metric.label}</p>
            </div>
          ))}
        </div>

        {unresolvedNotes > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-sm text-amber-200/80">
            {unresolvedNotes} unresolved evidence/data-quality item{unresolvedNotes === 1 ? '' : 's'} remain explicitly gated below.
          </div>
        )}
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {counterpartyIntelligencePathways.map(pathway => (
          <a
            key={pathway.slug}
            href={`#${pathway.slug}`}
            className="shrink-0 rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/8 px-3 py-1.5 text-xs text-[#C6A55A] hover:bg-[#C6A55A]/15"
          >
            {pathway.jurisdictions[0]} · {pathway.eventDate}
          </a>
        ))}
      </nav>

      {counterpartyIntelligencePathways.map((pathway, pathwayIndex) => {
        const sourceMap = new Map(pathway.sources.map(source => [source.id, source]))
        const openGateways = pathway.counterparties.filter(counterparty => counterparty.accessPosture === 'open_gateway')
        const controlled = pathway.counterparties.filter(counterparty => counterparty.accessPosture === 'vertically_controlled')

        return (
          <article
            key={pathway.id}
            id={pathway.slug}
            className="scroll-mt-6 space-y-6 rounded-3xl border border-white/10 bg-[#081423] p-5 md:p-7"
          >
            <header className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#C6A55A]/30 bg-[#C6A55A]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]">
                    #{pathwayIndex + 1} · material advancement
                  </span>
                  <span className="text-xs text-[#F5F1E8]/40">As of {pathway.asOf}</span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-[#F5F1E8]">{pathway.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#F5F1E8]/65">{pathway.thesis}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pathway.jurisdictions.map(jurisdiction => (
                    <span
                      key={jurisdiction}
                      className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] text-[#F5F1E8]/55"
                    >
                      {jurisdiction}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                  <p className="text-2xl font-semibold text-emerald-300">{openGateways.length}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-emerald-300/70">Open gateways</p>
                </div>
                <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
                  <p className="text-2xl font-semibold text-amber-300">{controlled.length}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-amber-300/70">Controlled routes</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-2xl font-semibold text-[#F5F1E8]">{pathway.counterparties.length}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#F5F1E8]/40">Counterparties</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-2xl font-semibold text-[#F5F1E8]">{pathway.nextTriggers.length}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#F5F1E8]/40">Next triggers</p>
                </div>
              </div>
            </header>

            {pathway.dataQualityNotes.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-300">Evidence gates</p>
                {pathway.dataQualityNotes.map(note => (
                  <div key={note.title} className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-medium text-amber-200">{note.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/60">{note.detail}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${claimClasses.unresolved}`}>
                        unresolved
                      </span>
                    </div>
                    <p className="mt-3 rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-xs leading-5 text-amber-100/70">
                      Decision rule: {note.decisionRule}
                    </p>
                    <SourceLinks sourceIds={note.sourceIds} sourceMap={sourceMap} />
                  </div>
                ))}
              </div>
            )}

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Verified pathway</p>
                  <h4 className="mt-1 text-lg font-semibold text-[#F5F1E8]">Route to market</h4>
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {pathway.pathway.map((step, index) => (
                  <div key={`${pathway.id}-${step.label}`} className="contents">
                    <div className="min-w-[210px] rounded-2xl border border-white/10 bg-black/15 p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]/70">Step {index + 1}</p>
                      <p className="mt-1 font-medium text-[#F5F1E8]">{step.label}</p>
                      <p className="mt-2 text-xs leading-5 text-[#F5F1E8]/50">{step.detail}</p>
                    </div>
                    {index < pathway.pathway.length - 1 && (
                      <div className="flex shrink-0 items-center text-[#C6A55A]/45" aria-hidden="true">→</div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Counterparty map</p>
                <h4 className="mt-1 text-lg font-semibold text-[#F5F1E8]">Companies, facilities, licences and channel posture</h4>
              </div>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead className="bg-black/25 text-[10px] uppercase tracking-[0.15em] text-[#C6A55A]">
                    <tr>
                      <th className="p-3">Counterparty</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Jurisdiction</th>
                      <th className="p-3">Ownership</th>
                      <th className="p-3">Licence / facility</th>
                      <th className="p-3">Channel posture</th>
                      <th className="p-3">Commercial position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pathway.counterparties.map(counterparty => (
                      <tr key={counterparty.id} className="align-top text-[#F5F1E8]/65 hover:bg-white/[0.02]">
                        <td className="p-3">
                          <p className="font-medium text-[#F5F1E8]">{counterparty.name}</p>
                          <div className="mt-1 flex gap-1.5">
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${claimClasses[counterparty.state]}`}>
                              {counterparty.state}
                            </span>
                          </div>
                          <SourceLinks sourceIds={counterparty.sourceIds} sourceMap={sourceMap} />
                        </td>
                        <td className="p-3 text-xs capitalize">{label(counterparty.role)}</td>
                        <td className="p-3 text-xs">{counterparty.jurisdiction}</td>
                        <td className="p-3 max-w-[210px] text-xs leading-5">{counterparty.ownership}</td>
                        <td className="p-3 max-w-[260px] text-xs leading-5">{counterparty.licenceOrFacility}</td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${postureClasses[counterparty.accessPosture]}`}>
                            {label(counterparty.accessPosture)}
                          </span>
                        </td>
                        <td className="p-3 max-w-[290px] text-xs leading-5">{counterparty.commercialPosition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Ownership changes</p>
                <div className="mt-4 space-y-3">
                  {pathway.ownershipChanges.map(change => (
                    <div key={`${change.entity}-${change.change}`} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[#F5F1E8]">{change.entity}</p>
                        {change.effectiveDate && <span className="text-[10px] text-[#F5F1E8]/35">{change.effectiveDate}</span>}
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${claimClasses[change.state]}`}>
                          {change.state}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#F5F1E8]/62">{change.change}</p>
                      <p className="mt-2 text-xs leading-5 text-[#F5F1E8]/45">Commercial meaning: {change.commercialMeaning}</p>
                      <SourceLinks sourceIds={change.sourceIds} sourceMap={sourceMap} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Relevant regulators</p>
                <div className="mt-4 space-y-3">
                  {pathway.regulators.map(regulator => (
                    <div key={`${regulator.name}-${regulator.jurisdiction}`} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <p className="font-medium text-[#F5F1E8]">{regulator.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-violet-300/70">{regulator.jurisdiction}</p>
                      <p className="mt-2 text-xs leading-5 text-[#F5F1E8]/50">{regulator.remit}</p>
                      <SourceLinks sourceIds={regulator.sourceIds} sourceMap={sourceMap} />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Likely winners</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${claimClasses.inference}`}>inference</span>
                </div>
                <div className="mt-4 space-y-3">
                  {pathway.likelyWinners.map(item => (
                    <div key={item.label}>
                      <p className="font-medium text-[#F5F1E8]">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#F5F1E8]/50">{item.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-rose-300">Likely losers</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${claimClasses.inference}`}>inference</span>
                </div>
                <div className="mt-4 space-y-3">
                  {pathway.likelyLosers.map(item => (
                    <div key={item.label}>
                      <p className="font-medium text-[#F5F1E8]">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#F5F1E8]/50">{item.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Highest-value commercial openings</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {pathway.commercialOpenings.map(opening => (
                  <div key={opening.title} className="rounded-2xl border border-[#C6A55A]/20 bg-[#C6A55A]/[0.035] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold text-[#F5F1E8]">{opening.title}</h4>
                      <span className="rounded-full border border-[#C6A55A]/25 bg-[#C6A55A]/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#C6A55A]">
                        {opening.priority}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/62">{opening.rationale}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {opening.targetCounterparties.map(target => (
                        <span key={target} className="rounded-full border border-white/10 bg-black/15 px-2 py-0.5 text-[10px] text-[#F5F1E8]/55">
                          {target}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 border-t border-white/8 pt-3 text-xs leading-5 text-[#F5F1E8]/40">
                      Evidence boundary: {opening.evidenceBoundary}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Next concrete triggers</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {pathway.nextTriggers.map(trigger => (
                  <div key={trigger.title} className="rounded-2xl border border-sky-400/15 bg-sky-400/[0.035] p-5">
                    <h4 className="font-semibold text-[#F5F1E8]">{trigger.title}</h4>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-sky-300/70">Trigger condition</p>
                    <p className="mt-1 text-sm leading-6 text-[#F5F1E8]/62">{trigger.condition}</p>
                    <p className="mt-3 text-xs leading-5 text-[#F5F1E8]/45">Why it matters: {trigger.whyItMatters}</p>
                    <SourceLinks sourceIds={trigger.sourceIds} sourceMap={sourceMap} />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/8 bg-black/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Source register</p>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {pathway.sources.map(source => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/8 bg-white/[0.02] p-3 transition hover:border-[#C6A55A]/35"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[#F5F1E8]">{source.label}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#F5F1E8]/40">
                        {source.kind}
                      </span>
                    </div>
                    {source.jurisdiction && <p className="mt-1 text-[10px] text-[#C6A55A]/65">{source.jurisdiction}</p>}
                    {source.note && <p className="mt-2 text-xs leading-5 text-[#F5F1E8]/40">{source.note}</p>}
                  </a>
                ))}
              </div>
            </section>
          </article>
        )
      })}
    </section>
  )
}
