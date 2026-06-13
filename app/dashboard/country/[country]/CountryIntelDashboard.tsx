'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  getCommercialCountryDashboardRecord,
  countryHeatmapLayers,
  countryDashboardRoles,
  seedComparisonCountryScores,
  type CountryHeatmapLayer,
  type CountryDashboardRole,
} from '@/lib/dashboard/commercialDashboard'
import type { ComparisonCountryScore } from '@/lib/dashboard/dashboardLiveData'
import { useDashboard } from '@/lib/dashboard/DashboardContext'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from './_components'
import type { CountryDashboardSummary } from '@/lib/dashboard/contracts'

// ── TOKENS ─────────────────────────────────────────────────────────────────
const C = {
  bg0:'#02070d', bg2:'#081320', bg3:'#0b1828', bg4:'#0e1e32',
  bDim:'rgba(255,255,255,0.07)', bMid:'rgba(255,255,255,0.12)',
  bGold:'rgba(198,165,90,0.28)', bGoldHi:'rgba(198,165,90,0.55)',
  gold:'#c6a55a', goldBrt:'#f0d39a', goldBg:'rgba(198,165,90,0.08)',
  tp:'#f3f0ea', ts:'rgba(243,240,234,0.6)', tm:'rgba(243,240,234,0.32)',
  green:'#5dcaa5', amber:'#fbbf24', red:'#f87171',
}

// ── HELPERS ─────────────────────────────────────────────────────────────────
function mapContextRole(role: string): CountryDashboardRole {
  if (role === 'medical_professional') return 'doctor'
  if (role === 'regulatory_legal')     return 'service_provider'
  return 'buyer'
}

function scoreColor(score: number) {
  if (score >= 75) return C.green
  if (score >= 55) return C.gold
  if (score >= 40) return C.amber
  return C.red
}

function scoreLabel(score: number) {
  if (score >= 75) return 'High'
  if (score >= 55) return 'Developing'
  if (score >= 40) return 'Review'
  return 'Thin'
}

// ── ATOMS ───────────────────────────────────────────────────────────────────
function DonutGauge({ score, color, size = 68 }: { score: number; color: string; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${color}55)` }} />
    </svg>
  )
}

function MiniGlobe({ lat, lng, layerColor }: { lat: number; lng: number; layerColor: string }) {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(lng)
  const afRef  = useRef<number | null>(null)
  const colRef = useRef(layerColor)
  colRef.current = layerColor

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const SIZE = 220, dpr = window.devicePixelRatio || 1
    cv.width = SIZE * dpr; cv.height = SIZE * dpr
    cv.style.width = '100%'; cv.style.height = 'auto'
    const ctx = cv.getContext('2d'); if (!ctx) return
    ctx.scale(dpr, dpr)
    const cx = SIZE/2, cy = SIZE/2, r = SIZE * 0.44
    const proj = (lt: number, ln: number) => {
      const la = lt*Math.PI/180, lo = (ln + rotRef.current)*Math.PI/180
      return { sx: cx + r*Math.cos(la)*Math.sin(lo), sy: cy - r*Math.sin(la), z: Math.cos(la)*Math.cos(lo) }
    }
    const draw = () => {
      ctx.clearRect(0,0,SIZE,SIZE)
      ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,r+1,0,Math.PI*2); ctx.clip()
      const g = ctx.createRadialGradient(cx-r*.3,cy-r*.3,r*.04,cx,cy,r)
      g.addColorStop(0,'#0E2444'); g.addColorStop(.5,'#071428'); g.addColorStop(1,'#02070D')
      ctx.fillStyle=g; ctx.fillRect(0,0,SIZE,SIZE)
      for (let lt=-75;lt<=75;lt+=30) {
        ctx.beginPath(); let s=false
        for (let lo=-180;lo<=181;lo+=3) {
          const p=proj(lt,lo); if(p.z<-.08){s=false;continue}
          if(s){ctx.lineTo(p.sx,p.sy)}else{ctx.moveTo(p.sx,p.sy);s=true}
        }
        ctx.strokeStyle=lt===0?'rgba(198,165,90,0.22)':'rgba(198,165,90,0.07)'
        ctx.lineWidth=lt===0?.9:.4; ctx.stroke()
      }
      for (let lo=-180;lo<180;lo+=30) {
        ctx.beginPath(); let s=false
        for (let lt=-88;lt<=88;lt+=3) {
          const p=proj(lt,lo); if(p.z<-.08){s=false;continue}
          if(s){ctx.lineTo(p.sx,p.sy)}else{ctx.moveTo(p.sx,p.sy);s=true}
        }
        ctx.strokeStyle='rgba(198,165,90,0.05)'; ctx.lineWidth=.35; ctx.stroke()
      }
      const pc=proj(lat,0)
      if (pc.z>0) {
        const col=colRef.current
        const t=(Date.now()%2000)/2000
        const gg=ctx.createRadialGradient(pc.sx,pc.sy,0,pc.sx,pc.sy,24)
        gg.addColorStop(0,col+'44'); gg.addColorStop(1,'rgba(0,0,0,0)')
        ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(pc.sx,pc.sy,24,0,Math.PI*2); ctx.fill()
        ctx.strokeStyle=col+Math.round((1-t)*153).toString(16).padStart(2,'0')
        ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(pc.sx,pc.sy,7+t*10,0,Math.PI*2); ctx.stroke()
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(pc.sx,pc.sy,5,0,Math.PI*2); ctx.fill()
      }
      const ev=ctx.createRadialGradient(cx,cy,r*.78,cx,cy,r)
      ev.addColorStop(0,'rgba(0,0,0,0)'); ev.addColorStop(1,'rgba(2,7,13,0.7)')
      ctx.fillStyle=ev; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()
      ctx.restore()
      const ar=ctx.createRadialGradient(cx,cy,r*.98,cx,cy,r+10)
      ar.addColorStop(0,'rgba(59,130,160,0.18)'); ar.addColorStop(1,'rgba(59,130,160,0)')
      ctx.fillStyle=ar; ctx.beginPath(); ctx.arc(cx,cy,r+10,0,Math.PI*2); ctx.arc(cx,cy,r*.98,0,Math.PI*2,true); ctx.fill()
    }
    const tick=()=>{ rotRef.current=(rotRef.current+.12)%360; draw(); afRef.current=requestAnimationFrame(tick) }
    tick()
    return ()=>{ if(afRef.current!==null) cancelAnimationFrame(afRef.current) }
  }, [lat, lng])
  return <canvas ref={cvRef} style={{ display:'block', borderRadius:8 }} />
}

function SectionCard({ title, action, actionHref, children }: {
  title: string; action?: string; actionHref?: string; children: React.ReactNode
}) {
  return (
    <div style={{ background:C.bg3, border:`1px solid ${C.bDim}`, borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:`1px solid ${C.bDim}`, flexShrink:0 }}>
        <span style={{ color:C.goldBrt, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>{title}</span>
        {action && actionHref && (
          <Link href={actionHref} style={{ color:C.gold, fontSize:10.5, textDecoration:'none' }}>{action} →</Link>
        )}
      </div>
      <div style={{ padding:'10px 14px', flex:1 }}>{children}</div>
    </div>
  )
}

// ── LAT/LNG MAP ─────────────────────────────────────────────────────────────
const LATLNG: Record<string, [number,number]> = {
  brazil:[-15,-48], germany:[52,10], australia:[-25,133], canada:[56,-96],
  israel:[31,35], france:[47,2], netherlands:[52,5], italy:[43,12],
  portugal:[39,-8], poland:[52,21], 'united-kingdom':[54,-2],
  'united-states':[38,-97], spain:[40,-4], czechia:[50,15],
  denmark:[56,10], switzerland:[47,8], 'new-zealand':[-41,174],
  colombia:[4,-72], thailand:[15,101], malta:[36,14],
}

// ── MAIN ────────────────────────────────────────────────────────────────────
export function CountryIntelDashboard({
  country,
  signalCount = 0,
  comparisonScores = [],
}: {
  country: CountryDashboardSummary
  signalCount?: number
  comparisonScores?: ComparisonCountryScore[]
}) {
  const { role: ctxRole } = useDashboard()
  const [selectedLayer, setSelectedLayer] = useState<CountryHeatmapLayer>('marketplace_activity')
  const [activeRole, setActiveRole]       = useState<CountryDashboardRole>(() => mapContextRole(ctxRole))

  // Seed live comparison scores on mount and when data changes
  useEffect(() => { if (comparisonScores.length) seedComparisonCountryScores(comparisonScores) }, [comparisonScores])

  useEffect(() => { setActiveRole(mapContextRole(ctxRole)) }, [ctxRole])

  const record     = getCommercialCountryDashboardRecord(country, selectedLayer)
  const badge      = getDashboardStatusBadge(country.dashboardStatus)
  const roleView   = record.roleViews[activeRole]
  const [lat, lng] = LATLNG[country.slug] ?? [20, 0]
  const layerColor = scoreColor(record.selectedLayerMetric.score)

  const metricCards = [
    { label:'Channel Readiness',  score:record.tradeAccess.accessScore,   sub:record.tradeAccess.routeFit },
    { label:'Market Activity',    score:record.marketplace.activityScore,  sub:`${record.marketplace.categories.length} active categories` },
    { label:'Operating Readiness',score:record.readiness.readinessScore,   sub:`${record.readiness.gates.length} gates to clear` },
  ]


  return (
    <div style={{ minHeight:'100%', background:C.bg0, padding:16, display:'flex', flexDirection:'column', gap:12, fontFamily:"'DM Sans',system-ui,sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' as const }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <h1 style={{ margin:0, fontSize:28, fontWeight:700, color:C.tp, letterSpacing:'-0.01em', fontFamily:"'Cinzel',Georgia,serif" }}>
              {country.displayName}
            </h1>
            <span style={{ background:TONE_BG[badge.tone], color:TONE_TEXT[badge.tone], border:`1px solid ${TONE_BORDER[badge.tone]}`, borderRadius:20, fontSize:9.5, fontWeight:700, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase' as const }}>
              {badge.label}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' as const }}>
            <span style={{ background:C.goldBg, border:`1px solid ${C.bGold}`, borderRadius:5, color:C.gold, fontSize:9.5, fontWeight:700, padding:'2px 8px', letterSpacing:'0.08em' }}>
              {roleView.label.toUpperCase()} VIEW
            </span>
            {[`${country.iso2} · ${country.iso3}`, country.region, country.subregion].filter(Boolean).map(v => (
              <span key={v} style={{ color:C.tm, fontSize:10.5 }}>
                <span style={{ marginRight:8, color:'rgba(255,255,255,0.12)' }}>|</span>{v}
              </span>
            ))}
            {signalCount > 0 && (
              <span style={{ color:C.green, fontSize:10.5 }}>
                <span style={{ marginRight:8, color:'rgba(255,255,255,0.12)' }}>|</span>{signalCount} active signals
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, marginTop:4 }}>
          <span style={{ color:C.tm, fontSize:10.5 }}>Updated {country.lastUpdated}</span>
          <Link
            href={`/contact?intent=country-brief&country=${country.slug}`}
            style={{ background:C.goldBg, border:`1px solid ${C.bGoldHi}`, borderRadius:8, padding:'7px 14px', color:C.goldBrt, fontSize:11, fontWeight:600, textDecoration:'none', letterSpacing:'0.04em' }}
          >
            Request Harbourview Review
          </Link>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
        {metricCards.map(m => {
          const col = scoreColor(m.score)
          return (
            <div key={m.label} style={{ background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:14 }}>
              <span style={{ color:C.tm, fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>{m.label}</span>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8 }}>
                <div style={{ position:'relative' as const, flexShrink:0 }}>
                  <DonutGauge score={m.score} color={col} />
                  <div style={{ position:'absolute' as const, inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                    <span style={{ color:col, fontSize:15, fontWeight:700, lineHeight:1 }}>{m.score}</span>
                    <span style={{ color:C.tm, fontSize:8 }}>/100</span>
                  </div>
                </div>
                <div>
                  <div style={{ color:col, fontSize:14, fontWeight:700, marginBottom:2 }}>{scoreLabel(m.score)}</div>
                  <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.4 }}>{m.sub}</div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Review Status */}
        <div style={{ background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:14 }}>
          <span style={{ color:C.tm, fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>Review Status</span>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8 }}>
            <div style={{ width:68, height:68, borderRadius:'50%', background:TONE_BG[badge.tone], border:`1px solid ${TONE_BORDER[badge.tone]}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={TONE_TEXT[badge.tone]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                {country.dashboardStatus === 'live' || country.dashboardStatus === 'partial'
                  ? <><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></>
                  : <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                }
              </svg>
            </div>
            <div>
              <div style={{ color:TONE_TEXT[badge.tone], fontSize:13, fontWeight:700, marginBottom:2 }}>{badge.label}</div>
              <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.4 }}>{country.publicSummary.slice(0,90)}…</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: Globe | Role View | Marketplace ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:10 }}>

        {/* Globe + Layer Selector */}
        <div style={{ background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:`1px solid ${C.bDim}` }}>
            <span style={{ color:C.goldBrt, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>Intelligence Layer</span>
            <span style={{ background:`${layerColor}18`, color:layerColor, border:`1px solid ${layerColor}40`, borderRadius:4, fontSize:9.5, fontWeight:700, padding:'2px 8px' }}>
              {record.selectedLayerMetric.badge} · {record.selectedLayerMetric.score}
            </span>
          </div>
          <div style={{ padding:'10px 14px' }}>
            <div style={{ color:C.gold, fontSize:9.5, fontWeight:700, letterSpacing:'0.08em', marginBottom:8 }}>SELECT LAYER</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {countryHeatmapLayers.map(l => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLayer(l.id)}
                  style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}
                >
                  <div style={{ width:14, height:14, borderRadius:'50%', border:`1.5px solid ${selectedLayer===l.id?C.gold:C.bMid}`, background:selectedLayer===l.id?C.goldBg:'none', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {selectedLayer===l.id && <div style={{ width:6, height:6, borderRadius:'50%', background:C.gold }} />}
                  </div>
                  <span style={{ color:selectedLayer===l.id?C.tp:C.tm, fontSize:11, flex:1 }}>{l.label}</span>
                  {selectedLayer===l.id && (
                    <span style={{ color:layerColor, fontSize:9.5, fontWeight:600 }}>{record.selectedLayerMetric.score}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:'0 14px 12px', display:'flex', justifyContent:'center' }}>
            <MiniGlobe lat={lat} lng={lng} layerColor={layerColor} />
          </div>
          <div style={{ padding:'8px 14px', borderTop:`1px solid ${C.bDim}` }}>
            <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.4 }}>{record.selectedLayerMetric.summary}</div>
          </div>
        </div>

        {/* Role View */}
        <div style={{ background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.bDim}`, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ color:C.goldBrt, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>Role View</span>
              <span style={{ color:C.gold, fontSize:10.5, fontWeight:600 }}>{roleView.label}</span>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap' as const, gap:4 }}>
              {countryDashboardRoles.map(r => (
                <button key={r.id} onClick={() => setActiveRole(r.id)} style={{ background:activeRole===r.id?C.goldBg:'transparent', border:`1px solid ${activeRole===r.id?C.bGold:C.bDim}`, borderRadius:5, padding:'2px 8px', color:activeRole===r.id?C.gold:C.tm, fontSize:10, fontWeight:activeRole===r.id?600:400, cursor:'pointer', fontFamily:'inherit' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding:'10px 14px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.4, fontStyle:'italic', marginBottom:2 }}>{roleView.headline}</div>
            {roleView.primaryCards.map((card, i) => (
              <div key={i} style={{ background:C.bg4, border:`1px solid ${C.bDim}`, borderRadius:10, padding:'10px 12px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:4 }}>
                  <span style={{ color:C.tp, fontSize:11, fontWeight:600 }}>{card.title}</span>
                  <span style={{ background:C.goldBg, color:C.gold, border:`1px solid ${C.bGold}`, borderRadius:4, fontSize:9, padding:'1px 6px', whiteSpace:'nowrap' as const, flexShrink:0 }}>{card.pillar}</span>
                </div>
                <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.4, marginBottom:6 }}>{card.body}</div>
                <Link href={card.href} style={{ color:C.gold, fontSize:10.5, fontWeight:600, textDecoration:'none' }}>{card.ctaLabel} →</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Marketplace */}
        <SectionCard title="Marketplace" action="Browse" actionHref={`/marketplace?country=${country.slug}`}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { label:'Activity Score', val:`${record.marketplace.activityScore}/100` },
              { label:'Categories',     val:`${record.marketplace.categories.length}` },
              { label:'Listings',       val:`${record.marketplace.listingSummaries.length}` },
              { label:'Wanted',         val:`${record.marketplace.wantedRequests.length}` },
            ].map(item => (
              <div key={item.label} style={{ background:C.bg4, borderRadius:8, padding:'8px 10px' }}>
                <div style={{ color:C.tp, fontSize:16, fontWeight:700, lineHeight:1 }}>{item.val}</div>
                <div style={{ color:C.tm, fontSize:9.5, marginTop:3 }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.5, marginBottom:10 }}>{record.marketplace.summary}</div>
          <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:6 }}>Active Categories</div>
          <div style={{ display:'flex', flexWrap:'wrap' as const, gap:4, marginBottom:10 }}>
            {record.marketplace.categories.slice(0,6).map(cat => (
              <span key={cat} style={{ background:C.bg4, border:`1px solid ${C.bDim}`, borderRadius:4, color:C.ts, fontSize:9.5, padding:'2px 7px' }}>{cat}</span>
            ))}
            {record.marketplace.categories.length > 6 && (
              <span style={{ color:C.tm, fontSize:9.5 }}>+{record.marketplace.categories.length-6} more</span>
            )}
          </div>
          {record.marketplace.listingSummaries.map(ls => (
            <Link key={ls.id} href={ls.href} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'6px 0', borderTop:`1px solid ${C.bDim}`, textDecoration:'none' }}>
              <div>
                <div style={{ color:C.ts, fontSize:11 }}>{ls.title}</div>
                <div style={{ color:C.tm, fontSize:9.5 }}>{ls.category} · {ls.geography}</div>
              </div>
              <span style={{ color:C.gold, fontSize:10.5, fontWeight:600, whiteSpace:'nowrap' as const }}>{ls.ctaLabel} →</span>
            </Link>
          ))}
          <div style={{ color:C.tm, fontSize:9.5, lineHeight:1.4, fontStyle:'italic', borderTop:`1px solid ${C.bDim}`, paddingTop:8, marginTop:4 }}>
            {record.marketplace.reviewedCounterpartySummary}
          </div>
        </SectionCard>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:10 }}>

        {/* Review Actions */}
        <SectionCard title="Review Actions" action="Start" actionHref={`/contact?intent=country-brief&country=${country.slug}`}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {record.reviewActions.map(action => (
              <Link key={action.id} href={action.href} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'7px 0', borderBottom:`1px solid ${C.bDim}`, textDecoration:'none' }}>
                <div>
                  <div style={{ color:C.ts, fontSize:11, lineHeight:1.3 }}>{action.label}</div>
                  <div style={{ color:C.tm, fontSize:9.5 }}>{action.description}</div>
                </div>
                <span style={{ color:C.gold, fontSize:12, flexShrink:0 }}>→</span>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Trade Access */}
        <SectionCard title="Trade Access" action="Full view" actionHref={`${country.dashboardPath}/market`}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <div style={{ background:C.bg4, borderRadius:8, padding:'8px 10px' }}>
              <div style={{ color:scoreColor(record.tradeAccess.accessScore), fontSize:16, fontWeight:700 }}>{record.tradeAccess.accessScore}</div>
              <div style={{ color:C.tm, fontSize:9.5, marginTop:2 }}>Access Score</div>
            </div>
            <div style={{ background:C.bg4, borderRadius:8, padding:'8px 10px' }}>
              <div style={{ color:C.ts, fontSize:11, fontWeight:600 }}>{record.tradeAccess.routeFit}</div>
              <div style={{ color:C.tm, fontSize:9.5, marginTop:2 }}>Route Fit</div>
            </div>
          </div>
          <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.5, marginBottom:10 }}>{record.tradeAccess.summary}</div>
          <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:6 }}>Corridors</div>
          {record.tradeAccess.corridors.map((c,i) => (
            <div key={i} style={{ color:C.ts, fontSize:10.5, padding:'4px 0', borderBottom:`1px solid ${C.bDim}` }}>
              <span style={{ color:C.gold, marginRight:6 }}>↗</span>{c}
            </div>
          ))}
          {record.tradeAccess.barriers.length > 0 && <>
            <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em', marginTop:10, marginBottom:6 }}>Barriers</div>
            {record.tradeAccess.barriers.slice(0,3).map((b,i) => (
              <div key={i} style={{ color:C.ts, fontSize:10.5, padding:'4px 0', borderBottom:`1px solid ${C.bDim}` }}>
                <span style={{ color:C.amber, marginRight:6 }}>⚠</span>{b}
              </div>
            ))}
          </>}
        </SectionCard>

        {/* Movement */}
        <SectionCard title="Market Movement" action="Signals" actionHref={`${country.dashboardPath}/signals`}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <div style={{ background:C.bg4, borderRadius:8, padding:'8px 10px' }}>
              <div style={{ color:scoreColor(record.movement.movementScore), fontSize:16, fontWeight:700 }}>{record.movement.movementScore}</div>
              <div style={{ color:C.tm, fontSize:9.5, marginTop:2 }}>Movement Score</div>
            </div>
            <div style={{ background:C.bg4, borderRadius:8, padding:'8px 10px' }}>
              <div style={{ color:record.movement.sourceConfidence==='High'?C.green:record.movement.sourceConfidence==='Medium'?C.amber:C.red, fontSize:13, fontWeight:700 }}>
                {record.movement.sourceConfidence}
              </div>
              <div style={{ color:C.tm, fontSize:9.5, marginTop:2 }}>Source Confidence</div>
            </div>
          </div>
          <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.5, marginBottom:10 }}>{record.movement.summary}</div>
          <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:6 }}>Signal Watch</div>
          {record.movement.signals.map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:`1px solid ${C.bDim}` }}>
              <span style={{ color:C.green, fontSize:9 }}>●</span>
              <span style={{ color:C.ts, fontSize:10.5 }}>{s}</span>
            </div>
          ))}
        </SectionCard>

        {/* Readiness */}
        <SectionCard title="Readiness Gates" action="Compliance" actionHref={`${country.dashboardPath}/compliance`}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <div style={{ background:C.bg4, borderRadius:8, padding:'8px 10px' }}>
              <div style={{ color:scoreColor(record.readiness.readinessScore), fontSize:16, fontWeight:700 }}>{record.readiness.readinessScore}</div>
              <div style={{ color:C.tm, fontSize:9.5, marginTop:2 }}>Readiness Score</div>
            </div>
            <div style={{ background:C.bg4, borderRadius:8, padding:'8px 10px' }}>
              <div style={{ color:C.ts, fontSize:13, fontWeight:700 }}>{record.readiness.gates.length}</div>
              <div style={{ color:C.tm, fontSize:9.5, marginTop:2 }}>Gates to Clear</div>
            </div>
          </div>
          <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.5, marginBottom:10 }}>{record.readiness.summary}</div>
          <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:6 }}>Required Gates</div>
          {record.readiness.gates.map((g,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:`1px solid ${C.bDim}` }}>
              <span style={{ color:C.amber, fontSize:9 }}>◆</span>
              <span style={{ color:C.ts, fontSize:10.5 }}>{g}</span>
            </div>
          ))}
          {record.readiness.blockers.length > 0 && <>
            <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em', marginTop:10, marginBottom:6 }}>Blockers</div>
            {record.readiness.blockers.slice(0,2).map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:`1px solid ${C.bDim}` }}>
                <span style={{ color:C.red, fontSize:9 }}>✕</span>
                <span style={{ color:C.ts, fontSize:10.5 }}>{b}</span>
              </div>
            ))}
          </>}
        </SectionCard>
      </div>

      {/* ── QUICK FACTS + COVERAGE ── */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const }}>
        <div style={{ flex:1, minWidth:280, background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:'12px 14px' }}>
          <div style={{ color:C.goldBrt, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const, marginBottom:10 }}>
            {country.displayName} — Quick Facts
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'8px 16px' }}>
            {[
              { label:'Legal Status',    val:record.quickFacts.legalStatus },
              { label:'Primary Use',     val:record.quickFacts.primaryCommercialUse },
              { label:'Education Fit',   val:record.quickFacts.educationFit },
              { label:'Readiness Note',  val:record.quickFacts.readinessNote },
            ].map(item => (
              <div key={item.label}>
                <div style={{ color:C.tm, fontSize:9.5, marginBottom:2 }}>{item.label}</div>
                <div style={{ color:C.ts, fontSize:11, lineHeight:1.4 }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width:180, background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
          <div style={{ color:C.goldBrt, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>Data Coverage</div>
          <div style={{ position:'relative' as const, width:72, height:72 }}>
            <DonutGauge score={record.coverage.coverageScore} color={C.gold} size={72} />
            <div style={{ position:'absolute' as const, inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:C.goldBrt, fontSize:16, fontWeight:700 }}>{record.coverage.coverageScore}%</span>
            </div>
          </div>
          <div style={{ color:C.tm, fontSize:10, textAlign:'center' as const, lineHeight:1.3 }}>{record.coverage.publicCoverage}</div>
          <div style={{ color:C.tm, fontSize:9.5, textAlign:'center' as const }}>Reviewed: {record.coverage.lastReviewedLabel}</div>
        </div>
      </div>

      {/* ── SECTION NAV SHORTCUTS ── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const, paddingTop:4, borderTop:`1px solid ${C.bDim}` }}>
        <span style={{ color:C.tm, fontSize:10, alignSelf:'center' }}>Go to section:</span>
        {(['market','education','compliance','signals','opportunities','intelligence','connections'] as const).map(s => {
          const available = country.routeAvailability[s]
          return (
            <Link
              key={s}
              href={available ? `${country.dashboardPath}/${s}` : '#'}
              style={{ background:available?C.goldBg:'transparent', border:`1px solid ${available?C.bGold:C.bDim}`, borderRadius:6, padding:'4px 10px', color:available?C.gold:C.tm, fontSize:10.5, textDecoration:'none', fontWeight:available?600:400, opacity:available?1:0.4, pointerEvents:(available ? 'auto' : 'none') as 'auto' | 'none' }}
            >
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
