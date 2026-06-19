import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listPartnerEcosystemRecords } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const STAGE_COLOURS: Record<string, string> = {
  identified: 'border-white/20 text-white/50',
  contacted: 'border-sky-400/40 text-sky-300',
  engaged: 'border-amber-400/40 text-amber-300',
  active: 'border-emerald-400/40 text-emerald-300',
  strategic: 'border-[#C6A55A]/40 text-[#C6A55A]',
}

const STATUS_COLOURS: Record<string, string> = {
  active: 'border-emerald-400/40 text-emerald-300',
  prospective: 'border-amber-400/40 text-amber-300',
  inactive: 'border-red-400/40 text-red-300',
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export default async function PartnerEcosystemPage() {
  await requireAdminAuth()
  const result = await listPartnerEcosystemRecords()
  const partners = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Partners</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Partner Ecosystem</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          All partners across the Harbourview ecosystem with relationship stages and opportunity mapping.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {['Name', 'Partner Type', 'Markets', 'Categories', 'Relationship Stage', 'Opportunity Mapping', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F5F1E8]/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id} className="border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors align-top">
                <td className="px-4 py-3 font-medium text-[#F5F1E8]">{partner.name}</td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">{partner.partner_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {partner.markets.map((m) => (
                      <span key={m} className="text-[10px] font-semibold text-[#C6A55A]">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px] text-[#F5F1E8]/60">
                  {partner.categories.map((c) => c.replace(/_/g, ' ')).join(', ')}
                </td>
                <td className="px-4 py-3">
                  <Pill label={partner.relationship_stage} cls={STAGE_COLOURS[partner.relationship_stage] ?? 'border-white/20 text-white/50'} />
                </td>
                <td className="px-4 py-3">
                  <ul className="space-y-0.5">
                    {partner.opportunity_mapping.map((opp, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#F5F1E8]/60">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#C6A55A]/50" />
                        {opp}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3">
                  <Pill label={partner.status} cls={STATUS_COLOURS[partner.status] ?? 'border-white/20 text-white/50'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
