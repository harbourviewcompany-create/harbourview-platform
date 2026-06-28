import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedEducationModules, AUDIENCE_LABELS } from '@/lib/server/educationModulesQuery'

export const metadata: Metadata = {
  title: 'GMP Education — Good Manufacturing Practice | Harbourview',
  description:
    'Orientation-level education on Good Manufacturing Practice (GMP) for cannabis operators, quality professionals, and operators targeting EU and international regulated markets.',
}

export const dynamic = 'force-dynamic'

export default async function GMPPage() {
  const allModules = await getPublishedEducationModules()
  const modules = allModules.filter(m =>
    ['quality', 'compliance', 'regulatory'].includes(m.track_id) ||
    m.title?.toLowerCase().includes('gmp') ||
    m.description?.toLowerCase().includes('gmp') ||
    m.description?.toLowerCase().includes('manufacturing practice')
  )

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <style>{CSS}</style>
      <div className="ed-wrap">

        <nav className="ed-nav">
          <Link href="/education" className="ed-nav-link">Education</Link>
          <span className="ed-sep">›</span>
          <span className="ed-cur">GMP</span>
        </nav>

        <header className="ed-header">
          <p className="ed-eyebrow">Education / Quality Standards</p>
          <h1 className="ed-title">Good Manufacturing Practice</h1>
          <p className="ed-sub">
            GMP is the quality system standard governing pharmaceutical and cannabis manufacturing.
            EU-GMP or a recognised equivalent is required for cannabis imported into European
            regulated markets. It covers facilities, personnel, documentation, testing, and release.
          </p>
        </header>

        <div className="ed-boundary">
          <span className="ed-b-ico">⚠</span>
          <p>
            Harbourview GMP education is orientation-level only. It does not constitute regulatory
            advice, GMP audit guidance, or a qualified person opinion. Consult a qualified
            GMP consultant and your competent authority for inspection preparation.
          </p>
        </div>

        <div className="ed-what-grid">
          {[
            { title: 'GMP scope for cannabis', body: 'Pharmaceutical GMP (EU Annex 1–20, with Annex 7 covering herbal medicinal products) applies to cannabis manufacturing. Key areas: facility design and qualification; equipment validation; personnel qualification; batch manufacturing records; in-process controls; analytical method validation; finished product release.' },
            { title: 'EU-GMP for non-EU producers', body: 'Non-EU producers (Canada, Colombia, South Africa, Israel, Australia) must obtain EU-GMP certification from a European competent authority — not from their domestic regulator. A site inspection is required. Mutual Recognition Agreements (MRAs) cover limited product types and countries; cannabis is generally not covered.' },
            { title: 'Qualified Person (QP)', body: 'Every batch of a medicinal product distributed in the EU must be certified by a QP — a legally designated individual with specified qualifications and practical experience. The QP certifies that the batch was manufactured to GMP and the terms of the authorisation. QP certification is a hard legal requirement, not a formality.' },
            { title: 'GMP and GACP linkage', body: 'EU-GMP audits of downstream cannabis manufacturers assess the GACP compliance of their starting material suppliers. A GMP-certified manufacturer sourcing from a GACP-non-compliant farm risks GMP non-compliance findings. Both must be maintained for a continuous regulatory-compliant supply chain.' },
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
          <p className="ed-cta-eyebrow">GMP readiness</p>
          <h2 className="ed-cta-title">EU-GMP certification pathway context</h2>
          <p className="ed-cta-body">
            Orientation-level EU-GMP pathway context for non-EU producers — including which
            competent authority to approach, typical inspection timelines, and common gap
            areas — is available through Harbourview intake.
          </p>
          <div className="ed-cta-actions">
            <Link href="/intake" className="ed-gold">Start confidential intake →</Link>
            <Link href="/education/glossary/gmp" className="ed-ghost">Glossary: GMP</Link>
          </div>
        </section>

        <footer className="ed-footnote">
          <p>Not legal, regulatory, or QP advice. Verify GMP requirements with your competent authority and a qualified GMP consultant.</p>
          <div className="ed-f-links">
            <Link href="/education/gacp">GACP Education →</Link>
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
