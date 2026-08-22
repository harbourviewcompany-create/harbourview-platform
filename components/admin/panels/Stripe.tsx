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

export function Stripe({ toast }) {
  const [stripeKey, setStripeKey] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const submit = async () => {
    if(!stripeKey||!vercelToken){toast({type:"error",text:"Both keys required"});return;}
    setLoading(true);setResult(null);
    try{const r=await fetch("/api/stripe/setup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({stripeKey,vercelToken})});setResult(await r.json());}
    catch(e){setResult({error:e.message});}
    setLoading(false);
  };
  if(result?.ok) return (<div className="card-section"><div className="card-section-title">Stripe Setup</div><div className="alert alert-success" style={{marginBottom:12}}>✓ Setup complete</div>{Object.entries(result.results||{}).map(([k,v])=>(<div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1A2640",fontSize:11}}><span style={{color:"#4A5E80",fontFamily:"monospace"}}>{k}</span><span style={{color:"#C9A84C",fontFamily:"monospace"}}>{v}</span></div>))}</div>);
  return (<div className="card-section" style={{maxWidth:480}}><div className="card-section-title">Activate Stripe Payments</div><p style={{fontSize:12,color:"#4A5E80",marginBottom:20,lineHeight:1.6}}>Creates Intel Plus and Operator products in Stripe, sets env vars in Vercel, triggers redeploy.</p><div className="stripe-field"><label>Stripe Secret Key</label><input type="password" placeholder="sk_live_…" value={stripeKey} onChange={e=>setStripeKey(e.target.value)}/></div><div className="stripe-field"><label>Vercel Bearer Token</label><input type="password" placeholder="Bearer token" value={vercelToken} onChange={e=>setVercelToken(e.target.value)}/></div>{result?.error&&<div className="alert alert-danger">{result.error}</div>}<button className="btn btn-gold" style={{marginTop:8}} disabled={loading} onClick={submit}>{loading?<><div className="spinner"/>Running…</>:"Run Stripe Setup →"}</button><div style={{marginTop:14,fontSize:11,color:"#3A4E6A",lineHeight:1.6}}>Stripe key: stripe.com → Developers → API keys<br/>Vercel token: vercel.com → Account Settings → Tokens</div></div>);
}

// ─── ACTIONS ─────────────────────────────────────────────────────────

// ─── CLINICAL ───────────────────────────────────────────────────────────
