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
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <p style={{ margin: 0, color: '#c6a55a', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Harbourview Command Centre
        </p>
        <h1 style={{ margin: '12px 0 8px', fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 400 }}>
          Loading the operating picture
        </h1>
        <p style={{ maxWidth: 720, margin: 0, color: 'rgba(245,241,232,.62)', lineHeight: 1.6 }}>
          Resolving jurisdiction, role, marketplace, intelligence, education, compliance and review controls.
        </p>
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
