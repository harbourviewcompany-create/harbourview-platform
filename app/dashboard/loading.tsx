export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading Harbourview Command Centre"
      style={{
        minHeight: '100dvh',
        background: '#020814',
        color: '#f5f1e8',
        padding: 'clamp(20px, 5vw, 64px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes hv-loading-globe-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hv-loading-globe-sphere {
            animation: none !important;
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
          Harbourview Command Centre
        </p>
        <h1
          style={{
            margin: '12px 0 8px',
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 400,
          }}
        >
          Loading the operating picture
        </h1>
        <p
          style={{
            maxWidth: 720,
            margin: 0,
            color: 'rgba(245,241,232,.62)',
            lineHeight: 1.6,
          }}
        >
          Resolving jurisdiction, role, marketplace, intelligence, education,
          compliance and review controls.
        </p>

        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            height: 'min(42vh, 280px)',
            marginTop: 40,
            maxWidth: 420,
          }}
        >
          {/* Soft radial field behind the sphere */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 50% 48%, rgba(198,165,90,0.14), transparent 58%)',
            }}
          />

          {/* Spinning gold sphere */}
          <div
            className="hv-loading-globe-sphere"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 'min(42vh, 220px)',
              height: 'min(42vh, 220px)',
              borderRadius: '50%',
              border: '1px solid rgba(198,165,90,0.32)',
              background:
                'radial-gradient(circle at 32% 24%, rgba(255,240,180,0.55), transparent 22%), radial-gradient(circle at 42% 42%, rgba(180,140,55,0.92) 0%, rgba(90,65,22,0.96) 52%, rgba(20,14,6,0.98) 100%)',
              boxShadow:
                'inset -22px -28px 55px rgba(0,0,0,0.55), inset 8px 12px 32px rgba(198,165,90,0.18), 0 18px 60px rgba(0,0,0,0.55)',
              animation: 'hv-loading-globe-spin 8s linear infinite',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Subtle latitude / highlight rings for depth */}
            <div
              style={{
                position: 'absolute',
                inset: '12%',
                borderRadius: '50%',
                border: '1px solid rgba(198,165,90,0.12)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '28%',
                borderRadius: '50%',
                border: '1px solid rgba(198,165,90,0.08)',
              }}
            />
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            height: 2,
            width: 'min(420px, 100%)',
            marginTop: 28,
            background: 'linear-gradient(90deg, #c6a55a, rgba(198,165,90,.08))',
          }}
        />
      </div>
    </main>
  )
}
