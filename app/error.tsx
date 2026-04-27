'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#C6A55A',
          marginBottom: '16px',
        }}
      >
        Something went wrong
      </p>
      <h2
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(22px, 3vw, 36px)',
          fontWeight: 600,
          color: '#F5F1E8',
          margin: '0 0 16px',
        }}
      >
        An unexpected error occurred
      </h2>
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '14px',
          color: '#C9C2B3',
          lineHeight: '1.7',
          maxWidth: '440px',
          marginBottom: '32px',
        }}
      >
        {error?.digest ? `Error ID: ${error.digest}` : 'Please try refreshing or contact Harbourview if this persists.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px',
          backgroundColor: '#C6A55A',
          color: '#0B1A2F',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          borderRadius: '2px',
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  )
}
