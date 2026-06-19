import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import {
  listAccessProducts,
  listRevenueIntelligenceItems,
  listSuccessFeeOpportunities,
  listSubscriptionTiers,
} from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

export default async function MonetizationOverviewPage() {
  await requireAdminAuth()

  const [accessResult, revenueResult, successFeeResult, subscriptionResult] = await Promise.all([
    listAccessProducts(),
    listRevenueIntelligenceItems(),
    listSuccessFeeOpportunities(),
    listSubscriptionTiers(),
  ])

  const isFixture =
    (accessResult.ok && accessResult.source === 'fixture') ||
    (revenueResult.ok && revenueResult.source === 'fixture') ||
    (successFeeResult.ok && successFeeResult.source === 'fixture') ||
    (subscriptionResult.ok && subscriptionResult.source === 'fixture')

  const accessProducts = accessResult.ok ? accessResult.data : []
  const revenueItems = revenueResult.ok ? revenueResult.data : []
  const successFees = successFeeResult.ok ? successFeeResult.data : []
  const subscriptions = subscriptionResult.ok ? subscriptionResult.data : []

  const pipelineTotal = revenueItems
    .filter((r) => r.stage !== 'closed_lost')
    .reduce((sum, r) => sum + r.expected_revenue, 0)

  const successFeePotential = successFees
    .filter((s) => s.status === 'tracking' || s.status === 'negotiating')
    .reduce((sum, s) => sum + s.estimated_fee, 0)

  const activeSubscribers = subscriptions.reduce((sum, s) => sum + s.subscriber_count, 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Monetization</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Monetization Overview</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Revenue pipeline, access products, success fee opportunities, and subscription intelligence.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Access Products</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{accessProducts.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Revenue Pipeline</p>
          <p className="mt-2 text-2xl font-semibold text-[#F5F1E8]">{fmt(pipelineTotal)}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Success Fee Potential</p>
          <p className="mt-2 text-2xl font-semibold text-[#F5F1E8]">{fmt(successFeePotential)}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Active Subscribers</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{activeSubscribers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: '/admin/monetization/access-products',
            label: 'Access Products',
            desc: 'All monetization products including buyer access, introductions, and reviews.',
            count: `${accessProducts.length} products`,
          },
          {
            href: '/admin/monetization/revenue-intelligence',
            label: 'Revenue Intelligence',
            desc: 'Pipeline of active revenue opportunities across all revenue types.',
            count: `${revenueItems.length} opportunities`,
          },
          {
            href: '/admin/monetization/success-fees',
            label: 'Success Fees',
            desc: 'Tracked success fee opportunities from introductions and deal closings.',
            count: `${successFees.length} opportunities`,
          },
          {
            href: '/admin/monetization/subscriptions',
            label: 'Subscriptions',
            desc: 'Intelligence subscription tiers and subscriber counts.',
            count: `${subscriptions.length} tiers`,
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{card.count}</p>
            <p className="mt-2 font-semibold text-[#F5F1E8]">{card.label}</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/55">{card.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
