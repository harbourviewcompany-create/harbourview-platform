import { requireAdminAuth } from '@/lib/auth/adminGuard';
import {
  getHealthCanadaRegistryCounts,
  listHealthCanadaActiveSites,
  listHealthCanadaOutreachQueue,
} from '@/lib/admin/healthCanadaOperators';

export const dynamic = 'force-dynamic';

function CountCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[#C6A55A]/20 bg-[#0B1A2F] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]/80">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#F5F1E8]">{value}</div>
    </div>
  );
}

export default async function HealthCanadaOperatorRegistryPage() {
  await requireAdminAuth();

  const [counts, sites, outreach] = await Promise.all([
    getHealthCanadaRegistryCounts(),
    listHealthCanadaActiveSites(),
    listHealthCanadaOutreachQueue(),
  ]);

  const configured = counts.ok && sites.ok && outreach.ok;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Private registry</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#F5F1E8]">Health Canada licensed operators</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#F5F1E8]/65">
          Admin/operator-only Canadian Licensed Operator Registry. This page is private CRM and intelligence infrastructure;
          it must not be used as a public supplier directory or public marketplace DTO source.
        </p>
      </div>

      {!configured ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-950/20 p-5 text-sm text-amber-100">
          Registry tables or service-role access are not configured yet. Apply the migration, place the staged CSV package in
          <code className="mx-1 rounded bg-black/30 px-1">data/private/health-canada/</code>, run the import, then run
          <code className="mx-1 rounded bg-black/30 px-1">npm run validate:health-canada-operators</code>.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-5">
        <CountCard label="Active sites" value={counts.ok ? counts.data.active_sites : '—'} />
        <CountCard label="Outreach ready" value={counts.ok ? counts.data.outreach_ready : '—'} />
        <CountCard label="Exclusions" value={counts.ok ? counts.data.exclusions : '—'} />
        <CountCard label="Conflicts" value={counts.ok ? counts.data.conflicts : '—'} />
        <CountCard label="Individual holds" value={counts.ok ? counts.data.individual_holds : '—'} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-semibold text-[#F5F1E8]">Active licence sites</h3>
          <p className="mt-1 text-xs text-[#F5F1E8]/55">Private rows only. Contact fields are intentionally not rendered in this shell.</p>
        </div>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-3">Company</th>
              <th className="p-3">Province</th>
              <th className="p-3">Status</th>
              <th className="p-3">Licence</th>
              <th className="p-3">Track</th>
              <th className="p-3">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sites.ok && sites.data.length ? sites.data.map((site) => (
              <tr key={site.site_id} className="text-[#F5F1E8]/75">
                <td className="p-3 font-medium text-[#F5F1E8]">{site.company_name}</td>
                <td className="p-3">{site.province || '—'}</td>
                <td className="p-3">{site.status}</td>
                <td className="p-3">{site.licence_class || '—'}</td>
                <td className="p-3">{site.track || '—'}</td>
                <td className="p-3">{site.review_required ? 'Review required' : '—'}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="p-8 text-center text-[#F5F1E8]/55">No active registry rows loaded.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-semibold text-[#F5F1E8]">Outreach queue</h3>
          <p className="mt-1 text-xs text-[#F5F1E8]/55">Private send-order queue. Phone/source evidence remains server-side only.</p>
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-black/25 text-xs uppercase tracking-[0.18em] text-[#C6A55A]">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Operator ID</th>
              <th className="p-3">Province</th>
              <th className="p-3">Track</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {outreach.ok && outreach.data.length ? outreach.data.map((row) => (
              <tr key={String(row.outreach_queue_id)} className="text-[#F5F1E8]/75">
                <td className="p-3">{String(row.send_order || '—')}</td>
                <td className="p-3 font-mono text-xs">{String(row.canonical_operator_id || '—')}</td>
                <td className="p-3">{String(row.province || '—')}</td>
                <td className="p-3">{String(row.track || '—')}</td>
                <td className="p-3">{String(row.first_contact_note || '—')}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="p-8 text-center text-[#F5F1E8]/55">No outreach queue rows loaded.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
