import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createRegulatorySignal } from '@/lib/regulatory-signals/admin'

export const dynamic = 'force-dynamic'

async function createSignalAction(formData: FormData) {
  'use server'
  const auth = (await requireAdminAuth())!
  const result = await createRegulatorySignal(formData, auth.user.id)
  if (!result.ok) throw new Error((result as any).error.message)
  redirect('/admin/regulatory-signals')
}

export default async function NewRegulatorySignalPage() {
  await requireAdminAuth()

  return (
    <section className="max-w-3xl">
      <h2 className="text-2xl font-semibold">New Regulatory Signal</h2>
      <p className="mt-2 text-sm text-[#F5F1E8]/65">Manual source-backed regulatory Signal capture. Publication is gated after review.</p>
      <form action={createSignalAction} className="mt-6 grid gap-4 text-sm">
        <input name="headline" placeholder="Headline" className="rounded bg-black/30 p-3" required />
        <input name="slug" placeholder="slug" className="rounded bg-black/30 p-3" required />
        <select name="signal_type" className="rounded bg-black/30 p-3" defaultValue="regulatory_guidance">
          <option value="regulatory_guidance">Regulatory guidance</option>
          <option value="policy_consultation">Policy consultation</option>
          <option value="legislation_change">Legislation change</option>
          <option value="import_export_pathway">Import/export pathway</option>
          <option value="licensing_market_access">Licensing/market access</option>
          <option value="prescription_patient_access">Prescription/patient access</option>
          <option value="hemp_cbd_boundary">Hemp/CBD boundary</option>
          <option value="enforcement_action">Enforcement action</option>
          <option value="pharmaceutical_reclassification">Pharmaceutical reclassification</option>
          <option value="trade_agreement">Trade agreement</option>
          <option value="court_decision">Court decision</option>
          <option value="quota_allocation">Quota allocation</option>
          <option value="international_treaty">International treaty</option>
          <option value="industrial_use_access">Industrial use access</option>
          <option value="professional_access">Professional access</option>
          <option value="research_access">Research access</option>
          <option value="enforcement_risk">Enforcement risk</option>
          <option value="market_exit">Market exit</option>
        </select>
        <input name="signal_date" type="date" className="rounded bg-black/30 p-3" required />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="country_name" placeholder="Country" className="rounded bg-black/30 p-3" />
          <input name="country_code" placeholder="Country code" className="rounded bg-black/30 p-3" />
        </div>
        <input name="region" placeholder="Region" className="rounded bg-black/30 p-3" />
        <input name="regulator_name" placeholder="Regulator / authority" className="rounded bg-black/30 p-3" />
        <select name="source_tier" className="rounded bg-black/30 p-3" defaultValue="tier_1_official">
          <option value="tier_1_official">Tier 1 official</option>
          <option value="tier_2_professional">Tier 2 professional</option>
          <option value="tier_3_secondary">Tier 3 secondary</option>
        </select>
        <input name="source_type" placeholder="Source type, e.g. regulator" defaultValue="regulator" className="rounded bg-black/30 p-3" />
        <input name="source_url" placeholder="Private/source URL" className="rounded bg-black/30 p-3" required />
        <input name="canonical_source_url" placeholder="Public canonical source URL" className="rounded bg-black/30 p-3" />
        <textarea name="private_summary" placeholder="Private summary" className="min-h-28 rounded bg-black/30 p-3" required />
        <textarea name="public_summary" placeholder="Public summary" className="min-h-24 rounded bg-black/30 p-3" />
        <textarea name="public_implication" placeholder="Public implication" className="min-h-24 rounded bg-black/30 p-3" />
        <label className="flex items-center gap-2"><input type="checkbox" name="public_safe" /> Public safe</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="publish_to_public" /> Publish to public when approved</label>
        <button className="rounded-full bg-[#C6A55A] px-5 py-3 font-medium text-[#081423]">Create Signal</button>
      </form>
    </section>
  )
}
