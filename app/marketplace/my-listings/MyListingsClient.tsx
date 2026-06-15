'use client'

import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type Submission = {
  id: string
  title_public_draft: string | null
  category_key: string | null
  listing_type_key: string | null
  publication_status: string | null
  status: string | null
  discovered_at: string
  submission_images: string[] | null
  country: string | null
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  not_publishable: {
    label: 'Under review',
    classes: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  draft_public_summary: {
    label: 'Draft ready',
    classes: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  needs_public_safety_review: {
    label: 'Safety review',
    classes: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  },
  approved_public_summary: {
    label: 'Approved',
    classes: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  published: {
    label: 'Live',
    classes: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
  private_only: {
    label: 'Private',
    classes: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  },
  rejected: {
    label: 'Rejected',
    classes: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  archived: {
    label: 'Archived',
    classes: 'text-[#F5F1E8]/30 bg-[#F5F1E8]/5 border-[#F5F1E8]/10',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function StatusBadge({ status }: { status: string | null }) {
  const cfg = STATUS_CONFIG[status ?? ''] ?? {
    label: status ?? '—',
    classes: 'text-[#F5F1E8]/40 bg-[#F5F1E8]/5 border-[#F5F1E8]/10',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  )
}

function formatCategoryKey(key: string | null) {
  if (!key) return null
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MyListingsClientProps {
  submissions: Submission[]
  userEmail: string
}

export function MyListingsClient({ submissions, userEmail }: MyListingsClientProps) {
  return (
    <div className="min-h-screen bg-[#040D1A] px-4 py-12">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Marketplace</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">My submissions</h1>
            <p className="mt-1 text-sm text-[#F5F1E8]/40">{userEmail}</p>
          </div>
          <Link
            href="/marketplace/sell"
            className="self-start rounded-full bg-[#C6A55A] px-5 py-2.5 text-sm font-semibold text-[#061322] hover:bg-[#D8BD75] transition-colors"
          >
            + New submission
          </Link>
        </div>

        {/* Empty state */}
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-[#C6A55A]/15 bg-[#0B1A2F]/80 px-8 py-16 text-center">
            <p className="text-sm text-[#F5F1E8]/40">No submissions yet.</p>
            <Link
              href="/marketplace/sell"
              className="mt-4 inline-block text-sm text-[#C6A55A] hover:underline"
            >
              Submit your first listing →
            </Link>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[#C6A55A]/15 bg-[#0B1A2F]/80">
              <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-[#C6A55A]/10 px-5 py-3 text-xs uppercase tracking-[0.15em] text-[#F5F1E8]/30 sm:grid">
                <span>Listing</span>
                <span>Category</span>
                <span>Status</span>
                <span>Submitted</span>
              </div>

              <div className="divide-y divide-[#C6A55A]/8">
                {submissions.map((sub) => {
                  const imageCount = sub.submission_images?.length ?? 0
                  return (
                    <div
                      key={sub.id}
                      className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4"
                    >
                      {/* Title + meta */}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#F5F1E8]">
                          {sub.title_public_draft ?? '(untitled)'}
                        </p>
                        <p className="mt-0.5 text-xs text-[#F5F1E8]/35">
                          {[
                            sub.country,
                            imageCount > 0
                              ? `${imageCount} image${imageCount > 1 ? 's' : ''}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>

                      {/* Category */}
                      <span className="text-xs text-[#F5F1E8]/40 sm:text-right">
                        {formatCategoryKey(sub.category_key) ?? '—'}
                      </span>

                      {/* Status */}
                      <div className="sm:flex sm:justify-end">
                        <StatusBadge status={sub.publication_status} />
                      </div>

                      {/* Date */}
                      <span className="text-xs text-[#F5F1E8]/30 sm:text-right">
                        {formatDate(sub.discovered_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-[#F5F1E8]/25">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} · Harbourview reviews all listings before routing or visibility
            </p>
          </>
        )}

        {/* Review notice */}
        <div className="mt-8 rounded-xl border border-[#C6A55A]/10 bg-[#0B1A2F]/40 px-5 py-4">
          <p className="text-xs leading-5 text-[#F5F1E8]/35">
            <span className="text-[#C6A55A]/70">Review timeline: </span>
            Harbourview reviews all submissions within 2 business days. Status progresses from{' '}
            <em>Under review</em> → <em>Approved</em> → <em>Live</em> as vetting completes.
            Contact{' '}
            <a href="mailto:ops@harbourview.co" className="text-[#C6A55A]/60 hover:text-[#C6A55A] underline">
              ops@harbourview.co
            </a>{' '}
            if you have questions about a specific submission.
          </p>
        </div>
      </div>
    </div>
  )
}
