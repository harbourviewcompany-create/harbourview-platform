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

export function Intel({ api, toast }) {
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
