import type { Metadata } from 'next'
import Link from 'next/link'
import UpgradeButton from '@/components/stripe/UpgradeButton'
import ManageBillingButton from '@/components/stripe/ManageBillingButton'
import { TIER_DISPLAY } from '@/lib/stripe/server'
import { getUserTier } from '@/lib/stripe/tier'

export const metadata: Metadata = {
  title: 'Upgrade access | Harbourview',
  description: 'Review Harbourview access tiers and upgrade the authenticated account.',
}

export const dynamic = 'force-dynamic'

type Tier = 'free' | 'intel' | 'operator'

type UpgradePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const TIER_ORDER: Tier[] = ['free', 'intel', 'operator']

const FEATURE_LABELS: Record<string, string> = {
  signals: 'Signals',
  intelligence: 'Intelligence',
  genetics: 'Genetics',
  network: 'Network',
  vault: 'Evidence vault',
  opportunities: 'Opportunities',
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeTier(value: string | undefined): Tier | null {
  return value === 'free' || value === 'intel' || value === 'operator' ? value : null
}

function tierMeetsMinimum(current: Tier, required: Tier) {
  return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(required)
}

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  const params = await searchParams
  const requestedFeature = firstParam(params.feature)?.trim().toLowerCase() ?? ''
  const requiredTier = normalizeTier(firstParam(params.required)) ?? 'intel'
  const reportedCurrentTier = normalizeTier(firstParam(params.current))
  const authenticatedTier = await getUserTier()
  const currentTier = authenticatedTier === 'intel' || authenticatedTier === 'operator'
    ? authenticatedTier
    : reportedCurrentTier ?? 'free'
  const featureLabel = FEATURE_LABELS[requestedFeature] ?? 'this Command Centre capability'
  const alreadyEntitled = tierMeetsMinimum(currentTier, requiredTier)

  return (
    <main className="min-h-screen bg-[#040814] px-5 py-10 text-[#d8e1e9] sm:px-8" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/dashboard" className="font-serif text-lg font-semibold tracking-[.155em] text-[#f3cf86]">
            HARBOURVIEW
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/account" className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-[#d8e1e9]">
              Account
            </Link>
            {currentTier !== 'free' && <ManageBillingButton />}
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-[#d9af63]/30 bg-[#0b1929] p-6 sm:p-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.2em] text-[#d9af63]">Access control</p>
          <h1 className="max-w-3xl font-serif text-3xl font-semibold text-[#f3cf86] sm:text-4xl">
            {alreadyEntitled ? 'Your account already meets this access level.' : `Upgrade access to ${featureLabel}.`}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#9aa8b6]">
            {alreadyEntitled
              ? `The authenticated account is on the ${currentTier} tier, which meets the ${requiredTier} requirement. Return to the requested capability or manage billing from your account.`
              : `${featureLabel} requires the ${requiredTier} tier. Review the controlled access options below; checkout changes only the authenticated account subscription.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-xl bg-[#f3cf86] px-5 py-2.5 text-sm font-semibold text-[#07111d]">
              Return to Command Centre
            </Link>
            <Link href="/account" className="rounded-xl border border-[#d9af63]/40 px-5 py-2.5 text-sm font-semibold text-[#d9af63]">
              Review account
            </Link>
          </div>
        </section>

        <section aria-labelledby="upgrade-options-title">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#d9af63]">Subscription options</p>
            <h2 id="upgrade-options-title" className="mt-2 font-serif text-2xl font-semibold text-[#f7efe1]">Choose the required access tier</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <article className="flex min-h-[320px] flex-col rounded-3xl border border-[#d9af63]/35 bg-[rgba(217,175,99,.06)] p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d9af63]">Intel</p>
                <h3 className="mt-2 text-xl font-semibold text-[#f7efe1]">Intel Plus</h3>
                <p className="mt-1 text-sm text-[#d9af63]">USD $149 / month</p>
              </div>
              <ul className="my-6 space-y-2 text-sm text-[#9aa8b6]">
                {TIER_DISPLAY.intel.features.map(feature => (
                  <li key={feature} className="flex gap-2"><span aria-hidden="true" className="text-[#d9af63]">✓</span><span>{feature}</span></li>
                ))}
              </ul>
              <div className="mt-auto">
                {currentTier === 'free' ? (
                  <UpgradeButton
                    priceKey="intel_monthly"
                    label="Upgrade to Intel Plus"
                    className="w-full rounded-xl px-4 py-3 text-center text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg,#f3cf86,#d9af63)', color: '#07111d' }}
                  />
                ) : (
                  <p className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-[#9aa8b6]">Included in the current tier</p>
                )}
              </div>
            </article>

            <article className="flex min-h-[320px] flex-col rounded-3xl border border-[#d9af63]/45 bg-[rgba(217,175,99,.09)] p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d9af63]">Operator</p>
                <h3 className="mt-2 text-xl font-semibold text-[#f7efe1]">Operator</h3>
                <p className="mt-1 text-sm text-[#d9af63]">USD $490 / month</p>
              </div>
              <ul className="my-6 space-y-2 text-sm text-[#9aa8b6]">
                {TIER_DISPLAY.operator.features.map(feature => (
                  <li key={feature} className="flex gap-2"><span aria-hidden="true" className="text-[#d9af63]">✓</span><span>{feature}</span></li>
                ))}
              </ul>
              <div className="mt-auto">
                {currentTier !== 'operator' ? (
                  <UpgradeButton
                    priceKey="operator_monthly"
                    label="Upgrade to Operator"
                    className="w-full rounded-xl px-4 py-3 text-center text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg,#f3cf86,#d9af63)', color: '#07111d' }}
                  />
                ) : (
                  <p className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-[#9aa8b6]">Current tier</p>
                )}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  )
}
