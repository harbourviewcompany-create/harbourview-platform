'use client'

import React from 'react'

export interface EducationPageProps {
  country:       { iso2: string; label: string }
  region:        string
  role:          string
  eduCategories: { icon: string; title: string; desc: string }[]
}

const TRACK_LINKS: Record<string, string> = {
  'Medical Cannabis': '/education/medical-cannabis',
  'Regulatory Compliance': '/education/regulatory',
  'Import & Export': '/education/trade',
  'GMP & Quality': '/education/gmp',
  'Genetics & Breeding': '/education/genetics',
  'Clinical Practice': '/education/clinical',
  'Investment & Operations': '/education/investment',
}

const FEATURED_TRACKS = [
  { icon: '⚖️', title: 'Regulatory Compliance',   desc: 'Import/export rules, licence requirements, and GMP standards across markets.',  tag: 'Core track' },
  { icon: '📦', title: 'Trade & Cross-Border',     desc: 'International shipping, customs procedures, phytosanitary certificates.',        tag: 'Practitioner' },
  { icon: '🌿', title: 'Cultivation Standards',    desc: 'Good Agricultural Practices, harvest protocols, and quality benchmarks.',       tag: 'Technical' },
  { icon: '🧪', title: 'Lab & Testing Protocols',  desc: 'COA interpretation, contaminant standards, and testing lab selection.',         tag: 'Technical' },
]

function EduCard({ item, idx }: { item: { icon: string; title: string; desc: string }; idx: number }) {
  const href = TRACK_LINKS[item.title] ?? '/education'
  return (
    <a href={href} className="ep-card" style={{ animationDelay: `${idx * 40}ms` }}>
      <div className="ep-card-icon">{item.icon}</div>
      <div className="ep-card-body">
        <div className="ep-card-title">{item.title}</div>
        <div className="ep-card-desc">{item.desc}</div>
      </div>
      <div className="ep-card-arrow">→</div>
    </a>
  )
}

export const EducationPage = React.memo(function EducationPage({
  country, role, eduCategories,
}: EducationPageProps) {
  const displayCategories = eduCategories.length > 0 ? eduCategories : FEATURED_TRACKS.map(t => ({
    icon: t.icon, title: t.title, desc: t.desc,
  }))

  return (
    <div className="ep-root">
      <style>{CSS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="ep-header">
        <div>
          <h1 className="ep-heading">Education Hub</h1>
          <p className="ep-sub">
            {country.label}
            {role ? ` · ${role}` : ''}
            {' · '}{displayCategories.length} modules available
          </p>
        </div>
        <a href="/education" className="ep-cta-gold">Full Library →</a>
      </div>

      <div className="ep-body">
        {/* ── Module grid ─────────────────────────────────────────────────── */}
        <div className="ep-main">
          <div className="ep-section-head">YOUR MODULES</div>
          <div className="ep-grid">
            {displayCategories.map((cat, i) => <EduCard key={cat.title + i} item={cat} idx={i} />)}
          </div>

          {eduCategories.length === 0 && (
            <div className="ep-notice">
              <span className="ep-notice-icon">ⓘ</span>
              Showing featured tracks. Select a role in the header to personalise your module list.
            </div>
          )}
        </div>

        {/* ── Right: Tracks + CTA ──────────────────────────────────────────── */}
        <aside className="ep-aside">
          <div className="ep-section-head">FEATURED TRACKS</div>
          <div className="ep-tracks">
            {FEATURED_TRACKS.map((t, i) => (
              <a key={t.title} href={TRACK_LINKS[t.title] ?? '/education'} className="ep-track" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="ep-track-icon">{t.icon}</div>
                <div className="ep-track-body">
                  <div className="ep-track-title">{t.title}</div>
                  <div className="ep-track-tag">{t.tag}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="ep-cta-card">
            <div className="ep-cta-head">Market-specific guidance</div>
            <div className="ep-cta-body">
              Need compliance guidance for {country.label}? Harbourview&apos;s education modules include
              jurisdiction-specific regulatory context and practical pathways.
            </div>
            <a href="/intake" className="ep-cta-outline">Request Custom Brief →</a>
          </div>

          <div className="ep-cta-card ep-cta-card--gold">
            <div className="ep-cta-head">Professional certification</div>
            <div className="ep-cta-body">
              Harbourview-verified professional credentials for cannabis trade compliance and market access.
            </div>
            <a href="/dashboard?page=education" className="ep-cta-gold">View Certifications →</a>
          </div>
        </aside>
      </div>
    </div>
  )
})

const CSS = `
.ep-root {
  display:flex;flex-direction:column;height:100%;overflow:hidden;
  animation:epIn .28s ease;
}
@keyframes epIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.ep-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;flex-shrink:0;gap:16px;
}
.ep-heading { font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#f5f0e8; }
.ep-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }
.ep-cta-gold {
  display:inline-flex;align-items:center;
  padding:9px 18px;border-radius:8px;font-size:12px;font-weight:600;
  background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;flex-shrink:0;
  transition:opacity .12s;
}
.ep-cta-gold:hover { opacity:.88; }

.ep-body {
  flex:1;overflow:hidden;display:grid;
  grid-template-columns:1fr 280px;padding:20px 24px 0;gap:0;
}
.ep-main  { overflow-y:auto;padding-right:20px;border-right:1px solid rgba(255,255,255,.06); }
.ep-aside { overflow-y:auto;padding-left:20px;display:flex;flex-direction:column;gap:14px; }

.ep-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.3);margin-bottom:12px;
}

.ep-grid {
  display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
  gap:10px;margin-bottom:16px;
}

.ep-card {
  display:flex;align-items:center;gap:12px;
  padding:14px;border-radius:10px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
  text-decoration:none;color:inherit;
  animation:cardIn .3s ease both;
  transition:border-color .12s,background .12s;
}
.ep-card:hover { border-color:rgba(212,168,75,.3);background:rgba(212,168,75,.04); }
@keyframes cardIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

.ep-card-icon { font-size:22px;flex-shrink:0; }
.ep-card-body { flex:1;min-width:0; }
.ep-card-title { font-size:12px;font-weight:600;color:#f5f0e8;line-height:1.3; }
.ep-card-desc  { font-size:10px;color:rgba(245,240,232,.42);margin-top:3px;line-height:1.45;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.ep-card-arrow { color:rgba(212,168,75,.5);font-size:13px;flex-shrink:0; }

.ep-notice {
  display:flex;align-items:flex-start;gap:8px;
  padding:10px 12px;border-radius:8px;
  background:rgba(91,155,213,.06);border:1px solid rgba(91,155,213,.12);
  font-size:10px;color:rgba(245,240,232,.45);line-height:1.55;
}
.ep-notice-icon { color:#5b9bd5;flex-shrink:0; }

.ep-tracks { display:flex;flex-direction:column;gap:6px; }
.ep-track {
  display:flex;align-items:center;gap:10px;
  padding:10px;border-radius:8px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
  text-decoration:none;color:inherit;
  animation:trackIn .3s ease both;
  transition:border-color .12s,background .12s;
}
.ep-track:hover { border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.05); }
@keyframes trackIn { from{opacity:0;transform:translateX(4px)} to{opacity:1;transform:translateX(0)} }
.ep-track-icon { font-size:18px;flex-shrink:0; }
.ep-track-title { font-size:11px;font-weight:600;color:#f5f0e8; }
.ep-track-tag   { font-size:9px;color:rgba(245,240,232,.35);margin-top:2px; }

.ep-cta-card {
  padding:14px;border-radius:10px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
  display:flex;flex-direction:column;gap:8px;
}
.ep-cta-card--gold { background:rgba(212,168,75,.04);border-color:rgba(212,168,75,.18); }
.ep-cta-head { font-size:12px;font-weight:600;color:#f5f0e8; }
.ep-cta-body { font-size:10px;color:rgba(245,240,232,.45);line-height:1.55; }
.ep-cta-outline {
  display:inline-flex;align-items:center;
  padding:7px 12px;border-radius:6px;font-size:11px;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);
  color:rgba(245,240,232,.6);text-decoration:none;
  transition:background .12s,color .12s;
}
.ep-cta-outline:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }
`
