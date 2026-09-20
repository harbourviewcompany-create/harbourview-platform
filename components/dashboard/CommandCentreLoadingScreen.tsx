import { LoadingGlobe } from '@/components/dashboard/LoadingGlobe'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

const copy = COMMAND_CENTRE_COPY.loadingBoundary

/**
 * Progressive Command Centre loading boundary.
 * Keeps the loading state intentionally quiet: centered command-centre copy,
 * a polar Harbourview globe, and one restrained progress rule.
 */
export function CommandCentreLoadingScreen() {
  return (
    <div
      aria-busy="true"
      aria-label={copy.ariaLabel}
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at 50% 40%, rgba(7,17,31,0.98) 0%, #020814 58%, #01050c 100%)',
        color: '#f5f1e8',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes hv-loading-rule-shimmer {
          0% { background-position: 100% 0; opacity: .42; }
          50% { opacity: 1; }
          100% { background-position: -100% 0; opacity: .42; }
        }
        @keyframes hv-loading-copy-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hv-loading-copy {
          animation: hv-loading-copy-in 700ms ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-loading-copy,
          .hv-loading-rule {
            animation: none !important;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 50%, rgba(198,165,90,0.035), transparent 34%)',
        }}
      />

      <main
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(920px, calc(100vw - 32px))',
          minHeight: '100dvh',
          boxSizing: 'border-box',
          display: 'grid',
          placeItems: 'center',
          padding: 'clamp(28px, 6vh, 72px) 0',
          textAlign: 'center',
        }}
      >
        <section
          className="hv-loading-copy"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#c6a55a',
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            {copy.eyebrow}
          </p>

          <h1
            style={{
              margin: '12px 0 10px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(29px, 4.2vw, 48px)',
              lineHeight: 1.08,
              fontWeight: 400,
              letterSpacing: '-0.015em',
            }}
          >
            {copy.title}
          </h1>

          <p
            style={{
              maxWidth: 680,
              margin: 0,
              color: 'rgba(245,241,232,.58)',
              fontSize: 'clamp(13px, 1.5vw, 15px)',
              lineHeight: 1.65,
            }}
          >
            {copy.detail}
          </p>

          <div
            style={{
              width: 'min(62vw, 340px)',
              marginTop: 'clamp(30px, 5vh, 52px)',
            }}
          >
            <LoadingGlobe size="100%" />
          </div>

          <div
            className="hv-loading-rule"
            aria-hidden="true"
            style={{
              height: 1,
              width: 'min(420px, 72vw)',
              marginTop: 'clamp(28px, 4vh, 42px)',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(198,165,90,.12) 14%, #c6a55a 40%, rgba(255,240,180,.96) 50%, #c6a55a 60%, rgba(198,165,90,.12) 86%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'hv-loading-rule-shimmer 3.2s ease-in-out infinite',
            }}
          />
        </section>
      </main>
    </div>
  )
}
