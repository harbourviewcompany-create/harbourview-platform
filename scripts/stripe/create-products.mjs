#!/usr/bin/env node
// Run: STRIPE_SECRET_KEY=sk_test_... node scripts/stripe/create-products.mjs
// Creates Intel Plus and Operator products + monthly/annual prices in Stripe
// Outputs the 4 price IDs to paste into Vercel env vars

import Stripe from 'stripe'

const sk = process.env.STRIPE_SECRET_KEY
if (!sk) { console.error('Set STRIPE_SECRET_KEY env var'); process.exit(1) }

const stripe = new Stripe(sk, { apiVersion: '2026-05-27.dahlia' })

async function main() {
  console.log('Creating Stripe products...\n')

  // ── Intel Plus ─────────────────────────────────────────────────────────────
  const intel = await stripe.products.create({
    name: 'Harbourview Intel Plus',
    description: 'Source trail, contradiction review, corridor monitoring, counterparty alerts, watchlists.',
    metadata: { tier: 'intel' },
  })
  console.log(`Intel Plus product: ${intel.id}`)

  const intelMonthly = await stripe.prices.create({
    product: intel.id,
    unit_amount: 14900,       // USD $149.00
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Intel Plus Monthly',
  })

  const intelAnnual = await stripe.prices.create({
    product: intel.id,
    unit_amount: 149000,      // USD $1,490.00
    currency: 'usd',
    recurring: { interval: 'year' },
    nickname: 'Intel Plus Annual',
  })

  // ── Operator ───────────────────────────────────────────────────────────────
  const operator = await stripe.products.create({
    name: 'Harbourview Operator',
    description: 'Everything in Intel Plus plus reviewed counterparty introductions, deal room, proof review, priority queue, analyst access.',
    metadata: { tier: 'operator' },
  })
  console.log(`Operator product: ${operator.id}`)

  const operatorMonthly = await stripe.prices.create({
    product: operator.id,
    unit_amount: 49000,       // USD $490.00
    currency: 'usd',
    recurring: { interval: 'month' },
    nickname: 'Operator Monthly',
  })

  const operatorAnnual = await stripe.prices.create({
    product: operator.id,
    unit_amount: 490000,      // USD $4,900.00
    currency: 'usd',
    recurring: { interval: 'year' },
    nickname: 'Operator Annual',
  })

  console.log('\n── Vercel env vars to set ────────────────────────────────────')
  console.log(`STRIPE_PRICE_INTEL_MONTHLY    = ${intelMonthly.id}`)
  console.log(`STRIPE_PRICE_INTEL_ANNUAL     = ${intelAnnual.id}`)
  console.log(`STRIPE_PRICE_OPERATOR_MONTHLY = ${operatorMonthly.id}`)
  console.log(`STRIPE_PRICE_OPERATOR_ANNUAL  = ${operatorAnnual.id}`)
  console.log('\nDone. Paste these into Vercel → Settings → Environment Variables.')
}

main().catch(err => { console.error(err); process.exit(1) })
