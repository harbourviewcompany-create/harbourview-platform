import { LoadingGlobe } from '@/components/dashboard/LoadingGlobe'

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
      }}
    >
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
          HARBOURVIEW COMMAND CENTRE
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

        <div style={{ marginTop: 40, maxWidth: 280 }}>
          <LoadingGlobe size="min(42vw, 200px)" spinDurationMs={13000} />
        </div>

        <div
          aria-hidden="true"
          style={{
            height: 2,
            width: 'min(420px, 100%)',
            marginTop: 32,
            background: 'linear-gradient(90deg, #c6a55a, rgba(198,165,90,.08))',
          }}
        />
      </div>
    </main>
  )
}
