/* eslint-disable */
// @ts-nocheck -- admin control surface, intentionally untyped runtime-driven UI
'use client';
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const WS_ID  = "a85840b4-c522-4cb8-9097-2f6c30a78417";

// All Supabase access goes through the server-side proxy at
// /api/admin/hub-proxy, which uses SUPABASE_SERVICE_ROLE_KEY on the server
// and is gated by requireAdminApiAuth(). No client-side secrets needed —
// admin auth is already enforced by the (protected) route group.
function mkApi() {
  const req = async (payload: Record<string, unknown>) => {
    const r = await fetch("/api/admin/hub-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const txt = await r.text();
    let d; try { d = JSON.parse(txt); } catch { d = txt; }
    if (!r.ok) throw new Error((d && (d.error || d.message)) || txt || r.status);
    return d;
  };
  return {
    get:   (t: string, qs="")    => req({ op:"get", table:t, qs }),
    patch: (t: string, qs: string, body: unknown) => req({ op:"patch", table:t, qs, body }),
    post:  (t: string, body: unknown)     => req({ op:"post", table:t, body }),
    del:   (t: string, qs: string)       => req({ op:"delete", table:t, qs }),
    rpc:   (fn: string, body: Record<string, unknown>={}) => req({ op:"rpc", fn, body }),
  };
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;}
  body{font-family:'DM Sans',sans-serif;background:#080E1C;color:#D4C9B8;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:#0D1527;}
  ::-webkit-scrollbar-thumb{background:#2A3A5C;border-radius:4px;}
  input,select,textarea{font-family:inherit;}
  button{cursor:pointer;font-family:inherit;}
  table{border-collapse:collapse;width:100%;}
  code{font-family:'DM Mono',monospace;}

  .hv-app{display:grid;grid-template-columns:220px 1fr;height:100vh;overflow:hidden;position:fixed;inset:0;z-index:50;background:#080E1C;}.hv-app.content-only{grid-template-columns:1fr;position:relative;inset:auto;height:auto;min-height:100%;z-index:1;}.hv-app.content-only .sidebar{display:none;}.hv-app.content-only .hv-main{min-height:100%;}.hv-app.content-only .topbar{display:none;}
  .sidebar{background:#060C1A;border-right:1px solid #1A2640;display:flex;flex-direction:column;overflow:hidden;}
  .sidebar-logo{padding:20px 18px 14px;border-bottom:1px solid #1A2640;}
  .logo-mark{font-size:11px;font-weight:600;letter-spacing:.25em;color:#C9A84C;text-transform:uppercase;}
  .logo-sub{font-size:10px;color:#4A5E80;margin-top:2px;letter-spacing:.1em;}
  .nav{flex:1;padding:10px 0;overflow-y:auto;}
  .nav-group{padding:8px 18px 4px;font-size:9px;font-weight:600;letter-spacing:.15em;color:#2A3A5C;text-transform:uppercase;}
  a.nav-item{text-decoration:none;color:inherit;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:8px 18px;font-size:12.5px;color:#6A7E9B;cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:color .15s,background .15s;border-left:2px solid transparent;}
  .nav-item:hover{color:#D4C9B8;background:#0D1527;}
  .nav-item.active{color:#C9A84C;background:#0D1527;border-left-color:#C9A84C;}
  .nav-badge{margin-left:auto;background:#8B2020;color:#FFB3B3;font-size:10px;padding:1px 6px;border-radius:20px;font-weight:500;}
  .nav-badge.warn{background:#7A5A10;color:#FFD980;}
  .sidebar-status{padding:12px 18px;border-top:1px solid #1A2640;}
  .status-dot{width:7px;height:7px;border-radius:50%;background:#3DA86E;display:inline-block;margin-right:8px;box-shadow:0 0 6px #3DA86E80;}
  .status-txt{font-size:11px;color:#4A5E80;}

  .hv-main{overflow-y:auto;background:#080E1C;display:flex;flex-direction:column;}
  .topbar{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:52px;border-bottom:1px solid #1A2640;background:#060C1A;position:sticky;top:0;z-index:10;flex-shrink:0;}
  .page-title{font-size:14px;font-weight:500;color:#D4C9B8;}
  .topbar-right{display:flex;align-items:center;gap:10px;}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:6px;font-size:12px;font-weight:500;border:none;transition:all .15s;cursor:pointer;white-space:nowrap;}
  .btn-ghost{background:transparent;color:#6A7E9B;border:1px solid #1A2640;}
  .btn-ghost:hover{background:#0D1527;color:#D4C9B8;}
  .btn-gold{background:#C9A84C;color:#080E1C;border:none;}
  .btn-gold:hover{background:#E0BD62;}
  .btn-danger{background:#8B2020;color:#FFB3B3;border:none;}
  .btn-danger:hover{background:#A02828;}
  .btn-success{background:#1A4A30;color:#6DD89A;border:none;}
  .btn-success:hover{background:#225A3A;}
  .btn-blue{background:#1A2A4A;color:#7BA8EF;border:none;}
  .btn-blue:hover{background:#1E3560;}
  .btn-sm{padding:4px 9px;font-size:11px;}
  .btn:disabled{opacity:.4;cursor:not-allowed;}

  .content{padding:20px 24px;flex:1;}
  .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
  .section-title{font-size:12px;font-weight:500;color:#4A5E80;text-transform:uppercase;letter-spacing:.1em;}

  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;}
  .kpi{background:#0D1527;border:1px solid #1A2640;border-radius:8px;padding:14px;}
  .kpi-val{font-size:24px;font-weight:500;color:#D4C9B8;line-height:1;}
  .kpi-val.gold{color:#C9A84C;} .kpi-val.danger{color:#EF7070;} .kpi-val.success{color:#6DD89A;} .kpi-val.warn{color:#EFA050;}
  .kpi-label{font-size:10px;color:#4A5E80;margin-top:5px;text-transform:uppercase;letter-spacing:.08em;}

  .table-wrap{background:#0D1527;border:1px solid #1A2640;border-radius:8px;overflow:hidden;margin-bottom:14px;}
  .table-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #1A2640;gap:8px;flex-wrap:wrap;}
  .table-filters{display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
  table th{font-size:10px;font-weight:500;color:#4A5E80;text-transform:uppercase;letter-spacing:.08em;padding:9px 12px;text-align:left;border-bottom:1px solid #1A2640;white-space:nowrap;}
  table td{font-size:12px;color:#A0B0C8;padding:9px 12px;border-bottom:1px solid #111E33;vertical-align:top;}
  table tr:last-child td{border-bottom:none;}
  table tr:hover td{background:#0A1220;}
  .cell-primary{color:#D4C9B8;font-weight:500;}
  .cell-mono{font-family:'DM Mono',monospace;font-size:11px;color:#8A9CB8;}

  .pill{display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:500;white-space:nowrap;}
  .pill-gold{background:#3A2A0A;color:#C9A84C;} .pill-red{background:#2A0E0E;color:#EF7070;}
  .pill-green{background:#0E2A1E;color:#6DD89A;} .pill-blue{background:#0E1E3A;color:#7BA8EF;}
  .pill-gray{background:#1A2640;color:#6A7E9B;} .pill-warn{background:#2A1E0A;color:#EFA050;}
  .pill-purple{background:#1E0E3A;color:#B07AEF;}

  .alert{padding:10px 14px;border-radius:6px;font-size:12px;margin-bottom:14px;}
  .alert-warn{background:#2A1E0A;border:1px solid #5A3A10;color:#EFA050;}
  .alert-info{background:#0E1E3A;border:1px solid #1E3A6A;color:#7BA8EF;}
  .alert-success{background:#0E2A1E;border:1px solid #1E4A30;color:#6DD89A;}
  .alert-danger{background:#2A0E0E;border:1px solid #5A1E1E;color:#EF7070;}

  .connect-wrap{display:flex;align-items:center;justify-content:center;height:100%;background:#080E1C;}
  .connect-card{background:#0D1527;border:1px solid #1A2640;border-radius:12px;padding:36px;width:420px;}
  .connect-title{font-size:17px;font-weight:500;color:#D4C9B8;margin-bottom:6px;}
  .connect-sub{font-size:12px;color:#4A5E80;margin-bottom:24px;line-height:1.6;}
  .field{margin-bottom:14px;}
  .field label{display:block;font-size:10px;font-weight:500;color:#4A5E80;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;}
  input[type=text],input[type=password],textarea{width:100%;background:#060C1A;border:1px solid #1A2640;border-radius:6px;padding:8px 11px;color:#D4C9B8;font-size:12px;outline:none;}
  input[type=text]:focus,input[type=password]:focus,textarea:focus{border-color:#C9A84C40;box-shadow:0 0 0 2px #C9A84C20;}
  select{background:#060C1A;border:1px solid #1A2640;border-radius:6px;padding:7px 9px;color:#D4C9B8;font-size:12px;outline:none;}
  select:focus{border-color:#C9A84C40;}

  .row-actions{display:flex;gap:5px;flex-wrap:nowrap;}
  .empty{text-align:center;padding:40px;color:#3A4E6A;font-size:13px;}
  .spinner{display:inline-block;width:13px;height:13px;border:2px solid #2A3A5C;border-top-color:#C9A84C;border-radius:50%;animation:spin .7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}

  .toast{position:fixed;bottom:20px;right:20px;background:#0D1527;border:1px solid #2A3A5C;border-radius:8px;padding:10px 14px;font-size:12px;color:#D4C9B8;z-index:9999;animation:slideIn .2s ease;max-width:300px;}
  .toast.success{border-color:#1E4A30;color:#6DD89A;} .toast.error{border-color:#5A1E1E;color:#EF7070;}
  @keyframes slideIn{from{transform:translateY(6px);opacity:0}to{transform:translateY(0);opacity:1}}

  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .action-card{background:#0D1527;border:1px solid #1A2640;border-radius:8px;padding:18px;}
  .action-card-title{font-size:12.5px;font-weight:500;color:#D4C9B8;margin-bottom:4px;}
  .action-card-desc{font-size:11px;color:#4A5E80;margin-bottom:12px;line-height:1.5;}

  .pipeline-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #111E33;}
  .pipeline-row:last-child{border-bottom:none;}
  .pipeline-label{font-size:12px;color:#6A7E9B;}
  .pipeline-val{font-size:12px;font-weight:500;color:#D4C9B8;font-family:'DM Mono',monospace;}

  .prog-bar{height:3px;background:#1A2640;border-radius:2px;margin-top:5px;overflow:hidden;}
  .prog-fill{height:100%;background:#C9A84C;border-radius:2px;transition:width .3s;}

  .tabs{display:flex;gap:1px;background:#060C1A;border:1px solid #1A2640;border-radius:6px;padding:2px;}
  .tab{padding:4px 12px;border-radius:4px;font-size:11px;color:#4A5E80;cursor:pointer;border:none;background:none;transition:all .15s;white-space:nowrap;}
  .tab.active{background:#1A2640;color:#D4C9B8;}

  .card-section{background:#0D1527;border:1px solid #1A2640;border-radius:8px;padding:16px;margin-bottom:14px;}
  .card-section-title{font-size:11px;font-weight:600;color:#C9A84C;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;}

  .detail-modal{position:fixed;inset:0;background:#00000080;z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;}
  .detail-panel{background:#0D1527;border:1px solid #2A3A5C;border-radius:10px;width:100%;max-width:620px;max-height:80vh;overflow-y:auto;}
  .detail-panel-head{padding:16px 20px;border-bottom:1px solid #1A2640;display:flex;align-items:center;justify-content:space-between;}
  .detail-panel-body{padding:20px;}
  .dl{display:grid;grid-template-columns:140px 1fr;gap:8px 12px;font-size:12px;}
  .dl dt{color:#4A5E80;} .dl dd{color:#D4C9B8;}

  .stripe-field{margin-bottom:12px;}
  .stripe-field label{display:block;font-size:10px;font-weight:600;color:#4A5E80;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;}
`;

const NAV = [
  { group: "Platform" },
  { id:"overview",    label:"Overview",         icon:"⬡" },
  { id:"actions",     label:"Actions",          icon:"▶" },
  { group: "Marketplace" },
  { id:"inquiries",   label:"Inquiries",        icon:"✉", badgeKey:"inquiry_pending" },
  { id:"candidates",  label:"Candidates",       icon:"◈" },
  { id:"intake",      label:"Intake Queue",     icon:"↓", badgeKey:"intake_pending" },
  { id:"deal",        label:"Deal Board",       icon:"⇄" },
  { group: "Intelligence" },
  { id:"signals",     label:"Signals",          icon:"◉", badgeKey:"unreviewed_signals" },
  { id:"staging",     label:"Staging Queue",    icon:"□", badgeKey:"staging_pending" },
  { id:"intel",       label:"Intel / Agents",   icon:"◆" },
  { id:"agents",      label:"Agent Console",    icon:"⚙", href:"/admin/agents" },
  { group: "Clinical" },
  { id:"clinical",    label:"Clinical Home",    icon:"✚" },
  { id:"clinreview",  label:"Evidence Queue",   icon:"◎", href:"/admin/clinical-review" },
  { id:"claimmap",    label:"Claim Map",        icon:"▦", href:"/admin/clinical-review/claim-map" },
  { id:"genetics",    label:"Genetics Review",  icon:"🧬", href:"/admin/genetics/review" },
  { group: "Data" },
  { id:"sources",     label:"Sources",          icon:"○" },
  { id:"countries",   label:"Countries",        icon:"◎" },
  { group: "System" },
  { id:"users",       label:"Users",            icon:"◷" },
  { id:"feed",        label:"Public Feed",      icon:"⊕" },
  { id:"stripe",      label:"Stripe",           icon:"$" },
];

const PAGE_TITLES = {
  overview:"Overview", signals:"Signal Review", staging:"Staging Queue",
  sources:"Source Registry", countries:"Country Coverage", users:"Users",
  feed:"Public Feed", actions:"Actions & Triggers", inquiries:"Marketplace Inquiries",
  candidates:"Candidates", intake:"Intake Queue", deal:"Deal Board",
  intel:"Intelligence / Agents", stripe:"Stripe Setup",
  clinical:"Clinical Home", claimmap:"Claim Map", clinreview:"Evidence Queue",
  agents:"Agent Console", genetics:"Genetics Review",
};

/** Cannabis / medical-cannabis scope heuristic for operator hygiene (not clinical inference). */
SCOPE_RE = /cannab|cannabis|marijuana|thc|cbd|nabiximols|sativex|epidiolex|hemp|gacp|gmp.?cann|narcotic.?import|bfarm|health.?canada|tga|anvisa|mhra|medical.?cannabis|phytocannabinoid|eu.?gmp|gacp|btmg|narcotics.?act/i;
/** Consumer / SEO / retail noise — not commercial corridor intel */
const CONSUMER_SPAM_RE = /weedmaps|how to buy|order weed|buy weed|visitor'?s? guide|dispensary near|recreational tourism|delivery near me|strain review|best edibles|smoke shop|is weed legal in|is cannabis legal in|is marijuana legal in|business guide 20\d\d|cannabis laws? (in )?(cyprus|dominica|austria|malta|luxembourg)/i;
function inCannabisScope(text) {
  if (!text) return false;
  const t = String(text);
  if (CONSUMER_SPAM_RE.test(t)) return false;
  // Generic "is X legal" tourist SEO without regulatory agency context
  if (/\bis (weed|cannabis|marijuana) legal\b/i.test(t) && !/\b(bfarm|tga|anvisa|mhra|health canada|eu-?gmp|import permit|narcotic)\b/i.test(t)) {
    return false;
  }
  return SCOPE_RE.test(t);
}

function Pill({ type="gray", children }) {
  const map = { gold:"pill-gold",red:"pill-red",green:"pill-green",blue:"pill-blue",gray:"pill-gray",warn:"pill-warn",purple:"pill-purple" };
  return <span className={`pill ${map[type]||"pill-gray"}`}>{children}</span>;
}
function priPill(p) { return <Pill type={{URGENT:"red",HIGH:"warn",MONITOR:"gray",LOW:"gray"}[p]||"gray"}>{p||"—"}</Pill>; }
function lanePill(l) { return <Pill type={{Regulatory:"blue",Economic:"gold",Trade:"green"}[l]||"gray"}>{l||"—"}</Pill>; }

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return <div className={`toast ${msg.type}`}>{msg.text}</div>;
}

function Spinner({ size=20 }) {
  return <div className="spinner" style={{width:size,height:size,margin:"0 auto"}} />;
}

function truncate(s, n=65) { return s && s.length>n ? s.slice(0,n)+"…" : (s||"—"); }
function fmtDate(s) { return s ? new Date(s).toLocaleDateString("en-CA") : "—"; }
function fmtDt(s) { return s ? new Date(s).toLocaleString("en-CA",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"; }

// ─── OVERVIEW ──────────────────────────────────────────────────────────────────
function Overview({ api, stats, setStats }) {
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
function Inquiries({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("marketplace_inquiries",
        "select=id,created_at,inquiry_type,contact_company,contact_name,contact_email,contact_phone,status,message,review_status,priority,last_contacted_at,next_follow_up_at&order=created_at.desc&limit=300"
      );
      setRows(d);
    } catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  }, [filter]);

  useEffect(()=>{load();},[load]);

  const setReview = async (id, review_status) => {
    try {
      await api.patch("marketplace_inquiries",`id=eq.${id}`,{review_status});
      setRows(r=>r.map(x=>x.id===id?{...x,review_status}:x));
      toast({type:"success",text:`Marked ${review_status}`});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const typeLabel = {listing_submission:"Listing",wanted_request_submission:"Wanted",quote_routing:"Quote",quote_request:"Quote"};
  const priColor = {urgent:"red",high:"warn",medium:"gray",low:"gray"};
  const displayed = rows.filter(r=>{
    if(filter==="open") return r.review_status==="open"||r.review_status==="new";
    if(filter==="pending") return r.review_status==="pending_response";
    if(filter==="closed") return r.review_status==="closed";
    return true;
  });

  return (
    <>
      {detail && (
        <div className="detail-modal" onClick={()=>setDetail(null)}>
          <div className="detail-panel" onClick={e=>e.stopPropagation()}>
            <div className="detail-panel-head">
              <span style={{fontSize:13,fontWeight:500,color:"#D4C9B8"}}>{detail.contact_name} — {detail.contact_company||"no company"}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>setDetail(null)}>✕</button>
            </div>
            <div className="detail-panel-body">
              <dl className="dl">
                <dt>Email</dt><dd>{detail.contact_email}</dd>
                <dt>Phone</dt><dd>{detail.contact_phone||"—"}</dd>
                <dt>Type</dt><dd>{typeLabel[detail.inquiry_type]||detail.inquiry_type}</dd>
                <dt>Status</dt><dd>{detail.review_status}</dd>
                <dt>Priority</dt><dd>{detail.priority}</dd>
                <dt>Created</dt><dd>{fmtDt(detail.created_at)}</dd>
                <dt>Last contacted</dt><dd>{fmtDt(detail.last_contacted_at)}</dd>
                <dt>Follow up</dt><dd>{fmtDt(detail.next_follow_up_at)}</dd>
              </dl>
              <div style={{marginTop:14,padding:12,background:"#060C1A",borderRadius:6,fontSize:12,color:"#A0B0C8",lineHeight:1.6}}>{detail.message}</div>
              <div style={{marginTop:14,display:"flex",gap:8}}>
                <button className="btn btn-success btn-sm" onClick={()=>{setReview(detail.id,"closed");setDetail(null);}}>Close</button>
                <button className="btn btn-blue btn-sm" onClick={()=>{setReview(detail.id,"pending_response");setDetail(null);}}>Pending response</button>
                <button className="btn btn-danger btn-sm" onClick={()=>{setReview(detail.id,"rejected");setDetail(null);}}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="table-wrap">
        <div className="table-header">
          <div className="tabs">
            {[["all",`All (${rows.length})`],["open","Open"],["pending","Pending Response"],["closed","Closed"]].map(([v,l])=>(
              <button key={v} className={`tab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
        </div>
        {loading?<div className="empty"><Spinner/></div>:displayed.length===0?<div className="empty">No inquiries</div>:
        <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>Contact</th><th>Company</th><th>Type</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {displayed.map(r=>(
                <tr key={r.id} onClick={()=>setDetail(r)} style={{cursor:"pointer"}}>
                  <td><span className="cell-primary">{r.contact_name}</span><br/><span style={{fontSize:10,color:"#4A5E80"}}>{r.contact_email}</span></td>
                  <td><span style={{fontSize:11,color:"#A0B0C8"}}>{r.contact_company||"—"}</span></td>
                  <td><Pill type="blue">{typeLabel[r.inquiry_type]||r.inquiry_type}</Pill></td>
                  <td><Pill type={priColor[r.priority]||"gray"}>{r.priority||"—"}</Pill></td>
                  <td>
                    {{new:"pill-gold",open:"pill-warn",pending_response:"pill-blue",closed:"pill-gray",rejected:"pill-red"}[r.review_status]
                      ? <Pill type={{new:"gold",open:"warn",pending_response:"blue",closed:"gray",rejected:"red"}[r.review_status]}>{r.review_status}</Pill>
                      : <Pill>{r.review_status}</Pill>}
                  </td>
                  <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="btn btn-success btn-sm" onClick={()=>setReview(r.id,"closed")}>✓</button>
                      <button className="btn btn-blue btn-sm" onClick={()=>setDetail(r)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>
    </>
  );
}

// ─── CANDIDATES ──────────────────────────────
function Candidates({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("needs_review");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("marketplace_candidates",
        "select=id,created_at,candidate_type,status,title,country,region,source_id,discovered_at,review_notes&order=discovered_at.desc&limit=300"
      );
      setRows(d);
    } catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  }, []);

  useEffect(()=>{load();},[load]);

  const setStatus = async (id, status) => {
    try {
      await api.patch("marketplace_candidates",`id=eq.${id}`,{status});
      setRows(r=>r.map(x=>x.id===id?{...x,status}:x));
      toast({type:"success",text:`Candidate ${status}`});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const displayed = rows.filter(r=> filter==="all" ? true : r.status===filter);
  const counts = rows.reduce((a,r)=>{a[r.status]=(a[r.status]||0)+1;return a;},{});
  const statPill = s=>({approved:<Pill type="green">Approved</Pill>,rejected:<Pill type="red">Rejected</Pill>,needs_review:<Pill type="warn">Needs Review</Pill>,draft:<Pill type="gray">Draft</Pill>}[s]||<Pill>{s}</Pill>);

  return (
    <div className="table-wrap">
      <div className="table-header">
        <div className="tabs">
          {[["needs_review",`Review (${counts.needs_review||0})`],["approved","Approved"],["draft","Draft"],["all",`All (${rows.length})`]].map(([v,l])=>(
            <button key={v} className={`tab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
      </div>
      {loading?<div className="empty"><Spinner/></div>:displayed.length===0?<div className="empty">No candidates</div>:
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Country</th><th>Status</th><th>Discovered</th><th>Actions</th></tr></thead>
          <tbody>
            {displayed.map(r=>(
              <tr key={r.id}>
                <td><span className="cell-primary">{truncate(r.title||r.id,55)}</span></td>
                <td><Pill type="blue">{r.candidate_type}</Pill></td>
                <td><span className="cell-mono">{r.country||r.region||"—"}</span></td>
                <td>{statPill(r.status)}</td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.discovered_at||r.created_at)}</span></td>
                <td>
                  {r.status==="needs_review"&&(
                    <div className="row-actions">
                      <button className="btn btn-success btn-sm" onClick={()=>setStatus(r.id,"approved")}>✓</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>setStatus(r.id,"rejected")}>✕</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

// ─── INTAKE QUEUE ──────────────────────────────────────────────────────────────
function Intake({ api, toast }) {
  const [cands, setCands] = useState([]);
  const [inqs, setInqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("candidates");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, i] = await Promise.all([
        api.get("marketplace_candidates", "select=id,created_at,candidate_type,status,title,country&candidate_type=eq.intake_form&status=eq.needs_review&order=created_at.desc&limit=100").catch(()=>[]),
        api.get("marketplace_inquiries", "select=id,created_at,inquiry_type,contact_name,contact_email,contact_company,review_status,priority&listing_id=is.null&order=created_at.desc&limit=200").catch(()=>[]),
      ]);
      setCands(c); setInqs(i);
    } catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const approveCandidate = async (id) => {
    await api.patch("marketplace_candidates",`id=eq.${id}`,{status:"approved"}).catch(e=>toast({type:"error",text:e.message}));
    setCands(c=>c.filter(x=>x.id!==id));
    toast({type:"success",text:"Candidate approved"});
  };

  return (
    <>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <div className="tabs">
          <button className={`tab ${tab==="candidates"?"active":""}`} onClick={()=>setTab("candidates")}>Intake Submissions ({cands.length})</button>
          <button className={`tab ${tab==="inquiries"?"active":""}`} onClick={()=>setTab("inquiries")}>Unmatched Inquiries ({inqs.length})</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
      </div>

      {loading?<div className="empty"><Spinner/></div>:tab==="candidates"?(
        <div className="table-wrap">
          {cands.length===0?<div className="empty">Intake queue clear ✓</div>:
          <table>
            <thead><tr><th>Title</th><th>Country</th><th>Type</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {cands.map(r=>(
                <tr key={r.id}>
                  <td><span className="cell-primary">{truncate(r.title||r.id,55)}</span></td>
                  <td><span className="cell-mono">{r.country||"—"}</span></td>
                  <td><Pill type="blue">{r.candidate_type}</Pill></td>
                  <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-success btn-sm" onClick={()=>approveCandidate(r.id)}>✓ Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      ):(
        <div className="table-wrap">
          {inqs.length===0?<div className="empty">No unmatched inquiries</div>:
          <table>
            <thead><tr><th>Contact</th><th>Company</th><th>Type</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {inqs.map(r=>(
                <tr key={r.id}>
                  <td><span className="cell-primary">{r.contact_name}</span><br/><span style={{fontSize:10,color:"#4A5E80"}}>{r.contact_email}</span></td>
                  <td><span style={{fontSize:11,color:"#A0B0C8"}}>{r.contact_company||"—"}</span></td>
                  <td><Pill type="blue">{r.inquiry_type}</Pill></td>
                  <td><Pill type={{urgent:"red",high:"warn",medium:"gray",low:"gray"}[r.priority]||"gray"}>{r.priority}</Pill></td>
                  <td><Pill type={{new:"gold",open:"warn",closed:"gray"}[r.review_status]||"gray"}>{r.review_status}</Pill></td>
                  <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      )}
    </>
  );
}

// ─── DEAL BOARD ────────────────────────────────────────────────────────────────
function DealBoard({ api, toast }) {
  const [matches, setMatches] = useState([]);
  const [dealRooms, setDealRooms] = useState([]);
  const [records, setRecords] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("matches");
  const [promoting, setPromoting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, dr, r, e] = await Promise.all([
        api.get("matches","select=id,status,listing_id,buyer_request_id,internal_notes,created_at&order=created_at.desc&limit=200").catch(()=>[]),
        api.get("deal_rooms","select=id,title,status,nda_required,created_at&order=created_at.desc&limit=100").catch(()=>[]),
        api.get("genetics_routing_records","select=*&order=created_at.desc&limit=200").catch(()=>[]),
        api.get("genetics_routing_events","select=*&order=created_at.desc&limit=200").catch(()=>[]),
      ]);
      setMatches(m); setDealRooms(dr); setRecords(r); setEvents(e);
    } catch(e2) { toast({type:"error",text:e2.message}); }
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const promote = useCallback(async (matchId) => {
    setPromoting(matchId);
    try {
      const res = await fetch(`/api/admin/marketplace/matches/${matchId}/promote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})});
      const d = await res.json();
      if(!res.ok || !d.ok) { toast({type:"error",text:d.error||"Promote failed"}); }
      else { toast({type:"success",text:`Deal room created: ${d.deal_room_id?.slice(0,8)}…`}); load(); }
    } catch(err) { toast({type:"error",text:err.message}); }
    setPromoting(null);
  },[load, toast]);

  const stPill = s=><Pill type={{
    new_request:"gray", needs_qualification:"warn", needs_buyer_permission:"warn",
    needs_holder_permission:"warn", ready_for_intro:"gold", introduced:"blue",
    declined:"red", archived:"gray",
  }[s]||"gray"}>{(s||"—").replace(/_/g," ")}</Pill>;

  const mPill = s=><Pill type={{proposed:"warn",deal_room_created:"green",rejected:"red",expired:"gray"}[s]||"gray"}>{(s||"—").replace(/_/g," ")}</Pill>;

  if(loading) return <div className="empty"><Spinner size={24}/></div>;

  return (
    <>
      <div className="kpi-grid" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
        {[
          {val:matches.length,label:"Total Matches"},
          {val:matches.filter(m=>m.status==="proposed").length,label:"Proposed",cls:"warn"},
          {val:dealRooms.length,label:"Deal Rooms",cls:"success"},
          {val:records.length,label:"Genetics Records"},
          {val:records.filter(r=>r.status==="ready_for_intro").length,label:"Ready for Intro",cls:"success"},
        ].map(k=>(
          <div className="kpi" key={k.label}>
            <div className={`kpi-val ${k.cls||""}`}>{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
        <div className="tabs">
          <button className={`tab ${tab==="matches"?"active":""}`} onClick={()=>setTab("matches")}>Matches ({matches.length})</button>
          <button className={`tab ${tab==="deal_rooms"?"active":""}`} onClick={()=>setTab("deal_rooms")}>Deal Rooms ({dealRooms.length})</button>
          <button className={`tab ${tab==="genetics"?"active":""}`} onClick={()=>setTab("genetics")}>Genetics ({records.length})</button>
          <button className={`tab ${tab==="events"?"active":""}`} onClick={()=>setTab("events")}>Events ({events.length})</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
      </div>

      {tab==="matches"&&(
        <div className="table-wrap">
          {matches.length===0?<div className="empty">No matches yet</div>:
          <div style={{overflowX:"auto"}}><table>
            <thead><tr><th>ID</th><th>Listing</th><th>Buyer Request</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
            <tbody>{matches.map(m=>(
              <tr key={m.id}>
                <td><span className="cell-mono">{m.id?.slice(0,8)}…</span></td>
                <td><span style={{fontSize:11,color:"#A0B0C8"}}>{truncate(m.listing_id||"—",28)}</span></td>
                <td><span style={{fontSize:11,color:"#A0B0C8"}}>{truncate(m.buyer_request_id||"—",28)}</span></td>
                <td>{mPill(m.status)}</td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(m.created_at)}</span></td>
                <td>
                  {m.status==="proposed"&&(
                    <button
                      className="btn btn-sm btn-primary"
                      style={{fontSize:10,padding:"2px 8px"}}
                      disabled={promoting===m.id}
                      onClick={()=>promote(m.id)}
                    >
                      {promoting===m.id?"…":"Create deal room"}
                    </button>
                  )}
                  {m.status==="deal_room_created"&&<span style={{fontSize:11,color:"#3DA86E"}}>✓ Room open</span>}
                </td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>
      )}

      {tab==="deal_rooms"&&(
        <div className="table-wrap">
          {dealRooms.length===0?<div className="empty">No deal rooms yet — promote a proposed match to create the first one</div>:
          <div style={{overflowX:"auto"}}><table>
            <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>NDA</th><th>Created</th></tr></thead>
            <tbody>{dealRooms.map(d=>(
              <tr key={d.id}>
                <td><span className="cell-mono">{d.id?.slice(0,8)}…</span></td>
                <td><span style={{fontSize:12,color:"#D4C9B8"}}>{truncate(d.title||"—",40)}</span></td>
                <td><Pill type={{open:"green",closed:"gray",paused:"warn"}[d.status]||"gray"}>{d.status||"—"}</Pill></td>
                <td><span style={{fontSize:11,color:d.nda_required?"#C6A55A":"#4A5E80"}}>{d.nda_required?"Required":"Not required"}</span></td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(d.created_at)}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>
      )}

      {tab==="genetics"&&(
        <div className="table-wrap">
          {records.length===0?<div className="empty">No routing records</div>:
          <div style={{overflowX:"auto"}}><table>
            <thead><tr><th>ID</th><th>Requester</th><th>Profile / Drop</th><th>Intent → Market</th><th>Status</th><th>Score</th><th>Created</th></tr></thead>
            <tbody>{records.map(r=>(
              <tr key={r.id}>
                <td><span className="cell-mono">{r.id?.slice(0,8)}…</span></td>
                <td>
                  <span style={{fontSize:12,color:"#D4C9B8"}}>{truncate(r.requester_company||"—",25)}</span><br/>
                  <span style={{fontSize:10,color:"#4A5E80"}}>{r.requester_email||"—"}</span>
                </td>
                <td><span style={{fontSize:12,color:"#A0B0C8"}}>{truncate(`${r.profile_slug||"—"} / ${r.drop_id||"—"}`,30)}</span></td>
                <td><span style={{fontSize:11,color:"#6A7E9B"}}>{truncate(`${r.intent||"—"} → ${r.target_market||"—"}`,30)}</span></td>
                <td>{stPill(r.status)}</td>
                <td><span className="cell-mono">{r.score ?? "—"}{r.score_band?` (${r.score_band})`:""}</span></td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>
      )}

      {tab==="events"&&(
        <div className="table-wrap">
          {events.length===0?<div className="empty">No events logged</div>:
          <div style={{overflowX:"auto"}}><table>
            <thead><tr><th>Record</th><th>Event</th><th>Summary</th><th>Actor</th><th>Date</th></tr></thead>
            <tbody>{events.map(e=>(
              <tr key={e.id}>
                <td><span className="cell-mono">{e.routing_record_id?.slice(0,8)||"—"}…</span></td>
                <td><Pill type="blue">{(e.event_type||"—").replace(/_/g," ")}</Pill></td>
                <td><span style={{fontSize:11,color:"#A0B0C8"}}>{truncate(e.event_summary||"—",40)}</span></td>
                <td><span style={{fontSize:11,color:"#6A7E9B"}}>{e.actor||"system"}</span></td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDt(e.created_at)}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>
      )}
    </>
  );
}

// ─── SIGNALS ────────────────────────────────────────────────────────────
function Signals({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unreviewed");
  const [lane, setLane] = useState("all");
  const [scopeMode, setScopeMode] = useState("in_scope"); // all | in_scope | oos
  const [selected, setSelected] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const parts = [
        "select=id,date,headline,source,country,pri,score,top_lane,reviewed,action,created_at",
        "order=created_at.desc","limit=200",
        filter==="unreviewed"?"reviewed=is.false":filter==="reviewed"?"reviewed=is.true":null,
        filter==="urgent"?"pri=eq.URGENT":null,
        lane!=="all"?`top_lane=eq.${lane}`:null,
      ].filter(Boolean).join("&");
      setRows(await api.get("signals",parts));
    } catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  },[filter,lane]);

  useEffect(()=>{load();},[load]);

  const setAction = async (id,reviewed,action) => {
    try {
      await api.patch("signals",`id=eq.${id}`,{reviewed,action});
      setRows(r=>r.map(s=>s.id===id?{...s,reviewed,action}:s));
      toast({type:"success",text:`Signal ${action}`});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const bulkApprove = async () => {
    const ids=[...selected];
    for(const id of ids) await api.patch("signals",`id=eq.${id}`,{reviewed:true,action:"approved"}).catch(()=>{});
    setRows(r=>r.map(s=>selected.has(s.id)?{...s,reviewed:true,action:"approved"}:s));
    setSelected(new Set());
    toast({type:"success",text:`${ids.length} approved`});
  };

  const toggle=(id)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const visible = rows.filter(s=>{
    const ok = inCannabisScope(s.headline);
    if (scopeMode==="in_scope") return ok;
    if (scopeMode==="oos") return !ok;
    return true;
  });
  const oosCount = rows.filter(s=>!inCannabisScope(s.headline)).length;
  const selAll=()=>setSelected(new Set(visible.filter(r=>!r.reviewed).map(r=>r.id)));
  const bulkRejectOos = async () => {
    const oos = rows.filter(s=>!s.reviewed && !inCannabisScope(s.headline));
    for (const s of oos) await api.patch("signals",`id=eq.${s.id}`,{reviewed:true,action:"rejected"}).catch(()=>{});
    setRows(r=>r.map(s=>!s.reviewed && !inCannabisScope(s.headline)?{...s,reviewed:true,action:"rejected"}:s));
    toast({type:"success",text:`Rejected ${oos.length} out-of-scope signals`});
  };

  return (
    <div className="table-wrap">
      <div className="table-header">
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <div className="tabs">
            {[["unreviewed","Unreviewed"],["urgent","Urgent"],["all","All"],["reviewed","Reviewed"]].map(([v,l])=>(
              <button key={v} className={`tab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</button>
            ))}
          </div>
          <select value={lane} onChange={e=>setLane(e.target.value)}>
            <option value="all">All Lanes</option>
            <option value="Regulatory">Regulatory</option>
            <option value="Economic">Economic</option>
            <option value="Trade">Trade</option>
          </select>
          <select value={scopeMode} onChange={e=>setScopeMode(e.target.value)} title="Cannabis / medical-cannabis scope filter">
            <option value="all">All scope</option>
            <option value="in_scope">In scope</option>
            <option value="oos">Out of scope</option>
          </select>
          {oosCount>0&&<span style={{fontSize:11,color:"#C9A84C"}}>{oosCount} possible OOS in view</span>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {selected.size>0&&<button className="btn btn-success btn-sm" onClick={bulkApprove}>✓ Approve {selected.size}</button>}
          {oosCount>0&&filter==="unreviewed"&&<button className="btn btn-danger btn-sm" onClick={bulkRejectOos}>✕ Reject OOS ({oosCount})</button>}
          <button className="btn btn-ghost btn-sm" onClick={selAll}>Select Unreviewed</button>
          <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
        </div>
      </div>
      {loading?<div className="empty"><Spinner/></div>:visible.length===0?<div className="empty">No signals</div>:
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr>
            <th style={{width:28}}></th><th>Headline</th><th>Scope</th><th>Country</th><th>Lane</th><th>Pri</th><th>Score</th><th>Date</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {visible.map(s=>(
              <tr key={s.id}>
                <td><input type="checkbox" checked={selected.has(s.id)} onChange={()=>toggle(s.id)} style={{accentColor:"#C9A84C"}}/></td>
                <td><span className="cell-primary">{truncate(s.headline,60)}</span></td>
                <td>{inCannabisScope(s.headline)?<Pill type="green">in</Pill>:<Pill type="warn">OOS?</Pill>}</td>
                <td><span className="cell-mono">{s.country||"—"}</span></td>
                <td>{lanePill(s.top_lane)}</td>
                <td>{priPill(s.pri)}</td>
                <td><span className="cell-mono">{s.score}</span></td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(s.date)}</span></td>
                <td>
                  {!s.reviewed?<Pill type="gray">Pending</Pill>
                    :s.action==="approved"?<Pill type="green">Approved</Pill>
                    :<Pill type="red">Rejected</Pill>}
                </td>
                <td>
                  {!s.reviewed?(
                    <div className="row-actions">
                      <button className="btn btn-success btn-sm" onClick={()=>setAction(s.id,true,"approved")}>✓</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>setAction(s.id,true,"rejected")}>✕</button>
                    </div>
                  ):<span style={{fontSize:11,color:"#3A4E6A"}}>{s.action}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

// ─── STAGING ────────────────────────────────────────────────────────────
function Staging({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopeMode, setScopeMode] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.get("hv_import_staging","select=id,proposed_title,proposed_country_iso,source_system,status,created_at&order=created_at.desc&limit=200"));
    } catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const update = async (id,status) => {
    try {
      await api.patch("hv_import_staging",`id=eq.${id}`,{status});
      setRows(r=>r.map(s=>s.id===id?{...s,status}:s));
      toast({type:"success",text:`Item ${status}`});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const bulkApprove = async () => {
    const pending=rows.filter(r=>r.status==="pending" && inCannabisScope(r.proposed_title));
    for(const r of pending) await api.patch("hv_import_staging",`id=eq.${r.id}`,{status:"approved"}).catch(()=>{});
    setRows(r=>r.map(s=>s.status==="pending"&&inCannabisScope(s.proposed_title)?{...s,status:"approved"}:s));
    toast({type:"success",text:`${pending.length} in-scope approved (OOS skipped)`});
  };

  const bulkRejectOos = async () => {
    const oos=rows.filter(r=>r.status==="pending" && !inCannabisScope(r.proposed_title));
    for(const r of oos) await api.patch("hv_import_staging",`id=eq.${r.id}`,{status:"rejected"}).catch(()=>{});
    setRows(r=>r.map(s=>s.status==="pending"&&!inCannabisScope(s.proposed_title)?{...s,status:"rejected"}:s));
    toast({type:"success",text:`Rejected ${oos.length} out-of-scope staging items`});
  };

  const visible = rows.filter(r=>{
    const ok = inCannabisScope(r.proposed_title);
    if (scopeMode==="in_scope") return ok;
    if (scopeMode==="oos") return !ok;
    return true;
  });
  const oosPending = rows.filter(r=>r.status==="pending" && !inCannabisScope(r.proposed_title)).length;

  return (
    <div className="table-wrap">
      <div className="table-header">
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span className="section-title">Import Staging ({rows.filter(r=>r.status==="pending").length} pending)</span>
          <select value={scopeMode} onChange={e=>setScopeMode(e.target.value)}>
            <option value="all">All scope</option>
            <option value="in_scope">In scope</option>
            <option value="oos">Out of scope</option>
          </select>
          {oosPending>0&&<span style={{fontSize:11,color:"#C9A84C"}}>{oosPending} OOS pending</span>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button className="btn btn-success btn-sm" onClick={bulkApprove}>✓ Approve in-scope pending</button>
          {oosPending>0&&<button className="btn btn-danger btn-sm" onClick={bulkRejectOos}>✕ Reject OOS ({oosPending})</button>}
          <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
        </div>
      </div>
      {loading?<div className="empty"><Spinner/></div>:visible.length===0?<div className="empty">Queue empty ✓</div>:
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th>Title</th><th>Scope</th><th>ISO</th><th>Source</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {visible.map(r=>(
              <tr key={r.id}>
                <td><span className="cell-primary">{truncate(r.proposed_title,55)}</span></td>
                <td>{inCannabisScope(r.proposed_title)?<Pill type="green">in</Pill>:<Pill type="warn">OOS?</Pill>}</td>
                <td><span className="cell-mono">{r.proposed_country_iso||"—"}</span></td>
                <td><span style={{fontSize:11,color:"#6A7E9B"}}>{r.source_system}</span></td>
                <td><Pill type={{pending:"warn",approved:"green",rejected:"red",promoted:"blue"}[r.status]||"gray"}>{r.status}</Pill></td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
                <td>
                  {r.status==="pending"&&(
                    <div className="row-actions">
                      <button className="btn btn-success btn-sm" onClick={()=>update(r.id,"approved")}>✓</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>update(r.id,"rejected")}>✕</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

// ─── INTEL / AGENTS ───────────────────────────────────────────────────
function Intel({ api, toast }) {
  const [signals, setSignals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("signals");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, src] = await Promise.all([
        api.get("ia_signals","select=id,created_at,summary,stage,impact,market_context&order=created_at.desc&limit=200").catch(()=>[]),
        api.get("ia_agent_tasks","select=id,created_at,task_type,status,priority,outcome,assigned_to&order=created_at.desc&limit=200").catch(()=>[]),
        api.get("ia_sources","select=id,name,category,status,reliability,last_checked,signal_yield&order=name.asc&limit=200").catch(()=>[]),
      ]);
      setSignals(s); setTasks(t); setSources(src);
    } catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const advanceTask = async (id, status) => {
    try {
      await api.patch("ia_agent_tasks",`id=eq.${id}`,{status});
      setTasks(t=>t.map(x=>x.id===id?{...x,status}:x));
      toast({type:"success",text:`Task → ${status}`});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const advanceSignal = async (id, stage) => {
    try {
      await api.patch("ia_signals",`id=eq.${id}`,{stage});
      setSignals(s=>s.map(x=>x.id===id?{...x,stage}:x));
      toast({type:"success",text:`Signal → ${stage}`});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const stagePill = s=>({new:<Pill type="blue">New</Pill>,needs_review:<Pill type="warn">Needs Review</Pill>,qualified:<Pill type="green">Qualified</Pill>,converted_to_opportunity:<Pill type="purple">Converted</Pill>,archived:<Pill type="gray">Archived</Pill>}[s]||<Pill>{s}</Pill>);
  const taskPill = s=>({pending:<Pill type="gray">Pending</Pill>,in_progress:<Pill type="blue">In Progress</Pill>,completed:<Pill type="green">Completed</Pill>,escalated:<Pill type="red">Escalated</Pill>}[s]||<Pill>{s}</Pill>);

  if(loading) return <div className="empty"><Spinner size={24}/></div>;

  return (
    <>
      <div className="kpi-grid" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
        {[
          {val:signals.length,label:"IA Signals"},
          {val:signals.filter(s=>s.stage==="needs_review"||s.stage==="new").length,label:"Needs Review",cls:"warn"},
          {val:signals.filter(s=>s.stage==="qualified").length,label:"Qualified",cls:"success"},
          {val:tasks.filter(t=>t.status==="pending").length,label:"Tasks Pending",cls:tasks.filter(t=>t.status==="pending").length>0?"warn":""},
          {val:tasks.filter(t=>t.priority==="urgent").length,label:"Urgent Tasks",cls:tasks.filter(t=>t.priority==="urgent").length>0?"danger":""},
        ].map(k=>(<div className="kpi" key={k.label}><div className={`kpi-val ${k.cls||""}`}>{k.val}</div><div className="kpi-label">{k.label}</div></div>))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"center"}}>
        <div className="tabs">
          <button className={`tab ${tab==="signals"?"active":""}`} onClick={()=>setTab("signals")}>Signals ({signals.length})</button>
          <button className={`tab ${tab==="tasks"?"active":""}`} onClick={()=>setTab("tasks")}>Tasks ({tasks.filter(t=>["pending","in_progress"].includes(t.status)).length})</button>
          <button className={`tab ${tab==="sources"?"active":""}`} onClick={()=>setTab("sources")}>IA Sources ({sources.length})</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
      </div>
      {tab==="signals"&&<div className="table-wrap">{signals.length===0?<div className="empty">No IA signals</div>:<div style={{overflowX:"auto"}}><table><thead><tr><th>Summary</th><th>Stage</th><th>Impact</th><th>Market</th><th>Created</th><th>Actions</th></tr></thead><tbody>{signals.map(s=>(<tr key={s.id}><td><span className="cell-primary">{truncate(s.summary,55)}</span></td><td>{stagePill(s.stage)}</td><td><Pill type={{high:"green",medium:"warn",low:"gray"}[s.impact]||"gray"}>{s.impact||"—"}</Pill></td><td><span style={{fontSize:11,color:"#6A7E9B"}}>{truncate(s.market_context,30)}</span></td><td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(s.created_at)}</span></td><td>{(s.stage==="new"||s.stage==="needs_review")&&<div className="row-actions"><button className="btn btn-success btn-sm" onClick={()=>advanceSignal(s.id,"qualified")}>Qualify</button><button className="btn btn-danger btn-sm" onClick={()=>advanceSignal(s.id,"archived")}>Archive</button></div>}</td></tr>))}</tbody></table></div>}</div>}
      {tab==="tasks"&&<div className="table-wrap">{tasks.length===0?<div className="empty">No tasks</div>:<div style={{overflowX:"auto"}}><table><thead><tr><th>Type</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Created</th><th>Actions</th></tr></thead><tbody>{tasks.map(t=>(<tr key={t.id}><td><span className="cell-primary">{t.task_type||"—"}</span></td><td>{taskPill(t.status)}</td><td><Pill type={{urgent:"red",high:"warn",medium:"gray",low:"gray"}[t.priority]||"gray"}>{t.priority}</Pill></td><td><span style={{fontSize:11,color:"#6A7E9B"}}>{t.assigned_to||"—"}</span></td><td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(t.created_at)}</span></td><td>{t.status==="pending"&&<button className="btn btn-blue btn-sm" onClick={()=>advanceTask(t.id,"in_progress")}>Start</button>}{t.status==="in_progress"&&<button className="btn btn-success btn-sm" onClick={()=>advanceTask(t.id,"completed")}>Complete</button>}</td></tr>))}</tbody></table></div>}</div>}
      {tab==="sources"&&<div className="table-wrap">{sources.length===0?<div className="empty">No IA sources</div>:<div style={{overflowX:"auto"}}><table><thead><tr><th>Name</th><th>Category</th><th>Status</th><th>Reliability</th><th>Yield</th><th>Last Checked</th></tr></thead><tbody>{sources.map(s=>(<tr key={s.id}><td><span className="cell-primary">{s.name}</span></td><td><Pill type="blue">{s.category}</Pill></td><td><Pill type={{active:"green",needs_review:"warn",inactive:"gray"}[s.status]||"gray"}>{s.status}</Pill></td><td><Pill type={{verified:"green",unverified:"warn",flagged:"red"}[s.reliability]||"gray"}>{s.reliability||"—"}</Pill></td><td><span className="cell-mono">{s.signal_yield??""}</span></td><td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(s.last_checked)}</span></td></tr>))}</tbody></table></div>}</div>}
    </>
  );
}

// ─── SOURCES ─────────────────────────────────────────────────────────
function Sources({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.get("source_registry","select=id,source_name,source_url,country,region,tier,is_active,requires_translation,source_type&order=tier.asc,source_name.asc&limit=500")); }
    catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const toggle = async (id,val) => {
    try {
      await api.patch("source_registry",`id=eq.${id}`,{is_active:val});
      setRows(r=>r.map(s=>s.id===id?{...s,is_active:val}:s));
      toast({type:"success",text:val?"Activated":"Deactivated"});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const displayed = rows.filter(r=>{
    if(filter==="active") return r.is_active;
    if(filter==="inactive") return !r.is_active;
    if(filter==="no-region") return !r.region;
    if(filter==="translation") return r.requires_translation;
    return true;
  });

  return (
    <div className="table-wrap">
      <div className="table-header">
        <div className="tabs">
          {[["all",`All (${rows.length})`],["active","Active"],["inactive","Inactive"],["no-region","No Region"],["translation","Needs Translation"]].map(([v,l])=>(<button key={v} className={`tab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</button>))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
      </div>
      {loading?<div className="empty"><Spinner/></div>:<div style={{overflowX:"auto"}}><table>
        <thead><tr><th>Name</th><th>Country</th><th>Tier</th><th>Type</th><th>Status</th><th>Flags</th><th>Toggle</th></tr></thead>
        <tbody>{displayed.map(s=>(<tr key={s.id}>
          <td><a href={s.source_url} target="_blank" rel="noopener" style={{color:"#D4C9B8",textDecoration:"none",fontWeight:500,fontSize:12}}>{truncate(s.source_name,45)} ↗</a></td>
          <td><span className="cell-mono">{s.country||"—"}</span></td>
          <td><span className="cell-mono">{s.tier}</span></td>
          <td><span style={{fontSize:11,color:"#6A7E9B"}}>{s.source_type||"—"}</span></td>
          <td>{s.is_active?<Pill type="green">Active</Pill>:<Pill type="gray">Off</Pill>}</td>
          <td>{s.requires_translation&&<Pill type="blue">Translate</Pill>}</td>
          <td><button className={`btn btn-sm ${s.is_active?"btn-danger":"btn-success"}`} onClick={()=>toggle(s.id,!s.is_active)}>{s.is_active?"Disable":"Enable"}</button></td>
        </tr>))}</tbody>
      </table></div>}
    </div>
  );
}

// ─── COUNTRIES ───────────────────────────────────────────────────────
function Countries({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.get("countries","select=id,country_name,iso_alpha2,region,data_completeness,market_access_status,medical_status,opportunity_score&order=region.asc,country_name.asc&limit=300")); }
    catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const saveEdit = async (id) => {
    try {
      await api.patch("countries",`id=eq.${id}`,editVal);
      setRows(r=>r.map(c=>c.id===id?{...c,...editVal}:c));
      setEditing(null);
      toast({type:"success",text:"Country updated"});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const statusOpts=["unknown","open","active","regulated","emerging","limited","restricted","review-required"];
  const displayed=rows.filter(r=>filter==="all"?true:r.data_completeness===filter);
  const compPill=v=>({full:<Pill type="green">Full</Pill>,partial:<Pill type="warn">Partial</Pill>,stub:<Pill type="gray">Stub</Pill>}[v]||<Pill>{v}</Pill>);

  return (
    <div className="table-wrap">
      <div className="table-header">
        <div className="tabs">
          {[["all",`All (${rows.length})`],["stub","Stub"],["partial","Partial"],["full","Full"]].map(([v,l])=>(<button key={v} className={`tab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</button>))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
      </div>
      <div style={{overflowX:"auto"}}><table>
        <thead><tr><th>Country</th><th>ISO</th><th>Region</th><th>Data</th><th>Market Access</th><th>Medical</th><th>Score</th><th>Edit</th></tr></thead>
        <tbody>{displayed.map(c=>(<tr key={c.id}>
          <td><span className="cell-primary">{c.country_name}</span></td>
          <td><span className="cell-mono">{c.iso_alpha2}</span></td>
          <td><span style={{fontSize:11,color:"#6A7E9B"}}>{c.region||"—"}</span></td>
          <td>{compPill(c.data_completeness)}</td>
          <td>{editing===c.id?<select value={editVal.market_access_status} onChange={e=>setEditVal(v=>({...v,market_access_status:e.target.value}))}>{statusOpts.map(o=><option key={o}>{o}</option>)}</select>:<span style={{fontSize:11,color:"#A0B0C8"}}>{c.market_access_status}</span>}</td>
          <td>{editing===c.id?<select value={editVal.medical_status} onChange={e=>setEditVal(v=>({...v,medical_status:e.target.value}))}>{statusOpts.map(o=><option key={o}>{o}</option>)}</select>:<span style={{fontSize:11,color:"#A0B0C8"}}>{c.medical_status}</span>}</td>
          <td><span className="cell-mono">{c.opportunity_score}</span></td>
          <td>{editing===c.id?<div className="row-actions"><button className="btn btn-gold btn-sm" onClick={()=>saveEdit(c.id)}>Save</button><button className="btn btn-ghost btn-sm" onClick={()=>setEditing(null)}>✕</button></div>:<button className="btn btn-ghost btn-sm" onClick={()=>{setEditing(c.id);setEditVal({market_access_status:c.market_access_status,medical_status:c.medical_status});}}>Edit</button>}</td>
        </tr>))}</tbody>
      </table></div>
    </div>
  );
}

// ─── USERS ───────────────────────────────────────────────────────────
function Users({ api, toast }) {
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{(async()=>{try{const [p,r]=await Promise.all([api.get("user_profiles","select=id,email,created_at,tier&order=created_at.asc"),api.get("user_roles","select=id,role_name,description").catch(()=>[])]);setProfiles(p);setRoles(r);}catch(e){toast({type:"error",text:e.message});}setLoading(false);})();},[]);
  if(loading) return <div className="empty"><Spinner/></div>;
  return (<><div className="table-wrap" style={{marginBottom:12}}><div className="table-header"><span className="section-title">Profiles ({profiles.length})</span></div>{profiles.length===0?<div className="empty">No profiles</div>:<table><thead><tr><th>ID</th><th>Email</th><th>Tier</th><th>Joined</th></tr></thead><tbody>{profiles.map(u=>(<tr key={u.id}><td><span className="cell-mono">{u.id?.slice(0,8)}…</span></td><td><span className="cell-primary">{u.email||"—"}</span></td><td>{u.tier?<Pill type="gold">{u.tier}</Pill>:<Pill type="gray">none</Pill>}</td><td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(u.created_at)}</span></td></tr>))}</tbody></table>}</div>{roles.length>0&&<div className="table-wrap"><div className="table-header"><span className="section-title">Roles ({roles.length})</span></div><table><thead><tr><th>Role</th><th>Description</th></tr></thead><tbody>{roles.map(r=><tr key={r.id}><td><Pill type="blue">{r.role_name}</Pill></td><td><span style={{fontSize:11,color:"#6A7E9B"}}>{r.description}</span></td></tr>)}</tbody></table></div>}</>);
}

// ─── FEED ───────────────────────────────────────────────────────────
function Feed({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async()=>{setLoading(true);try{setRows(await api.get("hv_public_feed","select=*&order=created_at.desc&limit=200"));}catch(e){toast({type:"error",text:e.message});}setLoading(false);},[]);
  useEffect(()=>{load();},[load]);
  return (<div className="table-wrap"><div className="table-header"><span className="section-title">Public Feed ({rows.length})</span><button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button></div>{loading?<div className="empty"><Spinner/></div>:rows.length===0?<div className="empty"><div style={{fontSize:20,marginBottom:8}}>📭</div><div>Feed empty — approve signals to populate</div></div>:<table><thead><tr><th>ID</th><th>Status</th><th>Workspace</th><th>Published</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><span className="cell-mono">{r.id?.slice(0,8)}…</span></td><td><Pill type={r.status==="published"?"green":"gray"}>{r.status}</Pill></td><td><span className="cell-mono">{r.workspace_id?.slice(0,8)}…</span></td><td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDt(r.published_at)}</span></td></tr>)}</tbody></table>}</div>);
}

// ─── STRIPE ──────────────────────────────────────────────────────────
function Stripe({ toast }) {
  const [stripeKey, setStripeKey] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const submit = async () => {
    if(!stripeKey||!vercelToken){toast({type:"error",text:"Both keys required"});return;}
    setLoading(true);setResult(null);
    try{const r=await fetch("/api/stripe/setup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stripeKey,vercelToken})});setResult(await r.json());}
    catch(e){setResult({error:e.message});}
    setLoading(false);
  };
  if(result?.ok) return (<div className="card-section"><div className="card-section-title">Stripe Setup</div><div className="alert alert-success" style={{marginBottom:12}}>✓ Setup complete</div>{Object.entries(result.results||{}).map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1A2640",fontSize:11}}><span style={{color:"#4A5E80",fontFamily:"monospace"}}>{k}</span><span style={{color:"#C9A84C",fontFamily:"monospace"}}>{v}</span></div>))}</div>);
  return (<div className="card-section" style={{maxWidth:480}}><div className="card-section-title">Activate Stripe Payments</div><p style={{fontSize:12,color:"#4A5E80",marginBottom:20,lineHeight:1.6}}>Creates Intel Plus and Operator products in Stripe, sets env vars in Vercel, triggers redeploy.</p><div className="stripe-field"><label>Stripe Secret Key</label><input type="password" placeholder="sk_live_…" value={stripeKey} onChange={e=>setStripeKey(e.target.value)}/></div><div className="stripe-field"><label>Vercel Bearer Token</label><input type="password" placeholder="Bearer token" value={vercelToken} onChange={e=>setVercelToken(e.target.value)}/></div>{result?.error&&<div className="alert alert-danger">{result.error}</div>}<button className="btn btn-gold" style={{marginTop:8}} disabled={loading} onClick={submit}>{loading?<><div className="spinner"/>Running…</>:"Run Stripe Setup →"}</button><div style={{marginTop:14,fontSize:11,color:"#3A4E6A",lineHeight:1.6}}>Stripe key: stripe.com → Developers → API keys<br/>Vercel token: vercel.com → Account Settings → Tokens</div></div>);
}

// ─── ACTIONS ─────────────────────────────────────────────────────────

// ─── CLINICAL ───────────────────────────────────────────────────────────
function ClinicalPanel() {
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

function Actions({ api, toast }) {
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
