import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCultivarPassports } from '@/lib/genetics/queries'

export const metadata: Metadata = {
  title: 'Cultivar Catalog | Harbourview Genetics',
  description: 'Browse public-safe cultivar passports for regulated cannabis genetics.',
}

export const dynamic = 'force-dynamic'

export default async function CultivarsListPage() {
  const passports = await getPublicCultivarPassports()

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8' }}>
      <style>{CSS}</style>
      <div className="cv-wrap">
        <nav className="cv-nav">
          <Link href="/genetics">Genetics</Link>
          <span>›</span>
          <span>Cultivars</span>
        </nav>
        <header className="cv-header">
          <h1>Cultivar catalog</h1>
          <p>
            {passports.length} public passport{passports.length === 1 ? '' : 's'}. Filter depth and
            comparison tools expand in operator workspace.
          </p>
        </header>

        {passports.length === 0 ? (
          <p className="cv-empty">No public cultivars published yet.</p>
        ) : (
          <div className="cv-grid">
            {passports.map((p) => (
              <Link key={p.id} href={`/genetics/cultivars/${p.slug}`} className="cv-card">
                <div className="cv-top">
                  <h2>{p.displayName}</h2>
                  <span>{p.claimStatus.replace(/_/g, ' ')}</span>
                </div>
                <p className="cv-meta">
                  {[p.cultivarCategory, p.cannabisCategory, p.originCountryCode, p.breederDisplayName]
                    .filter(Boolean)
                    .map((x) => String(x).replace(/_/g, ' '))
                    .join(' · ')}
                </p>
                <p className="cv-body">
                  {p.publicSummary.slice(0, 220)}
                  {p.publicSummary.length > 220 ? '…' : ''}
                </p>
                {p.aliasesPublic.length > 0 && (
                  <div className="cv-tags">
                    {p.aliasesPublic.slice(0, 4).map((a) => (
                      <span key={a}>{a}</span>
                    ))}
                  </div>
                )}
                <span className="cv-link">Open passport →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

const CSS = `
.cv-wrap{max-width:1100px;margin:0 auto;padding:48px 24px 80px}
.cv-nav{display:flex;gap:8px;align-items:center;margin-bottom:28px;font-size:11px;color:rgba(245,240,232,.4)}
.cv-nav a{color:#d4a84b;text-decoration:none}
.cv-header h1{font-family:Georgia,serif;font-size:clamp(24px,3vw,34px);font-weight:400;margin:0 0 8px;color:#f5f0e8}
.cv-header p{font-size:13px;color:rgba(245,240,232,.5);margin:0 0 24px}
.cv-empty{font-size:13px;color:rgba(245,240,232,.45)}
.cv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.cv-card{display:flex;flex-direction:column;gap:8px;padding:18px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;color:inherit}
.cv-card:hover{border-color:rgba(212,168,75,.25)}
.cv-top{display:flex;justify-content:space-between;gap:8px}
.cv-top h2{margin:0;font-size:15px;color:#f5f0e8}
.cv-top span{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:rgba(212,168,75,.85);border:1px solid rgba(212,168,75,.25);padding:2px 6px;border-radius:4px;height:fit-content}
.cv-meta{font-size:11px;color:rgba(245,240,232,.35);margin:0;text-transform:capitalize}
.cv-body{font-size:12px;line-height:1.6;color:rgba(245,240,232,.5);margin:0}
.cv-tags{display:flex;flex-wrap:wrap;gap:4px}
.cv-tags span{font-size:10px;padding:2px 7px;border-radius:4px;background:rgba(91,155,213,.1);color:#5b9bd5}
.cv-link{font-size:11px;color:#d4a84b;margin-top:auto}
`
