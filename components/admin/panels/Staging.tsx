/* eslint-disable */
// @ts-nocheck — extracted from HubPanel
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  Spinner,
  truncate,
  fmtDate,
  inCannabisScope,
} from '@/components/admin/panels/shared'

export function Staging({ api, toast }) {
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
