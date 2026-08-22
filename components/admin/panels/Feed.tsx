/* eslint-disable */
// @ts-nocheck — extracted from HubPanel
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  Spinner,
  fmtDt,
} from '@/components/admin/panels/shared'

export function Feed({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async()=>{setLoading(true);try{setRows(await api.get("hv_public_feed","select=*&order=created_at.desc&limit=200"));}catch(e){toast({type:"error",text:e.message});}setLoading(false);},[]);
  useEffect(()=>{load();},[load]);
  return (<div className="table-wrap"><div className="table-header"><span className="section-title">Public Feed ({rows.length})</span><button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button></div>{loading?<div className="empty"><Spinner/></div>:rows.length===0?<div className="empty"><div style={{fontSize:20,marginBottom:8}}>📭</div><div>Feed empty — approve signals to populate</div></div>:<table><thead><tr><th>ID</th><th>Status</th><th>Workspace</th><th>Published</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><span className="cell-mono">{r.id?.slice(0,8)}…</span></td><td><Pill type={r.status==="published"?"green":"gray"}>{r.status}</Pill></td><td><span className="cell-mono">{r.workspace_id?.slice(0,8)}…</span></td><td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDt(r.published_at)}</span></td></tr>)}</tbody></table>}</div>);
}

// ─── STRIPE ──────────────────────────────────────────────────────────
