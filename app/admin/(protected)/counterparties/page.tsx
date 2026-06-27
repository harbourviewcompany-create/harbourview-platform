import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import {
  listCounterparties,
  ROLE_LABELS,
  DOC_STATUS_LABELS,
  DOC_STATUS_COLORS,
} from '@/lib/admin/counterpartiesQuery'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CounterpartiesPage({
  searchParams,
}: {
  searchParams: Promise<{ doc_status?: string; role?: string; created?: string; deleted?: string }>
}) {
  await requireAdminAuth()
  const { doc_status, role, created, deleted } = await searchParams

  const result = await listCounterparties({ doc_status, role, limit: 100 })
  const counterparties = result.ok ? result.data : []
  const isFixture = !result.ok

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence Automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Counterparties</h2>
          <p className="mt-1 text-sm text-[#F5F1E8]/55">
            Tracked counterparty network. {counterparties.length} record{counterparties.length !== 1 ? 's' : ''}.
            Edit profiles and normalise market coverage from the detail view.
          </p>
        </div>
        <Link
          href="/admin/counterparties/new"
          className="shrink-0 rounded-lg border border-[#C6A55A]/35 bg-[#C6A55A]/10 px-4 py-2 text-sm font-medium text-[#C6A55A] hover:bg-[#C6A55A]/20 transition-colors"
        >
          + New counterparty
        </Link>
      </div>

      {isFixture && <FixtureBanner isFixture label="SUPABASE_SERVICE_ROLE_KEY not set — cannot read ia_counterparties." />}

      {created === '1' && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          Counterparty created successfully.
        </div>
      )}
      {deleted === '1' && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-950/30 px-4 py-3 text-sm text-amber-400">
          Counterparty deleted.
        </div>
      )}

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-2 text-sm">
        <select
          name="doc_status"
          defaultValue={doc_status ?? ''}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[#F5F1E8] text-sm"
        >
          <option value="">All doc statuses</option>
          {(['complete', 'partial', 'missing'] as const).map(s => (
            <option key={s} value={s}>{DOC_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          name="role"
          defaultValue={role ?? ''}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[#F5F1E8] text-sm"
        >
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-[#C6A55A]/30 bg-[#C6A55A]/10 px-4 py-1.5 text-[#C6A55A] text-sm font-medium hover:bg-[#C6A55A]/20 transition-colors"
        >
          Filter
        </button>
        {(doc_status || role) && (
          <Link
            href="/admin/counterparties"
            className="rounded-lg border border-white/10 px-4 py-1.5 text-[#F5F1E8]/50 text-sm hover:text-[#F5F1E8] transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {counterparties.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-[#F5F1E8]/40 text-sm">No counterparties found.</p>
          <p className="mt-2 text-[#F5F1E8]/25 text-xs">Records populate from the intelligence automation pipeline as sources and opportunities are processed.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[#F5F1E8]/40 text-xs uppercase tracking-[0.12em]">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Markets</th>
                <th className="px-4 py-3 text-left font-medium">Docs</th>
                <th className="px-4 py-3 text-right font-medium">Interactions</th>
                <th className="px-4 py-3 text-right font-medium">Intros</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {counterparties.map(cp => (
                <tr key={cp.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{cp.name}</td>
                  <td className="px-4 py-3 text-[#F5F1E8]/65">{ROLE_LABELS[cp.role] ?? cp.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {cp.markets.slice(0, 3).map(m => (
                        <span key={m} className="rounded-full bg-[#C6A55A]/10 border border-[#C6A55A]/20 px-2 py-0.5 text-[10px] text-[#C6A55A]">{m}</span>
                      ))}
                      {cp.markets.length > 3 && (
                        <span className="text-[#F5F1E8]/30 text-[10px]">+{cp.markets.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 font-medium text-xs ${DOC_STATUS_COLORS[cp.documentation_status] ?? 'text-[#F5F1E8]/50'}`}>
                    {DOC_STATUS_LABELS[cp.documentation_status] ?? cp.documentation_status}
                  </td>
                  <td className="px-4 py-3 text-right text-[#F5F1E8]/55">{cp.interaction_count}</td>
                  <td className="px-4 py-3 text-right text-[#F5F1E8]/55">{cp.introduction_count}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/counterparties/${encodeURIComponent(cp.id)}`}
                      className="text-[#C6A55A] text-xs hover:underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
