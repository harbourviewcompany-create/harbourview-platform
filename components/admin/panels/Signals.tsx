/* eslint-disable */
// @ts-nocheck — extracted from HubPanel
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  priPill,
  lanePill,
  Spinner,
  truncate,
  fmtDate,
  inCannabisScope,
} from '@/components/admin/panels/shared'

export function Signals({ api, toast }) {
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
