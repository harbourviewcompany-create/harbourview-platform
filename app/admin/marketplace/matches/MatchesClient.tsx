'use client'

type EmbeddedListing = {
  id: string
  title: string
  category: string
  region: string
} | null

type EmbeddedBuyerRequest = {
  id: string
  title: string
  category: string
  region: string
} | null

export type MatchRow = {
  id: string
  status: string
  internal_notes: string | null
  created_at: string
  match_rationale: string | null
  match_rationale_model: string | null
  match_rationale_generated_at: string | null
  // PostgREST returns to-one embeds as an object, but some client/version
  // combinations in this codebase have returned a single-element array —
  // typing as either and normalizing below, matching the existing
  // defensive pattern in app/api/admin/marketplace/matches/[id]/promote/route.ts
  listing: EmbeddedListing | EmbeddedListing[]
  buyer_request: EmbeddedBuyerRequest | EmbeddedBuyerRequest[]
}

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

const STATUS_STYLES: Record<string, string> = {
  proposed: 'bg-[#C6A55A]/15 text-[#C6A55A]',
  disclosure_requested: 'bg-blue-500/15 text-blue-300',
  disclosure_approved: 'bg-blue-500/20 text-blue-200',
  introduced: 'bg-emerald-500/15 text-emerald-300',
  closed_won: 'bg-green-500/20 text-green-300',
  closed_lost: 'bg-red-500/15 text-red-300',
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function MatchesClient({
  matches,
  configError,
}: {
  matches: MatchRow[]
  configError: string | null
}) {
  if (configError) {
    return (
      <main className="min-h-screen bg-[#061322] px-6 py-10 text-[#F5F1E8]">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
            {configError}
          </div>
        </div>
      </main>
    )
  }

  const withRationale = matches.filter(m => m.match_rationale).length

  return (
    <main className="min-h-screen bg-[#061322] px-6 py-10 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview operator</p>
          <h1 className="mt-2 text-3xl font-semibold">Marketplace Matches</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F5F1E8]/65">
            Listing ↔ buyer request pairs created by the matching engine. AI rationale is generated
            asynchronously by the daily matching cron — new matches show as &ldquo;Pending&rdquo; until enriched.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
            <div className="text-3xl font-bold text-[#F5F1E8]/90">{matches.length}</div>
            <div className="mt-1 text-xs text-[#F5F1E8]/50">Total matches (last 200)</div>
          </div>
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
            <div className="text-3xl font-bold text-emerald-400">{withRationale}</div>
            <div className="mt-1 text-xs text-[#F5F1E8]/50">With AI rationale</div>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-8 text-center text-sm text-[#F5F1E8]/50">
            No matches yet.
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const listing = one(m.listing)
              const buyer = one(m.buyer_request)
              return (
                <div key={m.id} className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-[#F5F1E8]">{listing?.title ?? '(listing deleted)'}</span>
                        <span className="text-[#F5F1E8]/40">↔</span>
                        <span className="font-semibold text-[#F5F1E8]">{buyer?.title ?? '(buyer request deleted)'}</span>
                      </div>
                      <div className="mt-1 text-xs text-[#F5F1E8]/45">
                        {listing?.category ?? '—'} · listing region {listing?.region ?? '—'} · buyer region {buyer?.region ?? '—'} · {formatDate(m.created_at)}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[m.status] ?? 'bg-[#F5F1E8]/10 text-[#F5F1E8]/60'}`}>
                      {statusLabel(m.status)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg border border-[#C6A55A]/10 bg-[#061322] p-3">
                    {m.match_rationale ? (
                      <>
                        <p className="text-sm leading-6 text-[#F5F1E8]/85">{m.match_rationale}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wide text-[#F5F1E8]/35">
                          {m.match_rationale_model} · {m.match_rationale_generated_at ? formatDate(m.match_rationale_generated_at) : ''}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm italic text-[#F5F1E8]/40">Rationale pending — enriched on the next matching cron run.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
