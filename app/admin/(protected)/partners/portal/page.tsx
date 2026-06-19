import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'

export const dynamic = 'force-dynamic'

export default async function PartnerPortalPage() {
  await requireAdminAuth()

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={false} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Partners</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Partner Portal</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Planned partner-facing portal for onboarding, deal flow, and opportunity access.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Coming Soon</p>
        <h3 className="text-xl font-semibold text-[#F5F1E8]">Partner Portal — In Development</h3>
        <p className="mx-auto max-w-lg text-sm text-[#F5F1E8]/60">
          The Harbourview Partner Portal will provide vetted ecosystem partners with direct access to deal
          flow, buyer demand signals, opportunity briefs, and co-facilitation workflows. Partners will be
          able to register, manage their profile, submit referrals, and track introductions through to
          closing — with success fee visibility and milestone tracking built in.
        </p>
        <div className="pt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 max-w-2xl mx-auto text-left">
          {[
            { label: 'Partner Onboarding', desc: 'Structured partner registration and vetting workflow.' },
            { label: 'Deal Flow Access', desc: 'Curated deal opportunities matched to partner capabilities.' },
            { label: 'Buyer Demand Signals', desc: 'Real-time buyer demand data for partner markets.' },
            { label: 'Referral Tracking', desc: 'Submit and track referrals with milestone visibility.' },
            { label: 'Success Fee Dashboard', desc: 'Transparent fee tracking from introduction to close.' },
            { label: 'Partner Intelligence', desc: 'Market briefs and regulatory updates for active markets.' },
          ].map((feature) => (
            <div key={feature.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#F5F1E8]">{feature.label}</p>
              <p className="mt-1 text-[11px] text-[#F5F1E8]/55">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
