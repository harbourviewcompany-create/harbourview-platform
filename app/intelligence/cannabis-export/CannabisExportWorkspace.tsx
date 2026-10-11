'use client'

import { useEffect, useMemo, useState } from 'react'

type Account = {
  id: string
  canonical_key: string
  kind: 'buyer' | 'supplier' | 'route_partner' | 'demand_partner'
  company_name: string
  country: string | null
  tier: string | null
  score: number | null
  priority_band: string | null
  status: string
  last_verified: string | null
  source_urls: string[]
  payload: Record<string, unknown>
}

type Market = {
  id: string
  country: string
  iso2: string | null
  market_rank: number | null
  legal_status: string | null
  import_status: string | null
  permitted_products: string | null
  latest_volume_signal: string | null
  canada_position: string | null
  trend: string | null
  regulatory_changes: string | null
  trade_risk: string | null
  opportunity_score: number | null
  priority_band: string | null
  last_verified: string | null
  source_urls: string[]
}

type Playbook = {
  id: string
  title: string
  category: string
  summary: string | null
  content: Record<string, unknown>
  status: string
  last_verified: string | null
  source_urls: string[]
}

type Contact = {
  id: string
  account_id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  sequence: number | null
  verification: string | null
  outreach_status: string
  last_verified: string | null
}

type Product = {
  id: string
  supplier_account_id: string | null
  product_name: string
  format_positioning: string | null
  thc_cbd_signal: string | null
  quality_signal: string | null
  availability_status: string | null
  recommended_use: string | null
  source_url: string | null
}

type Match = {
  id: string
  buyer_account_id: string
  supplier_account_id: string
  supplier_rank: number | null
  match_score: number | null
  why_match: string | null
  buyer_specific_offer: string | null
  suggested_pilot: string | null
  status: string
}

type Rfq = {
  id: string
  supplier_account_id: string
  priority: number | null
  subject: string | null
  email_draft: string | null
  linkedin_opening: string | null
  primary_ask: string | null
  why_now: string | null
  status: string
}

type Deal = {
  id: string
  buyer_account_id: string
  supplier_account_id: string | null
  market: string | null
  product_concept: string
  target_kg: number | null
  expected_sell_cad_per_g: number | null
  target_gross_margin: number | null
  non_supplier_variable_cad_per_g: number | null
  max_supplier_buy_cad_per_g: number | null
  public_supply_benchmark_cad_per_g: number | null
  buyer_status: string
  supplier_status: string
  next_action: string | null
}

type Benchmark = {
  id: string
  name: string
  period: string | null
  cad_per_g: number | null
  source_url: string | null
}

type Task = {
  id: string
  day_number: number | null
  action: string
  account_key: string | null
  owner_label: string | null
  expected_output: string | null
  dependency: string | null
  status: string
  due_date: string | null
}

type WorkspaceData = {
  accounts: Account[]
  markets: Market[]
  playbooks: Playbook[]
  contacts: Contact[]
  products: Product[]
  matches: Match[]
  rfqs: Rfq[]
  deals: Deal[]
  benchmarks: Benchmark[]
  tasks: Task[]
}

type Resource = 'account' | 'market' | 'playbook' | 'contact' | 'match' | 'rfq' | 'deal' | 'task'
type Tab = 'overview' | 'markets' | 'strategy' | 'buyers' | 'contacts' | 'suppliers' | 'products' | 'matches' | 'rfqs' | 'deals' | 'tasks'

const EMPTY: WorkspaceData = {
  accounts: [],
  markets: [],
  playbooks: [],
  contacts: [],
  products: [],
  matches: [],
  rfqs: [],
  deals: [],
  benchmarks: [],
  tasks: [],
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'markets', label: 'Markets' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'buyers', label: 'Buyers' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'products', label: 'Products' },
  { id: 'matches', label: 'Matches' },
  { id: 'rfqs', label: 'RFQs' },
  { id: 'deals', label: 'Deals' },
  { id: 'tasks', label: 'Execution' },
]

const STATUS_OPTIONS = ['not_contacted', 'contacted', 'replied', 'qualified', 'quoted', 'sample', 'negotiating', 'won', 'not_a_fit']
const TASK_OPTIONS = ['not_started', 'ready', 'in_progress', 'blocked', 'complete', 'dropped']
const RFQ_OPTIONS = ['drafted', 'ready', 'sent', 'replied', 'nda', 'rfq_received', 'quoted', 'qualified', 'rejected']

function label(value: string | null | undefined) {
  return (value ?? '—').replaceAll('_', ' ')
}

function money(value: number | null | undefined) {
  return value == null ? '—' : `C$${value.toFixed(2)}/g`
}

function percent(value: number | null | undefined) {
  return value == null ? '—' : `${Math.round(value * 100)}%`
}

function StatusSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-white/10 bg-[#0a1019] px-2.5 py-2 text-xs capitalize text-white/75 outline-none focus:border-amber-300/40"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {label(option)}
        </option>
      ))}
    </select>
  )
}

function SourceLinks({ urls }: { urls: Array<string | null | undefined> }) {
  const clean = urls.filter((url): url is string => Boolean(url))
  if (!clean.length) return <span className="text-white/28">—</span>
  return (
    <div className="flex flex-wrap gap-2">
      {clean.slice(0, 3).map((url, index) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-amber-200/80 underline decoration-amber-200/20 underline-offset-4 hover:text-amber-100"
        >
          source {index + 1}
        </a>
      ))}
    </div>
  )
}

export default function CannabisExportWorkspace() {
  const [data, setData] = useState<WorkspaceData>(EMPTY)
  const [tab, setTab] = useState<Tab>('overview')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/intelligence/cannabis-export', { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Unable to load export workspace.')
      setData(body.data ?? EMPTY)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load export workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const accountById = useMemo(
    () => new Map(data.accounts.map((account) => [account.id, account])),
    [data.accounts],
  )

  const buyers = useMemo(
    () => data.accounts.filter((account) => account.kind === 'buyer' || account.kind === 'demand_partner'),
    [data.accounts],
  )
  const suppliers = useMemo(
    () => data.accounts.filter((account) => account.kind === 'supplier' || account.kind === 'route_partner'),
    [data.accounts],
  )

  const patch = async (resource: Resource, id: string, nextPatch: Record<string, unknown>) => {
    setSavingId(id)
    setError(null)
    try {
      const response = await fetch('/api/intelligence/cannabis-export', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource, id, patch: nextPatch }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Update failed.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setSavingId(null)
    }
  }

  const search = query.trim().toLowerCase()
  const contains = (...parts: Array<string | null | undefined>) =>
    !search || parts.some((part) => part?.toLowerCase().includes(search))

  const highPriority = buyers.filter((account) => ['Immediate', 'Pursue', 'A+', 'A'].includes(account.priority_band ?? account.tier ?? ''))
  const activeDeals = data.deals.filter((deal) => !['won', 'not_a_fit'].includes(deal.buyer_status))
  const outstandingRfqs = data.rfqs.filter((rfq) => !['qualified', 'rejected'].includes(rfq.status))
  const openTasks = data.tasks.filter((task) => !['complete', 'dropped'].includes(task.status))

  return (
    <main className="min-h-screen bg-[#050a12] px-4 py-6 text-[#f5f0e8] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 border-b border-white/10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200/65">
                Harbourview · Private Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">Cannabis Export OS</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-white/55">
                Buyers, buying committees, Canadian suppliers, live product intelligence, RFQs, matched opportunities,
                deal economics and execution status. Research stays private and never seeds the public supplier directory.
              </p>
            </div>
            <button
              onClick={() => void load()}
              disabled={loading}
              className="rounded-xl border border-amber-200/20 bg-amber-200/10 px-4 py-2.5 text-sm text-amber-100 disabled:opacity-40"
            >
              {loading ? 'Refreshing…' : 'Refresh data'}
            </button>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/5 p-4 text-sm leading-6 text-red-100">
            {error}
          </div>
        ) : null}

        <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-9">
          {[
            ['Markets', data.markets.length],
            ['Buyers', buyers.length],
            ['Suppliers', suppliers.length],
            ['Contacts', data.contacts.length],
            ['High priority', highPriority.length],
            ['Open RFQs', outstandingRfqs.length],
            ['Active deals', activeDeals.length],
            ['Products', data.products.length],
            ['Open tasks', openTasks.length],
          ].map(([name, value]) => (
            <div key={String(name)} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{name}</div>
              <div className="mt-2 text-2xl font-semibold">{value}</div>
            </div>
          ))}
        </section>

        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={
                  tab === item.id
                    ? 'whitespace-nowrap rounded-full border border-amber-200/35 bg-amber-200/10 px-4 py-2 text-xs font-semibold text-amber-100'
                    : 'whitespace-nowrap rounded-full border border-white/10 px-4 py-2 text-xs text-white/48 hover:text-white/75'
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, country, contact, product…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-amber-200/30 xl:max-w-sm"
          />
        </div>

        {loading && data.accounts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-10 text-center text-white/45">Loading private export intelligence…</div>
        ) : null}

        {tab === 'overview' ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <h2 className="text-lg font-semibold">Highest-priority buyers</h2>
              <div className="mt-4 space-y-3">
                {buyers
                  .filter((account) => contains(account.company_name, account.country, account.priority_band, account.tier))
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .slice(0, 12)
                  .map((account) => (
                    <div key={account.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 p-3">
                      <div>
                        <div className="font-medium">{account.company_name}</div>
                        <div className="mt-1 text-xs text-white/40">
                          {account.country ?? '—'} · {account.priority_band ?? account.tier ?? 'unranked'} · score {account.score ?? '—'}
                        </div>
                      </div>
                      <button onClick={() => setTab('buyers')} className="text-xs text-amber-200/75">Open →</button>
                    </div>
                  ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <h2 className="text-lg font-semibold">Execution queue</h2>
              <div className="mt-4 space-y-3">
                {openTasks.slice(0, 12).map((task) => (
                  <div key={task.id} className="rounded-xl border border-white/8 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">Day {task.day_number ?? '—'} · {task.action}</div>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">{label(task.status)}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/42">{task.account_key ?? 'General'} · {task.expected_output ?? '—'}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 xl:col-span-2">
              <h2 className="text-lg font-semibold">2026 price benchmarks</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {data.benchmarks.map((benchmark) => (
                  <div key={benchmark.id} className="rounded-xl border border-white/8 p-4">
                    <div className="text-sm font-medium">{benchmark.name}</div>
                    <div className="mt-2 text-2xl font-semibold text-amber-100">{money(benchmark.cad_per_g)}</div>
                    <div className="mt-1 text-xs text-white/38">{benchmark.period ?? '—'}</div>
                    <div className="mt-3"><SourceLinks urls={[benchmark.source_url]} /></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {tab === 'markets' ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.markets
              .filter((market) => contains(market.country, market.priority_band, market.legal_status, market.import_status, market.trend))
              .sort((a, b) => (a.market_rank ?? 999) - (b.market_rank ?? 999))
              .map((market) => (
                <article key={market.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Rank {market.market_rank ?? '—'}</div>
                      <h3 className="mt-1 text-xl font-semibold">{market.country}</h3>
                    </div>
                    <span className="rounded-full border border-amber-200/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-100/80">
                      {market.priority_band ?? 'research'}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-white/8 p-3">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Legal</div>
                      <div className="mt-1 text-white/68">{market.legal_status ?? '—'}</div>
                    </div>
                    <div className="rounded-xl border border-white/8 p-3">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Imports</div>
                      <div className="mt-1 text-white/68">{market.import_status ?? '—'}</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-white/55">
                    <p><span className="text-white/30">Products · </span>{market.permitted_products ?? '—'}</p>
                    <p><span className="text-white/30">Demand · </span>{market.latest_volume_signal ?? '—'}</p>
                    <p><span className="text-white/30">Canada · </span>{market.canada_position ?? '—'}</p>
                    <p><span className="text-white/30">Change · </span>{market.regulatory_changes ?? market.trend ?? '—'}</p>
                    {market.trade_risk ? <p><span className="text-white/30">Risk · </span>{market.trade_risk}</p> : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <SourceLinks urls={market.source_urls} />
                    <span className="text-xs text-white/30">verified {market.last_verified ?? '—'}</span>
                  </div>
                </article>
              ))}
          </section>
        ) : null}

        {tab === 'strategy' ? (
          <section className="grid gap-4 xl:grid-cols-2">
            {data.playbooks
              .filter((playbook) => contains(playbook.title, playbook.category, playbook.summary))
              .map((playbook) => (
                <article key={playbook.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/60">{label(playbook.category)}</div>
                      <h3 className="mt-1 text-xl font-semibold">{playbook.title}</h3>
                    </div>
                    <StatusSelect value={playbook.status} options={['active', 'draft', 'review', 'retired']} onChange={(value) => void patch('playbook', playbook.id, { status: value })} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/58">{playbook.summary ?? '—'}</p>
                  <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-black/10 p-4 font-sans text-xs leading-5 text-white/48">
                    {JSON.stringify(playbook.content, null, 2)}
                  </pre>
                  <div className="mt-4 flex items-center justify-between">
                    <SourceLinks urls={playbook.source_urls} />
                    <span className="text-xs text-white/30">verified {playbook.last_verified ?? '—'}</span>
                  </div>
                </article>
              ))}
          </section>
        ) : null}

        {tab === 'buyers' ? (
          <section className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.16em] text-white/38">
                  <tr><th className="p-3">Buyer</th><th>Market</th><th>Tier</th><th>Score</th><th>Priority</th><th>Status</th><th>Verified</th><th>Sources</th></tr>
                </thead>
                <tbody>
                  {buyers.filter((a) => contains(a.company_name, a.country, a.tier, a.priority_band)).map((account) => (
                    <tr key={account.id} className="border-t border-white/7">
                      <td className="p-3 font-medium">{account.company_name}</td>
                      <td>{account.country ?? '—'}</td>
                      <td>{account.tier ?? '—'}</td>
                      <td>{account.score ?? '—'}</td>
                      <td>{account.priority_band ?? '—'}</td>
                      <td>
                        <StatusSelect value={account.status} options={STATUS_OPTIONS} onChange={(value) => void patch('account', account.id, { status: value })} />
                        {savingId === account.id ? <span className="ml-2 text-xs text-white/30">saving</span> : null}
                      </td>
                      <td>{account.last_verified ?? '—'}</td>
                      <td><SourceLinks urls={account.source_urls} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === 'contacts' ? (
          <section className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.16em] text-white/38">
                  <tr><th className="p-3">Company</th><th>Contact</th><th>Role</th><th>Sequence</th><th>LinkedIn</th><th>Email</th><th>Verification</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.contacts.filter((c) => {
                    const account = accountById.get(c.account_id)
                    return contains(account?.company_name, c.name, c.role, c.email)
                  }).map((contact) => (
                    <tr key={contact.id} className="border-t border-white/7">
                      <td className="p-3 font-medium">{accountById.get(contact.account_id)?.company_name ?? 'Unknown'}</td>
                      <td>{contact.name}</td>
                      <td className="max-w-xs text-white/65">{contact.role ?? '—'}</td>
                      <td>{contact.sequence ?? '—'}</td>
                      <td>{contact.linkedin_url ? <a className="text-amber-200/80 underline underline-offset-4" target="_blank" rel="noreferrer" href={contact.linkedin_url}>Open profile</a> : '—'}</td>
                      <td>{contact.email ? <a className="text-white/70" href={`mailto:${contact.email}`}>{contact.email}</a> : '—'}</td>
                      <td className="max-w-xs text-xs text-white/40">{contact.verification ?? '—'}</td>
                      <td><StatusSelect value={contact.outreach_status} options={STATUS_OPTIONS} onChange={(value) => void patch('contact', contact.id, { outreach_status: value })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === 'suppliers' ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {suppliers.filter((a) => contains(a.company_name, a.country, a.priority_band, a.tier)).map((account) => (
              <article key={account.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold">{account.company_name}</div>
                    <div className="mt-1 text-xs text-white/40">{account.country ?? '—'} · {label(account.kind)}</div>
                  </div>
                  <span className="rounded-full border border-amber-200/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-100/80">
                    {account.priority_band ?? account.tier ?? 'research'}
                  </span>
                </div>
                <div className="mt-4 text-sm leading-6 text-white/58">
                  {typeof account.payload?.positioning === 'string' ? account.payload.positioning : 'Supplier intelligence record'}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <SourceLinks urls={account.source_urls} />
                  <StatusSelect value={account.status} options={STATUS_OPTIONS} onChange={(value) => void patch('account', account.id, { status: value })} />
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {tab === 'products' ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.products.filter((product) => {
              const supplier = product.supplier_account_id ? accountById.get(product.supplier_account_id) : null
              return contains(product.product_name, product.thc_cbd_signal, supplier?.company_name)
            }).map((product) => (
              <article key={product.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="text-xs uppercase tracking-[0.14em] text-amber-200/60">
                  {product.supplier_account_id ? accountById.get(product.supplier_account_id)?.company_name : 'Market product'}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{product.product_name}</h3>
                <p className="mt-2 text-sm text-white/55">{product.format_positioning ?? '—'}</p>
                <div className="mt-4 rounded-xl border border-white/8 p-3 text-sm">
                  <div className="text-white/35">Potency</div>
                  <div className="mt-1">{product.thc_cbd_signal ?? 'RFQ required'}</div>
                </div>
                <p className="mt-3 text-xs leading-5 text-white/42">{product.recommended_use ?? product.quality_signal ?? '—'}</p>
                <div className="mt-4"><SourceLinks urls={[product.source_url]} /></div>
              </article>
            ))}
          </section>
        ) : null}

        {tab === 'matches' ? (
          <section className="space-y-3">
            {data.matches.filter((match) => {
              const buyer = accountById.get(match.buyer_account_id)
              const supplier = accountById.get(match.supplier_account_id)
              return contains(buyer?.company_name, supplier?.company_name, match.buyer_specific_offer)
            }).sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0)).map((match) => (
              <article key={match.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1.2fr_120px_180px] lg:items-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Buyer</div>
                    <div className="mt-1 font-semibold">{accountById.get(match.buyer_account_id)?.company_name ?? 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Supplier</div>
                    <div className="mt-1 font-semibold">{accountById.get(match.supplier_account_id)?.company_name ?? 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">Match</div>
                    <div className="mt-1 text-xl font-semibold text-amber-100">{match.match_score ?? '—'}</div>
                  </div>
                  <StatusSelect value={match.status} options={STATUS_OPTIONS} onChange={(value) => void patch('match', match.id, { status: value })} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm leading-6 text-white/55">
                  <div><span className="block text-[10px] uppercase tracking-[0.14em] text-white/30">Why</span>{match.why_match ?? '—'}</div>
                  <div><span className="block text-[10px] uppercase tracking-[0.14em] text-white/30">Offer</span>{match.buyer_specific_offer ?? '—'}</div>
                  <div><span className="block text-[10px] uppercase tracking-[0.14em] text-white/30">Pilot</span>{match.suggested_pilot ?? '—'}</div>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {tab === 'rfqs' ? (
          <section className="space-y-4">
            {data.rfqs.filter((rfq) => {
              const supplier = accountById.get(rfq.supplier_account_id)
              return contains(supplier?.company_name, rfq.subject, rfq.primary_ask)
            }).sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)).map((rfq) => (
              <article key={rfq.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-amber-200/60">Priority {rfq.priority ?? '—'}</div>
                    <h3 className="mt-1 text-xl font-semibold">{accountById.get(rfq.supplier_account_id)?.company_name ?? 'Supplier'}</h3>
                    <div className="mt-1 text-sm text-white/45">{rfq.subject ?? 'RFQ'}</div>
                  </div>
                  <StatusSelect value={rfq.status} options={RFQ_OPTIONS} onChange={(value) => void patch('rfq', rfq.id, { status: value })} />
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-xl border border-white/8 p-4">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Email draft</div>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-white/60">{rfq.email_draft ?? '—'}</pre>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/8 p-4 text-sm leading-6 text-white/58">
                      <span className="block text-[10px] uppercase tracking-[0.14em] text-white/30">LinkedIn opening</span>
                      {rfq.linkedin_opening ?? '—'}
                    </div>
                    <div className="rounded-xl border border-white/8 p-4 text-sm leading-6 text-white/58">
                      <span className="block text-[10px] uppercase tracking-[0.14em] text-white/30">Primary ask</span>
                      {rfq.primary_ask ?? '—'}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {tab === 'deals' ? (
          <section className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-[1500px] w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.16em] text-white/38">
                  <tr>
                    <th className="p-3">Buyer</th><th>Supplier</th><th>Market</th><th>Product</th><th>kg</th>
                    <th>Sell</th><th>Margin</th><th>Other cost</th><th>Max buy</th><th>Benchmark</th>
                    <th>Buyer</th><th>Supplier</th><th>Next action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deals.filter((deal) => {
                    const buyer = accountById.get(deal.buyer_account_id)
                    const supplier = deal.supplier_account_id ? accountById.get(deal.supplier_account_id) : null
                    return contains(buyer?.company_name, supplier?.company_name, deal.market, deal.product_concept)
                  }).map((deal) => (
                    <tr key={deal.id} className="border-t border-white/7 align-top">
                      <td className="p-3 font-medium">{accountById.get(deal.buyer_account_id)?.company_name ?? 'Unknown'}</td>
                      <td>{deal.supplier_account_id ? accountById.get(deal.supplier_account_id)?.company_name ?? 'Unknown' : 'TBD'}</td>
                      <td>{deal.market ?? '—'}</td>
                      <td className="max-w-sm">{deal.product_concept}</td>
                      <td>{deal.target_kg ?? '—'}</td>
                      <td>{money(deal.expected_sell_cad_per_g)}</td>
                      <td>{percent(deal.target_gross_margin)}</td>
                      <td>{money(deal.non_supplier_variable_cad_per_g)}</td>
                      <td className="font-semibold text-amber-100">{money(deal.max_supplier_buy_cad_per_g)}</td>
                      <td>{money(deal.public_supply_benchmark_cad_per_g)}</td>
                      <td><StatusSelect value={deal.buyer_status} options={STATUS_OPTIONS} onChange={(value) => void patch('deal', deal.id, { buyer_status: value })} /></td>
                      <td><StatusSelect value={deal.supplier_status} options={STATUS_OPTIONS} onChange={(value) => void patch('deal', deal.id, { supplier_status: value })} /></td>
                      <td className="max-w-md text-white/58">{deal.next_action ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === 'tasks' ? (
          <section className="space-y-3">
            {data.tasks.filter((task) => contains(task.action, task.account_key, task.expected_output, task.status)).map((task) => (
              <article key={task.id} className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:grid-cols-[80px_1fr_220px] md:items-center">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Day</div>
                  <div className="mt-1 text-2xl font-semibold">{task.day_number ?? '—'}</div>
                </div>
                <div>
                  <div className="font-semibold">{task.action}</div>
                  <div className="mt-1 text-sm text-white/48">{task.account_key ?? 'General'} · {task.expected_output ?? '—'}</div>
                  {task.dependency ? <div className="mt-1 text-xs text-white/28">Depends on: {task.dependency}</div> : null}
                </div>
                <StatusSelect value={task.status} options={TASK_OPTIONS} onChange={(value) => void patch('task', task.id, { status: value })} />
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  )
}
