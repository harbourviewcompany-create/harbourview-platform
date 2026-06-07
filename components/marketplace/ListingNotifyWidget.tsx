'use client'

import { useState, useTransition } from 'react'

export function ListingNotifyWidget({ category }: { category: string }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Enter a valid email.'); return }
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/marketplace/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact_email: email,
            contact_name: 'Notification subscriber',
            inquiry_type: 'listing_notification',
            message: `New listing notification request for category: ${category}`,
          }),
        })
        if (res.ok) {
          setDone(true)
        } else {
          setError('Could not save. Try again.')
        }
      } catch {
        setError('Network error. Try again.')
      }
    })
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F] px-6 py-5 text-sm text-[#C6A55A]">
        ✓ You&apos;ll be notified when new {category} listings are approved.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] px-6 py-5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C6A55A]/70">
        New listing alerts
      </p>
      <p className="mb-4 text-sm leading-6 text-white/55">
        Get notified when new reviewed supply is added to this category.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#081423] px-4 py-2.5 text-sm text-[#F5F1E8] placeholder-white/30 outline-none ring-[#C6A55A]/40 focus:ring-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-full bg-[#C6A55A] px-5 py-2.5 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:opacity-60"
        >
          {isPending ? '...' : 'Notify me'}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
