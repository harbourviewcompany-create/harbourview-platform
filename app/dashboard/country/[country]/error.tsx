'use client'

import Link from 'next/link'

export default function DashboardCountryError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#03070d] p-6 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/25 bg-red-950/20 p-8">
        <h2 className="text-2xl font-semibold">Country dashboard could not load</h2>
        <p className="mt-3 text-white/70">Retry the dashboard route or return to the globe country selector.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-xl bg-[#c6a55a] px-4 py-3 text-sm font-semibold text-[#07111f]">Retry</button>
          <Link href="/" className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80">Back to globe</Link>
        </div>
      </div>
    </main>
  )
}
