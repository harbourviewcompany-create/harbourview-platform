export default function HomePage() {
  return (
    <main>
      <div className="container" style={{ padding: '48px 0' }}>
        <section className="panel" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ color: 'var(--hv-gold)', letterSpacing: '0.18em', fontSize: 12, textTransform: 'uppercase', marginBottom: 12 }}>
            Harbourview
          </div>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.05 }}>Commercial intelligence and market access operations</h1>
          <p style={{ color: 'var(--hv-muted)', maxWidth: 720, fontSize: 16, lineHeight: 1.6 }}>
            This repository now acts as the canonical starting point for the Harbourview platform. The next layer is wiring the app to Supabase and replacing the placeholder migration with the real migration pack.
          </p>
        </section>

        <section className="panel" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Initial system lanes</h2>
          <ul style={{ color: 'var(--hv-muted)', lineHeight: 1.8 }}>
            <li>dashboard and operator workspace</li>
            <li>signals, companies, contacts and opportunities</li>
            <li>role-aware review, curation and publishing</li>
            <li>Supabase migrations, RPCs and edge functions</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
