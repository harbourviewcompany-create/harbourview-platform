'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

const copy = COMMAND_CENTRE_COPY.errorBoundary

export default function CountryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CountryConsole]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#03070d] px-6 text-center">
      <p
        className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: 'rgba(198,165,90,0.55)' }}
      >
        {copy.eyebrow}
      </p>
      <h1
        className="mb-3 font-serif text-3xl"
        style={{ color: '#f5f1e8' }}
      >
        Market workspace could not finish loading
      </h1>
      <p className="mb-7 max-w-md text-sm leading-relaxed" style={{ color: 'rgba(243,240,234,0.45)' }}>
        {copy.detail}
        {error.digest && (
          <span className="mt-2 block text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Failure digest: {error.digest}
          </span>
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90"
          style={{
            background: 'rgba(198,165,90,0.12)',
            border: '1px solid rgba(198,165,90,0.3)',
            color: '#F0D39A',
          }}
        >
          {copy.retry}
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl px-5 py-2.5 text-sm transition-all hover:opacity-70"
          style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(243,240,234,0.5)' }}
        >
          Back to Command Centre
        </Link>
      </div>
    </div>
  )
}
