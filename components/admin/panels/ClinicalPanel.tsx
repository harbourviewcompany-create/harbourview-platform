/* eslint-disable */
// @ts-nocheck — extracted from HubPanel
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  mkApi,
  Pill,
  priPill,
  lanePill,
  Toast,
  Spinner,
  truncate,
  fmtDate,
  fmtDt,
  inCannabisScope,
  panelCss,
  WS_ID,
  useAdminToast,
} from '@/components/admin/panels/shared'

export function ClinicalPanel() {
  return (
    <div style={{display:"grid",gap:14,maxWidth:800}}>
      <div className="card-section">
        <div className="card-section-title">Clinical evidence spine</div>
        <p style={{fontSize:12,color:"#6A7E9B",lineHeight:1.55,marginBottom:12}}>
          Graded cannabinoid clinical reference, claim-map, and commercial framework alignment
          (IMDRF / DTA / stage-gates). Operator tools only — not clinical advice; does not change
          public search conclusions or the platform disclaimer.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <a className="action-card" href="/admin/clinical-review" style={{textDecoration:"none",color:"inherit",display:"block"}}>
            <div className="action-card-title">Evidence review queue</div>
            <div className="action-card-desc">Publish / retire graded evidence and formulary rows. Human-gated.</div>
          </a>
          <a className="action-card" href="/admin/clinical-review/claim-map" style={{textDecoration:"none",color:"inherit",display:"block"}}>
            <div className="action-card-title">Claim map &amp; framework gaps</div>
            <div className="action-card-desc">Stage-gate readiness, IMDRF/DTA/ALCOA+ gaps, corridor flags. Live persist when migration applied.</div>
          </a>
          <a className="action-card" href="/admin/genetics/review" style={{textDecoration:"none",color:"inherit",display:"block"}}>
            <div className="action-card-title">Genetics review</div>
            <div className="action-card-desc">Cultivar / passport review queue for genetics programme.</div>
          </a>
          <a className="action-card" href="/admin/agents/evidence-actions" style={{textDecoration:"none",color:"inherit",display:"block"}}>
            <div className="action-card-title">Agent evidence actions</div>
            <div className="action-card-desc">Intelligence-automation evidence actions for operators.</div>
          </a>
        </div>
      </div>
      <div className="card-section">
        <div className="card-section-title">Wiring map</div>
        <table>
          <thead><tr><th>Surface</th><th>Route</th><th>Role</th></tr></thead>
          <tbody>
            <tr><td>Evidence queue</td><td className="cell-mono">/admin/clinical-review</td><td>Publish gate</td></tr>
            <tr><td>Claim map</td><td className="cell-mono">/admin/clinical-review/claim-map</td><td>Commercial orientation</td></tr>
            <tr><td>API</td><td className="cell-mono">/api/clinical/admin/framework-alignment</td><td>Persist alignment</td></tr>
            <tr><td>Command Centre</td><td className="cell-mono">Access Pathway → Corridors</td><td>Corridor flags</td></tr>
          </tbody>
        </table>
      </div>
      <div className="card-section">
        <div className="card-section-title">Scope</div>
        <p style={{fontSize:11,color:"#4A5E80",lineHeight:1.5}}>
          Cannabinoid / medical-cannabis clinical-reference only. Non-SaMD professional reference.
          Framework alignment is optional metadata for dossiers — never used for clinical inference.
        </p>
      </div>
    </div>
  );
}
