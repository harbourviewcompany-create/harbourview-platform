import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listSubscriptionTiers } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const STATUS_COLOURS: Record<string, string> = {
  active: 'border-emerald-400/40 text-emerald-300',
  draft: 'border-amber-400/40 text-amber-300',
  deprecated: 'border-red-400/40 text-red-300',
}

const TIER_COLOURS: Record<string, string> = {
  starter: 'border-sky-400/40 text-sky-300',
  professional: 'border-violet-400/40 text-violet-300',
  enterprise: 'border-[#C6A55A]/40 text-[#C6A55A]',
  custom: 'border-white/20 text-white/50',
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export default async function SubscriptionsPage() {
  await requireAdminAuth()
  const result = await listSubscriptionTiers()
  const tiers = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  const totalSubscribers = tiers.reduce((sum, t) => sum + t.subscriber_count, 0)

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Monetization</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Subscription Tiers</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Intelligence subscription tiers, pricing, and subscriber counts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Total Tiers</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{tiers.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Total Subscribers</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{totalSubscribers}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Active Tiers</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{tiers.filter((t) => t.status === 'active').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{tier.tier} tier</p>
              <h3 className="mt-1 font-semibold text-[#F5F1E8]">{tier.name}</h3>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-[#F5F1E8]">
                {tier.price_usd > 0
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(tier.price_usd)
                  : 'Custom'}
              </span>
              {tier.price_usd > 0 && (
                <span className="text-sm text-[#F5F1E8]/50">/ {tier.billing_period}</span>
              )}
            </div>

            {tier.features.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40 mb-1">Features</p>
                <ul className="space-y-0.5">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-[#F5F1E8]/60">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#C6A55A]/60" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40 mb-1">Markets</p>
              <p className="text-xs text-[#F5F1E8]/60">{tier.markets_included.join(', ')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Pill label={tier.status} cls={STATUS_COLOURS[tier.status] ?? 'border-white/20 text-white/50'} />
              <Pill label={tier.tier} cls={TIER_COLOURS[tier.tier] ?? 'border-white/20 text-white/50'} />
              <span className="text-xs text-[#F5F1E8]/50">{tier.subscriber_count} subscribers</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
