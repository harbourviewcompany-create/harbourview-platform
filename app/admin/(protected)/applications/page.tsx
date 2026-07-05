import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { listPendingProfessionals, listPendingSupplierProfiles } from '@/lib/admin/applicationsQuery'
import { ApplicationsList } from './ApplicationsList'

export const dynamic = 'force-dynamic'

export default async function PendingApplicationsPage() {
  await requireAdminAuth()

  const [professionalsResult, suppliersResult] = await Promise.all([
    listPendingProfessionals(),
    listPendingSupplierProfiles(),
  ])

  const professionals = professionalsResult.ok ? professionalsResult.data : []
  const suppliers = suppliersResult.ok ? suppliersResult.data : []
  const isLive = professionalsResult.ok && suppliersResult.ok

  return (
    <section className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Public submissions</p>
        <h2 className="mt-1 text-2xl font-semibold">Pending Applications</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/65">
          Professionals Directory and Supplier Directory applications submitted publicly. Neither
          appears anywhere until approved here.{' '}
          <span
            className={`text-[10px] uppercase tracking-[0.14em] ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}
          >
            {isLive ? 'Live' : 'Fixture'}
          </span>
        </p>
      </div>
      <ApplicationsList professionals={professionals} suppliers={suppliers} />
    </section>
  )
}
