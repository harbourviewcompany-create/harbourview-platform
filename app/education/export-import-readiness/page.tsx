import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedEducationModules, AUDIENCE_LABELS } from '@/lib/server/educationModulesQuery'

export const metadata: Metadata = {
  title: 'Export-Import Readiness | Harbourview Education',
  description: 'Orientation-level education for cannabis operators preparing to enter international export or import markets.',
}

// ISR: reference intelligence surface
export const revalidate = 3600

export default async function ExportImportReadinessPage() {
  const allModules = await getPublishedEducationModules()
  const modules = allModules.filter(m =>
    ['export', 'import', 'logistics', 'compliance'].includes(m.track_id)
  )

  return (
    <main className="bg-[#020814] text-white min-h-screen">
      <style>{CSS}</style>
      <div className="er-wrap">
        <nav className="er-nav">
          <Link href="/education" className="er-a">Education</Link>
          <span className="er-sep">›</span>
          <span className="er-cur">Export-Import Readiness</span>
        </nav>

        <header className="er-hd">
          <p className="er-ey">Education / Market Access</p>
          <h1 className="er-ti">Export-Import Readiness</h1>
          <p className="er-su">
            Orientation-level context covering export and import readiness for cannabis operators
            entering international markets. Covers documentation frameworks, licensing sequences,
            and corridor-specific requirements across regulated markets.
          </p>
        </header>

        <div className="er-bd">
          <span>⚠</span>
          <p>Not legal, regulatory, or compliance advice. Verify requirements with qualified local counsel and the relevant competent authority.</p>
        </div>

        <div className="er-pillars">
          {[
            { title: 'Export readiness', items: ['Competent authority export licence / narcotics export permit', 'GMP / GACP certification at the manufacturing and cultivation sites', 'Batch CoA from accredited source-market laboratory', 'Phytosanitary certificate (for plant material)', 'GDP-compliant cold-chain packaging qualification'], },
            { title: 'Import readiness', items: ['Destination-country narcotics import certificate or permit', 'Importer-of-record licence or WDA (EU markets)', 'EU-GMP certification or equivalence recognition for the source site', 'Batch CoA from accredited destination-market laboratory', 'Customs classification and controlled substance declaration'], },
            { title: 'Documentation sequence', items: ['Obtain import certificate first (required before export permit issued)', 'Export permit references import certificate number', 'Both documents must match: product, quantity, parties', 'Permits are batch-specific — new permit required for each shipment', 'INCB reporting obligations apply in both source and destination countries'], },
          ].map(p => (
            <div key={p.title} className="er-pillar">
              <h3 className="er-pt">{p.title}</h3>
              <ul className="er-pl">
                {p.items.map(item => <li key={item} className="er-pi">{item}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {modules.length > 0 && (
          <section className="er-sec">
            <h2 className="er-sth">Education Modules — Export, Import & Logistics</h2>
            <div className="er-mods">
              {modules.map(mod => (
                <Link key={mod.id} href={`/education/modules/${mod.slug}`} className="er-mod">
                  {mod.audience && <span className="er-ma">{(mod.audience as string[]).map((a: string) => AUDIENCE_LABELS[a] ?? a).join(', ')}</span>}
                  <h3 className="er-mt">{mod.title}</h3>
                  {mod.description && <p className="er-md">{mod.description}</p>}
                  <span className="er-ml">Open module →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="er-cta">
          <p className="er-cey">Private corridor analysis</p>
          <h2 className="er-cti">Route-specific export-import readiness assessment</h2>
          <p className="er-cbo">Documentation review, timeline estimation, and counterparty orientation for a specific corridor handled through confidential intake.</p>
          <div className="er-ca">
            <Link href="/intake" className="er-gold">Start Confidential Intake →</Link>
            <Link href="/intelligence/logistics-trade-routes" className="er-ghost">Corridor Intelligence</Link>
          </div>
        </section>

        <footer className="er-ft">
          <p>Orientation-level only. Not legal or regulatory advice.</p>
          <div className="er-fl">
            <Link href="/education/gacp">GACP Education →</Link>
            <Link href="/education/gmp">GMP Education →</Link>
            <Link href="/education/gdp">GDP Education →</Link>
            <Link href="/intelligence/logistics-trade-routes">Corridor Intelligence →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.er-wrap{max-width:900px;margin:0 auto;padding:48px 24px 80px}
.er-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px}
.er-a{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.er-a:hover{opacity:.7}
.er-sep{color:rgba(255,255,255,.2);font-size:11px}
.er-cur{font-size:11px;color:rgba(255,255,255,.4)}
.er-hd{margin-bottom:24px}
.er-ey{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:10px}
.er-ti{font-family:Georgia,serif;font-size:clamp(26px,4vw,40px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px}
.er-su{font-size:14px;color:rgba(245,240,232,.55);max-width:620px;line-height:1.75;margin:0}
.er-bd{display:flex;gap:10px;align-items:flex-start;padding:12px 16px;border-radius:8px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin:20px 0 28px;font-size:12px;color:rgba(212,168,75,.5)}
.er-bd p{font-size:12px;line-height:1.6;color:rgba(245,240,232,.4);margin:0}
.er-pillars{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:40px}
.er-pillar{padding:20px 22px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.02)}
.er-pt{font-size:14px;font-weight:600;color:rgba(245,240,232,.85);margin:0 0 12px}
.er-pl{padding-left:16px;margin:0;display:flex;flex-direction:column;gap:7px}
.er-pi{font-size:12px;color:rgba(245,240,232,.5);line-height:1.5}
.er-sec{margin-bottom:36px}
.er-sth{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 14px}
.er-mods{display:flex;flex-direction:column;gap:8px}
.er-mod{display:flex;flex-direction:column;gap:4px;padding:14px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;transition:border-color .15s}
.er-mod:hover{border-color:rgba(212,168,75,.3)}
.er-ma{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(212,168,75,.55)}
.er-mt{font-size:14px;font-weight:600;color:rgba(245,240,232,.85);margin:0}
.er-md{font-size:12px;color:rgba(245,240,232,.45);margin:0;line-height:1.5}
.er-ml{font-size:11px;color:#d4a84b}
.er-cta{padding:24px 28px;border-radius:14px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:36px}
.er-cey{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:6px}
.er-cti{font-family:Georgia,serif;font-size:18px;font-weight:400;color:#f5f0e8;margin:0 0 8px}
.er-cbo{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0 0 14px;max-width:500px}
.er-ca{display:flex;gap:10px;flex-wrap:wrap}
.er-gold{display:inline-flex;align-items:center;padding:8px 16px;background:#d4a84b;color:#020814;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.er-gold:hover{opacity:.85}
.er-ghost{display:inline-flex;align-items:center;padding:8px 16px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.er-ghost:hover{border-color:rgba(255,255,255,.35);color:#fff}
.er-ft{padding-top:20px;border-top:1px solid rgba(255,255,255,.06)}
.er-ft p{font-size:11px;color:rgba(245,240,232,.25);margin:0 0 10px}
.er-fl{display:flex;flex-wrap:wrap;gap:14px}
.er-fl a{font-size:11px;color:#d4a84b;text-decoration:none}
.er-fl a:hover{opacity:.7}
`
