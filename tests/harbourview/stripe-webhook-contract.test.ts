import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  HARBOURVIEW_STRIPE_WEBHOOK_EVENTS,
  HARBOURVIEW_STRIPE_WEBHOOK_PATH,
  harbourviewStripeWebhookUrl,
} from '../../lib/stripe/webhookConfig'

const repoRoot = process.cwd()
const canonicalUrl = 'https://harbourview.vercel.app/api/stripe/webhook'
const obsoletePath = '/api/webhooks/stripe'

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8')
}

describe('Harbourview Stripe webhook contract', () => {
  it('pins the canonical production route', () => {
    expect(HARBOURVIEW_STRIPE_WEBHOOK_PATH).toBe('/api/stripe/webhook')
    expect(harbourviewStripeWebhookUrl('https://harbourview.vercel.app')).toBe(canonicalUrl)
    expect(harbourviewStripeWebhookUrl('https://harbourview.vercel.app/')).toBe(canonicalUrl)
    expect(existsSync(join(repoRoot, 'app/api/stripe/webhook/route.ts'))).toBe(true)
  })

  it('pins the four entitlement events handled by the webhook', () => {
    expect(HARBOURVIEW_STRIPE_WEBHOOK_EVENTS).toEqual([
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ])
  })

  it('makes Stripe setup consume the canonical contract instead of an alternate path', () => {
    const setup = readRepoFile('app/api/stripe/setup/route.ts')
    expect(setup).toContain('harbourviewStripeWebhookUrl')
    expect(setup).toContain('HARBOURVIEW_STRIPE_WEBHOOK_EVENTS')
    expect(setup).not.toContain(obsoletePath)
  })

  it('keeps operator health evidence protected under the admin route tree', () => {
    const healthPath = 'app/admin/(protected)/stripe-health/page.tsx'
    expect(existsSync(join(repoRoot, healthPath))).toBe(true)
    const health = readRepoFile(healthPath)
    expect(health).toContain('Stripe Webhook Health')
    expect(health).toContain('HARBOURVIEW_STRIPE_WEBHOOK_EVENTS')
    expect(health).toContain('Secrets are never displayed')
    expect(health).toContain('Wurx')
  })

  it('keeps the admin navigation wired to webhook health', () => {
    const nav = readRepoFile('lib/admin/navConfig.ts')
    expect(nav).toContain("href: '/admin/stripe-health'")
  })
})
