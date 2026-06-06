import { getUserTier, tierAtLeast, type UserTier } from '@/lib/stripe/tier'
import UpgradeButton from '@/components/stripe/UpgradeButton'

const TIER_LABELS: Record<UserTier, string> = {
  free: 'Free',
  intel: 'Intel Plus',
  operator: 'Operator',
}

const UPGRADE_PRICE: Record<UserTier, 'intel_monthly' | 'operator_monthly'> = {
  free: 'intel_monthly',
  intel: 'operator_monthly',
  operator: 'operator_monthly',
}

export default async function TierGate({
  required,
  children,
  label,
}: {
  required: UserTier
  children: React.ReactNode
  label?: string
}) {
  const userTier = await getUserTier()

  if (tierAtLeast(userTier, required)) {
    return <>{children}</>
  }

  const requiredLabel = TIER_LABELS[required]
  const priceKey = UPGRADE_PRICE[userTier]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40 saturate-50">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07111F]/80 backdrop-blur-sm px-6 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#C6A55A]/30 bg-[#C6A55A]/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C6A55A" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <p className="mb-1 text-sm font-semibold text-[#F5F1E8]">
          {label ?? `${requiredLabel} required`}
        </p>
        <p className="mb-5 text-xs text-[#F5F1E8]/50">
          Upgrade to access {requiredLabel} features
        </p>
        <UpgradeButton
          priceKey={priceKey}
          label={`Upgrade to ${requiredLabel}`}
        />
      </div>
    </div>
  )
}
