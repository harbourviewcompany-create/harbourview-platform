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

export function Actions({ api, toast }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState({});
  const run = async (key: string, fn: () => Promise<unknown>) => {
    setRunning(r => ({...r, [key]: true}));
    setResults(r => ({...r, [key]: null}));
    try {
      const txt = JSON.stringify(await fn(), null, 2);
      setResults(r => ({...r, [key]: {ok: true, txt}}));
    } catch (e) {
      setResults(r => ({...r, [key]: {ok: false, txt: (e as Error).message}}));
    } finally {
      setRunning(r => ({...r, [key]: false}));
    }
  };
  const actions=[
    {key:"promote",title:"Promote Extracted Snapshots",desc:"promote_all_extracted_snapshots()",fn:()=>api.rpc("promote_all_extracted_snapshots")},
    {key:"ingest",title:"Ingest Staging Batch",desc:"hv_ingest_snapshot_to_staging()",fn:()=>api.rpc("hv_ingest_snapshot_to_staging",{p_batch_size:400,p_workspace_id:WS_ID})},
    {key:"extract",title:"Run Signal Extraction",desc:"hv_extract_signals_from_captured_text()",fn:()=>api.rpc("hv_extract_signals_from_captured_text",{p_batch_size:400})},
    {key:"snapstatus",title:"Snapshot Queue Status",desc:"Count snapshots by status",fn:async()=>{const d=await api.get("source_snapshots","select=processing_status&limit=5000");return d.reduce((a,r)=>{a[r.processing_status]=(a[r.processing_status]||0)+1;return a;},{})}},
    {key:"sigstats",title:"Signal Stats",desc:"Signal breakdown by review status",fn:async()=>{const d=await api.get("signals","select=reviewed,pri,action&limit=5000");return{total:d.length,unreviewed:d.filter(s=>!s.reviewed).length,approved:d.filter(s=>s.action==="approved").length,urgent:d.filter(s=>s.pri==="URGENT").length}}},
    {key:"inqstats",title:"Inquiry Stats",desc:"Inquiry breakdown by review status",fn:async()=>{const d=await api.get("marketplace_inquiries","select=review_status,priority&limit=1000").catch(()=>[]);return d.reduce((a,r)=>{a[r.review_status]=(a[r.review_status]||0)+1;return a;},{})}},
    {key:"bulkapprove",title:"Bulk Approve Staging",desc:"Approve all pending staging items",fn:async()=>{const p=await api.get("hv_import_staging","select=id&status=eq.pending");let n=0;for(const r of p){await api.patch("hv_import_staging",`id=eq.${r.id}`,{status:"approved"}).catch(()=>{});n++;}return{approved:n}}},
    {key:"coverage",title:"Country Coverage Audit",desc:"data_completeness breakdown",fn:async()=>{const d=await api.get("countries","select=data_completeness&limit=300");return d.reduce((a,r)=>{a[r.data_completeness]=(a[r.data_completeness]||0)+1;return a;},{})}},
  ];
  return (<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{actions.map(a=>{const res=results[a.key];const busy=running[a.key];return(<div className="action-card" key={a.key}><div className="action-card-title">{a.title}</div><div className="action-card-desc">{a.desc}</div><button className="btn btn-gold btn-sm" disabled={busy} onClick={()=>run(a.key,a.fn)}>{busy?<><div className="spinner"/>Running…</>:"▶ Run"}</button>{res&&<div style={{marginTop:10,fontSize:11,fontFamily:"'DM Mono',monospace",background:res.ok?"#0A1A0E":"#1A0A0A",border:`1px solid ${res.ok?"#1E4A30":"#4A1E1E"}`,color:res.ok?"#6DD89A":"#EF7070",borderRadius:4,padding:"8px 10px",whiteSpace:"pre-wrap",maxHeight:110,overflowY:"auto"}}>{res.txt}</div>}</div>);})}</div>);
}

// ─── APP SHELL ───────────────────────────────────────────────────────
export default function HarbourviewAdmin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sectionFromUrl = searchParams?.get("section") || "overview";
  const [section, setSection] = useState(sectionFromUrl);
  useEffect(() => {
    const s = searchParams?.get("section") || "overview";
    setSection(s);
  }, [searchParams]);
  const goSection = (id) => {
    setSection(id);
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (id === "overview") params.delete("section");
    else params.set("section", id);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };
  const [toastMsg, setToastMsg] = useState(null);
  const [stats, setStats] = useState(null);
  const toast=(msg)=>setToastMsg(msg);
  const client=mkApi();
  const badgeCounts={unreviewed_signals:stats?.unreviewed_signals||0,staging_pending:stats?.staging_pending||0,inquiry_pending:stats?.inquiry_pending||0,intake_pending:stats?.intake_pending||0};
  return (<><style>{css}</style><div className="hv-app content-only"><aside className="sidebar"><div className="sidebar-logo"><div className="logo-mark">Harbourview</div><div className="logo-sub">Admin Control Surface</div></div><nav className="nav">{NAV.map((n,i)=>{if(n.group)return <div className="nav-group" key={i}>{n.group}</div>;const count=n.badgeKey?badgeCounts[n.badgeKey]||0:0;if(n.href)return(<a key={n.id} href={n.href} className={`nav-item ${section===n.id?"active":""}`} style={{textDecoration:"none",color:"inherit"}}><span style={{fontSize:12,width:14,textAlign:"center",flexShrink:0}}>{n.icon}</span>{n.label}</a>);return(<button key={n.id} className={`nav-item ${section===n.id?"active":""}`} onClick={()=>goSection(n.id)}><span style={{fontSize:12,width:14,textAlign:"center",flexShrink:0}}>{n.icon}</span>{n.label}{count>0&&<span className={`nav-badge ${n.badgeKey==="staging_pending"||n.badgeKey==="inquiry_pending"||n.badgeKey==="intake_pending"?"warn":""}`}>{count}</span>}</button>);})}</nav><div className="sidebar-status"><span className="status-dot"/><span className="status-txt">zvxdgdkukjrrwamdpqrg</span></div></aside><main className="hv-main"><div className="topbar"><span className="page-title">{PAGE_TITLES[section]||section}</span><div className="topbar-right"><span style={{fontSize:11,color:"#3A4E6A",fontFamily:"'DM Mono',monospace"}}>{new Date().toLocaleTimeString()}</span></div></div><div className="content">{section==="overview"&&<Overview api={client} stats={stats} setStats={setStats}/>}{section==="inquiries"&&<Inquiries api={client} toast={toast}/>}{section==="candidates"&&<Candidates api={client} toast={toast}/>}{section==="intake"&&<Intake api={client} toast={toast}/>}{section==="deal"&&<DealBoard api={client} toast={toast}/>}{section==="signals"&&<Signals api={client} toast={toast} stats={stats}/>}{section==="staging"&&<Staging api={client} toast={toast}/>}{section==="intel"&&<Intel api={client} toast={toast}/>}{section==="sources"&&<Sources api={client} toast={toast}/>}{section==="countries"&&<Countries api={client} toast={toast}/>}{section==="users"&&<Users api={client} toast={toast}/>}{section==="feed"&&<Feed api={client} toast={toast}/>}{section==="stripe"&&<Stripe toast={toast}/>}{section==="actions"&&<Actions api={client} toast={toast}/>}{section==="clinical"&&<ClinicalPanel/>}</div></main></div>{toastMsg&&<Toast msg={toastMsg} onDone={()=>setToastMsg(null)}/>}</>);
}
