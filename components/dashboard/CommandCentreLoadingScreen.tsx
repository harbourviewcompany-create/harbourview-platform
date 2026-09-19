import { LoadingGlobe } from '@/components/dashboard/LoadingGlobe'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

const copy = COMMAND_CENTRE_COPY.loadingBoundary

/**
 * Progressive Command Centre loading boundary.
 * Paints shell chrome (wordmark header) immediately, then the operating-picture
 * content with LoadingGlobe — no R3F, safe for Next.js loading.tsx.
 */
export function CommandCentreLoadingScreen() {
  return (
    <div
      aria-busy="true"
      aria-label={copy.ariaLabel}
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#020814',
        color: '#f5f1e8',
      }}
    >
      <style>{`
        @keyframes hv-loading-rule-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-loading-rule {
            animation: none !important;
            background: linear-gradient(90deg, #c6a55a, rgba(198,165,90,.08)) !important;
          }
        }
      `}</style>

      {/* Progressive shell — header frame before modules resolve */}
      <header
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          minHeight: 56,
          padding: '12px clamp(16px, 4vw, 28px)',
          borderBottom: '1px solid rgba(198,165,90,0.14)',
          background: 'linear-gradient(180deg, rgba(7,17,31,0.98), rgba(2,8,20,0.96))',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              color: '#c6a55a',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            HARBOURVIEW
          </span>
          <span
            style={{
              color: 'rgba(245,241,232,0.45)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Command Centre
          </span>
        </div>
        <div
          style={{
            width: 72,
            height: 8,
            borderRadius: 999,
            background: 'rgba(198,165,90,0.12)',
          }}
        />
      </header>

      <main
        style={{
          flex: 1,
          padding: 'clamp(24px, 5vw, 64px)',
          width: '100%',
          maxWidth: 1440,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#c6a55a',
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {copy.eyebrow}
        </p>
        <h1
          style={{
            margin: '12px 0 8px',
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 400,
          }}
        >
          {copy.title}
        </h1>
        <p
          style={{
            maxWidth: 720,
            margin: 0,
            color: 'rgba(245,241,232,.62)',
            lineHeight: 1.6,
          }}
        >
          {copy.detail}
        </p>

        <div style={{ marginTop: 40, maxWidth: 280 }}>
          <LoadingGlobe size="min(42vw, 200px)" spinDurationMs={13000} />
        </div>

        <div
          className="hv-loading-rule"
          aria-hidden="true"
          style={{
            height: 2,
            width: 'min(420px, 100%)',
            marginTop: 32,
            background:
              'linear-gradient(90deg, rgba(198,165,90,.08) 0%, #c6a55a 40%, rgba(255,240,180,.95) 50%, #c6a55a 60%, rgba(198,165,90,.08) 100%)',
            backgroundSize: '200% 100%',
            animation: 'hv-loading-rule-shimmer 2.8s ease-in-out infinite',
          }}
        />

        {/* Lightweight module placeholders — progressive handoff cue */}
        <div
          aria-hidden="true"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
            marginTop: 40,
            maxWidth: 720,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 64,
                borderRadius: 12,
                border: '1px solid rgba(198,165,90,0.1)',
                background:
                  'linear-gradient(135deg, rgba(198,165,90,0.06), rgba(7,17,31,0.4))',
              }}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
