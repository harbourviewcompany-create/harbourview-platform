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

export function Intake({ api, toast }) {
  const [cands, setCands] = useState([]);
  const [inqs, setInqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("candidates");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, i] = await Promise.all([
        api.get("marketplace_candidates", "select=id,created_at,candidate_type,status,title,country&candidate_type=eq.intake_form&status=eq.needs_review&order=created_at.desc&limit=100").catch(()=>[]),
        api.get("marketplace_inquiries", "select=id,created_at,inquiry_type,contact_name,contact_email,contact_company,review_status,priority&listing_id=is.null&order=created_at.desc&limit=200").catch(()=>[]),
      ]);
      setCands(c); setInqs(i);
    } catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const approveCandidate = async (id) => {
    await api.patch("marketplace_candidates",`id=eq.${id}`,{status:"approved"}).catch(e=>toast({type:"error",text:e.message}));
    setCands(c=>c.filter(x=>x.id!==id));
    toast({type:"success",text:"Candidate approved"});
  };

  return (
    <>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <div className="tabs">
          <button className={`tab ${tab==="candidates"?"active":""}`} onClick={()=>setTab("candidates")}>Intake Submissions ({cands.length})</button>
          <button className={`tab ${tab==="inquiries"?"active":""}`} onClick={()=>setTab("inquiries")}>Unmatched Inquiries ({inqs.length})</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
      </div>

      {loading?<div className="empty"><Spinner/></div>:tab==="candidates"?(
        <div className="table-wrap">
          {cands.length===0?<div className="empty">Intake queue clear ✓</div>:
          <table>
            <thead><tr><th>Title</th><th>Country</th><th>Type</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {cands.map(r=>(
                <tr key={r.id}>
                  <td><span className="cell-primary">{truncate(r.title||r.id,55)}</span></td>
                  <td><span className="cell-mono">{r.country||"—"}</span></td>
                  <td><Pill type="blue">{r.candidate_type}</Pill></td>
                  <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-success btn-sm" onClick={()=>approveCandidate(r.id)}>✓ Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      ):(
        <div className="table-wrap">
          {inqs.length===0?<div className="empty">No unmatched inquiries</div>:
          <table>
            <thead><tr><th>Contact</th><th>Company</th><th>Type</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {inqs.map(r=>(
                <tr key={r.id}>
                  <td><span className="cell-primary">{r.contact_name}</span><br/><span style={{fontSize:10,color:"#4A5E80"}}>{r.contact_email}</span></td>
                  <td><span style={{fontSize:11,color:"#A0B0C8"}}>{r.contact_company||"—"}</span></td>
                  <td><Pill type="blue">{r.inquiry_type}</Pill></td>
                  <td><Pill type={{urgent:"red",high:"warn",medium:"gray",low:"gray"}[r.priority]||"gray"}>{r.priority}</Pill></td>
                  <td><Pill type={{new:"gold",open:"warn",closed:"gray"}[r.review_status]||"gray"}>{r.review_status}</Pill></td>
                  <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      )}
    </>
  );
}

// ─── DEAL BOARD ────────────────────────────────────────────────────────────────
