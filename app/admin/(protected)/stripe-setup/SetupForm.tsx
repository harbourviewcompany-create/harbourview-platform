'use client'

import { useState } from 'react'

const inputCls = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#F5F1E8] placeholder-[#F5F1E8]/25 outline-none focus:border-[#C6A55A]/50 font-mono'

export default function SetupForm() {
  const [stripeKey, setStripeKey]     = useState('')
  const [vercelToken, setVercelToken] = useState('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<{
    ok?: boolean
    results?: Record<string, string>
    errors?: string[] | null
    error?: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/stripe/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripeKey, vercelToken }),
      })
      setResult(await res.json())
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  if (result?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-900/10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold text-emerald-300">Setup complete</p>
            <p className="text-xs text-[#F5F1E8]/50 mt-0.5">Stripe products created, Vercel env vars set, redeploy triggered.</p>
          </div>
        </div>

        <div className="rounded-xl bg-black/30 p-4 space-y-2">
          {Object.entries(result.results ?? {}).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-[#F5F1E8]/40 font-mono">{k}</span>
              <span className="text-xs text-[#C6A55A] font-mono">{v}</span>
            </div>
          ))}
        </div>

        {result.errors?.length ? (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-900/10 p-4">
            <p className="text-xs font-semibold text-yellow-400 mb-2">Warnings:</p>
            {result.errors.map(e => (
              <p key={e} className="text-xs text-yellow-300/70">{e}</p>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-[#F5F1E8]/40 text-center">
          Vercel is redeploying now. Payments will be live in ~2 minutes.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#07111F] p-6">
      {result?.error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-900/20 p-4 text-sm text-red-300">
          {result.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1.5 text-xs font-medium text-[#F5F1E8]/50">
            Stripe Secret Key
          </label>
          <input
            type="password"
            required
            value={stripeKey}
            onChange={e => setStripeKey(e.target.value)}
            placeholder="sk_live_... or sk_test_..."
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-[#F5F1E8]/30">
            Stripe Dashboard → Developers → API keys → Secret key
          </p>
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-medium text-[#F5F1E8]/50">
            Vercel API Token
          </label>
          <input
            type="password"
            required
            value={vercelToken}
            onChange={e => setVercelToken(e.target.value)}
            placeholder="vercel_..."
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-[#F5F1E8]/30">
            vercel.com/account/tokens → Create token → Full Access
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#C6A55A] py-3 text-sm font-semibold text-[#07111F] hover:bg-[#d4b468] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating products and setting env vars…' : 'Run setup'}
        </button>
      </form>

      <div className="mt-6 rounded-xl bg-white/[0.03] border border-white/8 p-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#F5F1E8]/30">What this does</p>
        <ul className="space-y-1">
          {[
            'Creates Intel Plus product ($149/mo, $1,490/yr)',
            'Creates Operator product ($490/mo, $4,900/yr)',
            'Creates the webhook endpoint + signing secret',
            'Sets STRIPE_SECRET_KEY in Vercel',
            'Sets all 4 price IDs in Vercel',
            'Sets STRIPE_WEBHOOK_SECRET in Vercel',
            'Sets NEXT_PUBLIC_APP_URL',
            'Triggers a Vercel redeploy',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-xs text-[#F5F1E8]/50">
              <span className="text-[#C6A55A]/60 mt-0.5">→</span>{item}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-[#F5F1E8]/25 pt-1">
          One click — no manual Stripe Dashboard steps required.
        </p>
      </div>
    </div>
  )
}
