import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCultivarPassports } from '@/lib/genetics/queries'

export const metadata: Metadata = {
  title: 'Genetics Catalog — Cultivar Passports | Harbourview',
  description:
    'Public-safe cultivar passport directory for regulated cannabis genetics. Reviewed summaries only — material transfer and private evidence stay behind controlled workflows.',
}

export const dynamic = 'force-dynamic'

export default async function GeneticsHomePage() {
  const passports = await getPublicCultivarPassports()

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8' }}>
      <style>{GX_CSS}</style>
      <div className="gx-wrap">
        <header className="gx-header">
          <p className="gx-eyebrow">Genetics marketplace</p>
          <h1 className="gx-title">Cultivar passports</h1>
          <p className="gx-sub">
            Public-safe orientation for reviewed genetics listings. Contact details, private evidence,
            and material-transfer pathways move through Harbourview-controlled workflows — never open
            directories.
          </p>
          <div className="gx-actions">
            <Link href="/genetics/cultivars" className="gx-btn">
              Browse cultivars
            </Link>
            <Link href="/genetics/services" className="gx-btn gx-btn--ghost">
              Service providers
            </Link>
            <Link href="/genetics/collaboration" className="gx-btn gx-btn--ghost">
              Collaboration
            </Link>
            <Link href="/contact" className="gx-btn gx-btn--ghost">
              Request access
            </Link>
          </div>
        </header>

        <div className="gx-boundary">
          Public summaries only. No private provenance, CoA files, or contact exposure on this surface.
        </div>

        {passports.length === 0 ? (
          <p className="gx-empty">
            No public cultivar passports published yet. Approved listings appear here after review.
          </p>
        ) : (
          <div className="gx-grid">
            {passports.slice(0, 12).map((p) => (
              <Link key={p.id} href={`/genetics/cultivars/${p.slug}`} className="gx-card">
                <div className="gx-card-top">
                  <h2>{p.displayName}</h2>
                  <span className="gx-claim">{p.claimStatus.replace(/_/g, ' ')}</span>
                </div>
                <p className="gx-meta">
                  {[p.cultivarCategory, p.cannabisCategory, p.originCountryCode]
                    .filter(Boolean)
                    .map((x) => String(x).replace(/_/g, ' '))
                    .join(' · ')}
                </p>
                <p className="gx-body">{p.publicSummary.slice(0, 180)}{p.publicSummary.length > 180 ? '…' : ''}</p>
                <span className="gx-view">View passport →</span>
              </Link>
            ))}
          </div>
        )}

        <footer className="gx-foot">
          <Link href="/dashboard?page=genetics">Operator genetics workspace →</Link>
          <Link href="/marketplace">Marketplace →</Link>
        </footer>
      </div>
    </main>
  )
}

const GX_CSS = `
.gx-wrap{max-width:1100px;margin:0 auto;padding:48px 24px 80px}
.gx-eyebrow{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin:0 0 12px}
.gx-title{font-family:Georgia,serif;font-size:clamp(28px,4vw,40px);font-weight:400;color:#f5f0e8;margin:0 0 12px}
.gx-sub{font-size:14px;line-height:1.7;color:rgba(245,240,232,.55);max-width:680px;margin:0 0 20px}
.gx-actions{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px}
.gx-btn{display:inline-flex;padding:9px 16px;border-radius:6px;background:#d4a84b;color:#050c18;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
.gx-btn--ghost{background:transparent;border:1px solid rgba(245,240,232,.15);color:rgba(245,240,232,.7)}
.gx-boundary{font-size:12px;color:rgba(245,240,232,.4);padding:12px 14px;border-radius:8px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:28px}
.gx-empty{font-size:13px;color:rgba(245,240,232,.45)}
.gx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.gx-card{display:flex;flex-direction:column;gap:8px;padding:18px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;color:inherit}
.gx-card:hover{border-color:rgba(212,168,75,.25)}
.gx-card-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
.gx-card-top h2{margin:0;font-size:15px;color:#f5f0e8}
.gx-claim{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(212,168,75,.8);border:1px solid rgba(212,168,75,.25);padding:2px 6px;border-radius:4px;white-space:nowrap}
.gx-meta{font-size:11px;color:rgba(245,240,232,.35);margin:0;text-transform:capitalize}
.gx-body{font-size:12px;line-height:1.6;color:rgba(245,240,232,.5);margin:0}
.gx-view{font-size:11px;color:#d4a84b;margin-top:auto}
.gx-foot{margin-top:40px;display:flex;gap:16px;flex-wrap:wrap}
.gx-foot a{font-size:12px;color:#d4a84b;text-decoration:none}
`
