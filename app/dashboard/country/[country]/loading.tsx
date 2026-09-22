import { LoadingGlobe } from '@/components/dashboard/LoadingGlobe'
import { COMMAND_CENTRE_COPY } from '@/lib/platform/commandCentreCopy'

const copy = COMMAND_CENTRE_COPY.countryLoadingBoundary

/**
 * Country workspace loading — progressive shell frames + branded globe.
 * Matches Command Centre loading language without the full-bleed screen,
 * so in-shell navigation keeps rail/sidebar structure visible.
 */
export default function CountryLoading() {
  return (
    <div
      aria-busy="true"
      aria-label={copy.ariaLabel}
      className="flex min-h-screen flex-col bg-[#03070d]"
    >
      <style>{`
        @keyframes hv-country-loading-rule {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-country-loading-rule {
            animation: none !important;
            background: linear-gradient(90deg, #c6a55a, rgba(198,165,90,.08)) !important;
          }
        }
      `}</style>

      {/* Rail frame */}
      <div
        className="h-[52px] w-full"
        style={{
          background: 'rgba(4,9,18,0.97)',
          borderBottom: '1px solid rgba(198,165,90,0.12)',
        }}
        aria-hidden="true"
      />

      <div className="flex flex-1">
        {/* Sidebar frame */}
        <div
          className="hidden w-56 flex-shrink-0 p-4 sm:block"
          style={{
            background: 'rgba(4,9,18,0.97)',
            borderRight: '1px solid rgba(198,165,90,0.08)',
          }}
          aria-hidden="true"
        >
          <div
            className="mb-4 h-24 rounded-2xl"
            style={{ background: 'rgba(198,165,90,0.05)', border: '1px solid rgba(198,165,90,0.08)' }}
          />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="mb-1.5 h-8 rounded-lg"
              style={{ background: 'rgba(198,165,90,0.04)' }}
            />
          ))}
        </div>

        {/* Main — branded loading content */}
        <div className="flex flex-1 flex-col items-start px-5 py-6 sm:px-8">
          <p
            style={{
              margin: 0,
              color: '#c6a55a',
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            {copy.eyebrow}
          </p>
          <h1
            style={{
              margin: '10px 0 8px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(24px, 3.5vw, 36px)',
              fontWeight: 400,
              color: '#f5f1e8',
              lineHeight: 1.12,
            }}
          >
            {copy.title}
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 520,
              color: 'rgba(245,241,232,0.55)',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {copy.detail}
          </p>

          <div style={{ marginTop: 32, width: 160 }}>
            <LoadingGlobe size={160} />
          </div>

          <div
            className="hv-country-loading-rule"
            aria-hidden="true"
            style={{
              height: 1,
              width: 'min(320px, 100%)',
              marginTop: 28,
              background:
                'linear-gradient(90deg, rgba(198,165,90,.08) 0%, #c6a55a 40%, rgba(255,240,180,.95) 50%, #c6a55a 60%, rgba(198,165,90,.08) 100%)',
              backgroundSize: '200% 100%',
              animation: 'hv-country-loading-rule 2.8s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  )
}
