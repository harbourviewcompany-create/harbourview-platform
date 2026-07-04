import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { TierSelect } from './TierSelect'

export const dynamic = 'force-dynamic'

type MemberRow = {
  id: string
  email: string | null
  full_name: string | null
  company: string | null
  tier: string | null
  stripe_customer_id: string | null
  created_at: string
}

const TIER_COUNTS_LABEL: Record<string, string> = {
  free: 'Free',
  intel: 'Intel (paid)',
  operator: 'Operator',
}

export default async function MembersPage() {
  await requireAdminAuth()

  const supabase = await createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, company, tier, stripe_customer_id, created_at')
    .order('created_at', { ascending: false })

  const members = (data ?? []) as MemberRow[]
  const counts = members.reduce<Record<string, number>>((acc, m) => {
    const key = m.tier ?? 'free'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Tiered access</p>
        <h2 className="mt-1 text-2xl font-semibold">Members</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#F5F1E8]/65">
          Manual tier management ahead of Stripe self-serve upgrades. <span className="text-[#F5F1E8]/85">Intel</span> and{' '}
          <span className="text-[#F5F1E8]/85">Operator</span> tiers get the full signal feed and country intelligence
          briefings (enforced via RLS, not just page-gating) &mdash; <span className="text-[#F5F1E8]/85">Free</span> gets
          the public daily digest only.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
          Failed to load members: {error.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {(['free', 'intel', 'operator'] as const).map((t) => (
          <div key={t} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-2xl font-semibold text-[#F5F1E8]">{counts[t] ?? 0}</p>
            <p className="text-xs uppercase tracking-[0.14em] text-[#C6A55A]/80">{TIER_COUNTS_LABEL[t]}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-left text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name / Company</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">Stripe</th>
              <th className="px-4 py-3">Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-[#F5F1E8]">{m.email ?? '—'}</td>
                <td className="px-4 py-3 text-[#F5F1E8]/60">
                  {[m.full_name, m.company].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="px-4 py-3 text-[#F5F1E8]/45">
                  {new Date(m.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-[#F5F1E8]/45">
                  {m.stripe_customer_id ? (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
                      linked
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <TierSelect userId={m.id} currentTier={m.tier ?? 'free'} />
                </td>
              </tr>
            ))}
            {members.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#F5F1E8]/45">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
