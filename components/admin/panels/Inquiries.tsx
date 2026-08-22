/* eslint-disable */
// @ts-nocheck — extracted from HubPanel
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  Spinner,
  fmtDate,
  fmtDt,
} from '@/components/admin/panels/shared'

export function Inquiries({ api, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get("marketplace_inquiries",
        "select=id,created_at,inquiry_type,contact_company,contact_name,contact_email,contact_phone,status,message,review_status,priority,last_contacted_at,next_follow_up_at&order=created_at.desc&limit=300"
      );
      setRows(d);
    } catch(e) { toast({type:"error",text:e.message}); }
    setLoading(false);
  }, [filter]);

  useEffect(()=>{load();},[load]);

  const setReview = async (id, review_status) => {
    try {
      await api.patch("marketplace_inquiries",`id=eq.${id}`,{review_status});
      setRows(r=>r.map(x=>x.id===id?{...x,review_status}:x));
      toast({type:"success",text:`Marked ${review_status}`});
    } catch(e) { toast({type:"error",text:e.message}); }
  };

  const typeLabel = {listing_submission:"Listing",wanted_request_submission:"Wanted",quote_routing:"Quote",quote_request:"Quote"};
  const priColor = {urgent:"red",high:"warn",medium:"gray",low:"gray"};
  const displayed = rows.filter(r=>{
    if(filter==="open") return r.review_status==="open"||r.review_status==="new";
    if(filter==="pending") return r.review_status==="pending_response";
    if(filter==="closed") return r.review_status==="closed";
    return true;
  });

  return (
    <>
      {detail && (
        <div className="detail-modal" onClick={()=>setDetail(null)}>
          <div className="detail-panel" onClick={e=>e.stopPropagation()}>
            <div className="detail-panel-head">
              <span style={{fontSize:13,fontWeight:500,color:"#D4C9B8"}}>{detail.contact_name} — {detail.contact_company||"no company"}</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>setDetail(null)}>✕</button>
            </div>
            <div className="detail-panel-body">
              <dl className="dl">
                <dt>Email</dt><dd>{detail.contact_email}</dd>
                <dt>Phone</dt><dd>{detail.contact_phone||"—"}</dd>
                <dt>Type</dt><dd>{typeLabel[detail.inquiry_type]||detail.inquiry_type}</dd>
                <dt>Status</dt><dd>{detail.review_status}</dd>
                <dt>Priority</dt><dd>{detail.priority}</dd>
                <dt>Created</dt><dd>{fmtDt(detail.created_at)}</dd>
                <dt>Last contacted</dt><dd>{fmtDt(detail.last_contacted_at)}</dd>
                <dt>Follow up</dt><dd>{fmtDt(detail.next_follow_up_at)}</dd>
              </dl>
              <div style={{marginTop:14,padding:12,background:"#060C1A",borderRadius:6,fontSize:12,color:"#A0B0C8",lineHeight:1.6}}>{detail.message}</div>
              <div style={{marginTop:14,display:"flex",gap:8}}>
                <button className="btn btn-success btn-sm" onClick={()=>{setReview(detail.id,"closed");setDetail(null);}}>Close</button>
                <button className="btn btn-blue btn-sm" onClick={()=>{setReview(detail.id,"pending_response");setDetail(null);}}>Pending response</button>
                <button className="btn btn-danger btn-sm" onClick={()=>{setReview(detail.id,"rejected");setDetail(null);}}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="table-wrap">
        <div className="table-header">
          <div className="tabs">
            {[["all",`All (${rows.length})`],["open","Open"],["pending","Pending Response"],["closed","Closed"]].map(([v,l])=>(
              <button key={v} className={`tab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>{loading?<div className="spinner"/>:"↻"}</button>
        </div>
        {loading?<div className="empty"><Spinner/></div>:displayed.length===0?<div className="empty">No inquiries</div>:
        <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>Contact</th><th>Company</th><th>Type</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {displayed.map(r=>(
                <tr key={r.id} onClick={()=>setDetail(r)} style={{cursor:"pointer"}}>
                  <td><span className="cell-primary">{r.contact_name}</span><br/><span style={{fontSize:10,color:"#4A5E80"}}>{r.contact_email}</span></td>
                  <td><span style={{fontSize:11,color:"#A0B0C8"}}>{r.contact_company||"—"}</span></td>
                  <td><Pill type="blue">{typeLabel[r.inquiry_type]||r.inquiry_type}</Pill></td>
                  <td><Pill type={priColor[r.priority]||"gray"}>{r.priority||"—"}</Pill></td>
                  <td>
                    {{new:"pill-gold",open:"pill-warn",pending_response:"pill-blue",closed:"pill-gray",rejected:"pill-red"}[r.review_status]
                      ? <Pill type={{new:"gold",open:"warn",pending_response:"blue",closed:"gray",rejected:"red"}[r.review_status]}>{r.review_status}</Pill>
                      : <Pill>{r.review_status}</Pill>}
                  </td>
                  <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="btn btn-success btn-sm" onClick={()=>setReview(r.id,"closed")}>✓</button>
                      <button className="btn btn-blue btn-sm" onClick={()=>setDetail(r)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>
    </>
  );
}

// ─── CANDIDATES ──────────────────────────────
