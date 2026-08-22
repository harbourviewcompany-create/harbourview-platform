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

export function Countries({ api, toast }) {
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
