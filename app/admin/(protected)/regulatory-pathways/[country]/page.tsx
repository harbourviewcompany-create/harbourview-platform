import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import {
  listPathwaysByCountry,
  listProductFormats,
  listFormatRulesForPathways,
  listCitationsForEntities,
  listOperatorLicencesByCountry,
  PATHWAY_TYPE_LABELS,
  VERIFICATION_LABELS,
  VERIFICATION_COLORS,
  type RegulatoryPathway,
  type PathwayFormatRule,
  type RegulatoryCitation,
} from '@/lib/admin/regulatoryPathwaysQuery'

export const dynamic = 'force-dynamic'

const RULE_STATUS_COLORS: Record<string, string> = {
  permitted: 'text-emerald-400',
  unregulated: 'text-emerald-400/70',
  proposed: 'text-sky-400',
  restricted: 'text-amber-400',
  suspended: 'text-amber-400',
  prohibited: 'text-red-400',
  unknown: 'text-[#F5F1E8]/35',
}

function Citations({ citations }: { citations: RegulatoryCitation[] }) {
  if (citations.length === 0) return null
  return (
    <ul className="mt-3 space-y-1.5">
      {citations.map(c => (
        <li key={c.id} className="text-xs text-[#F5F1E8]/50">
          <span className="text-[#F5F1E8]/70">{c.instrument ?? c.source_type}</span>
          {c.article ? <> — {c.article}</> : null}
          {c.citation_url ? (
            <>
              {' '}
              <a href={c.citation_url} target="_blank" rel="noreferrer" className="text-[#C6A55A] hover:underline">
                source
              </a>
            </>
          ) : null}
          {c.published_date ? <span className="text-[#F5F1E8]/30"> · {c.published_date}</span> : null}
        </li>
      ))}
    </ul>
  )
}

function PathwayCard({
  pathway,
  rules,
  formatNames,
  pathwayCitations,
  ruleCitations,
}: {
  pathway: RegulatoryPathway
  rules: PathwayFormatRule[]
  formatNames: Map<string, string>
  pathwayCitations: RegulatoryCitation[]
  ruleCitations: Map<string, RegulatoryCitation[]>
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#C6A55A]">
            {PATHWAY_TYPE_LABELS[pathway.pathway_type] ?? pathway.pathway_type}
          </p>
          <h3 className="mt-1 text-lg font-medium text-[#F5F1E8]">{pathway.name}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#F5F1E8]/50">{pathway.status}</span>
          <span className={VERIFICATION_COLORS[pathway.verification] ?? 'text-[#F5F1E8]/40'}>
            {VERIFICATION_LABELS[pathway.verification] ?? pathway.verification}
          </span>
        </div>
      </div>

      {pathway.summary && <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/65">{pathway.summary}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-[#F5F1E8]/35">Regulator</dt>
          <dd className="mt-0.5 text-[#F5F1E8]/70">{pathway.regulator ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[#F5F1E8]/35">Legal basis</dt>
          <dd className="mt-0.5 text-[#F5F1E8]/70">{pathway.legal_basis ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[#F5F1E8]/35">Prescriber scope</dt>
          <dd className="mt-0.5 text-[#F5F1E8]/70">{pathway.prescriber_scope ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[#F5F1E8]/35">Min. age</dt>
          <dd className="mt-0.5 text-[#F5F1E8]/70">{pathway.min_age ?? '—'}</dd>
        </div>
      </dl>

      {pathway.qualifying_conditions && pathway.qualifying_conditions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {pathway.qualifying_conditions.map(c => (
            <span
              key={c}
              className="rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/10 px-2 py-0.5 text-[10px] text-[#C6A55A]"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {rules.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[#F5F1E8]/40 uppercase tracking-[0.1em]">
                <th className="px-3 py-2 text-left font-medium">Format</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">THC limit</th>
                <th className="px-3 py-2 text-left font-medium">CBD limit</th>
                <th className="px-3 py-2 text-left font-medium">Possession</th>
                <th className="px-3 py-2 text-left font-medium">Unit dose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td className="px-3 py-2 text-[#F5F1E8]/75">{formatNames.get(rule.format_id) ?? 'Unknown format'}</td>
                  <td className={`px-3 py-2 font-medium ${RULE_STATUS_COLORS[rule.status] ?? 'text-[#F5F1E8]/50'}`}>
                    {rule.status}
                  </td>
                  <td className="px-3 py-2 text-[#F5F1E8]/60">{rule.thc_limit ?? '—'}</td>
                  <td className="px-3 py-2 text-[#F5F1E8]/60">{rule.cbd_limit ?? '—'}</td>
                  <td className="px-3 py-2 text-[#F5F1E8]/60">{rule.possession_limit ?? '—'}</td>
                  <td className="px-3 py-2 text-[#F5F1E8]/60">{rule.unit_dose_limit ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rules.some(r => ruleCitations.get(r.id)?.length) && (
            <div className="border-t border-white/10 px-3 py-2">
              {rules.map(r => {
                const cites = ruleCitations.get(r.id)
                if (!cites || cites.length === 0) return null
                return (
                  <div key={r.id} className="mb-1 text-[11px] text-[#F5F1E8]/40">
                    <span className="text-[#F5F1E8]/55">{formatNames.get(r.format_id)}:</span>{' '}
                    {cites.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && '; '}
                        {c.instrument ?? c.source_type}
                        {c.citation_url && (
                          <>
                            {' '}
                            <a href={c.citation_url} target="_blank" rel="noreferrer" className="text-[#C6A55A] hover:underline">
                              source
                            </a>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <Citations citations={pathwayCitations} />
    </div>
  )
}

export default async function RegulatoryPathwayCountryPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  await requireAdminAuth()
  const { country } = await params
  const iso2 = country.toUpperCase()
  if (!/^[A-Z]{2}$/.test(iso2)) return notFound()

  const [pathwaysResult, formatsResult, licencesResult] = await Promise.all([
    listPathwaysByCountry(iso2),
    listProductFormats(),
    listOperatorLicencesByCountry(iso2),
  ])

  const isFixture = !pathwaysResult.ok || !formatsResult.ok || !licencesResult.ok
  const pathways = pathwaysResult.ok ? pathwaysResult.data : []
  const formats = formatsResult.ok ? formatsResult.data : []
  const licences = licencesResult.ok ? licencesResult.data : []

  const formatNames = new Map(formats.map(f => [f.id, f.name]))
  const pathwayIds = pathways.map(p => p.id)

  const rulesResult = await listFormatRulesForPathways(pathwayIds)
  const rules = rulesResult.ok ? rulesResult.data : []
  const rulesByPathway = new Map<string, PathwayFormatRule[]>()
  for (const rule of rules) {
    const list = rulesByPathway.get(rule.pathway_id) ?? []
    list.push(rule)
    rulesByPathway.set(rule.pathway_id, list)
  }

  const ruleIds = rules.map(r => r.id)
  const [pathwayCitationsResult, ruleCitationsResult] = await Promise.all([
    listCitationsForEntities('pathway', pathwayIds),
    listCitationsForEntities('rule', ruleIds),
  ])
  const pathwayCitationsById = new Map<string, RegulatoryCitation[]>()
  if (pathwayCitationsResult.ok) {
    for (const c of pathwayCitationsResult.data) {
      const list = pathwayCitationsById.get(c.entity_id) ?? []
      list.push(c)
      pathwayCitationsById.set(c.entity_id, list)
    }
  }
  const ruleCitationsById = new Map<string, RegulatoryCitation[]>()
  if (ruleCitationsResult.ok) {
    for (const c of ruleCitationsResult.data) {
      const list = ruleCitationsById.get(c.entity_id) ?? []
      list.push(c)
      ruleCitationsById.set(c.entity_id, list)
    }
  }

  if (pathways.length === 0 && licences.length === 0 && !isFixture) return notFound()

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/regulatory-pathways" className="text-xs text-[#F5F1E8]/40 hover:text-[#F5F1E8]/70">
            ← All countries
          </Link>
          <h2 className="mt-2 text-2xl font-semibold">{iso2}</h2>
          <p className="mt-1 text-sm text-[#F5F1E8]/55">
            {pathways.length} pathway{pathways.length !== 1 ? 's' : ''} · {licences.length} licensed operator
            {licences.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {isFixture && (
        <FixtureBanner
          isFixture
          label="SUPABASE_SERVICE_ROLE_KEY not set — cannot read regulatory_pathways / operator_licences."
        />
      )}

      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C6A55A]">Access pathways</h3>
        {pathways.length === 0 ? (
          <p className="text-sm text-[#F5F1E8]/40">No pathway data on file for this country.</p>
        ) : (
          pathways.map(pathway => (
            <PathwayCard
              key={pathway.id}
              pathway={pathway}
              rules={rulesByPathway.get(pathway.id) ?? []}
              formatNames={formatNames}
              pathwayCitations={pathwayCitationsById.get(pathway.id) ?? []}
              ruleCitations={ruleCitationsById}
            />
          ))
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C6A55A]">Licensed operators</h3>
        {licences.length === 0 ? (
          <p className="text-sm text-[#F5F1E8]/40">No operator licences on file for this country.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#F5F1E8]/40 text-xs uppercase tracking-[0.12em]">
                  <th className="px-4 py-3 text-left font-medium">Operator</th>
                  <th className="px-4 py-3 text-left font-medium">Licence #</th>
                  <th className="px-4 py-3 text-left font-medium">Class</th>
                  <th className="px-4 py-3 text-left font-medium">Regulator</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">GMP/GACP</th>
                  <th className="px-4 py-3 text-left font-medium">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {licences.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#F5F1E8]/85">{l.operator_legal_name ?? 'Unknown operator'}</td>
                    <td className="px-4 py-3 text-[#F5F1E8]/60">{l.licence_number ?? '—'}</td>
                    <td className="px-4 py-3 text-[#F5F1E8]/60">{l.licence_class ?? '—'}</td>
                    <td className="px-4 py-3 text-[#F5F1E8]/60">{l.issuing_regulator ?? '—'}</td>
                    <td className="px-4 py-3 text-[#F5F1E8]/60">{l.licence_status ?? '—'}</td>
                    <td className="px-4 py-3 text-[#F5F1E8]/60">
                      {[l.gmp_certified && 'GMP', l.gacp_certified && 'GACP'].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#F5F1E8]/60">{l.expiry_date ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
