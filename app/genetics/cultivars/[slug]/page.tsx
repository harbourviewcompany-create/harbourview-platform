import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicCultivarPassportBySlug } from '@/lib/genetics/queries'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const passport = await getPublicCultivarPassportBySlug(slug)
  if (!passport) return { title: 'Cultivar | Harbourview Genetics' }
  return {
    title: `${passport.displayName} | Harbourview Genetics`,
    description: passport.publicSummary.slice(0, 160),
  }
}

export default async function CultivarDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const p = await getPublicCultivarPassportBySlug(slug)
  if (!p) notFound()

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8' }}>
      <style>{CSS}</style>
      <div className="cd-wrap">
        <nav className="cd-nav">
          <Link href="/genetics">Genetics</Link>
          <span>›</span>
          <Link href="/genetics/cultivars">Cultivars</Link>
          <span>›</span>
          <span>{p.displayName}</span>
        </nav>

        <header className="cd-header">
          <p className="cd-eyebrow">Public passport</p>
          <h1>{p.displayName}</h1>
          <p className="cd-meta">
            {[p.cultivarCategory, p.cannabisCategory, p.originCountryCode, p.originJurisdictionLabel]
              .filter(Boolean)
              .map((x) => String(x).replace(/_/g, ' '))
              .join(' · ')}
          </p>
          <div className="cd-badges">
            <span className="cd-badge">{p.claimStatus.replace(/_/g, ' ')}</span>
            {p.breederDisplayName && <span className="cd-badge cd-badge--muted">Breeder: {p.breederDisplayName}</span>}
            {p.rightsHolderDisplayName && (
              <span className="cd-badge cd-badge--muted">Rights: {p.rightsHolderDisplayName}</span>
            )}
          </div>
        </header>

        <section className="cd-section">
          <h2>Summary</h2>
          <p>{p.publicSummary}</p>
          {p.verificationSummary && <p className="cd-note">{p.verificationSummary}</p>}
          {p.evidenceScoreSummary && <p className="cd-note">{p.evidenceScoreSummary}</p>}
          <p className="cd-disclaimer">{p.publicDisclaimer}</p>
        </section>

        {p.aliasesPublic.length > 0 && (
          <section className="cd-section">
            <h2>Public aliases</h2>
            <div className="cd-tags">
              {p.aliasesPublic.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          </section>
        )}

        {p.countryOpportunitiesPublic.length > 0 && (
          <section className="cd-section">
            <h2>Jurisdiction discussion status</h2>
            <div className="cd-opp-grid">
              {p.countryOpportunitiesPublic.map((o, i) => (
                <div key={`${o.countryCode}-${i}`} className="cd-opp">
                  <div className="cd-opp-top">
                    <strong>{o.countryCode}</strong>
                    <span>{o.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p>{o.opportunityType.replace(/_/g, ' ')}</p>
                  {o.publicNote && <p className="cd-note">{o.publicNote}</p>}
                  <Link href="/contact" className="cd-cta">
                    {o.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {p.publicEvidenceSummaries.length > 0 && (
          <section className="cd-section">
            <h2>Public evidence summaries</h2>
            <ul className="cd-ev-list">
              {p.publicEvidenceSummaries.map((e) => (
                <li key={e.id}>
                  <strong>{e.title}</strong>
                  <span>
                    {e.evidenceType.replace(/_/g, ' ')} · {e.claimStatus.replace(/_/g, ' ')}
                  </span>
                  {e.publicSummary && <p>{e.publicSummary}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="cd-cta-block">
          <p>Need licensing discussion, trial, or verification?</p>
          <div className="cd-actions">
            <Link href="/contact" className="cd-btn">
              Request via Harbourview
            </Link>
            <Link href="/genetics/cultivars" className="cd-btn cd-btn--ghost">
              Back to catalog
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

const CSS = `
.cd-wrap{max-width:800px;margin:0 auto;padding:48px 24px 80px}
.cd-nav{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:28px;font-size:11px;color:rgba(245,240,232,.4)}
.cd-nav a{color:#d4a84b;text-decoration:none}
.cd-eyebrow{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(212,168,75,.7);margin:0 0 8px}
.cd-header h1{font-family:Georgia,serif;font-size:clamp(26px,4vw,36px);font-weight:400;margin:0 0 8px;color:#f5f0e8}
.cd-meta{font-size:13px;color:rgba(245,240,232,.45);margin:0 0 12px;text-transform:capitalize}
.cd-badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:28px}
.cd-badge{font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid rgba(212,168,75,.25);color:rgba(212,168,75,.9);text-transform:capitalize}
.cd-badge--muted{border-color:rgba(255,255,255,.1);color:rgba(245,240,232,.5)}
.cd-section{margin-bottom:28px}
.cd-section h2{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(245,240,232,.35);margin:0 0 10px}
.cd-section p{font-size:14px;line-height:1.7;color:rgba(245,240,232,.7);margin:0 0 10px}
.cd-note{font-size:13px!important;color:rgba(245,240,232,.5)!important}
.cd-disclaimer{font-size:12px!important;color:rgba(245,240,232,.35)!important;border-top:1px solid rgba(255,255,255,.06);padding-top:12px}
.cd-tags{display:flex;flex-wrap:wrap;gap:6px}
.cd-tags span{font-size:11px;padding:3px 9px;border-radius:4px;background:rgba(91,155,213,.1);color:#5b9bd5}
.cd-opp-grid{display:grid;gap:10px}
.cd-opp{padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.cd-opp-top{display:flex;justify-content:space-between;gap:8px;margin-bottom:6px}
.cd-opp-top strong{color:#f5f0e8}
.cd-opp-top span{font-size:10px;text-transform:capitalize;color:rgba(212,168,75,.8)}
.cd-opp p{font-size:12px;color:rgba(245,240,232,.5);margin:0 0 6px;text-transform:capitalize}
.cd-cta{font-size:11px;color:#d4a84b;text-decoration:none}
.cd-ev-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
.cd-ev-list li{padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,.07)}
.cd-ev-list strong{display:block;color:#f5f0e8;font-size:13px;margin-bottom:4px}
.cd-ev-list span{font-size:10px;color:rgba(245,240,232,.35);text-transform:capitalize}
.cd-ev-list p{font-size:12px;color:rgba(245,240,232,.5);margin:6px 0 0}
.cd-cta-block{padding:20px;border-radius:12px;border:1px solid rgba(212,168,75,.15);background:rgba(212,168,75,.04)}
.cd-cta-block p{margin:0 0 12px;font-size:13px;color:rgba(245,240,232,.6)}
.cd-actions{display:flex;flex-wrap:wrap;gap:10px}
.cd-btn{display:inline-flex;padding:9px 16px;border-radius:6px;background:#d4a84b;color:#050c18;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
.cd-btn--ghost{background:transparent;border:1px solid rgba(245,240,232,.15);color:rgba(245,240,232,.7)}
`
