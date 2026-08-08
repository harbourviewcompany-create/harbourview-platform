import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8')

describe('Harbourview monetization lifecycle safeguards', () => {
  it('uses the canonical free/intel/operator entitlement vocabulary', () => {
    const entitlements = read('lib/billing/entitlements.ts')
    expect(entitlements).toContain("export type SubscriptionTier = 'free' | 'intel' | 'operator'")
    expect(entitlements).toContain("watchlist: 'intel'")
    expect(entitlements).toContain("genetics: 'operator'")
    expect(entitlements).not.toContain("admin: 'enterprise'")
  })

  it('makes Stripe customer creation idempotent and fails if the customer mapping cannot persist', () => {
    const stripeServer = read('lib/stripe/server.ts')
    expect(stripeServer).toContain('idempotencyKey: `harbourview-customer-${userId}`')
    expect(stripeServer).toContain('Unable to persist Stripe customer mapping')
  })

  it('prevents a second subscription checkout and routes existing subscribers to Billing Portal', () => {
    const checkout = read('app/api/stripe/checkout/route.ts')
    const upgradeButton = read('components/stripe/UpgradeButton.tsx')
    expect(checkout).toContain("code: 'EXISTING_SUBSCRIPTION'")
    expect(checkout).toContain('TERMINAL_SUBSCRIPTION_STATUSES')
    expect(upgradeButton).toContain("data.code === 'EXISTING_SUBSCRIPTION'")
    expect(upgradeButton).toContain("fetch('/api/stripe/portal', { method: 'POST' })")
  })

  it('does not let non-Harbourview Stripe prices alter Harbourview entitlement state', () => {
    const webhook = read('app/api/stripe/webhook/route.ts')
    expect(webhook).toContain('ignoring subscription with non-Harbourview price')
    expect(webhook).toContain('if (!derivedTier)')
  })

  it('recomputes entitlement across remaining subscriptions on updates and cancellation', () => {
    const webhook = read('app/api/stripe/webhook/route.ts')
    expect(webhook).toContain('async function recomputeUserEntitlement')
    expect(webhook).toContain("subscription.status !== 'active' && subscription.status !== 'trialing'")
    expect(webhook).toContain('await recomputeUserEntitlement(supabase, userId)')
  })

  it('marks a webhook event processed only after persistence succeeds', () => {
    const webhook = read('app/api/stripe/webhook/route.ts')
    expect(webhook).toContain('Webhook idempotency lookup failed')
    expect(webhook).toContain('Webhook idempotency insert failed')
    expect(webhook).toContain('subscriptions upsert failed')
    expect(webhook).toContain('app_metadata tier sync failed')
    expect(webhook.indexOf('await recomputeUserEntitlement(supabase, userId)')).toBeLessThan(
      webhook.lastIndexOf('await markProcessed(supabase, event)')
    )
  })

  it('uses the configured canonical app URL rather than a request-controlled Origin for Stripe redirects', () => {
    const checkout = read('app/api/stripe/checkout/route.ts')
    const portal = read('app/api/stripe/portal/route.ts')
    expect(checkout).not.toContain("req.headers.get('origin')")
    expect(portal).not.toContain("req.headers.get('origin')")
  })
})
