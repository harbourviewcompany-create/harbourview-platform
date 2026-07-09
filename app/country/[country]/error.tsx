'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { reportClientError } from '@/lib/errorReporting'

export default function CountryRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[HarbourviewCountryRoute]', error)
    reportClientError('country_role', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020814] px-6 text-center">
      <p
        className="mb-3 text-[10px] uppercase tracking-[0.2em]"
        style={{ color: 'rgba(239,68,68,0.55)' }}
      >
        Error · Harbourview
      </p>
      <h1 className="mb-3 font-serif text-3xl text-white">
        This market view failed to load
      </h1>
      <p
        className="mb-7 max-w-sm text-sm leading-relaxed"
        style={{ color: 'rgba(243,240,234,0.45)' }}
      >
        A data source for this market or role is temporarily unavailable.
        This may resolve on retry.
        {error.digest && (
          <span className="mt-1 block text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90"
          style={{
            background: 'rgba(198,165,90,0.12)',
            border: '1px solid rgba(198,165,90,0.3)',
            color: '#F0D39A',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl px-5 py-2.5 text-sm transition-all hover:opacity-70"
          style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(243,240,234,0.5)' }}
        >
          Back to Harbourview
        </Link>
      </div>
    </div>
  )
}
