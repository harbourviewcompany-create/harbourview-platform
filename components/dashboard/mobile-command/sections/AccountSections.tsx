import { SectionShell, type SectionRef } from '../SectionUI'
import { DealRoomsPanel } from '../../pages/DealRoomsPanel'
import UpgradeButton from '@/components/stripe/UpgradeButton'
import ManageBillingButton from '@/components/stripe/ManageBillingButton'
import { TIER_DISPLAY } from '@/lib/stripe/tierDisplay'
import type { UserTier } from '@/lib/stripe/tier'

// Subscription/billing — previously only existed at the standalone /account
// route, which had no equivalent anywhere in Command Centre (desktop or
// mobile). Reuses the same UpgradeButton/ManageBillingButton/TIER_DISPLAY as
// the desktop SettingsPage rather than a separate implementation.
export function SettingsSection({ sectionRef, userTier = 'free' }: {
  sectionRef: SectionRef
  userTier?: UserTier
}) {
  return (
    <SectionShell
      id="settings"
      sectionRef={sectionRef}
      eyebrow="Account"
      title="Subscription & billing"
      description="Your current plan, feature access, and billing management."
    >
      <div className="cc-settings-subscription" style={{ alignItems: 'flex-start' }}>
        <div className="cc-sub-plan-badge">
          <span className={`cc-status-badge cc-status-badge--${userTier}`}>
            {userTier === 'free' ? 'Free' : TIER_DISPLAY[userTier].name}
          </span>
          {userTier !== 'free' && <ManageBillingButton />}
        </div>
        {userTier !== 'operator' && (
          <div className="cc-sub-upgrade-row" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
            {(userTier === 'free' ? ['intel', 'operator'] as const : ['operator'] as const).map(tierKey => (
              <div key={tierKey} className="cc-sub-upgrade-card">
                <strong>{TIER_DISPLAY[tierKey].name}</strong>
                <span className="cc-sub-upgrade-price">{TIER_DISPLAY[tierKey].monthly.label}</span>
                <UpgradeButton
                  priceKey={TIER_DISPLAY[tierKey].monthly.key}
                  label={`Upgrade to ${TIER_DISPLAY[tierKey].name}`}
                  className="cc-sub-upgrade-btn"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  )
}

// Deal rooms — the in-shell DealRoomsPanel (components/dashboard/pages/
// DealRoomsPanel.tsx) already existed for desktop's Marketplace subView but
// had no mobile presence at all. Reused as-is: its table/thread CSS already
// has a responsive breakpoint in CommandCentre.css.
export function DealRoomsSection({ sectionRef }: { sectionRef: SectionRef }) {
  return (
    <SectionShell
      id="deal-rooms"
      sectionRef={sectionRef}
      eyebrow="Marketplace"
      title="Deal rooms"
      description="Private negotiation threads opened from marketplace listings."
    >
      <DealRoomsPanel />
    </SectionShell>
  )
}
