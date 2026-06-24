import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Professional Glossary | Harbourview Education',
  description:
    'Professional terminology for regulated cannabis supply chains — quality systems, regulatory frameworks, import and export, clinical and distribution concepts.',
}

const CATEGORIES = [
  {
    slug: 'quality-manufacturing',
    title: 'Quality & Manufacturing',
    description: 'GMP, GACP, GDP, certification, documentation, and quality system terminology.',
    terms: [
      { slug: 'gmp', label: 'GMP — Good Manufacturing Practice' },
      { slug: 'gacp', label: 'GACP — Good Agricultural and Collection Practice' },
      { slug: 'gdp', label: 'GDP — Good Distribution Practice' },
      { slug: 'coa', label: 'CoA — Certificate of Analysis' },
      { slug: 'qp', label: 'QP — Qualified Person' },
      { slug: 'capa', label: 'CAPA — Corrective and Preventive Action' },
      { slug: 'sop', label: 'SOP — Standard Operating Procedure' },
      { slug: 'iso-17025', label: 'ISO 17025 — Laboratory Accreditation' },
    ],
  },
  {
    slug: 'regulatory-trade',
    title: 'Regulatory & Trade',
    description: 'Import/export authorisations, international conventions, and market access frameworks.',
    terms: [
      { slug: 'narcotics-export-permit', label: 'Narcotics Export Permit' },
      { slug: 'narcotics-import-order', label: 'Narcotics Import Order' },
      { slug: 'single-convention-1961', label: 'Single Convention on Narcotic Drugs 1961' },
      { slug: 'market-authorisation', label: 'Market Authorisation (MA)' },
      { slug: 'special-access', label: 'Special Access / Named Patient / Specials' },
      { slug: 'phytosanitary-certificate', label: 'Phytosanitary Certificate' },
      { slug: 'incoterms', label: 'Incoterms' },
      { slug: 'eu-gmp-equivalence', label: 'EU-GMP Equivalence / Third-Country Recognition' },
    ],
  },
  {
    slug: 'clinical-medical',
    title: 'Clinical & Medical',
    description: 'Cannabinoid science, pharmacology, and clinical access terminology.',
    terms: [
      { slug: 'cannabinoids', label: 'Cannabinoids' },
      { slug: 'thc', label: 'THC — Delta-9-Tetrahydrocannabinol' },
      { slug: 'cbd', label: 'CBD — Cannabidiol' },
      { slug: 'endocannabinoid-system', label: 'Endocannabinoid System (ECS)' },
      { slug: 'pharmacovigilance', label: 'Pharmacovigilance' },
    ],
  },
  {
    slug: 'market-access',
    title: 'Market Access & Regulators',
    description: 'Key regulatory authorities, licence types, and market structure terms.',
    terms: [
      { slug: 'licensed-producer', label: 'Licensed Producer (LP) — Canada' },
      { slug: 'wholesale-distribution-authorisation', label: 'Wholesale Distribution Authorisation (WDA)' },
      { slug: 'incb', label: 'INCB — International Narcotics Control Board' },
      { slug: 'bfarm', label: 'BfArM — Germany' },
      { slug: 'tga', label: 'TGA — Australia' },
    ],
  },
]

export default function GlossaryPage() {
  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <style>{CSS}</style>
      <div className="gl-wrap">

        <nav className="gl-nav">
          <Link href="/education" className="gl-nav-link">Education</Link>
          <span className="gl-sep">›</span>
          <span className="gl-cur">Professional Glossary</span>
        </nav>

        <header className="gl-header">
          <p className="gl-eyebrow">Reference</p>
          <h1 className="gl-title">Professional Glossary</h1>
          <p className="gl-sub">
            Orientation-level terminology for regulated cannabis supply chains — quality systems,
            international trade, regulatory frameworks, and clinical concepts. Definitions do not
            constitute legal or regulatory advice.
          </p>
          <div className="gl-chips">
            <span className="gl-chip">{CATEGORIES.reduce((n, c) => n + c.terms.length, 0)} terms</span>
            <span className="gl-chip">{CATEGORIES.length} categories</span>
          </div>
        </header>

        <div className="gl-categories">
          {CATEGORIES.map(cat => (
            <section key={cat.slug} className="gl-cat">
              <div className="gl-cat-header">
                <h2 className="gl-cat-title">{cat.title}</h2>
                <p className="gl-cat-desc">{cat.description}</p>
              </div>
              <div className="gl-terms">
                {cat.terms.map(term => (
                  <Link key={term.slug} href={`/education/glossary/${term.slug}`} className="gl-term">
                    <span className="gl-term-label">{term.label}</span>
                    <span className="gl-term-arrow">→</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="gl-boundary">
          <p className="gl-b-label">Education boundary</p>
          <p className="gl-b-text">
            These definitions are orientation-level only. They do not constitute legal advice,
            regulatory guidance, QP opinion, or authoritative interpretation of any regulation,
            standard, or treaty obligation. For jurisdiction-specific interpretation, consult
            qualified local legal and regulatory professionals.
          </p>
          <div className="gl-b-actions">
            <Link href="/education/request" className="gl-gold">Request a Briefing →</Link>
            <Link href="/education" className="gl-ghost">Explore Education Tracks</Link>
          </div>
        </div>

      </div>
    </main>
  )
}

const CSS = `
.gl-wrap{max-width:860px;margin:0 auto;padding:48px 24px 80px}
.gl-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px}
.gl-nav-link{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.gl-nav-link:hover{opacity:.7}
.gl-sep{color:rgba(255,255,255,.2);font-size:11px}
.gl-cur{font-size:11px;color:rgba(255,255,255,.4)}
.gl-header{margin-bottom:40px}
.gl-eyebrow{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:10px}
.gl-title{font-family:Georgia,serif;font-size:clamp(28px,4vw,44px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px}
.gl-sub{font-size:14px;color:rgba(245,240,232,.55);max-width:580px;line-height:1.7;margin:0 0 16px}
.gl-chips{display:flex;gap:8px;flex-wrap:wrap}
.gl-chip{font-size:10px;font-family:'JetBrains Mono',ui-monospace,monospace;padding:3px 10px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:rgba(255,255,255,.4)}
.gl-categories{display:flex;flex-direction:column;gap:28px;margin-bottom:40px}
.gl-cat{border-radius:14px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);overflow:hidden}
.gl-cat-header{padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,.05)}
.gl-cat-title{font-size:15px;font-weight:600;color:rgba(245,240,232,.85);margin:0 0 4px}
.gl-cat-desc{font-size:12px;color:rgba(245,240,232,.4);margin:0}
.gl-terms{display:flex;flex-direction:column}
.gl-term{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.04);transition:background .1s}
.gl-term:last-child{border-bottom:none}
.gl-term:hover{background:rgba(212,168,75,.04)}
.gl-term-label{font-size:13px;color:rgba(245,240,232,.65)}
.gl-term-arrow{font-size:12px;color:rgba(212,168,75,.4)}
.gl-boundary{padding:28px 32px;border-radius:14px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03)}
.gl-b-label{font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.5);margin-bottom:8px}
.gl-b-text{font-size:12px;line-height:1.65;color:rgba(245,240,232,.4);margin:0 0 18px;max-width:580px}
.gl-b-actions{display:flex;gap:10px;flex-wrap:wrap}
.gl-gold{display:inline-flex;align-items:center;padding:9px 18px;background:#d4a84b;color:#020814;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:opacity .15s}
.gl-gold:hover{opacity:.85}
.gl-ghost{display:inline-flex;align-items:center;padding:9px 18px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:border-color .15s}
.gl-ghost:hover{border-color:rgba(255,255,255,.35);color:#fff}
`
