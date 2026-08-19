import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicServiceProviders } from '@/lib/genetics/queries'

export const metadata: Metadata = {
  title: 'Genetics Service Providers | Harbourview',
  description: 'Public-safe directory of genetics-related service providers.',
}

export const dynamic = 'force-dynamic'

export default async function GeneticsServicesPage() {
  const providers = await getPublicServiceProviders()

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8' }}>
      <style>{CSS}</style>
      <div className="gs-wrap">
        <nav className="gs-nav">
          <Link href="/genetics">Genetics</Link>
          <span>›</span>
          <span>Services</span>
        </nav>
        <h1>Service providers</h1>
        <p className="gs-sub">
          Reviewed public listings for genotyping, chemotype testing, tissue culture, and related
          services. Contact stays private.
        </p>
        {providers.length === 0 ? (
          <p className="gs-empty">No public service providers listed yet.</p>
        ) : (
          <div className="gs-grid">
            {providers.map((p) => (
              <article key={p.id} className="gs-card">
                <h2>{p.displayName}</h2>
                <p className="gs-cat">{p.service_category.replace(/_/g, ' ')}</p>
                <p className="gs-body">{p.service_summary}</p>
                <p className="gs-meta">
                  {[p.country_code, p.jurisdiction_label, p.verification_level]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </article>
            ))}
          </div>
        )}
        <Link href="/contact" className="gs-link">
          Request introduction →
        </Link>
      </div>
    </main>
  )
}

const CSS = `
.gs-wrap{max-width:960px;margin:0 auto;padding:48px 24px 80px}
.gs-nav{display:flex;gap:8px;margin-bottom:24px;font-size:11px;color:rgba(245,240,232,.4)}
.gs-nav a{color:#d4a84b;text-decoration:none}
.gs-wrap h1{font-family:Georgia,serif;font-size:28px;font-weight:400;margin:0 0 8px}
.gs-sub{font-size:13px;color:rgba(245,240,232,.5);margin:0 0 24px;max-width:560px;line-height:1.6}
.gs-empty{font-size:13px;color:rgba(245,240,232,.45)}
.gs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:24px}
.gs-card{padding:16px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.gs-card h2{margin:0 0 4px;font-size:14px;color:#f5f0e8}
.gs-cat{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#d4a84b;margin:0 0 8px}
.gs-body{font-size:12px;line-height:1.55;color:rgba(245,240,232,.5);margin:0 0 8px}
.gs-meta{font-size:11px;color:rgba(245,240,232,.3);margin:0}
.gs-link{font-size:12px;color:#d4a84b;text-decoration:none}
`
