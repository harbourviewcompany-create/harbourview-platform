import { LoadingGlobe } from '@/components/dashboard/LoadingGlobe'

/**
 * Admin segment loading — paints inside AdminControlShell content area.
 * Layout chrome (sidebar) remains from the parent layout when navigating
 * between admin routes; this boundary covers the main panel only.
 */
export default function AdminProtectedLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading admin control surface"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 20,
        minHeight: 240,
        padding: '8px 0 24px',
        color: '#D4C9B8',
      }}
    >
      <style>{`
        @keyframes hv-admin-loading-rule {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-admin-loading-rule {
            animation: none !important;
            background: linear-gradient(90deg, #C9A84C, rgba(201,168,76,.1)) !important;
          }
        }
      `}</style>

      <p
        style={{
          margin: 0,
          color: '#C9A84C',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        Admin control surface
      </p>
      <h1
        style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(22px, 3vw, 32px)',
          fontWeight: 400,
          color: '#E8DFD0',
        }}
      >
        Loading panel
      </h1>
      <p style={{ margin: 0, maxWidth: 480, color: '#6A7E9B', fontSize: 14, lineHeight: 1.55 }}>
        Resolving operator controls and review queues.
      </p>

      <div style={{ marginTop: 8 }}>
        <LoadingGlobe size={140} />
      </div>

      <div
        className="hv-admin-loading-rule"
        aria-hidden="true"
        style={{
          height: 2,
          width: 'min(280px, 100%)',
          marginTop: 8,
          background:
            'linear-gradient(90deg, rgba(201,168,76,.1) 0%, #C9A84C 40%, rgba(255,220,140,.9) 50%, #C9A84C 60%, rgba(201,168,76,.1) 100%)',
          backgroundSize: '200% 100%',
          animation: 'hv-admin-loading-rule 2.8s ease-in-out infinite',
        }}
      />
    </div>
  )
}
