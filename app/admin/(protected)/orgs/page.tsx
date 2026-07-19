import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import OrgReviewTable, { type PendingOrgRow } from './OrgReviewTable'

export const dynamic = 'force-dynamic'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

export default async function OrgReviewPage() {
  await requireAdminAuth()
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('hv_admin_review_queue')
    .select('id,queue_type,target_entity_type,target_entity_id,priority,status,notes,created_at,org_id,workspaces:org_id(id,slug,legal_name,trade_name,org_type,jurisdiction_country,verification_status)')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  const licenceIds = (data ?? [])
    .filter(r => r.target_entity_type === 'licence')
    .map(r => r.target_entity_id)

  const { data: licences } = licenceIds.length
    ? await supabase.from('hv_licences').select('id,licence_number,licence_type,jurisdiction_country').in('id', licenceIds)
    : { data: [] as any[] }

  const licenceById = new Map((licences ?? []).map((l: any) => [l.id, l]))

  const rows: PendingOrgRow[] = (data ?? []).map((r: any) => {
    const licence = r.target_entity_type === 'licence' ? licenceById.get(r.target_entity_id) : null
    return {
      queue_id: r.id,
      org_id: r.org_id,
      queue_type: r.queue_type,
      licence_id: r.target_entity_type === 'licence' ? r.target_entity_id : null,
      priority: r.priority,
      created_at: formatDate(r.created_at),
      legal_name: r.workspaces?.legal_name ?? 'Unknown',
      trade_name: r.workspaces?.trade_name ?? null,
      org_type: r.workspaces?.org_type ?? 'unknown',
      jurisdiction_country: licence?.jurisdiction_country ?? r.workspaces?.jurisdiction_country ?? '??',
      verification_status: r.workspaces?.verification_status ?? 'unverified',
      licence_number: licence?.licence_number ?? null,
      licence_type: licence?.licence_type ?? null,
      notes: r.notes ?? null,
    }
  })

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Verification queue</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            Only items that couldn't be auto-verified reach this queue — most licences match the public
            regulator registry automatically and never need a human.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-red-100">
          {error.message}
        </div>
      ) : null}

      <OrgReviewTable rows={rows} />
    </section>
  )
}
