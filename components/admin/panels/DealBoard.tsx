/* eslint-disable */
// @ts-nocheck — extracted from HubPanel
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill,
  Spinner,
  truncate,
  fmtDate,
  fmtDt,
} from '@/components/admin/panels/shared'

export function DealBoard({ api, toast }) {
  const [matches, setMatches] = useState([]);
  const [dealRooms, setDealRooms] = useState([]);
  const [records, setRecords] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("matches");
  const [promoting, setPromoting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, dr, r, e] = await Promise.all([
        api.get("matches","select=id,status,listing_id,buyer_request_id,internal_notes,created_at&order=created_at.desc&limit=200").catch(()=>[]),
        api.get("deal_rooms","select=id,title,status,nda_required,created_at&order=created_at.desc&limit=100").catch(()=>[]),
        api.get("genetics_routing_records","select=*&order=created_at.desc&limit=200").catch(()=>[]),
        api.get("genetics_routing_events","select=*&order=created_at.desc&limit=200").catch(()=>[]),
      ]);
      setMatches(m); setDealRooms(dr); setRecords(r); setEvents(e);
    } catch(e2) { toast({type:"error",text:e2.message}); }
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const promote = useCallback(async (matchId) => {
    setPromoting(matchId);
    try {
      const res = await fetch(`/api/admin/marketplace/matches/${matchId}/promote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})});
      const d = await res.json();
      if(!res.ok || !d.ok) { toast({type:"error",text:d.error||"Promote failed"}); }
      else { toast({type:"success",text:`Deal room created: ${d.deal_room_id?.slice(0,8)}…`}); load(); }
    } catch(err) { toast({type:"error",text:err.message}); }
    setPromoting(null);
  },[load, toast]);

  const stPill = s=><Pill type={{
    new_request:"gray", needs_qualification:"warn", needs_buyer_permission:"warn",
    needs_holder_permission:"warn", ready_for_intro:"gold", introduced:"blue",
    declined:"red", archived:"gray",
  }[s]||"gray"}>{(s||"—").replace(/_/g," ")}</Pill>;

  const mPill = s=><Pill type={{proposed:"warn",deal_room_created:"green",rejected:"red",expired:"gray"}[s]||"gray"}>{(s||"—").replace(/_/g," ")}</Pill>;

  if(loading) return <div className="empty"><Spinner size={24}/></div>;

  return (
    <>
      <div className="kpi-grid" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
        {[
          {val:matches.length,label:"Total Matches"},
          {val:matches.filter(m=>m.status==="proposed").length,label:"Proposed",cls:"warn"},
          {val:dealRooms.length,label:"Deal Rooms",cls:"success"},
          {val:records.length,label:"Genetics Records"},
          {val:records.filter(r=>r.status==="ready_for_intro").length,label:"Ready for Intro",cls:"success"},
        ].map(k=>(
          <div className="kpi" key={k.label}>
            <div className={`kpi-val ${k.cls||""}`}>{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
        <div className="tabs">
          <button className={`tab ${tab==="matches"?"active":""}`} onClick={()=>setTab("matches")}>Matches ({matches.length})</button>
          <button className={`tab ${tab==="deal_rooms"?"active":""}`} onClick={()=>setTab("deal_rooms")}>Deal Rooms ({dealRooms.length})</button>
          <button className={`tab ${tab==="genetics"?"active":""}`} onClick={()=>setTab("genetics")}>Genetics ({records.length})</button>
          <button className={`tab ${tab==="events"?"active":""}`} onClick={()=>setTab("events")}>Events ({events.length})</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
      </div>

      {tab==="matches"&&(
        <div className="table-wrap">
          {matches.length===0?<div className="empty">No matches yet</div>:
          <div style={{overflowX:"auto"}}><table>
            <thead><tr><th>ID</th><th>Listing</th><th>Buyer Request</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
            <tbody>{matches.map(m=>(
              <tr key={m.id}>
                <td><span className="cell-mono">{m.id?.slice(0,8)}…</span></td>
                <td><span style={{fontSize:11,color:"#A0B0C8"}}>{truncate(m.listing_id||"—",28)}</span></td>
                <td><span style={{fontSize:11,color:"#A0B0C8"}}>{truncate(m.buyer_request_id||"—",28)}</span></td>
                <td>{mPill(m.status)}</td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(m.created_at)}</span></td>
                <td>
                  {m.status==="proposed"&&(
                    <button
                      className="btn btn-sm btn-primary"
                      style={{fontSize:10,padding:"2px 8px"}}
                      disabled={promoting===m.id}
                      onClick={()=>promote(m.id)}
                    >
                      {promoting===m.id?"…":"Create deal room"}
                    </button>
                  )}
                  {m.status==="deal_room_created"&&<span style={{fontSize:11,color:"#3DA86E"}}>✓ Room open</span>}
                </td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>
      )}

      {tab==="deal_rooms"&&(
        <div className="table-wrap">
          {dealRooms.length===0?<div className="empty">No deal rooms yet — promote a proposed match to create the first one</div>:
          <div style={{overflowX:"auto"}}><table>
            <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>NDA</th><th>Created</th></tr></thead>
            <tbody>{dealRooms.map(d=>(
              <tr key={d.id}>
                <td><span className="cell-mono">{d.id?.slice(0,8)}…</span></td>
                <td><span style={{fontSize:12,color:"#D4C9B8"}}>{truncate(d.title||"—",40)}</span></td>
                <td><Pill type={{open:"green",closed:"gray",paused:"warn"}[d.status]||"gray"}>{d.status||"—"}</Pill></td>
                <td><span style={{fontSize:11,color:d.nda_required?"#C6A55A":"#4A5E80"}}>{d.nda_required?"Required":"Not required"}</span></td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(d.created_at)}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>
      )}

      {tab==="genetics"&&(
        <div className="table-wrap">
          {records.length===0?<div className="empty">No routing records</div>:
          <div style={{overflowX:"auto"}}><table>
            <thead><tr><th>ID</th><th>Requester</th><th>Profile / Drop</th><th>Intent → Market</th><th>Status</th><th>Score</th><th>Created</th></tr></thead>
            <tbody>{records.map(r=>(
              <tr key={r.id}>
                <td><span className="cell-mono">{r.id?.slice(0,8)}…</span></td>
                <td>
                  <span style={{fontSize:12,color:"#D4C9B8"}}>{truncate(r.requester_company||"—",25)}</span><br/>
                  <span style={{fontSize:10,color:"#4A5E80"}}>{r.requester_email||"—"}</span>
                </td>
                <td><span style={{fontSize:12,color:"#A0B0C8"}}>{truncate(`${r.profile_slug||"—"} / ${r.drop_id||"—"}`,30)}</span></td>
                <td><span style={{fontSize:11,color:"#6A7E9B"}}>{truncate(`${r.intent||"—"} → ${r.target_market||"—"}`,30)}</span></td>
                <td>{stPill(r.status)}</td>
                <td><span className="cell-mono">{r.score ?? "—"}{r.score_band?` (${r.score_band})`:""}</span></td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDate(r.created_at)}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>
      )}

      {tab==="events"&&(
        <div className="table-wrap">
          {events.length===0?<div className="empty">No events logged</div>:
          <div style={{overflowX:"auto"}}><table>
            <thead><tr><th>Record</th><th>Event</th><th>Summary</th><th>Actor</th><th>Date</th></tr></thead>
            <tbody>{events.map(e=>(
              <tr key={e.id}>
                <td><span className="cell-mono">{e.routing_record_id?.slice(0,8)||"—"}…</span></td>
                <td><Pill type="blue">{(e.event_type||"—").replace(/_/g," ")}</Pill></td>
                <td><span style={{fontSize:11,color:"#A0B0C8"}}>{truncate(e.event_summary||"—",40)}</span></td>
                <td><span style={{fontSize:11,color:"#6A7E9B"}}>{e.actor||"system"}</span></td>
                <td><span style={{fontSize:11,color:"#4A5E80"}}>{fmtDt(e.created_at)}</span></td>
              </tr>
            ))}</tbody>
          </table></div>}
        </div>
      )}
    </>
  );
}

// ─── SIGNALS ────────────────────────────────────────────────────────────
