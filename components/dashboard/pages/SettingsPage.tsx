'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface SettingsPageProps {
  country:    { iso2: string; label: string }
  region:     string
  role:       string
  userEmail?: string | null
}

type NotifPref = { id: string; label: string; desc: string; enabled: boolean }

const DEFAULT_PREFS: NotifPref[] = [
  { id: 'regulatory', label: 'Regulatory Alerts',      desc: 'Changes to licensing, policy, and market access status.',        enabled: true  },
  { id: 'signals',    label: 'Weekly Signal Digest',   desc: 'Intelligence signals relevant to your role and markets.',         enabled: true  },
  { id: 'listings',   label: 'New Listing Matches',    desc: 'Marketplace listings matching your role and country context.',    enabled: false },
  { id: 'intel',      label: 'Local Intel Updates',    desc: 'New coverage and data updates for your active markets.',          enabled: false },
  { id: 'deals',      label: 'Deal Room Activity',     desc: 'Pipeline movement and counterparty messages.',                    enabled: true  },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`sg-toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <div className="sg-toggle-knob" />
    </button>
  )
}

export const SettingsPage = React.memo(function SettingsPage({
  country, role, userEmail,
}: SettingsPageProps) {
  const router = useRouter()
  const [prefs, setPrefs] = useState<NotifPref[]>(DEFAULT_PREFS)
  const [saved, setSaved] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function togglePref(id: string, val: boolean) {
    setPrefs(prev => prev.map(p => p.id === id ? { ...p, enabled: val } : p))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="sg-root">
      <style>{CSS}</style>

      <div className="sg-header">
        <div>
          <h1 className="sg-heading">Settings</h1>
          <p className="sg-sub">Command Centre preferences and notification controls</p>
        </div>
        <button className={`sg-save-btn${saved ? ' saved' : ''}`} onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="sg-body">
        {/* ── Left: Context ─────────────────────────────────────────────────── */}
        <div className="sg-left">
          <div className="sg-section-head">ACTIVE CONTEXT</div>
          <div className="sg-context-card">
            <div className="sg-ctx-row">
              <span className="sg-ctx-label">Market</span>
              <span className="sg-ctx-val">{country.label}</span>
            </div>
            <div className="sg-ctx-row">
              <span className="sg-ctx-label">ISO Code</span>
              <span className="sg-ctx-val sg-ctx-mono">{country.iso2}</span>
            </div>
          </div>
          <p className="sg-ctx-note">
            Change your market using the selector in the header bar. Context is applied
            to all pages in the Command Centre.
          </p>

          <div className="sg-section-head sg-section-head--spaced">SESSION</div>
          <div className="sg-context-card">
            {userEmail && (
              <div className="sg-ctx-row">
                <span className="sg-ctx-label">Account</span>
                <span className="sg-ctx-val sg-ctx-mono" style={{fontSize:'11px'}}>{userEmail}</span>
              </div>
            )}
            <div className="sg-ctx-row">
              <span className="sg-ctx-label">Session type</span>
              <span className="sg-ctx-val">Authenticated</span>
            </div>
            <div className="sg-ctx-row">
              <span className="sg-ctx-label">Access level</span>
              <span className="sg-ctx-val">
                <span className="sg-badge sg-badge--active">Platform access</span>
              </span>
            </div>
            <div className="sg-ctx-row">
              <span className="sg-ctx-label">Data region</span>
              <span className="sg-ctx-val">Global</span>
            </div>
          </div>

          <div className="sg-section-head sg-section-head--spaced">ACCOUNT</div>
          <div className="sg-action-list">
            <a href="/account" className="sg-action-row">
              <div className="sg-action-icon">◎</div>
              <div>
                <div className="sg-action-label">Account Settings</div>
                <div className="sg-action-desc">Profile, billing, and subscription details</div>
              </div>
              <div className="sg-action-arrow">→</div>
            </a>
            <a href="/security" className="sg-action-row">
              <div className="sg-action-icon">⊙</div>
              <div>
                <div className="sg-action-label">Security</div>
                <div className="sg-action-desc">Password, MFA, and API access</div>
              </div>
              <div className="sg-action-arrow">→</div>
            </a>
            <a href="/intake" className="sg-action-row">
              <div className="sg-action-icon">⬡</div>
              <div>
                <div className="sg-action-label">Upgrade Access</div>
                <div className="sg-action-desc">Unlock additional markets and features</div>
              </div>
              <div className="sg-action-arrow">→</div>
            </a>
            <button type="button" onClick={handleSignOut} className="sg-action-row" style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer'}}>
              <div className="sg-action-icon" style={{color:'rgba(220,80,80,.7)'}}>⊗</div>
              <div>
                <div className="sg-action-label" style={{color:'rgba(220,80,80,.85)'}}>Sign Out</div>
                <div className="sg-action-desc">End your current session</div>
              </div>
              <div className="sg-action-arrow">→</div>
            </button>
          </div>
        </div>

        {/* ── Right: Notification preferences ─────────────────────────────── */}
        <div className="sg-right">
          <div className="sg-section-head">NOTIFICATION PREFERENCES</div>
          <div className="sg-prefs">
            {prefs.map(pref => (
              <div key={pref.id} className="sg-pref-row">
                <div className="sg-pref-body">
                  <div className="sg-pref-label">{pref.label}</div>
                  <div className="sg-pref-desc">{pref.desc}</div>
                </div>
                <Toggle checked={pref.enabled} onChange={v => togglePref(pref.id, v)} />
              </div>
            ))}
          </div>

          <div className="sg-section-head sg-section-head--spaced">DISPLAY PREFERENCES</div>
          <div className="sg-prefs">
            {[
              { label: 'Compact signals view',       desc: 'Show signals in a condensed single-line format.' },
              { label: 'Show confidence scores',     desc: 'Display percentage confidence on all intelligence items.' },
              { label: 'Highlight regulatory alerts',desc: 'Emphasise regulatory changes with visual indicators.' },
            ].map((p, i) => (
              <div key={p.label} className="sg-pref-row">
                <div className="sg-pref-body">
                  <div className="sg-pref-label">{p.label}</div>
                  <div className="sg-pref-desc">{p.desc}</div>
                </div>
                <Toggle checked={i === 1} onChange={() => {}} />
              </div>
            ))}
          </div>

          <div className="sg-save-footer">
            <button className={`sg-save-btn${saved ? ' saved' : ''}`} onClick={handleSave}>
              {saved ? '✓ Changes Saved' : 'Save Preferences'}
            </button>
            {saved && <span className="sg-saved-note">Preferences applied to current session.</span>}
          </div>
        </div>
      </div>
    </div>
  )
})

const CSS = `
.sg-root {
  display:flex;flex-direction:column;height:100%;overflow:hidden;
  animation:sgIn .28s ease;
}
@keyframes sgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

.sg-header {
  display:flex;align-items:flex-start;justify-content:space-between;
  padding:20px 24px 0;flex-shrink:0;gap:16px;
}
.sg-heading { font-family:'Georgia',serif;font-size:22px;font-weight:400;color:#f5f0e8; }
.sg-sub { font-size:11px;color:rgba(245,240,232,.42);margin-top:3px; }

.sg-save-btn {
  padding:8px 18px;border-radius:8px;font-size:12px;font-weight:600;
  border:1px solid rgba(212,168,75,.4);background:rgba(212,168,75,.08);
  color:#d4a84b;cursor:pointer;font:inherit;flex-shrink:0;
  transition:all .18s;
}
.sg-save-btn:hover { background:rgba(212,168,75,.15); }
.sg-save-btn.saved { border-color:rgba(76,175,130,.5);background:rgba(76,175,130,.1);color:#4caf82; }

.sg-body {
  flex:1;overflow:hidden;display:grid;
  grid-template-columns:320px 1fr;padding:20px 24px 0;gap:0;
}
.sg-left  { overflow-y:auto;padding-right:20px;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:10px; }
.sg-right { overflow-y:auto;padding-left:20px;display:flex;flex-direction:column;gap:10px; }

.sg-section-head {
  font-family:'JetBrains Mono','Fira Mono',monospace;
  font-size:9px;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(245,240,232,.3);
}
.sg-section-head--spaced { margin-top:8px; }

.sg-context-card {
  border-radius:10px;overflow:hidden;
  border:1px solid rgba(255,255,255,.07);
  background:rgba(255,255,255,.025);
}
.sg-ctx-row {
  display:flex;align-items:center;justify-content:space-between;
  padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.05);
}
.sg-ctx-row:last-child { border-bottom:none; }
.sg-ctx-label { font-size:11px;color:rgba(245,240,232,.42); }
.sg-ctx-val   { font-size:11px;font-weight:500;color:#f5f0e8; }
.sg-ctx-mono  { font-family:'JetBrains Mono','Fira Mono',monospace;font-size:10px;color:#d4a84b; }

.sg-badge { font-size:10px;padding:2px 8px;border-radius:5px;font-weight:500; }
.sg-badge--active { background:rgba(76,175,130,.12);color:#4caf82;border:1px solid rgba(76,175,130,.2); }

.sg-ctx-note { font-size:10px;color:rgba(245,240,232,.32);line-height:1.6;margin:0; }

.sg-action-list { display:flex;flex-direction:column;gap:4px; }
.sg-action-row {
  display:flex;align-items:center;gap:10px;
  padding:10px 12px;border-radius:8px;text-decoration:none;
  background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);
  transition:background .12s,border-color .12s;
}
.sg-action-row:hover { background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.11); }
.sg-action-icon { font-size:14px;color:rgba(212,168,75,.6);flex-shrink:0;width:16px;text-align:center; }
.sg-action-label { font-size:12px;font-weight:500;color:#f5f0e8; }
.sg-action-desc  { font-size:10px;color:rgba(245,240,232,.35);margin-top:1px; }
.sg-action-arrow { margin-left:auto;color:rgba(245,240,232,.2);font-size:12px; }

.sg-prefs { display:flex;flex-direction:column;gap:0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02); }
.sg-pref-row {
  display:flex;align-items:center;gap:14px;justify-content:space-between;
  padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.05);
}
.sg-pref-row:last-child { border-bottom:none; }
.sg-pref-body { flex:1;min-width:0; }
.sg-pref-label { font-size:12px;font-weight:500;color:#f5f0e8; }
.sg-pref-desc  { font-size:10px;color:rgba(245,240,232,.38);margin-top:2px;line-height:1.4; }

.sg-toggle {
  width:36px;height:20px;border-radius:10px;flex-shrink:0;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);
  position:relative;cursor:pointer;transition:background .18s,border-color .18s;
}
.sg-toggle.on { background:rgba(212,168,75,.35);border-color:rgba(212,168,75,.5); }
.sg-toggle-knob {
  position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
  background:rgba(245,240,232,.6);transition:left .18s,background .18s;
}
.sg-toggle.on .sg-toggle-knob { left:18px;background:#d4a84b; }

.sg-save-footer {
  margin-top:auto;padding-top:16px;display:flex;align-items:center;gap:12px;
}
.sg-saved-note { font-size:10px;color:rgba(245,240,232,.38); }
`
