import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listGlobalExpansionCoverage } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const READINESS_COLOURS: Record<string, string> = {
  ready: 'border-emerald-400/40 text-emerald-300',
  partial: 'border-amber-400/40 text-amber-300',
  building: 'border-sky-400/40 text-sky-300',
  gap: 'border-red-400/40 text-red-300',
}

const PRIORITY_COLOURS: Record<string, string> = {
  tier_1: 'border-emerald-400/40 text-emerald-300',
  tier_2: 'border-amber-400/40 text-amber-300',
  tier_3: 'border-slate-400/40 text-slate-400',
}

const REVENUE_COLOURS: Record<string, string> = {
  high: 'border-[#C6A55A]/40 text-[#C6A55A]',
  medium: 'border-sky-400/40 text-sky-300',
  low: 'border-white/20 text-white/50',
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

function CoverageStat({ label, value }: { label: string; value: number }) {
  const colour = value >= 80 ? 'bg-emerald-400' : value >= 50 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-[#F5F1E8]/40">{label}</span>
        <span className="text-[10px] font-semibold text-[#F5F1E8]">{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default async function GlobalExpansionPage() {
  await requireAdminAuth()
  const result = await listGlobalExpansionCoverage()
  const markets = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  const tier1 = markets.filter((m) => m.priority === 'tier_1').length
  const readyMarkets = markets.filter((m) => m.route_to_market_readiness === 'ready').length

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Global Expansion</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Global Expansion Coverage</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Coverage status, route-to-market readiness, and expansion priority across all tracked markets.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Markets Tracked</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{markets.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Tier 1 Markets</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{tier1}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Route-Ready Markets</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400">{readyMarkets}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Gap Markets</p>
          <p className="mt-2 text-3xl font-semibold text-red-400">
            {markets.filter((m) => m.route_to_market_readiness === 'gap').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {markets.map((market) => (
          <div key={market.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">
                {market.market} · {market.region}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill
                  label={market.route_to_market_readiness}
                  cls={READINESS_COLOURS[market.route_to_market_readiness] ?? 'border-white/20 text-white/50'}
                />
                <Pill
                  label={market.priority}
                  cls={PRIORITY_COLOURS[market.priority] ?? 'border-white/20 text-white/50'}
                />
                <Pill
                  label={market.revenue_potential}
                  cls={REVENUE_COLOURS[market.revenue_potential] ?? 'border-white/20 text-white/50'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <CoverageStat label="Pathway" value={market.pathway_coverage} />
              <CoverageStat label="Partner" value={market.partner_coverage} />
              <CoverageStat label="Buyer Demand" value={market.buyer_demand_coverage} />
              <CoverageStat label="Supply" value={market.supply_relevance} />
              <CoverageStat label="Source" value={market.source_coverage} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40 mb-1">
                Signal Freshness: <span className="text-[#F5F1E8]/60">{market.signal_freshness_days} days</span>
              </p>
            </div>

            {market.documentation_requirements.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40 mb-1">Documentation Requirements</p>
                <ul className="space-y-0.5">
                  {market.documentation_requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#F5F1E8]/55">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#C6A55A]/50" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
