import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve((_req: Request) => {
  return new Response(HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-cache',
    },
  });
});

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ADI — Apex Diamond Intelligence</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#07090d;--surface:#0e1117;--card:#13171f;--card2:#181d27;--border:rgba(255,255,255,.06);--border2:rgba(255,255,255,.12);--text:#e8eaf0;--muted:#5a6275;--dim:#2a2f3d;--gold:#f0b429;--gold-d:rgba(240,180,41,.12);--green:#34d399;--green-d:rgba(52,211,153,.1);--red:#f87171;--red-d:rgba(248,113,113,.09);--blue:#60a5fa;--blue-d:rgba(96,165,250,.09);--amber:#fbbf24;--amber-d:rgba(251,191,36,.1);--r:10px}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Syne',sans-serif;min-height:100vh}
a{color:inherit;text-decoration:none}
.shell{display:grid;grid-template-columns:200px 1fr;min-height:100vh}
.sidebar{background:var(--surface);border-right:1px solid var(--border);position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column}
.main{min-width:0;overflow:hidden}
.logo{padding:20px 18px 18px;border-bottom:1px solid var(--border)}
.logo-a{font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.logo-b{font-size:10px;color:var(--muted);margin-top:3px;font-family:'DM Mono',monospace}
.nav-g{padding:14px 0 0}
.nav-l{font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);padding:0 18px 7px}
.nav-i{display:flex;align-items:center;gap:9px;padding:8px 18px;cursor:pointer;font-size:12px;font-weight:600;color:var(--muted);transition:all .12s;border-left:2px solid transparent}
.nav-i:hover{color:var(--text);background:rgba(255,255,255,.025)}
.nav-i.active{color:var(--text);border-left-color:var(--gold);background:rgba(240,180,41,.04)}
.nav-dot{width:5px;height:5px;border-radius:50%;background:var(--dim);flex-shrink:0;transition:all .12s}
.nav-i.active .nav-dot,.nav-i:hover .nav-dot{background:var(--gold)}
.nav-i.live .nav-dot{background:var(--green);box-shadow:0 0 5px var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.sidebar-foot{margin-top:auto;padding:14px 18px;border-top:1px solid var(--border)}
.ver{font-size:9px;font-family:'DM Mono',monospace;color:var(--muted)}
.clk{font-size:9px;font-family:'DM Mono',monospace;color:var(--dim);margin-top:4px}
.ph{padding:24px 28px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.ph-title{font-size:20px;font-weight:800;letter-spacing:-.02em}
.ph-sub{font-size:12px;color:var(--muted);margin-top:3px}
.ph-right{display:flex;gap:8px;align-items:center}
.content{padding:16px 28px 40px}
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:6px;font-size:11px;font-weight:700;font-family:'Syne',sans-serif;cursor:pointer;transition:all .12s;border:1px solid var(--border);outline:none}
.btn-g{background:transparent;color:var(--muted)}.btn-g:hover{color:var(--text);border-color:var(--border2);background:rgba(255,255,255,.03)}
.btn-p{background:var(--gold);color:#000;border-color:var(--gold)}.btn-p:hover{background:#f5c03a;transform:translateY(-1px)}
.btn:disabled{opacity:.35;cursor:default;transform:none!important}
.btn-sm{padding:4px 10px;font-size:10px}
.pill{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;font-family:'DM Mono',monospace;white-space:nowrap}
.p-g{background:var(--green-d);color:var(--green);border:1px solid rgba(52,211,153,.18)}
.p-gold{background:var(--gold-d);color:var(--gold);border:1px solid rgba(240,180,41,.2)}
.p-r{background:var(--red-d);color:var(--red);border:1px solid rgba(248,113,113,.18)}
.p-b{background:var(--blue-d);color:var(--blue);border:1px solid rgba(96,165,250,.18)}
.p-d{background:rgba(255,255,255,.04);color:var(--muted);border:1px solid var(--border)}
.blink{animation:blink 1.3s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.sc-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}
.sc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px}
.sc-l{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.sc-v{font-size:24px;font-weight:800;margin-top:5px;letter-spacing:-.03em;line-height:1}
.sc-s{font-size:10px;color:var(--muted);margin-top:3px;font-family:'DM Mono',monospace}
.sec{margin-bottom:20px}
.sec-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.sec-t{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.tabs{display:flex;gap:2px;padding:3px;background:rgba(255,255,255,.04);border-radius:7px;width:fit-content;margin-bottom:14px}
.tab{padding:5px 12px;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer;color:var(--muted);transition:all .12s;white-space:nowrap}
.tab.active{background:var(--card);color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,.4)}
.games{display:grid;gap:7px}
.gc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:12px 15px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;transition:border-color .12s,background .12s}
.gc:hover{border-color:var(--border2);background:var(--card2)}
.gc-league{font-size:9px;font-weight:800;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:3px}
.gc-teams{font-size:13px;font-weight:700;line-height:1.3}
.gc-meta{margin-top:4px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.gc-score{font-size:20px;font-weight:800;font-family:'DM Mono',monospace;text-align:right;white-space:nowrap}
.pc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;margin-bottom:8px}
.pc:hover{border-color:var(--border2)}
.pc-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;margin-bottom:12px}
.pc-league{font-size:9px;font-weight:800;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-bottom:4px}
.pc-teams{font-size:14px;font-weight:700}
.pc-body{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.pc-metric{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:7px;padding:10px 12px}
.pc-ml{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.pc-mv{font-size:15px;font-weight:800;font-family:'DM Mono',monospace}
.pc-ms{font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;margin-top:2px}
.pc-layers{margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.pc-layer{font-size:9px;font-family:'DM Mono',monospace}
.pc-ln{color:var(--muted);margin-bottom:2px;text-transform:uppercase;letter-spacing:.08em}
.pc-lv{color:var(--text)}
.sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}
.src-c{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px}
.src-c.ok{border-left:3px solid var(--green)}.src-c.fail{border-left:3px solid var(--red)}
.src-n{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px}
.src-m{font-size:10px;color:var(--muted);font-family:'DM Mono',monospace;display:flex;gap:6px;align-items:center}
.src-r{margin-top:8px;font-size:10px;font-family:'DM Mono',monospace;padding-top:8px;border-top:1px solid var(--border)}
.src-r.ok{color:var(--green)}.src-r.err{color:var(--red)}
.news-list{display:grid;gap:6px}
.ni{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:9px 13px;display:flex;align-items:flex-start;gap:10px}
.ni-sport{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);white-space:nowrap;width:42px;flex-shrink:0;padding-top:1px}
.ni-title{font-size:12px;flex:1;line-height:1.4}
.ni-date{font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;white-space:nowrap;flex-shrink:0}
.sk{background:linear-gradient(90deg,var(--card) 25%,rgba(255,255,255,.04) 50%,var(--card) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:7px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.empty{text-align:center;padding:40px 20px;color:var(--muted)}
.empty-i{font-size:28px;margin-bottom:10px;opacity:.35}
.empty-t{font-size:12px}
.wc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;margin-bottom:14px}
.bc-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.dt{width:100%;border-collapse:collapse}
.dt th{text-align:left;padding:7px 10px;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)}
.dt td{padding:8px 10px;font-size:11px;border-bottom:1px solid var(--border);font-family:'DM Mono',monospace;color:var(--muted)}
.dt td:first-child{color:var(--text);font-family:'Syne',sans-serif;font-size:12px;font-weight:600}
.api-box{background:rgba(240,180,41,.06);border:1px solid rgba(240,180,41,.2);border-radius:8px;padding:12px 14px;font-size:11px;font-family:'DM Mono',monospace;margin-bottom:14px;word-break:break-all}
.api-label{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--dim);border-radius:3px}
@media(max-width:860px){.shell{grid-template-columns:1fr}.sidebar{display:none}.sc-row{grid-template-columns:1fr 1fr}.pc-body{grid-template-columns:1fr 1fr}.pc-layers{grid-template-columns:1fr 1fr}}
</style></head><body>
<div class="shell">
<aside class="sidebar">
  <div class="logo"><div class="logo-a">ADI</div><div class="logo-b">Apex Diamond Intelligence</div></div>
  <nav class="nav-g"><div class="nav-l">Live</div>
    <div class="nav-i active" onclick="nav('dashboard')"><span class="nav-dot live"></span>Dashboard</div>
    <div class="nav-i" onclick="nav('predictions')"><span class="nav-dot"></span>Predictions</div>
    <div class="nav-i" onclick="nav('games')"><span class="nav-dot"></span>Games &amp; Scores</div>
    <div class="nav-i" onclick="nav('news')"><span class="nav-dot"></span>News Feed</div>
  </nav>
  <nav class="nav-g"><div class="nav-l">System</div>
    <div class="nav-i" onclick="nav('sources')"><span class="nav-dot"></span>Source Health</div>
    <div class="nav-i" onclick="nav('registry')"><span class="nav-dot"></span>Registry</div>
    <div class="nav-i" onclick="nav('api')"><span class="nav-dot"></span>API</div>
  </nav>
  <div class="sidebar-foot"><div class="ver">v1.8.7 &middot; supabase edge</div><div class="clk" id="clk"></div><div style="margin-top:8px"><span id="liveChip" class="pill p-d">LOADING</span></div></div>
</aside>
<div class="main">
<div id="p-dashboard">
  <div class="ph"><div><div class="ph-title">Dashboard</div><div class="ph-sub">Live &middot; 37 sources &middot; auto-refresh every 60s</div></div>
  <div class="ph-right"><button class="btn btn-g" onclick="clearCache()">Clear</button><button class="btn btn-p" id="refBtn" onclick="loadAll()">&#8635; Refresh</button></div></div>
  <div class="content">
    <div class="sc-row">
      <div class="sc"><div class="sc-l">Sources live</div><div class="sc-v" id="s-src">-</div><div class="sc-s" id="s-srcsub">checking</div></div>
      <div class="sc"><div class="sc-l">Games today</div><div class="sc-v" id="s-games">-</div><div class="sc-s" id="s-gamessub">loading</div></div>
      <div class="sc"><div class="sc-l">Predictions</div><div class="sc-v" id="s-preds">-</div><div class="sc-s" id="s-predssub">engine ready</div></div>
      <div class="sc"><div class="sc-l">High confidence</div><div class="sc-v" id="s-high" style="color:var(--green)">-</div><div class="sc-s">strong signals</div></div>
      <div class="sc"><div class="sc-l">Last refresh</div><div class="sc-v" style="font-size:15px;margin-top:8px" id="s-time">-</div><div class="sc-s" id="s-cache">edge fn</div></div>
    </div>
    <div id="dashBanner" style="display:none;border-radius:7px;padding:10px 14px;font-size:11px;margin-bottom:14px"></div>
    <div class="sec"><div class="sec-h"><div class="sec-t">Top predictions</div><button class="btn btn-g btn-sm" onclick="nav('predictions')">View all &rarr;</button></div>
      <div id="dashPreds"><div class="sk" style="height:90px"></div><div class="sk" style="height:90px;opacity:.6;margin-top:8px"></div></div>
    </div>
    <div class="sec"><div class="sec-h"><div class="sec-t">Games</div>
      <div class="tabs" id="dgt"><div class="tab active" onclick="dFilter('all',this)">All</div><div class="tab" onclick="dFilter('MLB',this)">MLB</div><div class="tab" onclick="dFilter('NBA',this)">NBA</div><div class="tab" onclick="dFilter('NHL',this)">NHL</div><div class="tab" onclick="dFilter('NFL',this)">NFL</div><div class="tab" onclick="dFilter('Soccer',this)">Soccer</div></div>
    </div>
    <div id="dashGames" class="games"><div class="sk" style="height:52px"></div><div class="sk" style="height:52px;opacity:.6;margin-top:7px"></div></div>
  </div></div>
</div>
<div id="p-predictions" style="display:none">
  <div class="ph"><div><div class="ph-title">Predictions</div><div class="ph-sub">Spread &middot; total &middot; moneyline &middot; sharp signals</div></div><div class="ph-right"><button class="btn btn-p" onclick="loadAll()">&#8635; Refresh</button></div></div>
  <div class="content"><div class="tabs" id="plt"><div class="tab active" onclick="pFilter('all',this)">All</div><div class="tab" onclick="pFilter('MLB',this)">MLB</div><div class="tab" onclick="pFilter('NBA',this)">NBA</div><div class="tab" onclick="pFilter('NHL',this)">NHL</div><div class="tab" onclick="pFilter('NFL',this)">NFL</div><div class="tab" onclick="pFilter('Soccer',this)">Soccer</div><div class="tab" onclick="pFilter('HIGH',this)">HIGH only</div></div><div id="predsContainer"></div></div>
</div>
<div id="p-games" style="display:none">
  <div class="ph"><div><div class="ph-title">Games &amp; Scores</div><div class="ph-sub">Live scores and scheduled games</div></div><div class="ph-right"><button class="btn btn-p" onclick="loadAll()">&#8635; Refresh</button></div></div>
  <div class="content"><div class="tabs" id="glt"><div class="tab active" onclick="gFilter('all',this)">All</div><div class="tab" onclick="gFilter('MLB',this)">MLB</div><div class="tab" onclick="gFilter('NBA',this)">NBA</div><div class="tab" onclick="gFilter('NHL',this)">NHL</div><div class="tab" onclick="gFilter('NFL',this)">NFL</div><div class="tab" onclick="gFilter('Soccer',this)">Soccer</div><div class="tab" onclick="gFilter('F1',this)">F1</div></div><div id="gamesContainer" class="games"></div></div>
</div>
<div id="p-news" style="display:none">
  <div class="ph"><div><div class="ph-title">News Feed</div><div class="ph-sub">ESPN live news &middot; all sports</div></div><div class="ph-right"><button class="btn btn-p" onclick="loadAll()">&#8635; Refresh</button></div></div>
  <div class="content"><div id="newsContainer" class="news-list"></div></div>
</div>
<div id="p-sources" style="display:none">
  <div class="ph"><div><div class="ph-title">Source Health</div><div class="ph-sub">QA for all 37 sources</div></div><div class="ph-right"><button class="btn btn-p" onclick="loadAll()">&#8635; Run QA</button></div></div>
  <div class="content"><div class="bc-row" id="srcBuckets"></div><div id="srcGrid" class="sg"></div></div>
</div>
<div id="p-registry" style="display:none">
  <div class="ph"><div><div class="ph-title">Source Registry</div></div><div class="ph-right"><input id="regQ" placeholder="Filter..." style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:6px;padding:6px 11px;font-size:11px;color:var(--text);width:180px;font-family:'DM Mono',monospace;outline:none" oninput="renderReg()"/></div></div>
  <div class="content"><div id="regTable"></div></div>
</div>
<div id="p-api" style="display:none">
  <div class="ph"><div><div class="ph-title">API Endpoints</div><div class="ph-sub">Supabase Edge Function &middot; public read-only</div></div></div>
  <div class="content"><div class="wc"><div class="api-box"><div class="api-label">Base URL</div>https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/adi-engine</div>
  <div style="display:grid;gap:10px">
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:14px"><b style="font-size:12px">GET /</b><div style="font-size:10px;color:var(--muted);margin-top:4px">Full payload: games + predictions + news + sources</div></div>
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:14px"><b style="font-size:12px">GET /predictions</b><div style="font-size:10px;color:var(--muted);margin-top:4px">?league=NFL &amp;minConfidence=MEDIUM</div></div>
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:14px"><b style="font-size:12px">GET /games &nbsp; GET /news &nbsp; GET /sources &nbsp; GET /health</b></div>
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:14px"><div class="api-label" style="margin-bottom:6px">Add this header to all API calls</div><code style="font-size:10px">Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M</code></div>
  </div></div></div>
</div>
</div></div>
<script>
const API='https://zvxdgdkukjrrwamdpqrg.supabase.co/functions/v1/adi-engine';
const ANONKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eGRnZGt1a2pycndhbWRwcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDMxNzUsImV4cCI6MjA5MjgxOTE3NX0.MEGWEsDpJO3964Ef2G2Cbo-Q5JKT46WB1xtlXE-ue5M';
const HEADERS={'Authorization':'Bearer '+ANONKEY,'Content-Type':'application/json'};
const S={games:[],predictions:[],news:[],sources:[],loading:false,df:'all',gf:'all',pf:'all'};
function nav(p){document.querySelectorAll('[id^="p-"]').forEach(e=>e.style.display='none');const el=document.getElementById('p-'+p);if(el)el.style.display='';document.querySelectorAll('.nav-i').forEach(e=>e.classList.remove('active'));document.querySelectorAll('.nav-i').forEach(e=>{if(e.getAttribute('onclick')?.includes("'"+p+"'"))e.classList.add('active');});if(p==='registry')renderReg();}
async function loadAll(){if(S.loading)return;S.loading=true;const btn=document.getElementById('refBtn');if(btn){btn.disabled=true;btn.textContent='Loading...';}chip('LOADING','p-gold');try{const res=await fetch(API,{headers:HEADERS});if(!res.ok)throw new Error('API '+res.status+' '+await res.text().then(t=>t.slice(0,80)));const data=await res.json();S.games=data.games||[];S.predictions=data.predictions||[];S.news=data.news||[];S.sources=data.sources||[];S.fetchedAt=data.fetchedAt;S.fromCache=data.fromCache;const w=S.sources.filter(s=>s.ok).length;chip('LIVE · '+w+' sources','p-g');set('s-cache',data.fromCache?'cached':'live fetch');renderAll();}catch(e){chip('ERROR','p-r');showBanner(''+e.message,'red');console.error(e);}S.loading=false;if(btn){btn.disabled=false;btn.textContent='&#8635; Refresh';}}
function renderAll(){const w=S.sources.filter(s=>s.ok).length,tot=S.sources.length,hi=S.predictions.filter(p=>p.confidence==='HIGH').length,lg=[...new Set(S.games.map(g=>g.league))].slice(0,4);set('s-src',w);set('s-srcsub','of '+tot+' checked');set('s-games',S.games.length);set('s-gamessub',lg.join(', ')||'-');set('s-preds',S.predictions.length);set('s-predssub',hi+' HIGH conf');set('s-high',hi);set('s-time',S.fetchedAt?new Date(S.fetchedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'-');renderDP();renderDG();renderPreds();renderGames();renderNews();renderSrc();}
function gcHTML(g){const sc=g.homeScore!=null&&g.awayScore!=null?'<div class="gc-score">'+g.awayScore+' – '+g.homeScore+'</div>':g.start?'<div class="gc-score" style="font-size:12px;color:var(--muted)">'+ft(g.start)+'</div>':'<div class="gc-score" style="font-size:12px;color:var(--dim)">TBD</div>';const sp=g.inProgress?'<span class="pill p-g"><span class="blink">●</span> LIVE</span>':(g.status||'').toLowerCase().includes('final')?'<span class="pill p-d">FINAL</span>':(g.status||'').toLowerCase().match(/sched|pre|fut|tbd/)?'<span class="pill p-gold">UPCOMING</span>':'<span class="pill p-b">'+esc(g.status)+'</span>';const clk=g.inProgress&&g.period?'<span style="font-size:10px;color:var(--muted);font-family:monospace"> '+g.period+(g.clock?' '+g.clock:'')+'</span>':'';return '<div class="gc"><div><div class="gc-league">'+g.league+'</div><div class="gc-teams">'+esc(g.away)+' <span style="color:var(--muted)">@</span> '+esc(g.home)+'</div><div class="gc-meta">'+sp+clk+'</div></div>'+sc+'</div>';}
function pcHTML(p){const hp=Math.round(p.homeWinProb*100),ap=Math.round(p.awayWinProb*100);const vf=p.valueFlag&&p.valueFlag!=='none'?'<span style="background:rgba(240,180,41,.15);color:var(--gold);border:1px solid rgba(240,180,41,.3);padding:2px 7px;border-radius:5px;font-size:9px;font-weight:800">▲ VALUE: '+p.valueFlag.toUpperCase()+'</span>':'';const cp=p.confidence==='HIGH'?'p-g':p.confidence==='MEDIUM'?'p-gold':'p-d';const ly=p.layers||{};return '<div class="pc"><div class="pc-top"><div><div class="pc-league">'+p.league+'</div><div class="pc-teams">'+esc(p.away)+' <span style="color:var(--muted)">@</span> '+esc(p.home)+'</div><div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="pill '+cp+'">'+p.confidence+'</span><span style="font-size:10px;color:var(--muted)">'+p.signalCount+' signals · '+p.confidenceScore+'/100</span>'+vf+'</div></div><div style="text-align:right;font-size:11px;color:var(--muted)">'+ft(p.start)+'</div></div><div class="pc-body"><div class="pc-metric"><div class="pc-ml">Spread</div><div class="pc-mv">'+esc(p.impliedLine)+'</div><div class="pc-ms">estimated</div></div><div class="pc-metric"><div class="pc-ml">Total</div><div class="pc-mv">'+esc(p.impliedTotal)+'</div><div class="pc-ms">est O/U</div></div><div class="pc-metric"><div class="pc-ml">Win prob</div><div class="pc-mv">'+hp+'% / '+ap+'%</div><div style="display:flex;gap:2px;margin-top:5px"><div style="background:var(--gold);border-radius:3px;width:'+hp+'%;height:5px"></div><div style="background:var(--blue);border-radius:3px;width:'+ap+'%;height:5px"></div></div></div><div class="pc-metric"><div class="pc-ml">Sharp</div><div class="pc-mv" style="font-size:10px;line-height:1.4">'+(p.sharpSignal||'').slice(0,60)+'</div></div></div><div class="pc-layers"><div class="pc-layer"><div class="pc-ln">Market</div><div class="pc-lv">'+(ly.market?.homeProb!=null?Math.round(ly.market.homeProb*100)+'%':'—')+'</div></div><div class="pc-layer"><div class="pc-ln">Form</div><div class="pc-lv">'+(ly.form?.homeProb!=null?Math.round(ly.form.homeProb*100)+'%':'—')+'</div></div><div class="pc-layer"><div class="pc-ln">Home adv</div><div class="pc-lv">'+(ly.home?.adj!=null?'+'+((ly.home.adj||0)*100).toFixed(1)+'%':'—')+'</div></div><div class="pc-layer"><div class="pc-ln">Weather</div><div class="pc-lv">'+esc((ly.weather?.detail||'N/A').slice(0,18))+'</div></div><div class="pc-layer"><div class="pc-ln">Sharp</div><div class="pc-lv">'+esc((ly.sharp?.detail||'—').slice(0,22))+'</div></div></div></div>';}
function renderDP(){const el=document.getElementById('dashPreds');if(!el)return;const p=S.predictions.slice(0,3);el.innerHTML=p.length?p.map(pcHTML).join(''):'<div class="empty"><div class="empty-i">&#128202;</div><div class="empty-t">No predictions yet — loading...</div></div>';}
function renderPreds(){const el=document.getElementById('predsContainer');if(!el)return;let p=S.predictions;const f=S.pf;if(f==='HIGH')p=p.filter(x=>x.confidence==='HIGH');else if(f!=='all')p=p.filter(x=>x.league===f);el.innerHTML=p.length?p.map(pcHTML).join(''):'<div class="empty"><div class="empty-i">&#128202;</div><div class="empty-t">No predictions for this filter</div></div>';}
function renderDG(){const el=document.getElementById('dashGames');if(!el)return;const g=S.df==='all'?S.games:S.games.filter(x=>x.league===S.df||(x.sport||'').toLowerCase().includes(S.df.toLowerCase()));el.innerHTML=g.length?g.slice(0,16).map(gcHTML).join(''):'<div class="empty"><div class="empty-i">&#127967;</div><div class="empty-t">Loading games...</div></div>';}
function renderGames(){const el=document.getElementById('gamesContainer');if(!el)return;const g=S.gf==='all'?S.games:S.games.filter(x=>x.league===S.gf||(x.sport||'').toLowerCase().includes(S.gf.toLowerCase()));el.innerHTML=g.length?g.map(gcHTML).join(''):'<div class="empty"><div class="empty-i">&#127967;</div><div class="empty-t">No games for this filter</div></div>';}
function renderNews(){const el=document.getElementById('newsContainer');if(!el)return;el.innerHTML=S.news.length?S.news.slice(0,30).map(n=>'<div class="ni"><div class="ni-sport">'+esc((n.sport||'').slice(0,8))+'</div><div class="ni-title">'+(n.url?'<a href="'+n.url+'" target="_blank" rel="noopener" style="color:var(--text)">'+esc(n.title)+'</a>':esc(n.title))+'</div><div class="ni-date">'+(n.published?new Date(n.published).toLocaleDateString():'—')+'</div></div>').join(''):'<div class="empty"><div class="empty-t">No news loaded</div></div>';}
function renderSrc(){const w=S.sources.filter(s=>s.ok).length,f=S.sources.filter(s=>!s.ok).length;const b=document.getElementById('srcBuckets');if(b)b.innerHTML='<div class="sc"><div class="sc-l">Working</div><div class="sc-v" style="color:var(--green)">'+w+'</div><div class="sc-s">live data</div></div><div class="sc"><div class="sc-l">Failed</div><div class="sc-v" style="color:var(--red)">'+f+'</div><div class="sc-s">check logs</div></div><div class="sc"><div class="sc-l">Total</div><div class="sc-v">'+S.sources.length+'</div><div class="sc-s">registered</div></div>';const g=document.getElementById('srcGrid');if(!g)return;g.innerHTML=S.sources.length?S.sources.map(s=>'<div class="src-c '+(s.ok?'ok':'fail')+'"><div class="src-n">'+esc(s.name)+'</div><div class="src-m">'+(s.ok?'<span class="pill p-g">OK</span>':'<span class="pill p-r">FAIL</span>')+'<span>'+s.ms+'ms</span><span>'+s.gameCount+' games</span></div><div class="src-r '+(s.ok?'ok':'err')+'">'+(s.ok?s.gameCount+' games in '+s.ms+'ms':'err: '+(s.error||'unknown'))+'</div></div>').join(''):'<div class="empty"><div class="empty-t">Run refresh to check sources</div></div>';}
const REG=[{n:'ESPN MLB',c:'public-api',s:'MLB',on:true},{n:'ESPN NBA',c:'public-api',s:'NBA',on:true},{n:'ESPN NHL',c:'public-api',s:'NHL',on:true},{n:'ESPN NFL',c:'public-api',s:'NFL',on:true},{n:'ESPN WNBA',c:'public-api',s:'WNBA',on:true},{n:'ESPN NCAAB',c:'public-api',s:'NCAAB',on:true},{n:'ESPN NCAAF',c:'public-api',s:'NCAAF',on:true},{n:'ESPN MLS',c:'public-api',s:'MLS',on:true},{n:'ESPN EPL',c:'public-api',s:'EPL',on:true},{n:'ESPN UCL',c:'public-api',s:'UCL',on:true},{n:'ESPN La Liga',c:'public-api',s:'La Liga',on:true},{n:'ESPN Bundesliga',c:'public-api',s:'Bundesliga',on:true},{n:'ESPN Serie A',c:'public-api',s:'Serie A',on:true},{n:'ESPN Ligue 1',c:'public-api',s:'Ligue 1',on:true},{n:'ESPN F1',c:'public-api',s:'F1',on:true},{n:'ESPN Golf',c:'public-api',s:'Golf',on:true},{n:'ESPN Tennis',c:'public-api',s:'Tennis',on:true},{n:'ESPN UFC',c:'public-api',s:'MMA',on:true},{n:'MLB Stats API',c:'official',s:'MLB',on:true},{n:'NHL API',c:'official',s:'NHL',on:true},{n:'BallDontLie NBA',c:'public-api',s:'NBA',on:true},{n:'OpenLigaDB',c:'official',s:'Bundesliga',on:true},{n:'Jolpica F1',c:'official',s:'F1',on:true},{n:'TheSportsDB NFL',c:'public-api',s:'NFL',on:true},{n:'TheSportsDB NBA',c:'public-api',s:'NBA',on:true},{n:'TheSportsDB MLB',c:'public-api',s:'MLB',on:true},{n:'TheSportsDB NHL',c:'public-api',s:'NHL',on:true},{n:'Weather NYC',c:'public-api',s:'weather',on:true},{n:'Weather Chicago',c:'public-api',s:'weather',on:true},{n:'Weather LA',c:'public-api',s:'weather',on:true},{n:'Weather Miami',c:'public-api',s:'weather',on:true},{n:'Weather Dallas',c:'public-api',s:'weather',on:true},{n:'ESPN NFL News',c:'news',s:'NFL',on:true},{n:'ESPN NBA News',c:'news',s:'NBA',on:true},{n:'ESPN MLB News',c:'news',s:'MLB',on:true},{n:'ESPN NHL News',c:'news',s:'NHL',on:true},{n:'ESPN Soccer News',c:'news',s:'Soccer',on:true},{n:'PredictIt',c:'prediction-market',s:'Multi',on:true},{n:'The Odds API',c:'odds-feed',s:'Multi',on:false},{n:'Sportradar',c:'licensed',s:'Multi',on:false}];
function renderReg(){const el=document.getElementById('regTable');if(!el)return;const q=(document.getElementById('regQ')?.value||'').toLowerCase();const rows=REG.filter(r=>!q||r.n.toLowerCase().includes(q)||r.s.toLowerCase().includes(q));el.innerHTML='<table class="dt"><thead><tr><th>Source</th><th>Class</th><th>Sport</th><th>Status</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.n)+'</td><td>'+r.c+'</td><td>'+r.s+'</td><td>'+(r.on?'<span class="pill p-g" style="font-size:9px">ON</span>':'<span class="pill p-d" style="font-size:9px">OFF</span>')+'</td></tr>').join('')+'</tbody></table><div style="font-size:10px;color:var(--muted);margin-top:10px">'+rows.length+' of '+REG.length+' sources</div>';}
function dFilter(v,el){S.df=v;setTab('#dgt',el);renderDG();}
function gFilter(v,el){S.gf=v;setTab('#glt',el);renderGames();}
function pFilter(v,el){S.pf=v;setTab('#plt',el);renderPreds();}
function setTab(sel,el){document.querySelectorAll(sel+' .tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');}
function set(id,v){const el=document.getElementById(id);if(el)el.textContent=String(v);}
function chip(l,c){const el=document.getElementById('liveChip');if(el){el.textContent=l;el.className='pill '+c;}}
function showBanner(msg,type){const el=document.getElementById('dashBanner');if(!el)return;el.textContent=msg;el.style.cssText='display:block;border-radius:7px;padding:10px 14px;font-size:11px;margin-bottom:14px;background:'+(type==='red'?'var(--red-d)':'var(--amber-d)')+';color:'+(type==='red'?'var(--red)':'var(--amber)');setTimeout(()=>el.style.display='none',8000);}
function ft(iso){try{if(!iso)return '';return new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}catch{return String(iso||'');}}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function clearCache(){S.games=[];S.predictions=[];S.news=[];S.sources=[];renderAll();chip('CLEARED','p-gold');}
function tick(){const el=document.getElementById('clk');if(el)el.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
setInterval(tick,1000);setInterval(loadAll,60000);tick();loadAll();
<\/script>
</body></html>`;
