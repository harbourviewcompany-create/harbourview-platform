import Link from 'next/link'
import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { getAdminDataClient } from '@/lib/supabase/adminDataClient'
import {
  listAdminCandidatesByStatus,
  listAdminPublishedListings,
  summarizeQueue,
  type MarketplaceAdminQueueItem,
  type AdminPublishedListing,
} from '@/lib/server/marketplaceAdminQuery'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function fmt(d: string) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
}

const STATUS_COLOURS: Record<string, string> = {
  captured:           'border-white/20 text-white/50',
  needs_review:       'border-amber-400/40 text-amber-200',
  needs_verification: 'border-sky-400/40 text-sky-200',
  approved_draft:     'border-emerald-400/40 text-emerald-200',
  rejected:           'border-red-400/40 text-red-200',
  archived:           'border-white/10 text-white/30',
}

const RISK_COLOURS: Record<number, string> = {}

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLOURS[status] ?? 'border-white/20 text-white/50'
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function ScoreBadge({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null) return null
  const colour = value >= 70 ? 'text-emerald-300' : value >= 40 ? 'text-amber-300' : 'text-red-300'
  return (
    <div className="text-center">
      <div className={`text-xl font-semibold ${colour}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</div>
    </div>
  )
}

function CandidateRow({ c }: { c: MarketplaceAdminQueueItem }) {
  const title = (c as any).title_internal || (c as any).title_public_draft || c.title || 'Untitled candidate'
  const category = (c as any).marketplace_category || c.category_key || 'uncategorized'
  const region = (c as any).region || c.region || '—'
  const restricted = (c as any).restricted_item
  const licenceReview = (c as any).requires_license_review
  const listing = c as any

  return (
    <tr className="border-t border-white/8 align-top transition hover:bg-white/[0.02]">
      <td className="p-4">
        <div className="font-medium text-[#f5f1e8]">{title}</div>
        <div className="mt-0.5 text-[11px] text-white/40">{(c as any).candidate_type || c.record_type || 'candidate'}</div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {restricted && <span className="rounded-full border border-red-400/35 px-2 py-0.5 text-[10px] text-red-200">Restricted</span>}
          {licenceReview && <span className="rounded-full border border-amber-400/35 px-2 py-0.5 text-[10px] text-amber-200">Licence review</span>}
        </div>
      {/* Provenance — required for admin review workflow */}
      {((c as any).sourceUrl || (c as any).sourceName || (c as any).provenanceSummary || (c as any).internalReviewNotes) && (
        <details className="mt-3 border-t border-white/8 pt-3">
          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 hover:text-white/55 select-none">
            Provenance summary
          </summary>
          <div className="mt-2 grid gap-1.5 text-[11px] text-white/50">
            {(c as any).sourceUrl && (
              <div className="flex items-start gap-2">
                <span className="w-28 shrink-0 text-white/30">View source listing</span>
                <a href={(c as any).sourceUrl} target="_blank" rel="noopener noreferrer"
                   className="truncate text-sky-400/70 hover:text-sky-300 transition-colors">
                  {(c as any).sourceName || (c as any).sourceUrl}
                </a>
              </div>
            )}
            {(c as any).sourceName && !(c as any).sourceUrl && (
              <div className="flex items-start gap-2">
                <span className="w-28 shrink-0 text-white/30">Evidence captured</span>
                <span>{(c as any).sourceName}</span>
              </div>
            )}
            {(c as any).provenanceSummary && (
              <div className="flex items-start gap-2">
                <span className="w-28 shrink-0 text-white/30">Provenance summary</span>
                <span>{(c as any).provenanceSummary}</span>
              </div>
            )}
            {(c as any).internalReviewNotes && (
              <div className="flex items-start gap-2">
                <span className="w-28 shrink-0 text-white/30">Internal review notes</span>
                <span>{(c as any).internalReviewNotes}</span>
              </div>
            )}
            {(c as any).sourceEvidence && (
              <div className="flex items-start gap-2">
                <span className="w-28 shrink-0 text-white/30">Evidence captured</span>
                <span>{(c as any).sourceEvidence}</span>
              </div>
            )}
          </div>
        </details>
      )}
      </td>
      <td className="p-4 text-white/65">
        <div>{category}</div>
        {(c as any).subcategory && <div className="text-[11px] text-white/35">{(c as any).subcategory}</div>}
      </td>
      <td className="p-4 text-white/65">{(c as any).listing_type || c.listing_type_key || '—'}</td>
      <td className="p-4 text-white/65">{region}</td>
      <td className="p-4 text-white/65">{c.source_type || '—'}</td>
      <td className="p-4"><StatusPill status={(c as any).status || 'captured'} /></td>
      <td className="p-4">
        <div className="flex gap-4">
          <ScoreBadge label="Conf" value={c.confidence_score} />
          <ScoreBadge label="Rel" value={c.commercial_relevance_score} />
          <ScoreBadge label="Risk" value={c.compliance_risk_score} />
        </div>
      </td>
      <td className="p-4 text-[11px] text-white/40">{fmt(c.created_at)}</td>
      <td className="p-4">
        <Link
          href={`/admin/candidates/${c.id}`}
          className="rounded-full border border-gold/40 px-3 py-1 text-[11px] text-gold transition hover:bg-gold/10"
        >
          Review
        </Link>
      </td>
    </tr>
  )
}

function PublishedRow({ l }: { l: AdminPublishedListing }) {
  return (
    <tr className="border-t border-white/8 align-top transition hover:bg-white/[0.02]">
      <td className="p-4">
        <div className="font-medium text-[#f5f1e8]">{l.title}</div>
        {l.slug && <div className="mt-0.5 text-[11px] text-white/35">/marketplace/listings/{l.slug}</div>}
      </td>
      <td className="p-4 text-white/65">{l.category}</td>
      <td className="p-4 text-white/65">{l.marketplace_section}</td>
      <td className="p-4 text-white/65">{l.region}{l.location_country ? ` · ${l.location_country}` : ''}</td>
      <td className="p-4 text-white/65">{l.condition || '—'}</td>
      <td className="p-4 text-white/65">{l.price_display || 'On request'}</td>
      <td className="p-4">
        {l.is_featured && <span className="rounded-full border border-gold/35 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">Featured</span>}
      </td>
      <td className="p-4 text-[11px] text-white/40">{fmt(l.created_at)}</td>
    </tr>
  )
}

export default async function AdminListingsPage() {
  await requireAdminAuth()
  const configured = getAdminDataClient().ok

  const [candidatesResult, publishedResult] = await Promise.all([
    configured ? listAdminCandidatesByStatus() : Promise.resolve(null),
    configured ? listAdminPublishedListings() : Promise.resolve(null),
  ])

  const candidates = candidatesResult?.ok ? candidatesResult.data : []
  const published  = publishedResult?.ok  ? publishedResult.data  : []
  const summary    = summarizeQueue(candidates)

  const needsReview      = candidates.filter(c => (c as any).status === 'needs_review' || (c as any).status === 'captured')
  const needsVerification = candidates.filter(c => (c as any).status === 'needs_verification')
  const approvedDraft    = candidates.filter(c => (c as any).status === 'approved_draft')
  const rejected         = candidates.filter(c => (c as any).status === 'rejected')

  return (
    <section className="space-y-10">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#f5f1e8]">Marketplace review</h2>
          <p className="mt-1 text-sm text-white/55">
            Live candidate queue and published listing management. All mutations write to Supabase.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/candidates" className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:border-gold/50 hover:text-gold">
            Candidates
          </Link>
          <Link href="/marketplace" target="_blank" className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10">
            View public marketplace ↗
          </Link>
        </div>
      </div>

      {/* Config warning */}
      {!configured && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-5 text-sm text-amber-100">
          Admin data plane not configured. Set <code className="rounded bg-white/10 px-1">SUPABASE_SERVICE_ROLE_KEY</code> and{' '}
          <code className="rounded bg-white/10 px-1">HARBOURVIEW_ADMIN_REVIEW_ENABLED=true</code> in Vercel environment variables.
        </div>
      )}

      {/* Queue summary */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Object.entries(summary).map(([status, count]) => (
            <div key={status} className="rounded-xl border border-white/10 bg-[#0b1a2f] p-4 text-center">
              <div className="text-2xl font-semibold text-[#f5f1e8]">{count}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/40">{status.replace(/_/g, ' ')}</div>
            </div>
          ))}
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-center">
            <div className="text-2xl font-semibold text-gold">{published.length}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-gold/60">Published live</div>
          </div>
        </div>
      )}

      {/* Needs review */}
      {needsReview.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[#f5f1e8]">Needs review</h3>
            <span className="rounded-full border border-amber-400/40 bg-amber-950/20 px-2 py-0.5 text-xs text-amber-200">{needsReview.length}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#080f1a]">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-black/30 text-[10px] uppercase tracking-[0.18em] text-gold/70">
                <tr><th className="p-4">Candidate</th><th className="p-4">Category</th><th className="p-4">Listing type</th><th className="p-4">Region</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Scores</th><th className="p-4">Created</th><th className="p-4">Action</th></tr>
              </thead>
              <tbody>{needsReview.map(c => <CandidateRow key={c.id} c={c} />)}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Needs verification */}
      {needsVerification.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[#f5f1e8]">Needs verification</h3>
            <span className="rounded-full border border-sky-400/40 bg-sky-950/20 px-2 py-0.5 text-xs text-sky-200">{needsVerification.length}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#080f1a]">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-black/30 text-[10px] uppercase tracking-[0.18em] text-gold/70">
                <tr><th className="p-4">Candidate</th><th className="p-4">Category</th><th className="p-4">Listing type</th><th className="p-4">Region</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Scores</th><th className="p-4">Created</th><th className="p-4">Action</th></tr>
              </thead>
              <tbody>{needsVerification.map(c => <CandidateRow key={c.id} c={c} />)}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved draft — ready to promote */}
      {approvedDraft.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[#f5f1e8]">Approved draft — ready to publish</h3>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-950/20 px-2 py-0.5 text-xs text-emerald-200">{approvedDraft.length}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-emerald-400/10 bg-[#080f1a]">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-black/30 text-[10px] uppercase tracking-[0.18em] text-gold/70">
                <tr><th className="p-4">Candidate</th><th className="p-4">Category</th><th className="p-4">Listing type</th><th className="p-4">Region</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Scores</th><th className="p-4">Created</th><th className="p-4">Action</th></tr>
              </thead>
              <tbody>{approvedDraft.map(c => <CandidateRow key={c.id} c={c} />)}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Published live */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[#f5f1e8]">Published live</h3>
          <span className="rounded-full border border-gold/35 bg-gold/10 px-2 py-0.5 text-xs text-gold">{published.length}</span>
        </div>
        {published.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#080f1a] p-8 text-center text-sm text-white/40">
            No listings are currently published to the public marketplace.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#080f1a]">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-black/30 text-[10px] uppercase tracking-[0.18em] text-gold/70">
                <tr><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Section</th><th className="p-4">Region</th><th className="p-4">Condition</th><th className="p-4">Price</th><th className="p-4">Featured</th><th className="p-4">Published</th></tr>
              </thead>
              <tbody>{published.map(l => <PublishedRow key={l.id} l={l} />)}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejected */}
      {rejected.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-3 text-white/40 hover:text-white/60">
            <span className="text-sm">Rejected ({rejected.length})</span>
          </summary>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-[#080f1a]">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-black/30 text-[10px] uppercase tracking-[0.18em] text-gold/70">
                <tr><th className="p-4">Candidate</th><th className="p-4">Category</th><th className="p-4">Listing type</th><th className="p-4">Region</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Scores</th><th className="p-4">Created</th><th className="p-4">Action</th></tr>
              </thead>
              <tbody>{rejected.map(c => <CandidateRow key={c.id} c={c} />)}</tbody>
            </table>
          </div>
        </details>
      )}

      {/* Empty state */}
      {configured && candidates.length === 0 && published.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-[#080f1a] p-12 text-center">
          <p className="text-lg font-semibold text-[#f5f1e8]">No marketplace candidates yet</p>
          <p className="mt-2 text-sm text-white/45">
            Candidates appear here when submitted through the intake form or sourced via the admin pipeline.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/marketplace/sell" className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10">
              Submit via intake form
            </Link>
            <Link href="/admin/sources/new" className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-[#061322]">
              Intake a source
            </Link>
          </div>
        </div>
      )}

    </section>
  )
}
