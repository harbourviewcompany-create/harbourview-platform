'use client'

import { useState } from 'react'

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-xl border border-white/15 px-4 py-1.5 text-xs text-[#F5F1E8]/60 transition-colors hover:border-white/25 hover:text-[#F5F1E8]/80 disabled:opacity-40"
    >
      {loading ? 'Redirecting…' : 'Manage billing →'}
    </button>
  )
}
