'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { reportClientError } from '@/lib/errorReporting'

export default function AdminSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[HarbourviewAdmin]', error)
    reportClientError('admin', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-red-400/70">
        Error · Admin
      </p>
      <h1 className="mb-3 text-2xl font-semibold text-[#F5F1E8]">
        This section failed to load
      </h1>
      <p className="mb-7 max-w-sm text-sm leading-relaxed text-[#F5F1E8]/50">
        Something went wrong loading this admin page. The rest of the admin
        area is unaffected — use the nav above to go elsewhere, or retry this
        page.
        {error.digest && (
          <span className="mt-2 block text-[10px] text-[#F5F1E8]/25">
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-[#C6A55A]/40 bg-[#C6A55A]/10 px-5 py-2.5 text-sm font-medium text-[#C6A55A] transition hover:bg-[#C6A55A]/20"
        >
          Try again
        </button>
        <Link
          href="/admin/hub"
          className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-[#F5F1E8]/60 transition hover:bg-white/5"
        >
          Back to Admin Hub
        </Link>
      </div>
    </div>
  )
}
