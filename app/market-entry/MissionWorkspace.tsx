'use client'

import { useEffect, useState } from 'react'

type Mission = {
  id: string
  origin_iso2: string
  destination_iso2: string
  product_class: string
  status: string
  plan_version: number
  reproducibility_key: string
  payment_status?: string
  report_status?: string
  created_at: string
}

type Plan = {
  status: string
  input: { originIso2: string; destinationIso2: string; productClass: string }
  reproducibilityKey: string
  evidence: { overallStatus: string; items: Array<{ jurisdictionIso2: string; status: string; authorityName: string | null; authorityUrl: string | null; verifiedAt: string | null; expiresAt: string | null }> }
  execution: { tasks: Array<{ id: string; title: string; side: string; status: string; estimatedWeeks: number | null; prerequisiteIds: string[] }>; criticalPathWeeks: number }
  documentation: { required: string[]; optional: string[] }
  cost: { currency: string; ranges: string[]; confidence: string; disclaimer: string }
  timeline: { sequentialWeeks: number; criticalPathWeeks: number; confidence: string; disclaimer: string }
}

const PRODUCT_CLASSES = ['flower', 'extract', 'finished_product', 'starting_material']

export default function MissionWorkspace() {
  const [origin, setOrigin] = useState('CA')
  const [destination, setDestination] = useState('DE')
  const [product, setProduct] = useState('flower')
  const [mission, setMission] = useState<Mission | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMissions() {
    const response = await fetch('/api/market-entry/missions', { cache: 'no-store' })
    if (!response.ok) return
    const data = await response.json() as { missions?: Mission[] }
    setMissions(data.missions ?? [])
  }

  useEffect(() => { void loadMissions() }, [])

  async function createMission() {
    setBusy(true)
    setError(null)
    setPlan(null)
    try {
      const response = await fetch('/api/market-entry/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originIso2: origin.toUpperCase(), destinationIso2: destination.toUpperCase(), productClass: product }),
      })
      const data = await response.json() as { error?: string; mission?: Mission; plan?: Plan }
      if (!response.ok || !data.mission || !data.plan) throw new Error(data.error ?? 'Unable to create mission.')
      setMission(data.mission)
      setPlan(data.plan)
      await loadMissions()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create mission.')
    } finally {
      setBusy(false)
    }
  }

  async function buyReport() {
    if (!mission) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/market-entry/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: mission.id }),
      })
      const data = await response.json() as { error?: string; url?: string }
      if (!response.ok || !data.url) throw new Error(data.error ?? 'Checkout is unavailable.')
      window.location.assign(data.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout is unavailable.')
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#07090d] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Harbourview · Market Entry OS</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-5xl">Build a market-entry mission.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Generate a decision-grade corridor plan, inspect evidence and dependencies, then unlock the persisted report through one-time checkout. Unknown or stale regulatory evidence remains blocked.</p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-4">
          <label className="text-xs uppercase tracking-wider text-white/45">Origin<input value={origin} onChange={e => setOrigin(e.target.value)} maxLength={2} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-base uppercase outline-none focus:border-white/30" /></label>
          <label className="text-xs uppercase tracking-wider text-white/45">Destination<input value={destination} onChange={e => setDestination(e.target.value)} maxLength={2} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-base uppercase outline-none focus:border-white/30" /></label>
          <label className="text-xs uppercase tracking-wider text-white/45">Product<select value={product} onChange={e => setProduct(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-base outline-none">{PRODUCT_CLASSES.map(item => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
          <button disabled={busy} onClick={createMission} className="self-end rounded-lg bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-40">{busy ? 'Building…' : 'Build mission'}</button>
        </section>

        {error && <div role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">{error}</div>}

        {plan && mission && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-white/40">Mission status</p><p className="mt-1 text-xl">{plan.status}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs">Evidence: {plan.evidence.overallStatus}</span></div>
                <p className="mt-4 font-mono text-xs text-white/35">{plan.reproducibilityKey}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg">Execution graph</h2><p className="mt-1 text-sm text-white/50">Critical path: {plan.execution.criticalPathWeeks} weeks</p><div className="mt-5 space-y-2">{plan.execution.tasks.map(task => <div key={task.id} className="rounded-lg border border-white/8 bg-black/20 p-3"><div className="flex justify-between gap-4"><span className="text-sm">{task.title}</span><span className="text-xs text-white/40">{task.status}</span></div><p className="mt-1 text-xs text-white/40">{task.side} · {task.estimatedWeeks ?? '—'} weeks · {task.prerequisiteIds.length} prerequisites</p></div>)}</div></div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg">Documentation</h2><p className="mt-3 text-xs uppercase tracking-wider text-white/35">Required</p><ul className="mt-2 space-y-1 text-sm text-white/70">{plan.documentation.required.map(item => <li key={item}>• {item}</li>)}</ul></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg">Cost & timeline</h2><p className="mt-3 text-sm text-white/70">{plan.cost.currency}: {plan.cost.ranges.join(', ') || 'Unknown'}</p><p className="mt-2 text-sm text-white/70">{plan.timeline.criticalPathWeeks} weeks critical path</p><p className="mt-3 text-xs leading-5 text-white/40">{plan.cost.disclaimer}</p></div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h2 className="text-lg">Evidence</h2><div className="mt-4 space-y-3">{plan.evidence.items.map(item => <div key={item.jurisdictionIso2} className="flex flex-col gap-1 border-b border-white/5 pb-3 sm:flex-row sm:justify-between"><span className="text-sm">{item.jurisdictionIso2} · {item.status}</span><span className="text-xs text-white/40">{item.authorityName ?? 'Authority evidence required'}{item.expiresAt ? ` · expires ${new Date(item.expiresAt).toLocaleDateString()}` : ''}</span></div>)}</div></div>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start"><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-wider text-white/40">Report</p><h2 className="mt-2 text-2xl">One-time corridor report</h2><p className="mt-3 text-sm leading-6 text-white/55">Payment unlocks the persisted report for this mission. Harbourview does not represent the plan as a licence, permit, customs clearance, or legal approval.</p><button disabled={busy || mission.payment_status === 'paid'} onClick={buyReport} className="mt-6 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-40">{mission.payment_status === 'paid' ? 'Report paid' : 'Continue to secure checkout'}</button><div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/40"><span>Mission</span><span className="text-right">{mission.id.slice(0, 8)}…</span><span>Payment</span><span className="text-right">{mission.payment_status ?? 'unpaid'}</span><span>Report</span><span className="text-right">{mission.report_status ?? 'locked'}</span></div></div></aside>
          </section>
        )}

        <section className="mt-10"><h2 className="text-sm uppercase tracking-[0.2em] text-white/40">Recent missions</h2><div className="mt-3 grid gap-2">{missions.map(item => <button key={item.id} onClick={() => { setMission(item); setError('Select a new corridor to rebuild its current plan. Persisted mission summaries are shown here; no stale plan is silently reused.') }} className="flex flex-wrap justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-left"><span>{item.origin_iso2} → {item.destination_iso2} · {item.product_class}</span><span className="text-xs text-white/40">{item.status} · {item.payment_status ?? 'unpaid'}</span></button>)}</div></section>
      </div>
    </main>
  )
}
