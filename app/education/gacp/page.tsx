import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedEducationModules, AUDIENCE_LABELS } from '@/lib/server/educationModulesQuery'

export const metadata: Metadata = {
  title: 'GACP Education — Good Agricultural & Collection Practice | Harbourview',
  description:
    'Orientation-level education on Good Agricultural and Collection Practice (GACP) for cannabis cultivators, quality teams, and operators targeting regulated export markets.',
}

export const dynamic = 'force-dynamic'

export default async function GACPPage() {
  const allModules = await getPublishedEducationModules()
  // GACP is covered across 'quality', 'compliance', and 'logistics' tracks
  const modules = allModules.filter(m =>
    ['quality', 'compliance', 'logistics'].includes(m.track_id) ||
    m.title?.toLowerCase().includes('gacp') ||
    m.description?.toLowerCase().includes('gacp') ||
    m.description?.toLowerCase().includes('agricultural')
  )

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <style>{CSS}</style>
      <div className="ed-wrap">

        <nav className="ed-nav">
          <Link href="/education" className="ed-nav-link">Education</Link>
          <span className="ed-sep">›</span>
          <span className="ed-cur">GACP</span>
        </nav>

        <header className="ed-header">
          <p className="ed-eyebrow">Education / Quality Standards</p>
          <h1 className="ed-title">Good Agricultural and Collection Practice</h1>
          <p className="ed-sub">
            GACP establishes the quality baseline for cannabis cultivation, harvesting, drying, and
            primary processing. It is the foundational documentation requirement for starting
            material entering a GMP manufacturing process, and a prerequisite for most regulated
            export markets.
          </p>
        </header>

        <div className="ed-boundary">
          <span className="ed-b-ico">⚠</span>
          <p>
            Harbourview GACP education is orientation-level only. It does not constitute regulatory
            advice, GMP or GACP audit guidance, or a substitute for qualified inspection preparation.
            Verify current GACP requirements with your competent authority.
          </p>
        </div>

        <div className="ed-what-grid">
          {[
            { title: 'What GACP covers', body: 'Site and facility suitability; seed and planting material traceability; cultivation practices and input controls; harvest, drying, and primary processing procedures; pest and pathogen management; personnel hygiene and training; batch documentation and lot traceability from seed to dispatch.' },
            { title: 'EU GACP framework', body: 'The EMA\'s GACP Guideline (EMEA/HMPC/246816/2005) is the primary reference for EU-bound cannabis exports. It aligns with the WHO GACP guidelines and covers wild collection as well as cultivated material.' },
            { title: 'GACP and GMP relationship', body: 'GACP governs starting material — the plant as it leaves the farm gate. GMP governs the manufacturing process downstream. Both are required for a product to enter European pharmaceutical cannabis channels. GACP certification at the cultivation site is assessed as part of EU-GMP audits for the downstream manufacturer.' },
            { title: 'Practical implications', body: 'A GACP-compliant cultivation operation must maintain SOPs for every critical step from site selection through dispatch; conduct batch record documentation with lot traceability; perform documented pest and pathogen monitoring; and have a quality management system covering deviations, CAPA, and change control.' },
          ].map(item => (
            <div key={item.title} className="ed-what-card">
              <h3 className="ed-what-title">{item.title}</h3>
              <p className="ed-what-body">{item.body}</p>
            </div>
          ))}
        </div>

        {modules.length > 0 && (
          <section className="ed-section">
            <h2 className="ed-section-title">Related Education Modules</h2>
            <div className="ed-modules">
              {modules.map(mod => (
                <Link key={mod.id} href={`/education/modules/${mod.slug}`} className="ed-module">
                  <div className="ed-mod-meta">
                    {mod.audience && <span className="ed-mod-aud">{(mod.audience as string[]).map((a: string) => AUDIENCE_LABELS[a] ?? a).join(', ')}</span>}
                  </div>
                  <h3 className="ed-mod-title">{mod.title}</h3>
                  {mod.description && <p className="ed-mod-desc">{mod.description}</p>}
                  <span className="ed-mod-link">Open module →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="ed-cta">
          <p className="ed-cta-eyebrow">GACP gap analysis</p>
          <h2 className="ed-cta-title">Is your facility GACP-ready for EU export?</h2>
          <p className="ed-cta-body">
            Harbourview can provide orientation-level GACP readiness context through our
            confidential intake process — not a substitute for a qualified auditor, but a useful
            starting point before engaging a certification body.
          </p>
          <div className="ed-cta-actions">
            <Link href="/intake" className="ed-gold">Start confidential intake →</Link>
            <Link href="/education/glossary/gacp" className="ed-ghost">Glossary: GACP</Link>
          </div>
        </section>

        <footer className="ed-footnote">
          <p>Not legal, regulatory, or QP advice. Verify GACP requirements with your national competent authority and a qualified inspection consultant.</p>
          <div className="ed-f-links">
            <Link href="/education/gmp">GMP Education →</Link>
            <Link href="/education/gdp">GDP Education →</Link>
            <Link href="/education/glossary">Professional Glossary →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.ed-wrap{max-width:860px;margin:0 auto;padding:48px 24px 80px}
.ed-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px}
.ed-nav-link{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.ed-nav-link:hover{opacity:.7}
.ed-sep{color:rgba(255,255,255,.2);font-size:11px}
.ed-cur{font-size:11px;color:rgba(255,255,255,.4)}
.ed-header{margin-bottom:24px}
.ed-eyebrow{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:10px}
.ed-title{font-family:Georgia,serif;font-size:clamp(26px,4vw,40px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px}
.ed-sub{font-size:14px;color:rgba(245,240,232,.55);max-width:620px;line-height:1.75;margin:0}
.ed-boundary{display:flex;gap:12px;align-items:flex-start;padding:14px 18px;border-radius:8px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin:24px 0 32px}
.ed-b-ico{color:rgba(212,168,75,.5);font-size:13px;flex-shrink:0;margin-top:2px}
.ed-boundary p{font-size:12px;line-height:1.65;color:rgba(245,240,232,.4);margin:0}
.ed-what-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;margin-bottom:40px}
.ed-what-card{padding:20px 22px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02)}
.ed-what-title{font-size:14px;font-weight:600;color:rgba(245,240,232,.85);margin:0 0 8px}
.ed-what-body{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0}
.ed-section{margin-bottom:40px}
.ed-section-title{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 16px}
.ed-modules{display:flex;flex-direction:column;gap:10px}
.ed-module{display:flex;flex-direction:column;gap:5px;padding:16px 20px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;transition:border-color .15s}
.ed-module:hover{border-color:rgba(212,168,75,.3)}
.ed-mod-meta{display:flex;gap:8px;margin-bottom:4px}
.ed-mod-aud{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(212,168,75,.55)}
.ed-mod-title{font-size:14px;font-weight:600;color:rgba(245,240,232,.85);margin:0}
.ed-mod-desc{font-size:12px;color:rgba(245,240,232,.45);margin:0;line-height:1.55}
.ed-mod-link{font-size:11px;color:#d4a84b;margin-top:4px}
.ed-cta{padding:28px 32px;border-radius:16px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:40px}
.ed-cta-eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:8px}
.ed-cta-title{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 10px}
.ed-cta-body{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0 0 16px;max-width:520px}
.ed-cta-actions{display:flex;gap:10px;flex-wrap:wrap}
.ed-gold{display:inline-flex;align-items:center;padding:9px 18px;background:#d4a84b;color:#020814;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:opacity .15s}
.ed-gold:hover{opacity:.85}
.ed-ghost{display:inline-flex;align-items:center;padding:9px 18px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.ed-ghost:hover{border-color:rgba(255,255,255,.35);color:#fff}
.ed-footnote{padding-top:24px;border-top:1px solid rgba(255,255,255,.06)}
.ed-footnote p{font-size:11px;line-height:1.7;color:rgba(245,240,232,.25);margin:0 0 12px}
.ed-f-links{display:flex;flex-wrap:wrap;gap:16px}
.ed-f-links a{font-size:11px;color:#d4a84b;text-decoration:none}
.ed-f-links a:hover{opacity:.7}
`
