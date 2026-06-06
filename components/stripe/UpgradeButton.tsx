'use client'

import { useState } from 'react'
import type { PriceKey } from '@/lib/stripe/server'

export default function UpgradeButton({
  priceKey,
  label,
  className,
  style,
}: {
  priceKey: PriceKey
  label?: string
  className?: string
  style?: React.CSSProperties
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey, returnPath: '/account' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={style}
        className={className ?? 'rounded-xl bg-[#C6A55A] px-5 py-2.5 text-sm font-semibold text-[#07111F] transition-colors hover:bg-[#d4b468] disabled:opacity-50'}
      >
        {loading ? 'Redirecting…' : (label ?? 'Upgrade')}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
