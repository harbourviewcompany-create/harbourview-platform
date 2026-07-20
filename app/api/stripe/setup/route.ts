import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAuth } from '@/lib/auth/adminApiAuth'

const VERCEL_PROJECT_ID = 'prj_Zp8HBDstqAAOCN6W7LAElahsq3qS'
const VERCEL_TEAM_ID    = 'team_0rK4jTvMLlSufR0ZzX4LCKYi'

async function stripeRequest(path: string, method = 'GET', body?: Record<string, string>, secretKey?: string) {
  const key = secretKey ?? process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? JSON.stringify(data))
  return data
}

async function setVercelEnv(key: string, value: string, vercelToken: string) {
  const check = await fetch(
    `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`,
    { headers: { Authorization: `Bearer ${vercelToken}` } }
  )
  const existing = await check.json()
  const found = existing.envs?.find((e: { key: string }) => e.key === key)

  if (found) {
    // Update existing
    await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${found.id}?teamId=${VERCEL_TEAM_ID}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, target: ['production', 'preview'] }),
      }
    )
  } else {
    // Create new
    await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, type: 'encrypted', target: ['production', 'preview'] }),
      }
    )
  }
}

export async function POST(req: NextRequest) {
  // Admin-only: this endpoint creates Stripe products and writes secrets to the
  // production Vercel environment. It must never be callable unauthenticated.
  const authFailure = await requireAdminApiAuth(req)
  if (authFailure) return authFailure

  try {
    const { stripeKey, vercelToken } = await req.json() as { stripeKey: string; vercelToken: string }

    if (!stripeKey?.startsWith('sk_')) {
      return NextResponse.json({ error: 'Invalid Stripe secret key (must start with sk_)' }, { status: 400 })
    }
    if (!vercelToken) {
      return NextResponse.json({ error: 'Vercel token required' }, { status: 400 })
    }

    const results: Record<string, string> = {}
    const errors: string[] = []

    // ── Create Intel Plus product + prices ────────────────────────────────────
    const intelProduct = await stripeRequest('/products', 'POST', {
      name: 'Harbourview Intel Plus',
      description: 'Source trail access, corridor monitoring, counterparty movement alerts across 50+ jurisdictions.',
    }, stripeKey)

    const intelMonthly = await stripeRequest('/prices', 'POST', {
      product:        intelProduct.id,
      unit_amount:    '14900',
      currency:       'usd',
      'recurring[interval]': 'month',
      nickname:       'Intel Plus Monthly',
    }, stripeKey)

    const intelAnnual = await stripeRequest('/prices', 'POST', {
      product:        intelProduct.id,
      unit_amount:    '149000',
      currency:       'usd',
      'recurring[interval]': 'year',
      nickname:       'Intel Plus Annual',
    }, stripeKey)

    results['STRIPE_PRICE_INTEL_MONTHLY'] = intelMonthly.id
    results['STRIPE_PRICE_INTEL_ANNUAL']  = intelAnnual.id

    // ── Create Operator product + prices ──────────────────────────────────────
    const operatorProduct = await stripeRequest('/products', 'POST', {
      name: 'Harbourview Operator',
      description: 'Full access: reviewed counterparty introductions, deal room, proof review workflow, priority market queue.',
    }, stripeKey)

    const operatorMonthly = await stripeRequest('/prices', 'POST', {
      product:        operatorProduct.id,
      unit_amount:    '49000',
      currency:       'usd',
      'recurring[interval]': 'month',
      nickname:       'Operator Monthly',
    }, stripeKey)

    const operatorAnnual = await stripeRequest('/prices', 'POST', {
      product:        operatorProduct.id,
      unit_amount:    '490000',
      currency:       'usd',
      'recurring[interval]': 'year',
      nickname:       'Operator Annual',
    }, stripeKey)

    results['STRIPE_PRICE_OPERATOR_MONTHLY'] = operatorMonthly.id
    results['STRIPE_PRICE_OPERATOR_ANNUAL']  = operatorAnnual.id

    // ── Webhook endpoint — the last manual step, now automated ────────────────
    // Previously required going into the Stripe Dashboard by hand to create
    // this and copy the signing secret. Stripe only returns `secret` at
    // creation time, so this has to happen here, in the same request.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://harbourview.vercel.app'
    let webhookSecret: string | null = null
    try {
      const webhookParams = new URLSearchParams()
      webhookParams.append('url', `${appUrl}/api/stripe/webhook`)
      webhookParams.append('enabled_events[]', 'checkout.session.completed')
      webhookParams.append('enabled_events[]', 'customer.subscription.created')
      webhookParams.append('enabled_events[]', 'customer.subscription.updated')
      webhookParams.append('enabled_events[]', 'customer.subscription.deleted')
      webhookParams.append('description', 'Harbourview subscription sync (created via /admin/stripe-setup)')

      const webhookRes = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: webhookParams.toString(),
      })
      const webhookData = await webhookRes.json()
      if (!webhookRes.ok) throw new Error(webhookData.error?.message ?? JSON.stringify(webhookData))

      webhookSecret = webhookData.secret ?? null
      if (webhookSecret) {
        results['STRIPE_WEBHOOK_SECRET'] = `${webhookSecret.slice(0, 11)}… (set in Vercel)`
      } else {
        errors.push('Webhook endpoint created but no secret returned — check Stripe Dashboard → Webhooks manually.')
      }
    } catch (e) {
      errors.push(`Webhook endpoint creation failed: ${e instanceof Error ? e.message : 'unknown error'}. Create it manually in Stripe → Webhooks pointing at ${appUrl}/api/stripe/webhook, selecting checkout.session.completed + customer.subscription.created/updated/deleted, then add the signing secret as STRIPE_WEBHOOK_SECRET in Vercel.`)
    }

    // ── Set all env vars in Vercel ────────────────────────────────────────────
    const envVars: Record<string, string> = {
      STRIPE_SECRET_KEY:              stripeKey,
      STRIPE_PRICE_INTEL_MONTHLY:     intelMonthly.id,
      STRIPE_PRICE_INTEL_ANNUAL:      intelAnnual.id,
      STRIPE_PRICE_OPERATOR_MONTHLY:  operatorMonthly.id,
      STRIPE_PRICE_OPERATOR_ANNUAL:   operatorAnnual.id,
      NEXT_PUBLIC_APP_URL:            appUrl,
      ...(webhookSecret ? { STRIPE_WEBHOOK_SECRET: webhookSecret } : {}),
    }

    for (const [key, value] of Object.entries(envVars)) {
      try {
        await setVercelEnv(key, value, vercelToken)
      } catch (e) {
        errors.push(`${key}: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }

    // ── Trigger redeploy ──────────────────────────────────────────────────────
    try {
      await fetch(
        `https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'harbourview-platform',
            gitSource: { type: 'github', ref: 'main', repoId: '958888474' },
          }),
        }
      )
    } catch {
      errors.push('Redeploy trigger failed — redeploy manually in Vercel')
    }

    return NextResponse.json({ ok: true, results, errors: errors.length ? errors : null })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
