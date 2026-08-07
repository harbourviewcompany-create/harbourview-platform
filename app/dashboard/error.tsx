'use client'

import { useEffect } from 'react'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[dashboard-error-boundary]', {
      message: error.message,
      digest: error.digest ?? null,
    })
  }, [error])

  return (
    <main
      role="alert"
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: '#020814',
        color: '#f5f1e8',
        padding: 24,
      }}
    >
      <section
        style={{
          width: 'min(680px, 100%)',
          padding: 'clamp(24px, 5vw, 48px)',
          border: '1px solid rgba(198,165,90,.24)',
          borderRadius: 20,
          background: 'linear-gradient(145deg, rgba(13,29,47,.98), rgba(5,15,28,.98))',
        }}
      >
        <p style={{ margin: 0, color: '#c6a55a', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          {COMMAND_CENTRE_COPY.errorBoundary.eyebrow}
        </p>
        <h1 style={{ margin: '12px 0 8px', fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 400 }}>
          {COMMAND_CENTRE_COPY.errorBoundary.title}
        </h1>
        <p style={{ margin: 0, color: 'rgba(245,241,232,.66)', lineHeight: 1.65 }}>
          {COMMAND_CENTRE_COPY.errorBoundary.detail}
        </p>
        {error.digest && (
          <p style={{ margin: '16px 0 0', color: 'rgba(245,241,232,.42)', fontFamily: 'monospace', fontSize: 12 }}>
            Digest: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 48,
            marginTop: 24,
            padding: '0 18px',
            border: 0,
            borderRadius: 12,
            background: '#c6a55a',
            color: '#06101d',
            fontWeight: 800,
          }}
        >
          {COMMAND_CENTRE_COPY.errorBoundary.retry}
        </button>
      </section>
    </main>
  )
}
