'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/lib/errorReporting'
import './globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[HarbourviewGlobalError]', error)
    reportClientError('global', error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#020814] px-6 text-center text-white">
        <p
          className="mb-3 text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'rgba(239,68,68,0.55)' }}
        >
          Error · Harbourview
        </p>
        <h1 className="mb-3 font-serif text-3xl">Something went wrong</h1>
        <p
          className="mb-7 max-w-sm text-sm leading-relaxed"
          style={{ color: 'rgba(243,240,234,0.45)' }}
        >
          Harbourview hit an unexpected error loading this page.
          {error.digest && (
            <span className="mt-1 block text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Error ID: {error.digest}
            </span>
          )}
        </p>
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
      </body>
    </html>
  )
}
