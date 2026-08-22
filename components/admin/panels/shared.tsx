/* eslint-disable */
// @ts-nocheck — shared admin panel primitives (extracted from HubPanel)
'use client'

import { useState, useEffect } from 'react'

export const WS_ID = "a85840b4-c522-4cb8-9097-2f6c30a78417";

export function mkApi() {
  const req = async (payload) => {
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
    get:   (t, qs="")    => req({ op:"get", table:t, qs }),
    patch: (t, qs, body) => req({ op:"patch", table:t, qs, body }),
    /** Single request multi-row update via PostgREST id=in.(...) */
    patchBulk: (t, ids, body, idColumn="id") =>
      req({ op:"bulk_patch", table:t, ids, body, idColumn }),
    post:  (t, body)     => req({ op:"post", table:t, body }),
    del:   (t, qs)       => req({ op:"delete", table:t, qs }),
    rpc:   (fn, body={}) => req({ op:"rpc", fn, body }),
  };
}

const SCOPE_RE = /cannab|cannabis|marijuana|thc|cbd|nabiximols|sativex|epidiolex|hemp|gacp|gmp.?cann|narcotic.?import|bfarm|health.?canada|tga|anvisa|mhra|medical.?cannabis|phytocannabinoid|eu.?gmp|btmg|narcotics.?act/i;
const CONSUMER_SPAM_RE = /weedmaps|how to buy|order weed|buy weed|visitor'?s? guide|dispensary near|recreational tourism|delivery near me|strain review|best edibles|smoke shop|is weed legal in|is cannabis legal in|is marijuana legal in|business guide 20\d\d|cannabis laws? (in )?(cyprus|dominica|austria|malta|luxembourg)/i;
export function inCannabisScope(text) {
  if (!text) return false;
  const t = String(text);
  if (CONSUMER_SPAM_RE.test(t)) return false;
  if (/\bis (weed|cannabis|marijuana) legal\b/i.test(t) && !/\b(bfarm|tga|anvisa|mhra|health canada|eu-?gmp|import permit|narcotic)\b/i.test(t)) {
    return false;
  }
  return SCOPE_RE.test(t);
}

export const panelCss = `
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

  .hv-app{display:block;min-height:100%;background:#080E1C;}.hv-app.content-only{grid-template-columns:1fr;position:relative;inset:auto;height:auto;min-height:100%;z-index:1;}.hv-app.content-only .sidebar{display:none;}.hv-app.content-only .hv-main{min-height:100%;}.hv-app.content-only .topbar{display:none;}
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



export function Pill({ type="gray", children }) {
  const map = { gold:"pill-gold",red:"pill-red",green:"pill-green",blue:"pill-blue",gray:"pill-gray",warn:"pill-warn",purple:"pill-purple" };
  return <span className={`pill ${map[type]||"pill-gray"}`}>{children}</span>;
}
export function priPill(p) { return <Pill type={{URGENT:"red",HIGH:"warn",MONITOR:"gray",LOW:"gray"}[p]||"gray"}>{p||"—"}</Pill>; }
export function lanePill(l) { return <Pill type={{Regulatory:"blue",Economic:"gold",Trade:"green"}[l]||"gray"}>{l||"—"}</Pill>; }

export function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone, msg]);
  return <div className={`toast ${msg.type}`}>{msg.text}</div>;
}
export function Spinner({ size=20 }) {
  return <div className="spinner" style={{width:size,height:size,margin:"0 auto"}} />;
}
export function truncate(s, n=65) { return s && s.length>n ? s.slice(0,n)+"…" : (s||"—"); }
export function fmtDate(s) { return s ? new Date(s).toLocaleDateString("en-CA") : "—"; }
export function fmtDt(s) { return s ? new Date(s).toLocaleString("en-CA",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—"; }

export function PanelShell({ title, children }) {
  const [toastMsg, setToastMsg] = useState(null);
  return (
    <>
      <style>{panelCss}</style>
      <div className="hv-app">
        <div className="hv-main">
          {title ? <div className="topbar"><span className="page-title">{title}</span></div> : null}
          <div className="content">{children}</div>
        </div>
      </div>
      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
    </>
  );
}

export function useAdminToast() {
  const [toastMsg, setToastMsg] = useState(null);
  const toast = (msg) => setToastMsg(msg);
  const node = toastMsg ? <Toast msg={toastMsg} onDone={() => setToastMsg(null)} /> : null;
  return { toast, toastNode: node };
}
