// Plain display data for subscription tiers — deliberately NOT server-only.
// Split out of lib/stripe/server.ts (which imports the Stripe SDK and is
// server-only) so client components — specifically SettingsPage inside
// components/dashboard/CommandCentre.tsx — can render tier names, pricing,
// and feature lists without pulling the Stripe SDK into the client bundle.
// lib/stripe/server.ts re-exports this for backward compatibility with
// existing imports (e.g. app/account/page.tsx).

import type { PriceKey } from './types'

export const TIER_DISPLAY = {
  intel: {
    name: 'Intel Plus',
    monthly: { label: 'USD $149 / mo', key: 'intel_monthly' as PriceKey },
    annual:  { label: 'USD $1,490 / yr', key: 'intel_annual' as PriceKey },
    features: [
      'Source trail access on every signal',
      'Contradiction review and confidence context',
      'Saved watchlists',
    ],
  },
  operator: {
    name: 'Operator',
    monthly: { label: 'USD $490 / mo', key: 'operator_monthly' as PriceKey },
    annual:  { label: 'USD $4,900 / yr', key: 'operator_annual' as PriceKey },
    features: [
      'Everything in Intel Plus',
      'Reviewed counterparty introductions',
      'Deal room access',
      'Proof review workflow',
      'Direct Harbourview analyst access',
    ],
  },
} as const
