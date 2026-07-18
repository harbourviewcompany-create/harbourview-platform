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
    .select('id,priority,status,notes,created_at,org_id,workspaces:org_id(id,slug,legal_name,trade_name,org_type,jurisdiction_country,verification_status)')
    .eq('queue_type', 'org_verification')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  const rows: PendingOrgRow[] = (data ?? []).map((r: any) => ({
    queue_id: r.id,
    org_id: r.org_id,
    priority: r.priority,
    created_at: formatDate(r.created_at),
    legal_name: r.workspaces?.legal_name ?? 'Unknown',
    trade_name: r.workspaces?.trade_name ?? null,
    org_type: r.workspaces?.org_type ?? 'unknown',
    jurisdiction_country: r.workspaces?.jurisdiction_country ?? '??',
    verification_status: r.workspaces?.verification_status ?? 'unverified',
  }))

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-semibold">Organization verification</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">
            New organizations created through Command Centre onboarding, pending Passport verification.
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
