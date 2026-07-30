import React from 'react'
import type { FeatureAccess } from '@/lib/billing/entitlements'

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

export function WatchlistUpgradeGate({ access }: { access: FeatureAccess }) {
  const requiredLabel = TIER_LABEL[access.requiredTier] ?? access.requiredTier
  const currentLabel = TIER_LABEL[access.currentTier] ?? access.currentTier

  return (
    <div className="wug-root">
      <style>{CSS}</style>
      <div className="wug-icon">◈</div>
      <div className="wug-title">Watchlist is a {requiredLabel} feature</div>
      <p className="wug-body">
        Track markets, signals, and counterparties with automatic alerts when watched jurisdictions
        change status. Your current plan is {currentLabel} — upgrade to {requiredLabel} or above to
        unlock Watchlist.
      </p>
      <a href="/intake" className="wug-cta">
        Upgrade to {requiredLabel} →
      </a>
    </div>
  )
}

const CSS = `
.wug-root {
  display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;
  padding:56px 24px;max-width:440px;margin:0 auto;
}
.wug-icon { font-size:32px;color:rgba(212,168,75,.35); }
.wug-title { font-family:'Georgia',serif;font-size:20px;font-weight:400;color:#f5f0e8; }
.wug-body { font-size:12px;color:rgba(245,240,232,.45);line-height:1.7; }
.wug-cta {
  display:inline-flex;align-items:center;padding:9px 18px;border-radius:8px;
  font-size:12px;font-weight:600;background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;transition:opacity .12s;margin-top:4px;
}
.wug-cta:hover { opacity:.88; }
`
