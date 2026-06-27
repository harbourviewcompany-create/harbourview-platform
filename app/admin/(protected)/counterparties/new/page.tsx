import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  createCounterparty,
  ROLE_LABELS,
  COUNTERPARTY_ROLES,
} from '@/lib/admin/counterpartiesQuery'

export const dynamic = 'force-dynamic'

async function submitNewCounterparty(formData: FormData) {
  'use server'
  const markets    = String(formData.get('markets') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const categories = String(formData.get('categories') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  await createCounterparty({
    name:                 String(formData.get('name') ?? ''),
    role:                 String(formData.get('role') ?? ''),
    markets,
    categories,
    needs_profile:        String(formData.get('needs_profile') ?? '') || null,
    supply_profile:       String(formData.get('supply_profile') ?? '') || null,
    documentation_status: (formData.get('documentation_status') as 'complete' | 'partial' | 'missing') ?? 'missing',
  })
  redirect('/admin/counterparties?created=1')
}

export default async function NewCounterpartyPage() {
  await requireAdminAuth()

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin/counterparties" className="text-[#C6A55A] text-sm hover:underline">← Counterparties</Link>
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#C6A55A]">New counterparty</p>
        <h2 className="mt-1 text-2xl font-semibold">Add counterparty</h2>
        <p className="mt-1 text-sm text-[#F5F1E8]/50">
          Manually add a counterparty to the intelligence network.
        </p>
      </div>

      <form action={submitNewCounterparty} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Name *</label>
            <input
              name="name"
              required
              autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40"
              placeholder="Company or individual name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Role *</label>
            <select
              name="role"
              defaultValue="other"
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
            Markets <span className="normal-case text-[#F5F1E8]/30">(comma-separated, e.g. Germany, UK, Canada or ISO2 codes)</span>
          </label>
          <input
            name="markets"
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
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40"
            placeholder="cannabis inventory, packaging"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Needs profile</label>
            <textarea
              name="needs_profile"
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F1E8] outline-none focus:border-[#C6A55A]/40 resize-none"
              placeholder="What this counterparty is seeking…"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.12em] text-[#F5F1E8]/45">Supply profile</label>
            <textarea
              name="supply_profile"
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
            defaultValue="missing"
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
            Create counterparty
          </button>
          <Link
            href="/admin/counterparties"
            className="text-[#F5F1E8]/40 text-sm hover:text-[#F5F1E8] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
