/* eslint-disable */
'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  Pill,
  Spinner,
  truncate,
  fmtDate,
  type AdminApi,
  type ToastMsg,
} from '@/components/admin/panels/shared'

type CandidateRow = {
  id: string; created_at: string; candidate_type: string; status: string;
  title?: string | null; country?: string | null; region?: string | null;
  source_id?: string | null; discovered_at?: string | null; review_notes?: string | null;
};
type CandidateFilter = "needs_review" | "approved" | "draft" | "all";

export function Candidates({ api, toast }: { api: AdminApi; toast: (msg: ToastMsg) => void }) {
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CandidateFilter>("needs_review");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("marketplace_candidates",
        "select=id,created_at,candidate_type,status,title,country,region,source_id,discovered_at,review_notes&order=discovered_at.desc&limit=300"
      );
      setRows(d);
    } catch(e) { toast({type:"error",text: e instanceof Error ? e.message : String(e)}); }
    setLoading(false);
  }, []);

  useEffect(()=>{load();},[load]);

  const setStatus = async (id: string, status: string) => {
    try {
      await api.patch("marketplace_candidates",`id=eq.${id}`,{status});
      setRows(r=>r.map(x=>x.id===id?{...x,status}:x));
      toast({type:"success",text:`Candidate ${status}`});
    } catch(e) { toast({type:"error",text: e instanceof Error ? e.message : String(e)}); }
  };

  const displayed = rows.filter(r=> filter==="all" ? true : r.status===filter);
  const counts = rows.reduce((a: Record<string, number>,r)=>{a[r.status]=(a[r.status]||0)+1;return a;},{});
  const statPill = (s: string) => (({approved:<Pill type="green">Approved</Pill>,rejected:<Pill type="red">Rejected</Pill>,needs_review:<Pill type="warn">Needs Review</Pill>,draft:<Pill type="gray">Draft</Pill>} as Record<string, ReactNode>)[s]||<Pill>{s}</Pill>);

  return (
    <div className="table-wrap">
      <div className="table-header">
        <div className="tabs">
          {([["needs_review",`Review (${counts.needs_review||0})`],["approved","Approved"],["draft","Draft"],["all",`All (${rows.length})`]] as [CandidateFilter,string][]).map(([v,l])=>(
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
