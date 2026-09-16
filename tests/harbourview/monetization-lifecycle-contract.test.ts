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

  it('ignores Stripe subscriptions whose price does not map to a Harbourview tier', () => {
    const webhook = read('app/api/stripe/webhook/route.ts')
    expect(webhook).toContain('tierFromPriceId')
    expect(webhook).toContain('const item=sub.items.data[0],price=item?.price?.id??null,tier=price?tierFromPriceId(price):null')
    expect(webhook).toContain('if(!tier)return')
  })

  it('recomputes entitlement from all remaining active subscriptions after updates and cancellation', () => {
    const webhook = read('app/api/stripe/webhook/route.ts')
    expect(webhook).toContain('async function entitlement')
    expect(webhook).toContain("x.status!=='active'&&x.status!=='trialing'")
    expect(webhook).toContain('await entitlement(s,uid)')
  })

  it('marks a webhook event processed only after persistence succeeds', () => {
    const webhook = read('app/api/stripe/webhook/route.ts')
    const processedIndex = webhook.indexOf('if(await processed(s,event.id))')
    const switchIndex = webhook.indexOf('switch(event.type)')
    const markIndex = webhook.lastIndexOf('await mark(s,event)')
    expect(processedIndex).toBeGreaterThan(-1)
    expect(switchIndex).toBeGreaterThan(processedIndex)
    expect(markIndex).toBeGreaterThan(switchIndex)
    expect(webhook).toContain('async function processed')
    expect(webhook).toContain('async function mark')
    expect(webhook).toContain("from('subscriptions').upsert")
    expect(webhook).toContain("from('user_profiles').update")
    expect(webhook).toContain('return NextResponse.json({error:\'Webhook handler failed.\'},{status:500})')
  })

  it('uses the configured canonical app URL rather than a request-controlled Origin for Stripe redirects', () => {
    const checkout = read('app/api/stripe/checkout/route.ts')
    const portal = read('app/api/stripe/portal/route.ts')
    expect(checkout).not.toContain("req.headers.get('origin')")
    expect(portal).not.toContain("req.headers.get('origin')")
  })
})
