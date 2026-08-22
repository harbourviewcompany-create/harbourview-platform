/* eslint-disable */
// @ts-nocheck — Actions panel (admin control surface)
'use client'

import { useState } from 'react'
import { WS_ID } from '@/components/admin/panels/shared'

export function Actions({ api, toast }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState({});
  const run = async (key, fn) => {
    setRunning(r => ({...r, [key]: true}));
    setResults(r => ({...r, [key]: null}));
    try {
      const txt = JSON.stringify(await fn(), null, 2);
      setResults(r => ({...r, [key]: {ok: true, txt}}));
    } catch (e) {
      setResults(r => ({...r, [key]: {ok: false, txt: e.message || String(e)}}));
    } finally {
      setRunning(r => ({...r, [key]: false}));
    }
  };
  const runAutonomy = async () => {
    const res = await fetch('/api/admin/ops-autonomy/run', { method: 'POST' })
    const data = await res.json()
    if (!res.ok || !data.ok) throw new Error(data.error || 'Autonomy failed')
    return data.result
  }

  const actions = [
    {key:"autonomy",title:"Run ops autonomy (no human review)",desc:"Auto-reject OOS signals/staging, auto-approve HIGH/URGENT in-scope, country coverage tick + enrichment queue",fn:()=>runAutonomy()},

    {key:"promote",title:"Promote Extracted Snapshots",desc:"promote_all_extracted_snapshots()",fn:()=>api.rpc("promote_all_extracted_snapshots")},
    {key:"ingest",title:"Ingest Staging Batch",desc:"hv_ingest_snapshot_to_staging()",fn:()=>api.rpc("hv_ingest_snapshot_to_staging",{p_batch_size:400,p_workspace_id:WS_ID})},
    {key:"extract",title:"Run Signal Extraction",desc:"hv_extract_signals_from_captured_text()",fn:()=>api.rpc("hv_extract_signals_from_captured_text",{p_batch_size:400})},
    {key:"snapstatus",title:"Snapshot Queue Status",desc:"Count snapshots by status",fn:async()=>{
      const d = await api.get("source_snapshots","select=processing_status&limit=5000");
      const arr = Array.isArray(d) ? d : [];
      return arr.reduce((a,r)=>{a[r.processing_status]=(a[r.processing_status]||0)+1;return a;},{});
    }},
  ];
  return (
    <div style={{display:"grid",gap:12,maxWidth:720}}>
      <div className="card-section">
        <div className="card-section-title">Actions &amp; triggers</div>
        <p style={{fontSize:12,color:"#6A7E9B",marginBottom:12,lineHeight:1.5}}>
          Operator RPCs via hub-proxy. Results appear below each action.
        </p>
        {actions.map(a => (
          <div key={a.key} className="action-card" style={{marginBottom:10}}>
            <div className="action-card-title">{a.title}</div>
            <div className="action-card-desc">{a.desc}</div>
            <button
              className="btn btn-ghost btn-sm"
              style={{marginTop:8}}
              disabled={!!running[a.key]}
              onClick={() => run(a.key, a.fn)}
            >
              {running[a.key] ? "Running…" : "Run"}
            </button>
            {results[a.key] && (
              <pre style={{
                marginTop:8,fontSize:10,padding:8,borderRadius:6,
                background:"#0D1527",border:"1px solid #1A2640",
                color: results[a.key].ok ? "#A8C5A0" : "#E8A0A0",
                overflow:"auto",maxHeight:200
              }}>
                {results[a.key].txt}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
