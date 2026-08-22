/* eslint-disable */
// @ts-nocheck — extracted from HubPanel
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Spinner,
} from '@/components/admin/panels/shared'

export function Overview({ api, stats, setStats }) {
  useEffect(() => {
    if (stats) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled && !stats) {
        setStats({
          signals_total: 0, unreviewed_signals: 0, urgent_signals: 0,
          sources_active: 0, sources_total: 0, pending_snapshots: 0,
          staging_pending: 0, users: 0, inquiries_pending: 0, candidates: 0,
          countries_full: 0, countries_total: 0, load_error: "timeout",
        });
      }
    }, 12000);
    (async () => {
      try {
        const [snaps, sigs, srcs, ctries, staging, users, inqs, cands] = await Promise.all([
          api.get("source_snapshots", "select=processing_status&limit=2000").catch(()=>[]),
          api.get("signals", "select=reviewed,pri&limit=2000").catch(()=>[]),
          api.get("source_registry", "select=is_active&limit=1000").catch(()=>[]),
          api.get("countries", "select=data_completeness&limit=300").catch(()=>[]),
          api.get("hv_import_staging", "select=status&limit=1000").catch(()=>[]),
          api.get("user_profiles", "select=id&limit=100").catch(()=>[]),
          api.get("marketplace_inquiries", "select=review_status&limit=500").catch(()=>[]),
          api.get("marketplace_candidates", "select=status&limit=500").catch(()=>[]),
        ]);
        if (cancelled) return;
        const arr = (x) => Array.isArray(x) ? x : [];
        const byKey = (a,k) => arr(a).reduce((acc,r)=>{acc[r[k]]=(acc[r[k]]||0)+1;return acc;},{});
        const snapMap = byKey(snaps,"processing_status");
        const stageMap = byKey(staging,"status");
        const cMap = byKey(ctries,"data_completeness");
        setStats({
          signals_total: arr(sigs).length,
          unreviewed_signals: arr(sigs).filter(s=>!s.reviewed).length,
          urgent_signals: arr(sigs).filter(s=>s.pri==="URGENT").length,
          sources_active: arr(srcs).filter(s=>s.is_active).length,
          sources_total: arr(srcs).length,
          pending_snapshots: snapMap.pending||0,
          staging_pending: stageMap.pending||stageMap.queued||0,
          users: arr(users).length,
          inquiries_pending: arr(inqs).filter(i=>i.review_status==="pending"||!i.review_status).length,
          candidates: arr(cands).length,
          countries_full: cMap.full||cMap.complete||0,
          countries_total: arr(ctries).length,
        });
      } catch (e) {
        if (!cancelled) {
          setStats({
            signals_total: 0, unreviewed_signals: 0, urgent_signals: 0,
            sources_active: 0, sources_total: 0, pending_snapshots: 0,
            staging_pending: 0, users: 0, inquiries_pending: 0, candidates: 0,
            countries_full: 0, countries_total: 0,
            load_error: e.message || "load failed",
          });
        }
      } finally {
        clearTimeout(timer);
      }
    })();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [api, stats, setStats]);

  if (!stats) {
    return (
      <div style={{padding:40,textAlign:"center"}}>
        <div className="spinner" style={{width:28,height:28,margin:"0 auto 12px"}} />
        <div style={{fontSize:12,color:"#6A7E9B"}}>Loading control surface stats…</div>
      </div>
    );
  }

  const cards = [
    {label:"Unreviewed signals",value:stats.unreviewed_signals,href:"/admin/signals"},
    {label:"Staging pending",value:stats.staging_pending,href:"/admin/staging"},
    {label:"Active sources",value:stats.sources_active,href:"/admin/sources"},
    {label:"Inquiries",value:stats.inquiries_pending,href:"/admin/inquiries"},
    {label:"Candidates",value:stats.candidates,href:"/admin/candidates"},
    {label:"Countries",value:stats.countries_total,href:"/admin/countries"},
  ];

  return (
    <div style={{display:"grid",gap:16,maxWidth:900}}>
      {stats.load_error && (
        <div className="alert alert-error" style={{fontSize:12}}>Stats partial: {stats.load_error}</div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
        {cards.map(c => (
          <a key={c.label} href={c.href} className="stat-card" style={{textDecoration:"none",color:"inherit",display:"block"}}>
            <div className="stat-val">{c.value ?? "—"}</div>
            <div className="stat-label">{c.label}</div>
          </a>
        ))}
      </div>
      <div className="card-section">
        <div className="card-section-title">Quick links</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          <a className="btn btn-ghost btn-sm" href="/admin/signals">Signals →</a>
          <a className="btn btn-ghost btn-sm" href="/admin/staging">Staging →</a>
          <a className="btn btn-ghost btn-sm" href="/admin/clinical-home">Clinical →</a>
          <a className="btn btn-ghost btn-sm" href="/admin/clinical-review/claim-map">Claim map →</a>
          <a className="btn btn-ghost btn-sm" href="/admin/actions">Actions →</a>
        </div>
      </div>
    </div>
  );
}
