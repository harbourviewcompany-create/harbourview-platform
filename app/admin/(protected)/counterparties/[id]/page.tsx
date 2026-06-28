import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getCounterpartyById,
  updateCounterparty,
  deleteCounterparty,
  ROLE_LABELS,
  DOC_STATUS_LABELS,
  DOC_STATUS_COLORS,
  COUNTERPARTY_ROLES,
} from '@/lib/admin/counterpartiesQuery'

export const dynamic = 'force-dynamic'

async function saveCounterparty(id: string, formData: FormData) {
  'use server'
  const markets    = String(formData.get('markets') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const categories = String(formData.get('categories') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  await updateCounterparty(id, {
    name:                 String(formData.get('name') ?? ''),
    role:                 String(formData.get('role') ?? ''),
    markets,
    categories,
    needs_profile:        String(formData.get('needs_profile') ?? '') || null,
    supply_profile:       String(formData.get('supply_profile') ?? '') || null,
    documentation_status: (formData.get('documentation_status') as 'complete' | 'partial' | 'missing') ?? 'missing',
  })
  redirect(`/admin/counterparties/${encodeURIComponent(id)}?saved=1`)
}

export default async function CounterpartyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  await requireAdminAuth()
  const { id } = await params
  const { saved } = await searchParams

  const result = await getCounterpartyById(decodeURIComponent(id))
  if (!result.ok || !result.data) return notFound()
  const cp = result.data

  async function deleteAction() {
    'use server'
    await deleteCounterparty(cp.id)
    redirect('/admin/counterparties?deleted=1')
  }

  const action = saveCounterparty.bind(null, cp.id)

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin/counterparties" className="text-[#C6A55A] text-sm hover:underline">← Counterparties</Link>
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Counterparty</p>
        <h2 className="mt-1 text-2xl font-semibold">{cp.name}</h2>
        <p className="mt-1 text-sm text-[#F5F1E8]/50">
          {ROLE_LABELS[cp.role] ?? cp.role}
          {' · '}
          <span className={DOC_STATUS_COLORS[cp.documentation_status]}>
            {DOC_STATUS_LABELS[cp.documentation_status]}
          </span>
          {' · '}
          {cp.interaction_count} interaction{cp.interaction_count !== 1 ? 's' : ''}
          {' · '}
          {cp.introduction_count} intro{cp.introduction_count !== 1 ? 's' : ''}
        </p>
      </div>

      {saved === '1' && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          Saved successfully.
        </div>
      )}

      <form action={action} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Name</label>
            <input
              name="name"
              defaultValue={cp.name}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Role</label>
            <select
              name="role"
              defaultValue={cp.role}
              className="w-full rounded-lg border border-white/10 bg-[#081423] px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40"
            >
              {COUNTERPARTY_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">
            Markets <span className="normal-case text-[#F5F1E8]/30">(comma-separated, e.g. Germany, UK, Canada)</span>
          </label>
          <input
            name="markets"
            defaultValue={cp.markets.join(', ')}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40"
            placeholder="Germany, UK, Canada"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">
            Categories <span className="normal-case text-[#F5F1E8]/30">(comma-separated)</span>
          </label>
          <input
            name="categories"
            defaultValue={cp.categories.join(', ')}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40"
            placeholder="cannabis inventory, packaging"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Needs profile</label>
            <textarea
              name="needs_profile"
              defaultValue={cp.needs_profile ?? ''}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40 resize-none"
              placeholder="What this counterparty is seeking…"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Supply profile</label>
            <textarea
              name="supply_profile"
              defaultValue={cp.supply_profile ?? ''}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40 resize-none"
              placeholder="What this counterparty can supply…"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Documentation status</label>
          <select
            name="documentation_status"
            defaultValue={cp.documentation_status}
            className="rounded-lg border border-white/10 bg-[#081423] px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40"
          >
            <option value="complete">Complete</option>
            <option value="partial">Partial</option>
            <option value="missing">Missing</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg border border-[#C6A55A]/35 bg-[#C6A55A]/10 px-5 py-2 text-sm font-semibold text-[#C6A55A] hover:bg-[#C6A55A]/20 transition-colors"
          >
            Save changes
          </button>
          <Link
            href="/admin/counterparties"
            className="text-[#F5F1E8]/40 text-sm hover:text-[#F5F1E8] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Read-only metadata */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-5 text-xs text-[#F5F1E8]/35 space-y-1">
        <div>ID: <span className="font-mono">{cp.id}</span></div>
        <div>Last interaction: {cp.last_interaction ?? 'None recorded'}</div>
        <div>Created: {new Date(cp.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <div>Updated: {new Date(cp.updated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.14em] text-red-400/70">Danger zone</p>
        <p className="text-sm text-[#F5F1E8]/45">
          Permanently removes this counterparty record. Interaction history and introduction logs referencing this record may be affected.
        </p>
        <form action={deleteAction}>
          <button
            type="submit"
            className="rounded-lg border border-red-700/40 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/40 transition-colors"
            onClick={undefined}
          >
            Delete counterparty
          </button>
        </form>
      </div>
    </section>
  )
}
