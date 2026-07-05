'use client'

export type DossierStatusRow = {
  id: string
  market: string
  region: string
  status: string
  priority: string
  last_updated: string | null
  notes: string | null
}

export type DossierFileRow = {
  id: string
  title: string
  country_id: string | null
  storage_bucket: string | null
  file_path: string | null
  file_size_bytes: number | null
  maturity_score: number | null
  maturity_tier: string | null
  page_count: number | null
  updated_at: string
}

const STATUS_STYLES: Record<string, string> = {
  current: 'bg-emerald-500/15 text-emerald-300',
  in_progress: 'bg-[#C6A55A]/15 text-[#C6A55A]',
  not_started: 'bg-[#F5F1E8]/10 text-[#F5F1E8]/50',
  stale: 'bg-red-500/15 text-red-300',
}

const PRIORITY_ORDER: Record<string, number> = { now: 0, soon: 1, later: 2 }
const PRIORITY_LABEL: Record<string, string> = { now: 'Now', soon: 'Soon', later: 'Later' }

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function findFile(market: string, files: DossierFileRow[]): DossierFileRow | undefined {
  return files.find(f => f.title.split(' — ')[0]?.trim().toLowerCase() === market.trim().toLowerCase())
}

export default function DossiersClient({
  statusRows,
  fileRows,
  configError,
}: {
  statusRows: DossierStatusRow[]
  fileRows: DossierFileRow[]
  configError: string | null
}) {
  if (configError) {
    return (
      <main className="min-h-screen bg-[#061322] px-6 py-10 text-[#F5F1E8]">
        <div className="mx-auto max-w-6xl rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
          {configError}
        </div>
      </main>
    )
  }

  const grouped = [...statusRows].sort((a, b) => {
    const pd = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
    return pd !== 0 ? pd : a.market.localeCompare(b.market)
  })

  const counts = statusRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})
  const withFile = fileRows.filter(f => f.file_path).length

  return (
    <main className="min-h-screen bg-[#061322] px-6 py-10 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl space-y-8">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Harbourview operator</p>
          <h1 className="mt-2 text-3xl font-semibold">Market Dossier Portfolio</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F5F1E8]/65">
            Coverage tracker for the Harbourview v5 market intelligence dossiers, surfaced on the public
            country pages under &ldquo;Full Market Dossier Available&rdquo; once a file is attached.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
            <div className="text-3xl font-bold text-[#F5F1E8]/90">{statusRows.length}</div>
            <div className="mt-1 text-xs text-[#F5F1E8]/50">Tracked markets</div>
          </div>
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
            <div className="text-3xl font-bold text-emerald-400">{counts.current ?? 0}</div>
            <div className="mt-1 text-xs text-[#F5F1E8]/50">Current</div>
          </div>
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
            <div className="text-3xl font-bold text-red-400">{counts.stale ?? 0}</div>
            <div className="mt-1 text-xs text-[#F5F1E8]/50">Stale — needs refresh</div>
          </div>
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
            <div className="text-3xl font-bold text-[#C6A55A]">{withFile}</div>
            <div className="mt-1 text-xs text-[#F5F1E8]/50">Files uploaded</div>
          </div>
        </div>

        <div className="space-y-3">
          {grouped.map((row) => {
            const file = findFile(row.market, fileRows)
            const hasFile = !!file?.file_path
            return (
              <div key={row.id} className="rounded-xl border border-[#C6A55A]/15 bg-[#0B1A2F] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-[#F5F1E8]">{row.market}</span>
                      <span className="text-[#F5F1E8]/40">·</span>
                      <span className="text-[#F5F1E8]/50">{row.region}</span>
                      <span className="rounded-full bg-[#F5F1E8]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F5F1E8]/60">
                        {PRIORITY_LABEL[row.priority] ?? row.priority}
                      </span>
                    </div>
                    {row.notes && <p className="mt-1 text-xs text-[#F5F1E8]/45">{row.notes}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[row.status] ?? 'bg-[#F5F1E8]/10 text-[#F5F1E8]/60'}`}>
                    {row.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {hasFile && file && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#C6A55A]/10 bg-[#061322] p-3">
                    <div className="text-xs text-[#F5F1E8]/60">
                      {file.maturity_score !== null && (
                        <span className="mr-3 font-semibold text-[#C6A55A]">
                          Maturity {file.maturity_score}/25{file.maturity_tier ? ` · ${file.maturity_tier}` : ''}
                        </span>
                      )}
                      <span>Updated {new Date(file.updated_at).toLocaleDateString('en-CA')}</span>
                      {file.file_size_bytes && <span> · {formatSize(file.file_size_bytes)}</span>}
                    </div>
                    <a
                      href={`/api/admin/intelligence/dossiers/${file.id}/download`}
                      className="rounded-sm border border-[#C6A55A]/40 bg-[#C6A55A]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#C6A55A] hover:bg-[#C6A55A]/20"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
