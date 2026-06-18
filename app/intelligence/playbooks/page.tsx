import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPlaybooks, DIFFICULTY_LABEL, DIFFICULTY_COLOR } from '@/lib/intelligence/jurisdictionPlaybooks'

export const metadata: Metadata = {
  title: 'Jurisdiction Entry Playbooks — Cannabis Market Entry Intelligence | Harbourview',
  description:
    'Step-by-step market entry playbooks for 20 active cannabis jurisdictions. Regulatory pathways, key licensing bodies, timelines, cost ranges, and common pitfalls — updated by the Harbourview intelligence team.',
  openGraph: {
    title: 'Cannabis Market Entry Playbooks | Harbourview',
    description:
      'Regulatory playbooks for licensed cannabis operators entering new markets. Licensing steps, regulator contacts, timeline estimates, and pitfalls to avoid.',
  },
}

export const dynamic = 'force-dynamic'

const COUNTRY_FLAGS: Record<string, string> = {
  DE: '🇩🇪', GB: '🇬🇧', AU: '🇦🇺', CA: '🇨🇦', NL: '🇳🇱',
  PT: '🇵🇹', TH: '🇹🇭', IL: '🇮🇱', CO: '🇨🇴', ZA: '🇿🇦',
  MT: '🇲🇹', LU: '🇱🇺', CZ: '🇨🇿', NZ: '🇳🇿', MX: '🇲🇽',
  BR: '🇧🇷', CH: '🇨🇭', FR: '🇫🇷', ES: '🇪🇸', PL: '🇵🇱',
}

const DIFFICULTY_ICON: Record<string, string> = {
  low:       '●○○○',
  moderate:  '●●○○',
  high:      '●●●○',
  very_high: '●●●●',
}

export default async function PlaybooksIndexPage() {
  const playbooks = await getAllPlaybooks()

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>

      <div className="pb-wrap">
        <header className="pb-header">
          <Link href="/intelligence" className="pb-back">← Intelligence</Link>
          <div className="pb-eyebrow">Market Entry Intelligence</div>
          <h1 className="pb-title">Jurisdiction Entry Playbooks</h1>
          <p className="pb-sub">
            Step-by-step regulatory entry guides for {playbooks.length} active cannabis markets.
            Licensing pathways, key regulators, timeline estimates, cost ranges, and common pitfalls.
          </p>
          <div className="pb-legend">
            {(['low','moderate','high','very_high'] as const).map(d => (
              <span key={d} className="pb-legend-item">
                <span className="pb-legend-dot" style={{ background: DIFFICULTY_COLOR[d] }} />
                {DIFFICULTY_LABEL[d]}
              </span>
            ))}
          </div>
        </header>

        <div className="pb-grid">
          {playbooks.map(pb => {
            const flag = COUNTRY_FLAGS[pb.country_iso2] ?? '🌐'
            const color = DIFFICULTY_COLOR[pb.difficulty] ?? '#d4a84b'
            return (
              <Link
                key={pb.country_iso2}
                href={`/intelligence/country/${pb.country_iso2.toLowerCase()}`}
                className="pb-card"
                style={{ '--accent': color } as React.CSSProperties}
              >
                <div className="pb-card-accent" style={{ background: color }} />
                <div className="pb-card-top">
                  <span className="pb-flag">{flag}</span>
                  <span className="pb-iso">{pb.country_iso2}</span>
                  <span className="pb-difficulty" style={{ color, borderColor: `${color}40` }}>
                    {DIFFICULTY_ICON[pb.difficulty]}
                  </span>
                </div>

                <h2 className="pb-country">{pb.country_name}</h2>

                <div className="pb-meta-row">
                  <span className="pb-meta-chip">{pb.typical_timeline_months} months</span>
                  <span className="pb-meta-chip">{pb.steps.length} steps</span>
                  <span className="pb-meta-chip" style={{ color }}>
                    {DIFFICULTY_LABEL[pb.difficulty]}
                  </span>
                </div>

                {pb.estimated_cost_range && (
                  <p className="pb-cost">{pb.estimated_cost_range}</p>
                )}

                {pb.key_regulators.length > 0 && (
                  <div className="pb-regulators">
                    {pb.key_regulators.slice(0, 2).map(r => (
                      <span key={r.name} className="pb-regulator-chip">{r.name}</span>
                    ))}
                  </div>
                )}

                <div className="pb-card-footer">
                  <span className="pb-reviewed">Updated {pb.last_reviewed}</span>
                  <span className="pb-cta">View playbook →</span>
                </div>
              </Link>
            )
          })}
        </div>

        <footer className="pb-footnote">
          <p>
            Playbooks are orientation-level guides only and do not constitute legal, regulatory, or investment advice.
            Regulatory frameworks change frequently — verify current requirements with qualified local counsel before committing to any market.
          </p>
          <div className="pb-footnote-links">
            <Link href="/markets">Market Briefings →</Link>
            <Link href="/intelligence">Intelligence Home →</Link>
            <Link href="/contact">Request Custom Playbook →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.pb-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}
.pb-back {
  display: inline-block;
  font-size: 11px;
  color: #d4a84b;
  text-decoration: none;
  letter-spacing: .08em;
  margin-bottom: 32px;
}
.pb-back:hover { opacity: .7; }
.pb-header { margin-bottom: 40px; }
.pb-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: rgba(212,168,75,.7);
  margin-bottom: 12px;
}
.pb-title {
  font-family: 'Georgia', serif;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 400;
  color: #f5f0e8;
  letter-spacing: -.01em;
  margin: 0 0 12px;
}
.pb-sub {
  font-size: 14px;
  color: rgba(245,240,232,.5);
  max-width: 640px;
  line-height: 1.6;
  margin: 0 0 20px;
}
.pb-legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.pb-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(245,240,232,.4);
}
.pb-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.pb-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.02);
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: border-color .15s, background .15s, transform .12s;
}
.pb-card:hover {
  border-color: rgba(255,255,255,.14);
  background: rgba(255,255,255,.04);
  transform: translateY(-1px);
}
.pb-card-accent {
  position: absolute;
  top: 0; left: 0;
  width: 3px;
  height: 100%;
  opacity: .5;
  border-radius: 12px 0 0 12px;
}
.pb-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pb-flag { font-size: 18px; line-height: 1; }
.pb-iso {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: .18em;
  color: rgba(245,240,232,.35);
}
.pb-difficulty {
  margin-left: auto;
  font-size: 9px;
  letter-spacing: .08em;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 600;
}
.pb-country {
  font-size: 17px;
  font-weight: 600;
  color: #f5f0e8;
  margin: 0;
  line-height: 1.2;
}
.pb-meta-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.pb-meta-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,.05);
  color: rgba(245,240,232,.5);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  letter-spacing: .04em;
}
.pb-cost {
  font-size: 11px;
  color: rgba(245,240,232,.4);
  margin: 0;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.pb-regulators {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.pb-regulator-chip {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(212,168,75,.08);
  border: 1px solid rgba(212,168,75,.15);
  color: rgba(212,168,75,.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.pb-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,.05);
}
.pb-reviewed {
  font-size: 9px;
  color: rgba(245,240,232,.2);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.pb-cta {
  font-size: 10px;
  color: #d4a84b;
  opacity: .6;
}
.pb-card:hover .pb-cta { opacity: 1; }
.pb-footnote {
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,.06);
}
.pb-footnote p {
  font-size: 11px;
  line-height: 1.7;
  color: rgba(245,240,232,.3);
  max-width: 640px;
  margin: 0 0 16px;
}
.pb-footnote-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.pb-footnote-links a {
  font-size: 11px;
  color: #d4a84b;
  text-decoration: none;
}
.pb-footnote-links a:hover { opacity: .7; }
`
