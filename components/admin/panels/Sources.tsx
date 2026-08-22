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

export function Sources({ api, toast }) {
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
