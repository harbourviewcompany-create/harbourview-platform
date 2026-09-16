/**
 * Lightweight CSS globe for route-level loading boundaries.
 * Intentionally free of R3F / GlobeProvider so first paint stays fast.
 */
export function LoadingGlobe({
  size = 200,
  spinDurationMs = 13000,
  className,
}: {
  /** Diameter in px (or any CSS length when passed as string). */
  size?: number | string
  /** Full rotation duration; slower reads as command, not spinner. */
  spinDurationMs?: number
  className?: string
}) {
  const diameter = typeof size === 'number' ? `${size}px` : size

  return (
    <div
      className={className}
      aria-hidden="true"
      data-loading-globe="true"
      style={{
        position: 'relative',
        width: diameter,
        height: diameter,
        maxWidth: '100%',
        marginInline: 'auto',
      }}
    >
      <style>{`
        @keyframes hv-loading-globe-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-loading-globe-surface {
            animation: none !important;
          }
        }
      `}</style>

      {/* Soft field behind the sphere */}
      <div
        style={{
          position: 'absolute',
          inset: '-18%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 48%, rgba(198,165,90,0.16), transparent 62%)',
          pointerEvents: 'none',
        }}
      />

      {/* Atmosphere halo — static */}
      <div
        style={{
          position: 'absolute',
          inset: '-6%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 50%, rgba(198,165,90,0.14) 0%, rgba(96,144,220,0.08) 42%, transparent 68%)',
          boxShadow: '0 0 40px rgba(198,165,90,0.12)',
          pointerEvents: 'none',
        }}
      />

      {/* Sphere shell — depth + limb; does not spin */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid rgba(198,165,90,0.34)',
          background:
            'radial-gradient(circle at 32% 24%, rgba(255,240,180,0.22), transparent 28%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.55) 0%, transparent 55%)',
          boxShadow:
            'inset -22px -28px 55px rgba(0,0,0,0.62), inset 10px 14px 36px rgba(198,165,90,0.16), 0 18px 56px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Rotating surface — bands sell the spin */}
        <div
          className="hv-loading-globe-surface"
          style={{
            position: 'absolute',
            inset: '-8%',
            borderRadius: '50%',
            background: `
              repeating-conic-gradient(
                from 0deg,
                rgba(198,165,90,0.55) 0deg 14deg,
                rgba(90,65,22,0.85) 14deg 22deg,
                rgba(180,140,55,0.7) 22deg 36deg,
                rgba(40,28,10,0.9) 36deg 44deg
              )
            `,
            opacity: 0.92,
            animation: `hv-loading-globe-spin ${spinDurationMs}ms linear infinite`,
            mixBlendMode: 'soft-light',
          }}
        />

        {/* Base metal wash under the bands */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 42% 40%, rgba(180,140,55,0.95) 0%, rgba(90,65,22,0.96) 52%, rgba(20,14,6,0.98) 100%)',
            zIndex: -1,
          }}
        />

        {/* Fixed limb / specular highlight — screen-space, sells volume */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 22%, rgba(255,248,220,0.55) 0%, transparent 26%), radial-gradient(circle at 78% 72%, rgba(0,0,0,0.45) 0%, transparent 40%)',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle equator / latitude cues (static relative to limb) */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '48%',
            height: 1,
            background:
              'linear-gradient(90deg, transparent, rgba(245,241,232,0.18), transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}
