'use client'

import React from 'react'

export interface WatchlistPageProps {
  country: { iso2: string; label: string }
  region:  string
  role:    string
}

export const WatchlistPage = React.memo(function WatchlistPage({
  country,
}: WatchlistPageProps) {
  return (
    <div className="wl-root">
      <style>{CSS}</style>

      <div className="wl-header">
        <div>
          <h1 className="wl-heading">Watchlist</h1>
          <p className="wl-sub">Track markets, signals, and counterparties</p>
        </div>
        <a href="/intelligence" className="wl-cta-outline">Browse Markets</a>
      </div>

      {/* Current market being viewed */}
      <div className="wl-current">
        <div className="wl-section-head">CURRENTLY VIEWING</div>
        <div className="wl-current-card">
          <div className="wl-current-flag">🌐</div>
          <div className="wl-current-info">
            <div className="wl-current-name">{country.label}</div>
            <div className="wl-current-label">Active session · Not saved</div>
          </div>
          <button className="wl-add-btn">+ Add to Watchlist</button>
        </div>
      </div>

      {/* Empty state */}
      <div className="wl-empty">
        <div className="wl-empty-icon">◈</div>
        <div className="wl-empty-title">Your watchlist is empty</div>
        <p className="wl-empty-body">
          Save markets, signals, and counterparties to track them across sessions.
          Harbourview will surface relevant changes and notify you when watched markets move.
        </p>

        <div className="wl-feature-grid">
          {[
            { icon: '◷', label: 'Regulatory Alerts',    desc: 'Get notified when watched markets change regulatory status.' },
            { icon: '≋',  label: 'Signal Notifications', desc: 'Weekly intelligence signals for markets you follow.'        },
            { icon: '⊞',  label: 'Listing Matches',      desc: 'New listings matching your role and region profile.'         },
            { icon: '◉',  label: 'Local Intel Updates',  desc: 'Priority coverage updates for your watched markets.'        },
          ].map(f => (
            <div key={f.label} className="wl-feature-card">
              <div className="wl-feature-icon">{f.icon}</div>
              <div className="wl-feature-label">{f.label}</div>
              <div className="wl-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="wl-cta-group">
          <a href="/intake" className="wl-cta-gold">Upgrade for Watchlist Access →</a>
          <a href="/intelligence" className="wl-cta-outline">Browse Markets to Add</a>
        </div>
      </div>
    </div>
  )
})

const CSS = `
.wl-root {
  display:flex;flex-direction:column;height:100%;overflow-y:auto;
  padding:0 0 32px;animation:wlIn .28s ease;
}
@keyframes wlIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.wl-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;gap:16px;flex-shrink:0;
}
.wl-heading { font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#f5f0e8; }
.wl-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }

.wl-cta-gold {
  display:inline-flex;align-items:center;padding:9px 18px;border-radius:8px;
  font-size:12px;font-weight:600;background:linear-gradient(135deg,#d4a84b,#b88c35);
  color:#0d1117;text-decoration:none;transition:opacity .12s;
}
.wl-cta-gold:hover { opacity:.88; }
.wl-cta-outline {
  display:inline-flex;align-items:center;padding:8px 14px;border-radius:8px;font-size:11px;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);
  color:rgba(245,240,232,.55);text-decoration:none;flex-shrink:0;
  transition:background .12s,color .12s;
}
.wl-cta-outline:hover { background:rgba(255,255,255,.08);color:#f5f0e8; }

.wl-current { padding:16px 24px 0; }
.wl-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.3);margin-bottom:10px;
}
.wl-current-card {
  display:flex;align-items:center;gap:12px;
  padding:14px;border-radius:10px;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);
  max-width:480px;
}
.wl-current-flag { font-size:24px;flex-shrink:0; }
.wl-current-info { flex:1;min-width:0; }
.wl-current-name  { font-size:13px;font-weight:600;color:#f5f0e8; }
.wl-current-label { font-size:10px;color:rgba(245,240,232,.35);margin-top:2px; }
.wl-add-btn {
  font-size:11px;padding:6px 12px;border-radius:7px;
  border:1px solid rgba(212,168,75,.3);background:rgba(212,168,75,.06);
  color:#d4a84b;cursor:pointer;font:inherit;flex-shrink:0;
  transition:background .12s;
}
.wl-add-btn:hover { background:rgba(212,168,75,.14); }

.wl-empty {
  display:flex;flex-direction:column;align-items:center;
  text-align:center;gap:16px;padding:40px 24px;
}
.wl-empty-icon  { font-size:32px;color:rgba(212,168,75,.35); }
.wl-empty-title { font-family:'Georgia',serif;font-size:20px;font-weight:400;color:#f5f0e8; }
.wl-empty-body  { font-size:12px;color:rgba(245,240,232,.42);max-width:440px;line-height:1.7; }

.wl-feature-grid {
  display:grid;grid-template-columns:repeat(2,1fr);gap:10px;
  width:100%;max-width:540px;margin:4px 0;
}
.wl-feature-card {
  padding:14px;border-radius:10px;text-align:left;
  background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);
}
.wl-feature-icon  { font-size:18px;margin-bottom:7px; }
.wl-feature-label { font-size:11px;font-weight:600;color:#f5f0e8;margin-bottom:4px; }
.wl-feature-desc  { font-size:10px;color:rgba(245,240,232,.4);line-height:1.5; }

.wl-cta-group { display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:4px; }
`
