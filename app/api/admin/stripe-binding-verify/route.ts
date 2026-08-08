import 'server-only'
import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

const EXPECTED_ACCOUNT_ID = 'acct_1TfSk5HGqu2rN3Ie'
const VERIFY_TOKEN_SHA256 = '30bbce7e95430e94959ff81c42474b939d38a1cb8a31503ee7319dcdbe86fe5b'

function tokenMatches(token: string | null): boolean {
  if (!token) return false
  return createHash('sha256').update(token).digest('hex') === VERIFY_TOKEN_SHA256
}

async function stripeGet(path: string, key: string) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  const body = await response.json()
  return { ok: response.ok, status: response.status, body }
}

export async function GET(req: NextRequest) {
  if (!tokenMatches(req.nextUrl.searchParams.get('token'))) {
    return new NextResponse(null, { status: 404 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY ?? ''
  const webhookSecretPresent = Boolean(process.env.STRIPE_WEBHOOK_SECRET)
  const prices = {
    STRIPE_PRICE_INTEL_MONTHLY: process.env.STRIPE_PRICE_INTEL_MONTHLY ?? '',
    STRIPE_PRICE_INTEL_ANNUAL: process.env.STRIPE_PRICE_INTEL_ANNUAL ?? '',
    STRIPE_PRICE_OPERATOR_MONTHLY: process.env.STRIPE_PRICE_OPERATOR_MONTHLY ?? '',
    STRIPE_PRICE_OPERATOR_ANNUAL: process.env.STRIPE_PRICE_OPERATOR_ANNUAL ?? '',
  }

  const result: Record<string, unknown> = {
    secretKeyPresent: Boolean(secretKey),
    webhookSecretPresent,
    expectedAccountId: EXPECTED_ACCOUNT_ID,
    authenticatedAccountId: null,
    accountMatch: false,
    prices: {},
  }

  if (!secretKey) {
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  }

  const account = await stripeGet('/account', secretKey)
  const accountId = account.ok && typeof account.body?.id === 'string' ? account.body.id : null
  result.authenticatedAccountId = accountId
  result.accountMatch = accountId === EXPECTED_ACCOUNT_ID

  const priceResults: Record<string, unknown> = {}
  for (const [name, priceId] of Object.entries(prices)) {
    if (!priceId) {
      priceResults[name] = { configured: false, exists: false }
      continue
    }
    const price = await stripeGet(`/prices/${encodeURIComponent(priceId)}`, secretKey)
    priceResults[name] = {
      configured: true,
      exists: price.ok && price.body?.object === 'price',
      active: price.ok && typeof price.body?.active === 'boolean' ? price.body.active : null,
      lookupStatus: price.status,
    }
  }
  result.prices = priceResults

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
