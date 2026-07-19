'use client'

import React, { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

// Surfaces api.regulatory_pending_changes_feed() — the previously-dark
// public.regulatory_pending_changes. Partially public: teaser (country, change
// type, confidence, coarse year) is visible to everyone; specifics are gated to
// intel/operator members and returned already-redacted by the RPC (locked=true).
// Self-fetching client panel so it can drop into any Command Centre surface
// without threading through the per-country server data layer.

interface PendingChange {
  id:                      string
  country_iso2:            string | null
  change_type:             string | null
  entity_type:             string | null
  confidence:              string | null
  timeframe_hint:          string | null
  has_details:             boolean
  locked:                  boolean
  current_value:           string | null
  expected_value:          string | null
  expected_note:           string | null
  expected_effective_date: string | null
  source_url:              string | null
}

const CONF_LABEL: Record<string, string> = {
  enacted_pending_force: 'Enacted · pending force',
  announced:             'Announced',
  draft:                 'Draft',
}

const CONF_COLOR: Record<string, string> = {
  enacted_pending_force: '#e0a355',
  announced:             '#d4a84b',
  draft:                 'rgba(245,240,232,.5)',
}

const CHANGE_LABEL: Record<string, string> = {
  status:     'Legal status',
  prescriber: 'Prescriber rules',
  new_format: 'New market format',
}

export function RegulatoryRadar({ countryIso }: { countryIso?: string }) {
  const [rows, setRows] = useState<PendingChange[] | null>(null)
  const [err, setErr]   = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('regulatory_pending_changes_feed')
        if (!active) return
        if (error) { setErr(error.message); setRows([]); return }
        setRows((data ?? []) as PendingChange[])
      } catch (e) {
        if (active) { setErr(String(e)); setRows([]) }
      }
    })()
    return () => { active = false }
  }, [])

  // Nothing to show and no error → render nothing (no empty box).
  if (rows !== null && rows.length === 0 && !err) return null

  const anyLocked = (rows ?? []).some(r => r.locked)

  return (
    <div className="rr-wrap">
      <style>{RADAR_CSS}</style>

      <div className="rr-head">
        <span className="rr-title">REGULATORY RADAR</span>
        <span className="rr-sub">Upcoming changes across tracked markets</span>
      </div>

      {rows === null && <div className="rr-msg">Loading upcoming changes…</div>}
      {err && <div className="rr-msg">Radar unavailable right now.</div>}

      <div className="rr-grid">
        {(rows ?? []).map(r => {
          const highlight = Boolean(countryIso && r.country_iso2 === countryIso)
          return (
            <div key={r.id} className={'rr-card' + (highlight ? ' rr-card--hl' : '')}>
              <div className="rr-card-top">
                <span className="rr-iso">{r.country_iso2 ?? '—'}</span>
                <span
                  className="rr-conf"
                  style={{ color: CONF_COLOR[r.confidence ?? ''] ?? 'rgba(245,240,232,.5)' }}
                >
                  {CONF_LABEL[r.confidence ?? ''] ?? r.confidence ?? '—'}
                </span>
              </div>

              <div className="rr-change">
                {CHANGE_LABEL[r.change_type ?? ''] ?? r.change_type ?? 'Regulatory change'}
                {r.timeframe_hint ? ` · ${r.timeframe_hint}` : ''}
              </div>

              {r.locked ? (
                <div className="rr-locked">
                  <span className="rr-lock">🔒</span>
                  <span>Details for Intel &amp; Operator members</span>
                </div>
              ) : (
                <div className="rr-detail">
                  {r.expected_value && <div className="rr-expected">→ {r.expected_value}</div>}
                  {r.expected_note && <div className="rr-note">{r.expected_note}</div>}
                  {r.source_url && (
                    <a className="rr-src" href={r.source_url} target="_blank" rel="noopener noreferrer">
                      source ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {anyLocked && (
        <a className="rr-cta" href="/pricing">Unlock full regulatory intelligence →</a>
      )}
    </div>
  )
}

const RADAR_CSS = `
.rr-wrap {
  margin-top:16px; padding:16px 18px;
  border:1px solid rgba(212,168,75,.18); border-radius:12px;
  background:linear-gradient(180deg, rgba(212,168,75,.05), rgba(5,12,24,0));
}
.rr-head { display:flex; align-items:baseline; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
.rr-title { font-size:11px; letter-spacing:.12em; color:#d4a84b; font-weight:600; }
.rr-sub { font-size:11px; color:rgba(245,240,232,.42); }
.rr-msg { font-size:12px; color:rgba(245,240,232,.5); padding:6px 0; }
.rr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
.rr-card {
  border:1px solid rgba(255,255,255,.07); border-radius:9px; padding:12px;
  background:rgba(255,255,255,.02); transition:border-color .15s, background .15s;
}
.rr-card--hl { border-color:rgba(212,168,75,.5); background:rgba(212,168,75,.06); }
.rr-card-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; gap:8px; }
.rr-iso { font-family:'Georgia',serif; font-size:15px; color:#f5f0e8; letter-spacing:.02em; }
.rr-conf { font-size:10px; font-weight:600; letter-spacing:.02em; text-align:right; }
.rr-change { font-size:12px; color:rgba(245,240,232,.8); margin-bottom:8px; line-height:1.3; }
.rr-locked {
  display:flex; align-items:center; gap:6px; font-size:11px; color:rgba(245,240,232,.45);
  padding-top:8px; border-top:1px dashed rgba(255,255,255,.08);
}
.rr-lock { font-size:12px; filter:grayscale(.2); }
.rr-detail { padding-top:8px; border-top:1px solid rgba(255,255,255,.06); }
.rr-expected { font-size:12px; color:#e0a355; margin-bottom:4px; line-height:1.35; }
.rr-note { font-size:11px; color:rgba(245,240,232,.6); line-height:1.45; }
.rr-src { display:inline-block; margin-top:6px; font-size:10px; color:rgba(212,168,75,.85); text-decoration:none; }
.rr-src:hover { text-decoration:underline; }
.rr-cta { display:inline-block; margin-top:14px; font-size:12px; font-weight:600; color:#d4a84b; text-decoration:none; }
.rr-cta:hover { text-decoration:underline; }
`