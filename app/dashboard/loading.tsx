import { LoadingGlobe } from '@/components/dashboard/LoadingGlobe'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

const copy = COMMAND_CENTRE_COPY.loadingBoundary

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label={copy.ariaLabel}
      style={{
        minHeight: '100dvh',
        background: '#020814',
        color: '#f5f1e8',
        padding: 'clamp(20px, 5vw, 64px)',
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

      <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
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
      </div>
    </main>
  )
}
