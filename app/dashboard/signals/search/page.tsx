// app/dashboard/signals/search/page.tsx
// Standalone signal-search page. New, additive route -- does not modify any
// existing page or navigation. Add a link to it from wherever the dashboard
// nav is safest to extend, separately, once this is verified working.

import SignalSemanticSearch from '@/components/dashboard/SignalSemanticSearch'

export const metadata = {
  title: 'Search Signals — HarbourView',
}

export default function SignalSearchPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 8px' }}>
        <h1 style={{ color: '#f0f0f0', fontSize: 22, margin: 0 }}>Search Signals</h1>
        <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>
          Semantic search over reviewed regulatory signals. Available on Intel and Operator plans.
        </p>
      </div>
      <SignalSemanticSearch />
    </main>
  )
}
