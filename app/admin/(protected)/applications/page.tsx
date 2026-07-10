import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { listPendingProfessionals, listPendingSupplierProfiles } from '@/lib/admin/applicationsQuery'
import { DecisionButtons } from './ApplicationActions'

export const dynamic = 'force-dynamic'

function fmt(d: string) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
}

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
          <span className={`text-[10px] uppercase tracking-[0.14em] ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isLive ? 'Live' : 'Fixture'}
          </span>
        </p>
      </div>

      {/* Professionals */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/70">
          Professionals ({professionals.length} pending)
        </h3>
        {professionals.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-[#F5F1E8]/45">
            No pending professional applications.
          </p>
        ) : (
          <div className="space-y-3">
            {professionals.map((p: import('@/lib/admin/applicationsQuery').PendingProfessional) => (
              <div key={p.id} className="flex items-start justify-between gap-4 rounded-xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-4">
                <div>
                  <p className="font-medium text-[#F5F1E8]">
                    {p.full_name}{p.title ? `, ${p.title}` : ''}
                    <span className="ml-2 text-xs capitalize text-[#C6A55A]/80">{p.credential_type.replace(/_/g, ' ')}</span>
                  </p>
                  {p.institution && (
                    <p className="mt-0.5 text-xs text-[#F5F1E8]/45">{p.institution}{p.institution_country ? ` · ${p.institution_country}` : ''}</p>
                  )}
                  <p className="mt-1 text-xs text-[#F5F1E8]/45">Markets: {p.countries.join(', ') || '—'}</p>
                  {p.specialties.length > 0 && <p className="mt-1 text-xs text-[#F5F1E8]/45">Specialties: {p.specialties.join(', ')}</p>}
                  {p.bio_public && <p className="mt-2 max-w-xl text-xs leading-5 text-[#F5F1E8]/55">{p.bio_public}</p>}
                  <p className="mt-2 text-[10px] text-[#F5F1E8]/30">Submitted {fmt(p.created_at)}</p>
                </div>
                <DecisionButtons kind="professionals" id={p.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suppliers */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/70">
          Suppliers ({suppliers.length} pending)
        </h3>
        {suppliers.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-[#F5F1E8]/45">
            No pending supplier applications.
          </p>
        ) : (
          <div className="space-y-3">
            {suppliers.map((s: import('@/lib/admin/applicationsQuery').PendingSupplierProfile) => (
              <div key={s.id} className="flex items-start justify-between gap-4 rounded-xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-4">
                <div>
                  <p className="font-medium text-[#F5F1E8]">
                    {s.company_name ?? 'Unnamed company'}
                    <span className="ml-2 text-xs capitalize text-[#C6A55A]/80">{s.seller_type.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#F5F1E8]/45">
                    {s.contact_name ?? 'No contact name'}{s.contact_email ? ` · ${s.contact_email}` : ''}{s.capabilities?.hq_country ? ` · HQ: ${s.capabilities.hq_country}` : ''} · Serves: {s.capabilities?.regions_served?.join(', ') ?? s.region}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.categories.map((c: string) => (
                      <span key={c} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-[#F5F1E8]/55">{c.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-[#F5F1E8]/55">{s.description}</p>
                  <p className="mt-2 text-[10px] text-[#F5F1E8]/30">Submitted {fmt(s.created_at)}</p>
                </div>
                <DecisionButtons kind="suppliers" id={s.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
