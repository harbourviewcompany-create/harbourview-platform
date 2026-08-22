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
        const byKey = (arr,k) => arr.reduce((a,r)=>{a[r[k]]=(a[r[k]]||0)+1;return a;},{});
        const snapMap = byKey(snaps,"processing_status");
        const stageMap = byKey(staging,"status");
        const cMap = byKey(ctries,"data_completeness");
        setStats({
          signals_total: sigs.length,
          unreviewed_signals: sigs.filter(s=>!s.reviewed).length,
          urgent_signals: sigs.filter(s=>s.pri==="URGENT").length,
          sources_active: srcs.filter(s=>s.is_active).length,
          sources_total: srcs.length,
          pending_snapshots: snapMap.pending||0,
          extracted_snapshots: snapMap.extracted||0,
          staging_pending: stageMap.pending||0,
          countries_total: ctries.length,
          countries_populated: (cMap.full||0)+(cMap.partial||0),
          user_count: users.length,
          inquiry_pending: inqs.filter(i=>i.review_status==="new"||i.review_status==="open").length,
          intake_pending: cands.filter(c=>c.status==="needs_review").length,
        });
      } catch(e) {
        console.error('[overview]', e);
        setStats({signals_total:0,unreviewed_signals:0,urgent_signals:0,sources_active:0,sources_total:0,pending_snapshots:0,extracted_snapshots:0,staging_pending:0,countries_total:0,countries_populated:0,user_count:0,inquiry_pending:0,intake_pending:0});
      }
    })();
  }, []);

  if (!stats) return <div className="empty"><Spinner size={24}/></div>;

  const pop = stats.countries_total ? Math.round(stats.countries_populated/stats.countries_total*100) : 0;
  const rev = stats.signals_total ? Math.round((stats.signals_total-stats.unreviewed_signals)/stats.signals_total*100) : 0;

  const kpis = [
    {val:stats.signals_total,      label:"Total Signals"},
    {val:stats.unreviewed_signals, label:"Unreviewed",       cls:stats.unreviewed_signals>50?"danger":"warn"},
    {val:stats.urgent_signals,     label:"Urgent",           cls:stats.urgent_signals>0?"danger":""},
    {val:stats.pending_snapshots,  label:"Pending Snapshots",cls:stats.pending_snapshots>0?"warn":"success"},
    {val:stats.sources_active,     label:"Active Sources"},
    {val:stats.staging_pending,    label:"Staging Pending",  cls:stats.staging_pending>0?"warn":""},
    {val:stats.inquiry_pending,    label:"Inquiries Pending",cls:stats.inquiry_pending>0?"warn":""},
    {val:stats.intake_pending,     label:"Intake Pending",   cls:stats.intake_pending>0?"warn":""},
    {val:stats.countries_total,    label:"Countries"},
    {val:stats.user_count,         label:"Users"},
  ];

  return (
    <>
      <div className="kpi-grid">
        {kpis.map(k => (
          <div className="kpi" key={k.label}>
            <div className={`kpi-val ${k.cls||""}`}>{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card-section">
          <div className="card-section-title">Pipeline Health</div>
          {[
            ["Signals reviewed", `${rev}%`, rev===100?"success":"warn"],
            ["Country coverage", `${pop}% (${stats.countries_populated}/${stats.countries_total})`, pop>50?"success":"warn"],
            ["Snapshot queue", stats.pending_snapshots===0?"Clear ✓":`${stats.pending_snapshots} pending`, stats.pending_snapshots===0?"success":"danger"],
            ["Sources active", `${stats.sources_active} / ${stats.sources_total}`, ""],
            ["Staging queue", stats.staging_pending===0?"Clear":`${stats.staging_pending} pending`, stats.staging_pending>0?"warn":""],
            ["Marketplace inquiries", stats.inquiry_pending===0?"None pending":`${stats.inquiry_pending} open`, stats.inquiry_pending>0?"warn":""],
            ["Intake queue", stats.intake_pending===0?"Clear":`${stats.intake_pending} to review`, stats.intake_pending>0?"warn":""],
          ].map(([l,v,cls])=>(
            <div className="pipeline-row" key={l}>
              <span className="pipeline-label">{l}</span>
              <span className="pipeline-val" style={{color:cls==="success"?"#6DD89A":cls==="danger"?"#EF7070":cls==="warn"?"#EFA050":"#D4C9B8"}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:12}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#4A5E80",marginBottom:3}}><span>Signal review</span><span>{rev}%</span></div>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${rev}%`}} /></div>
          </div>
          <div style={{marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#4A5E80",marginBottom:3}}><span>Country coverage</span><span>{pop}%</span></div>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${pop}%`}} /></div>
          </div>
        </div>
        <div className="card-section">
          <div className="card-section-title">Cron Schedule (UTC)</div>
          {[
            ["06:00","source-engine-pass-1","50 sources"],
            ["06:15","source-engine-pass-2","50 sources"],
            ["06:30","source-engine-pass-3","32 sources"],
            ["06:45","source-engine-pass-4","22 sources"],
            ["06:50","source-engine-extract","batch 400"],
            ["07:00","source-engine-promote","all extracted"],
          ].map(([t,n,d])=>(
            <div className="pipeline-row" key={t}>
              <span style={{display:"flex",gap:8,alignItems:"baseline"}}>
                <code style={{color:"#C9A84C",fontSize:11}}>{t}</code>
                <span className="pipeline-label" style={{fontSize:11}}>{n}</span>
              </span>
              <span style={{fontSize:10,color:"#3A4E6A"}}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── INQUIRIES ──────────────────────────────
