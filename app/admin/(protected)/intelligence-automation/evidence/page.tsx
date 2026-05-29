import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth/adminGuard';
import { evidenceVault } from '@/lib/intelligence-automation/fixtures';

export const dynamic = 'force-dynamic';

const reviewColors: Record<string, string> = {
  pending: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  reviewed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  needs_action: 'text-red-400 border-red-400/30 bg-red-400/10',
  archived: 'text-[#F5F1E8]/35 border-white/15 bg-white/5',
};
const typeAbbr: Record<string, string> = {
  coa: 'COA', licence_document: 'LIC', gacp_document: 'GACP', eu_gmp_document: 'GMP',
  product_photo: 'IMG', spec_sheet: 'SPEC', export_document: 'EXP', import_document: 'IMP',
  source_screenshot: 'SCR', regulator_notice: 'REG', meeting_note: 'MTG',
  email_note: 'EMAIL', commercial_note: 'NOTE', counterparty_note: 'CP',
};
const reviewOrder = ['needs_action','pending','reviewed','archived'];

export default async function IntelEvidencePage() {
  await requireAdminAuth();
  const sorted = [...evidenceVault].sort((a, b) => reviewOrder.indexOf(a.reviewStatus) - reviewOrder.indexOf(b.reviewStatus));
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Intelligence automation</p>
          <h2 className="mt-1 text-2xl font-semibold">Evidence Vault</h2>
          <p className="mt-2 text-sm text-[#F5F1E8]/65">COAs, licences, GACP and EU-GMP documents, spec sheets, meeting notes, and commercial evidence. Private vault linked to counterparties and markets.</p>
        </div>
        <Link href="/admin/intelligence-automation" className="text-sm text-[#C6A55A] underline-offset-4 hover:underline">← Intelligence hub</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sorted.map(ev => (
          <div key={ev.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C6A55A]/25 bg-black/30 text-[10px] font-bold text-[#C6A55A]">
                {typeAbbr[ev.type] ?? ev.type.slice(0, 3).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${reviewColors[ev.reviewStatus]}`}>{ev.reviewStatus.replace(/_/g, ' ')}</span>
                <h3 className="mt-1.5 text-sm font-semibold text-[#F5F1E8]">{ev.title}</h3>
                {ev.linkedCounterpartyName && <p className="mt-1 text-xs text-[#F5F1E8]/50">Counterparty: {ev.linkedCounterpartyName}</p>}
                {ev.linkedMarket && <p className="text-xs text-[#F5F1E8]/50">Market: {ev.linkedMarket}</p>}
                {ev.notes && <p className="mt-1 text-xs text-amber-400/80">{ev.notes}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {ev.tags.map(t => <span key={t} className="rounded-full border border-white/12 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#F5F1E8]/50">{t}</span>)}
                </div>
                <p className="mt-2 text-[10px] text-[#F5F1E8]/35">Added {ev.addedAt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
