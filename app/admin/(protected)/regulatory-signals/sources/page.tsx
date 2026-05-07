import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createRegulatorySource, listRegulatorySources } from '@/lib/regulatory-signals/admin'

export const dynamic = 'force-dynamic'

async function createSourceAction(formData: FormData) {
  'use server'
  const auth = await requireAdminAuth()
  const result = await createRegulatorySource(formData, auth.user.id)
  if (!result.ok) throw new Error(result.error.message)
  redirect('/admin/regulatory-signals/sources')
}

export default async function RegulatorySourcesPage() {
  await requireAdminAuth()
  const sources = await listRegulatorySources()

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Regulatory Sources</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">Manual source registry for regulatory Signals. Automated scraping is not enabled in V1.</p>
      </div>

      <form action={createSourceAction} className="mb-8 grid gap-3 rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] p-5 text-sm md:grid-cols-2">
        <input name="source_name" placeholder="Source name" className="rounded bg-black/30 p-3" required />
        <input name="base_url" placeholder="Base URL" className="rounded bg-black/30 p-3" required />
        <select name="source_tier" className="rounded bg-black/30 p-3" defaultValue="tier_1_official">
          <option value="tier_1_official">Tier 1 official</option>
          <option value="tier_2_professional">Tier 2 professional</option>
          <option value="tier_3_secondary">Tier 3 secondary</option>
        </select>
        <input name="source_type" placeholder="Source type" defaultValue="regulator" className="rounded bg-black/30 p-3" />
        <input name="country_name" placeholder="Country" className="rounded bg-black/30 p-3" />
        <input name="regulator_name" placeholder="Regulator" className="rounded bg-black/30 p-3" />
        <textarea name="validation_notes" placeholder="Validation notes" className="rounded bg-black/30 p-3 md:col-span-2" />
        <button className="rounded-full bg-[#C6A55A] px-5 py-3 font-medium text-[#081423] md:col-span-2">Create Source</button>
      </form>

      {!sources.ok ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">{sources.error.message}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]"><tr><th className="p-4">Source</th><th className="p-4">Tier</th><th className="p-4">Country</th><th className="p-4">Regulator</th></tr></thead>
            <tbody className="divide-y divide-white/10">
              {sources.data.length ? sources.data.map((source) => (
                <tr key={source.id} className="text-[#F5F1E8]/75">
                  <td className="p-4"><div className="font-medium text-[#F5F1E8]">{source.source_name}</div><div className="text-xs text-[#F5F1E8]/45">{source.base_url}</div></td>
                  <td className="p-4">{source.source_tier}</td>
                  <td className="p-4">{source.country_name || 'Global'}</td>
                  <td className="p-4">{source.regulator_name || 'Not set'}</td>
                </tr>
              )) : <tr><td colSpan={4} className="p-8 text-center text-[#F5F1E8]/55">No regulatory sources captured.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
