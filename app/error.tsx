'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
      <p className="max-w-sm text-sm text-gray-500">
        An unexpected error occurred. Our team has been notified.
        {error.digest && (
          <span className="mt-1 block font-mono text-xs text-gray-400">
            Ref: {error.digest}
          </span>
        )}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        Try again
      </button>
    </div>
  )
}
