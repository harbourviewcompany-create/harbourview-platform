import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listPartnerEcosystemRecords } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

export default async function PartnersOverviewPage() {
  await requireAdminAuth()
  const result = await listPartnerEcosystemRecords()
  const partners = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  const activePartners = partners.filter((p) => p.status === 'active').length
  const strategicPartners = partners.filter((p) => p.relationship_stage === 'strategic').length
  const prospectivePartners = partners.filter((p) => p.status === 'prospective').length

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Partners</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Partner Ecosystem</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          Overview of the Harbourview partner network across all markets and partner types.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Total Partners</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{partners.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Active Partners</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{activePartners}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Strategic Partners</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{strategicPartners}</p>
        </div>
        <div className="bg-white/[0.03] border border-[#C6A55A]/25 rounded-xl p-4">
          <p className="text-xs text-[#F5F1E8]/50">Prospective Partners</p>
          <p className="mt-2 text-3xl font-semibold text-[#F5F1E8]">{prospectivePartners}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            href: '/admin/partners/ecosystem',
            label: 'Partner Ecosystem',
            desc: 'Full partner directory with relationship stages, markets, and opportunity mapping.',
            count: `${partners.length} partners`,
          },
          {
            href: '/admin/partners/portal',
            label: 'Partner Portal',
            desc: 'Planned partner-facing portal for onboarding, deal flow, and opportunity access.',
            count: 'Coming soon',
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">{card.count}</p>
            <p className="mt-2 font-semibold text-[#F5F1E8]">{card.label}</p>
            <p className="mt-1 text-sm text-[#F5F1E8]/55">{card.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
