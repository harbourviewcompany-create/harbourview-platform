import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

import { getPublicCountryBySlug } from '@/lib/server/countriesQuery'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import { dashboardSections } from '@/lib/dashboard/countries'
import { getLatestBriefing } from '@/lib/intelligence/jurisdictionSynthesis'
import { getPlaybook, DIFFICULTY_LABEL } from '@/lib/intelligence/jurisdictionPlaybooks'
import { getCountryDossier, formatFileSize } from '@/lib/server/dossierQuery'

const MATURITY_COLORS: Record<string, string> = {
  emerging:    'text-amber-400',
  developing:  'text-sky-400',
  maturing:    'text-emerald-400',
  mature:      'text-emerald-300',
  restricted:  'text-red-400',
  unknown:     'text-white/30',
}

const LEGAL_LABELS: Record<string, string> = {
  medical_only:  'Medical only',
  adult_use:     'Adult-use & medical',
  decrim:        'Decriminalised',
  illegal:       'Prohibited',
  mixed:         'Mixed / varies by state',
  transitional:  'Transitional — reform underway',
  unknown:       'Status unverified',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-emerald-300',
  active: 'text-emerald-400',
  regulated: 'text-sky-400',
  emerging: 'text-amber-400',
  limited: 'text-orange-400',
  restricted: 'text-red-400',
  unknown: 'text-white/30',
}

const STATUS_DOT: Record<string, string> = {
  open: 'bg-emerald-300',
  active: 'bg-emerald-400',
  regulated: 'bg-sky-400',
  emerging: 'bg-amber-400',
  limited: 'bg-orange-400',
  restricted: 'bg-red-400',
  unknown: 'bg-white/10',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open — legal adult-use and medical',
  active: 'Active regulated market',
  regulated: 'Regulated access framework',
  emerging: 'Emerging — reform underway',
  limited: 'Limited medical access',
  restricted: 'Restricted / prohibited',
  unknown: 'Status unverified',
}

export default async function CountryIntelligenceDrilldownPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country: countryParam } = await params

  // Try live Supabase data first
  const liveCountry = await getPublicCountryBySlug(countryParam)
  // Resolve iso2 for briefing lookup regardless of which path renders
  const resolvedForBriefing = resolveCountryRouteParam(countryParam)
  const briefingIso2 = liveCountry?.iso_alpha2 ?? resolvedForBriefing?.iso2 ?? null
  const briefing = briefingIso2 ? await getLatestBriefing(briefingIso2) : null
  const playbook = briefingIso2 ? await getPlaybook(briefingIso2) : null
  const dossier = liveCountry ? await getCountryDossier(liveCountry.id) : null

  if (liveCountry) {
    const statusColor = STATUS_COLORS[liveCountry.market_access_status] ?? STATUS_COLORS.unknown
    const statusDot = STATUS_DOT[liveCountry.market_access_status] ?? STATUS_DOT.unknown

    return (
      <main className="min-h-screen bg-[#020814] px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/intelligence/country-briefs"
            className="text-xs uppercase tracking-[0.2em] text-[#c6a55a] hover:underline"
          >
            ← Country Briefs
          </Link>

          <section className="mt-6 rounded-2xl border border-[#c6a55a]/20 bg-[#07101f] p-6 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c6a55a]/70">
              Country Intelligence Brief
            </p>
            <div className="mt-3 flex items-start gap-3">
              <div className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusDot}`} />
              <h1 className="text-3xl font-semibold md:text-5xl">{liveCountry.country_name}</h1>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {liveCountry.iso_alpha2} · {liveCountry.region}
                {liveCountry.subregion ? ` · ${liveCountry.subregion}` : ''}
              </span>
              <span className={`rounded-full border border-white/10 bg-white/5 px-3 py-1 ${statusColor}`}>
                {STATUS_LABEL[liveCountry.market_access_status] ?? liveCountry.market_access_status}
              </span>
              {liveCountry.regulator_label && (
                <span className="rounded-full border border-[#c6a55a]/20 bg-[#c6a55a]/10 px-3 py-1 text-[#f0d39a]">
                  {liveCountry.regulator_label}
                </span>
              )}
            </div>

            {liveCountry.public_summary && (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">
                {liveCountry.public_summary}
              </p>
            )}
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {[
              ['Medical', liveCountry.medical_status],
              ['Adult use', liveCountry.adult_use_status],
              ['Import', liveCountry.import_status],
              ['Export', liveCountry.export_status],
              ['Signals', liveCountry.signals_status],
            ].map(([label, value]) => (
              <article
                key={label}
                className="rounded-xl border border-white/10 bg-[#07101f] p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c6a55a]/60">{label}</p>
                <p className={`mt-2 text-sm font-semibold capitalize ${STATUS_COLORS[value ?? 'unknown'] ?? STATUS_COLORS.unknown}`}>
                  {value ?? 'unknown'}
                </p>
              </article>
            ))}
          </section>

          {briefing && (
            <section className="mt-6 rounded-2xl border border-[#c6a55a]/20 bg-[#07101f] p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c6a55a]/70">
                  Weekly Intelligence Briefing
                </p>
                <p className="text-[10px] text-white/30 flex-shrink-0">
                  w/e {briefing.week_ending} · {briefing.signal_count} signals
                </p>
              </div>
              <h2 className="mt-3 text-base font-semibold text-[#f5f0e8] leading-snug">
                {briefing.headline}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                  {LEGAL_LABELS[briefing.legal_status] ?? briefing.legal_status}
                </span>
                <span className={`rounded-full border border-white/10 bg-white/5 px-3 py-1 ${MATURITY_COLORS[briefing.market_maturity] ?? 'text-white/50'}`}>
                  {briefing.market_maturity.charAt(0).toUpperCase() + briefing.market_maturity.slice(1)} market
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/65">{briefing.summary}</p>
              {briefing.what_changed && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-1">What changed</p>
                  <p className="text-sm leading-6 text-white/55">{briefing.what_changed}</p>
                </div>
              )}
              {briefing.operator_implications && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-1">Operator implications</p>
                  <p className="text-sm leading-6 text-white/55">{briefing.operator_implications}</p>
                </div>
              )}
              {briefing.whats_coming && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-1">What&apos;s coming</p>
                  <p className="text-sm leading-6 text-white/55">{briefing.whats_coming}</p>
                </div>
              )}
              {briefing.key_signals.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-2">Key signals this period</p>
                  <ul className="space-y-1.5">
                    {briefing.key_signals.map((sig, i) => (
                      <li key={i} className="flex gap-2 text-xs text-white/45">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c6a55a]/40" />
                        {sig}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {playbook && (
            <section className="mt-6 rounded-2xl border border-[#c6a55a]/15 bg-[#07101f] p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c6a55a]/70">
                  Market Entry Playbook
                </p>
                <span className="text-[10px] text-white/30 flex-shrink-0">{playbook.typical_timeline_months}-month pathway</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                  {DIFFICULTY_LABEL[playbook.difficulty]}
                </span>
                {playbook.estimated_cost_range && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/40 font-mono">
                    {playbook.estimated_cost_range}
                  </span>
                )}
              </div>
              {playbook.legal_framework_summary && (
                <p className="mt-4 text-sm leading-7 text-white/60">{playbook.legal_framework_summary}</p>
              )}
              {playbook.steps.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-3">Entry Steps</p>
                  <ol className="space-y-4">
                    {playbook.steps.map(step => (
                      <li key={step.step} className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#c6a55a]/30 bg-[#c6a55a]/10 text-[9px] font-bold text-[#c6a55a]">
                          {step.step}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white/80">{step.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/45">{step.description}</p>
                          <span className="mt-1 inline-block font-mono text-[9px] text-white/20">~{step.estimated_weeks}w</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {playbook.key_regulators.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-2">Key Regulatory Bodies</p>
                  <div className="space-y-2">
                    {playbook.key_regulators.map(reg => (
                      <div key={reg.name} className="flex flex-wrap gap-2 text-xs">
                        <span className="font-semibold text-[#c6a55a]/70">{reg.name}</span>
                        <span className="text-white/35">— {reg.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {playbook.common_pitfalls.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-2">Common Pitfalls</p>
                  <ul className="space-y-1.5">
                    {playbook.common_pitfalls.map((pitfall, i) => (
                      <li key={i} className="flex gap-2 text-xs text-white/40">
                        <span className="mt-0.5 flex-shrink-0 text-red-400/50">⚠</span>
                        {pitfall}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                <span className="font-mono text-[9px] text-white/20">Updated {playbook.last_reviewed} · Orientation-level only</span>
                <Link href="/intelligence/playbooks" className="text-[10px] text-[#c6a55a] hover:opacity-70">All playbooks →</Link>
              </div>
            </section>
          )}

          {dossier && (
            <section className="mt-6 rounded-2xl border border-[#c6a55a]/25 bg-gradient-to-br from-[#0d1a2f] to-[#07101f] p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c6a55a]/80">
                  Full Market Dossier Available
                </p>
                {dossier.maturity_score !== null && (
                  <span className="flex-shrink-0 rounded-full border border-[#c6a55a]/40 bg-[#c6a55a]/10 px-3 py-1 text-[10px] font-semibold text-[#c6a55a]">
                    Maturity Score {dossier.maturity_score}/25{dossier.maturity_tier ? ` · ${dossier.maturity_tier}` : ''}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-7 text-white/60">
                A full Harbourview v5 market intelligence dossier exists for {liveCountry.country_name} — regulatory
                history and structure, medical and adult-use channel analysis, trade flows, competitive landscape,
                and market access strategy across {dossier.page_count ? `${dossier.page_count} pages` : '16 sections'}.
                This brief above is orientation-level only; the full dossier is shared directly with qualified counterparties.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-sm border border-[#c6a55a]/50 bg-[#c6a55a]/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#c6a55a] transition-colors hover:border-[#c6a55a]/80 hover:bg-[#c6a55a]/25"
                >
                  Request the Full Dossier
                </Link>
                <span className="font-mono text-[9px] text-white/25">
                  Updated {new Date(dossier.updated_at).toLocaleDateString('en-CA')}
                  {dossier.file_size_bytes ? ` · ${formatFileSize(dossier.file_size_bytes)}` : ''}
                </span>
              </div>
            </section>
          )}

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#07101f] p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c6a55a]/66">
              Intelligence boundary
            </p>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Detailed route intelligence, counterparty review, licensing pathway context and
              commercial timing analysis are available through reviewed private workflows.
              This brief is orientation-level only.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-sm border border-[#c6a55a]/40 bg-[#c6a55a]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#c6a55a] transition-colors hover:border-[#c6a55a]/70 hover:bg-[#c6a55a]/20"
              >
                Request Country Intelligence
              </Link>
              <Link
                href="/intake"
                className="inline-flex items-center rounded-sm border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60 transition-colors hover:border-white/30 hover:text-white/80"
              >
                Start Confidential Intake
              </Link>
            </div>
          </section>
        </div>
      </main>
    )
  }

  // Fall back to dashboard fixture data (covers 191 NE countries)
  const dashboardCountry = resolveCountryRouteParam(countryParam)
  if (!dashboardCountry) return notFound()

  const badge = getDashboardStatusBadge(dashboardCountry.dashboardStatus)

  return (
    <main className="min-h-screen bg-[#020814] px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/intelligence/country-briefs"
          className="text-xs uppercase tracking-[0.2em] text-[#c6a55a] hover:underline"
        >
          ← Country Briefs
        </Link>

        <section className="mt-6 rounded-2xl border border-[#c6a55a]/20 bg-[#07101f] p-6 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c6a55a]/70">
            Country Intelligence Brief
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{dashboardCountry.displayName}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">{dashboardCountry.publicSummary}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {dashboardCountry.iso2} · {dashboardCountry.region}
            </span>
            <span className="rounded-full border border-[#c6a55a]/20 bg-[#c6a55a]/10 px-3 py-1 text-[#f0d39a]">
              {badge.label}
            </span>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {dashboardSections.map((section) => {
            const panel = dashboardCountry.panels[section]
            return (
              <article key={section} className="rounded-2xl border border-white/10 bg-[#07101f] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c6a55a]/60">{section}</p>
                <h2 className="mt-2 text-sm font-semibold">{panel.stateCopy.label}</h2>
                <p className="mt-2 text-xs leading-5 text-white/50">{panel.publicSummary}</p>
              </article>
            )
          })}
        </section>

        {briefing && (
          <section className="mt-6 rounded-2xl border border-[#c6a55a]/20 bg-[#07101f] p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c6a55a]/70">
                Weekly Intelligence Briefing
              </p>
              <p className="text-[10px] text-white/30 flex-shrink-0">
                w/e {briefing.week_ending} · {briefing.signal_count} signals
              </p>
            </div>
            <h2 className="mt-3 text-base font-semibold text-[#f5f0e8] leading-snug">
              {briefing.headline}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                {LEGAL_LABELS[briefing.legal_status] ?? briefing.legal_status}
              </span>
              <span className={`rounded-full border border-white/10 bg-white/5 px-3 py-1 ${MATURITY_COLORS[briefing.market_maturity] ?? 'text-white/50'}`}>
                {briefing.market_maturity.charAt(0).toUpperCase() + briefing.market_maturity.slice(1)} market
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/65">{briefing.summary}</p>
            {briefing.what_changed && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-1">What changed</p>
                <p className="text-sm leading-6 text-white/55">{briefing.what_changed}</p>
              </div>
            )}
            {briefing.operator_implications && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-1">Operator implications</p>
                <p className="text-sm leading-6 text-white/55">{briefing.operator_implications}</p>
              </div>
            )}
            {briefing.key_signals.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-2">Key signals this period</p>
                <ul className="space-y-1.5">
                  {briefing.key_signals.map((sig, i) => (
                    <li key={i} className="flex gap-2 text-xs text-white/45">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c6a55a]/40" />
                      {sig}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {playbook && (
          <section className="mt-6 rounded-2xl border border-[#c6a55a]/15 bg-[#07101f] p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c6a55a]/70">
                Market Entry Playbook
              </p>
              <span className="text-[10px] text-white/30 flex-shrink-0">{playbook.typical_timeline_months}-month pathway</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
                {DIFFICULTY_LABEL[playbook.difficulty]}
              </span>
              {playbook.estimated_cost_range && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/40 font-mono">
                  {playbook.estimated_cost_range}
                </span>
              )}
            </div>
            {playbook.legal_framework_summary && (
              <p className="mt-4 text-sm leading-7 text-white/60">{playbook.legal_framework_summary}</p>
            )}
            {playbook.steps.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-3">Entry Steps</p>
                <ol className="space-y-4">
                  {playbook.steps.map(step => (
                    <li key={step.step} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#c6a55a]/30 bg-[#c6a55a]/10 text-[9px] font-bold text-[#c6a55a]">
                        {step.step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white/80">{step.title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/45">{step.description}</p>
                        <span className="mt-1 inline-block font-mono text-[9px] text-white/20">~{step.estimated_weeks}w</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {playbook.key_regulators.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-2">Key Regulatory Bodies</p>
                <div className="space-y-2">
                  {playbook.key_regulators.map(reg => (
                    <div key={reg.name} className="flex flex-wrap gap-2 text-xs">
                      <span className="font-semibold text-[#c6a55a]/70">{reg.name}</span>
                      <span className="text-white/35">— {reg.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {playbook.common_pitfalls.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#c6a55a]/60 mb-2">Common Pitfalls</p>
                <ul className="space-y-1.5">
                  {playbook.common_pitfalls.map((pitfall, i) => (
                    <li key={i} className="flex gap-2 text-xs text-white/40">
                      <span className="mt-0.5 flex-shrink-0 text-red-400/50">⚠</span>
                      {pitfall}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="font-mono text-[9px] text-white/20">Updated {playbook.last_reviewed} · Orientation-level only</span>
              <Link href="/intelligence/playbooks" className="text-[10px] text-[#c6a55a] hover:opacity-70">All playbooks →</Link>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#07101f] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c6a55a]/66">
            Intelligence boundary
          </p>
          <p className="mt-3 text-sm leading-7 text-white/50">
            Detailed country intelligence is pending analyst review for this jurisdiction.
            Submit an intelligence request to prioritise this market.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-sm border border-[#c6a55a]/40 bg-[#c6a55a]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#c6a55a] transition-colors hover:border-[#c6a55a]/70 hover:bg-[#c6a55a]/20"
            >
              Request Country Intelligence
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
