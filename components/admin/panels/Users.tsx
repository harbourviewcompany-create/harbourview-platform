/* eslint-disable */
// @ts-nocheck — extracted from HubPanel
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  Spinner,
  fmtDate,
} from '@/components/admin/panels/shared'

export function Users({ api, toast }) {
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{(async()=>{try{const [p,r]=await Promise.all([api.get("user_profiles","select=id,email,created_at,tier&order=created_at.asc"),api.get("user_roles","select=id,role_name,description").catch(()=>[])]);setProfiles(p);setRoles(r);}catch(e){toast({type:"error",text:e.message});}setLoading(false);})();},[]);
  if(loading) return <div className="empty"><Spinner/></div>;
  return (<><div className="table-wrap" style={{marginBottom:12}}><div className="table-header"><span className="section-title">Profiles ({profiles.length})</span></div>{profiles.length===0?<div className="empty">No profiles</div>:<table><thead><tr><th>ID</th><th>Email</th><th>Tier</th><th>Joined</th></tr></thead><tbody>{profiles.map(u=>(<tr key={u.id}><td><span className="cell-mono">{u.id?.slice(0,8)}…</span></td><td><span className="cell-primary">{u.email||"—"}</span></td><td>{u.tier?<Pill type="gold">{u.tier}</Pill>:<Pill type="gray">none</Pill>}</td><td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(u.created_at)}</span></td></tr>))}</tbody></table>}</div>{roles.length>0&&<div className="table-wrap"><div className="table-header"><span className="section-title">Roles ({roles.length})</span></div><table><thead><tr><th>Role</th><th>Description</th></tr></thead><tbody>{roles.map(r=><tr key={r.id}><td><Pill type="blue">{r.role_name}</Pill></td><td><span style={{fontSize:11,color:"#6A7E9B"}}>{r.description}</span></td></tr>)}</tbody></table></div>}</>);
}

// ─── FEED ───────────────────────────────────────────────────────────
