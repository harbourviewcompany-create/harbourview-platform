import { notFound } from 'next/navigation'
import Link from 'next/link'
import { resolveCountryRouteParam } from '@/lib/dashboard/countries'
import { getDashboardStatusBadge } from '@/lib/dashboard/statusBadges'
import type { DashboardPanelState } from '@/lib/dashboard/contracts'
import { TONE_BG, TONE_BORDER, TONE_TEXT } from '../_components'
import { getCountryIntelligence } from '@/data/harbourview/country-intelligence'
import { getCountryIntelProfile } from '@/lib/dashboard/getCountryIntelProfileCached'
import { getCountryMarketSignals } from '@/lib/dashboard/getCountryMarketSignals'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const displayName = country.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  return { title: `${displayName} Market Overview | Harbourview`, description: `Harbourview ${displayName} market overview dashboard.` }
}

type Props = { params: Promise<{ country: string }> }
type MarketDerived = { model:{label:string;detail:string}; imports:{label:string;detail:string}; operators:{label:string;detail:string}; regulator:{label:string;detail:string} }

function deriveMarketData(state: DashboardPanelState): MarketDerived {
  const map: Record<DashboardPanelState, MarketDerived> = {
    live:{model:{label:'Medical + Regulated Adult',detail:'Full medical-access framework with adult-use regulatory provisions in effect.'},imports:{label:'Active import channels',detail:'Import licences, GMP certification pathways, and narcotics import permit frameworks are operative.'},operators:{label:'Licensed multi-operator',detail:'Multiple licensed domestic operators; international suppliers are import-eligible under narcotics import permit frameworks.'},regulator:{label:'National health authority',detail:'National medicines regulator governs product approval, import authorisation, and operator licensing.'}},
    partial:{model:{label:'Medical access',detail:'Medical-access framework is active with selective prescriber and dispensary routing.'},imports:{label:'Selective import channels',detail:'Import is permitted under case-by-case narcotics permit; some product categories remain import-blocked.'},operators:{label:'Restricted operator pool',detail:'Licensed operator pool is limited; some product types require direct manufacturer import authorisation.'},regulator:{label:'National medicines authority',detail:'Regulated by national medicines regulator with oversight from the health ministry.'}},
    'static-orientation':{model:{label:'CBD / Limited access',detail:'Only low-THC or CBD-classified products are accessible under the current framework.'},imports:{label:'CBD-only import pathway',detail:'Import is limited to CBD isolates and broad-spectrum products within legal THC thresholds.'},operators:{label:'Supplement-track operators',detail:'Products are handled through supplement or nutraceutical operator channels, not narcotics licensing.'},regulator:{label:'Food & supplement authority',detail:'Products are regulated as food supplements; narcotics authority involvement is limited.'}},
    'fallback-backed':{model:{label:'Emerging framework',detail:'Legislative or regulatory framework is under active development; orientation data reflects current draft posture.'},imports:{label:'Undefined import pathway',detail:'No confirmed import framework; channels are expected to emerge as legislation progresses.'},operators:{label:'Pre-licensing stage',detail:'Operator licensing framework has not been finalised; early-mover engagement is limited to review-gated intake.'},regulator:{label:'Regulatory authority (TBD)',detail:'Regulatory mandate is expected to be assigned to the national health or medicines authority.'}},
    'request-only':{model:{label:'Private / request-gated',detail:'Market access is private-route only; all engagement is routed through Harbourview review.'},imports:{label:'Case-by-case import',detail:'Import may be possible under individual narcotics import permits; requires Harbourview routing review.'},operators:{label:'Undisclosed operator pool',detail:'Operator relationships and licensing details are not disclosed on the public dashboard; request review for access.'},regulator:{label:'Restricted regulator access',detail:'Regulatory contact and product pathway data are not available on the public surface.'}},
    'review-required':{model:{label:'Review-gated access',detail:'Market posture data is available after Harbourview review and routing confirmation.'},imports:{label:'Review-gated import data',detail:'Import framework details require review before disclosure; consult Harbourview before routing.'},operators:{label:'Review-gated operator list',detail:'Operator and counterparty data requires review authorisation before access.'},regulator:{label:'Review-gated regulator info',detail:'Regulator contact and pathway data are held behind review and not available on the public dashboard.'}},
    unavailable:{model:{label:'Not available',detail:'Market framework data is not available on the public dashboard.'},imports:{label:'Not available',detail:'Import pathway data is not available.'},operators:{label:'Not available',detail:'Operator data is not available.'},regulator:{label:'Not available',detail:'Regulator data is not available.'}},
  }
  return map[state]
}

const SIGNAL_TYPE_LABEL: Record<string,string>={regulatory:'Regulatory',commercial:'Commercial',legislative:'Legislative',enforcement:'Enforcement',market:'Market',scientific:'Scientific'}
const IMPACT_COLOR: Record<string,string>={high:'rgba(239,68,68,0.7)',medium:'rgba(198,165,90,0.7)',low:'rgba(100,116,139,0.7)'}

function fmtDate(d:string|null):string|null{
  if(!d)return null
  try{return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(d))}catch{return null}
}

export default async function MarketPage({params}:Props){
  const{country:slug}=await params
  const country=resolveCountryRouteParam(slug)
  if(!country)return notFound()

  const panel=country.panels.market
  const badge=getDashboardStatusBadge(panel.state)
  const intel=getCountryIntelligence(country.slug)
  const baseDerived=deriveMarketData(panel.state)

  const[liveProfile,recentSignals]=await Promise.all([
    getCountryIntelProfile(country.iso2),
    getCountryMarketSignals(country.iso2),
  ])

  let derived:MarketDerived
  if(intel?.market){
    derived={model:{label:intel.market.frameworkLabel,detail:intel.market.frameworkDetail},imports:{label:intel.market.importLabel,detail:intel.market.importDetail},operators:{label:intel.market.operatorLabel,detail:intel.market.operatorDetail},regulator:{label:intel.market.regulatorLabel,detail:intel.market.regulatorDetail}}
  }else{
    derived=liveProfile?.briefing_program_status?{
      model:{label:liveProfile.briefing_program_status,detail:liveProfile.briefing_market_dynamics??baseDerived.model.detail},
      imports:baseDerived.imports,
      operators:baseDerived.operators,
      regulator:{label:liveProfile.briefing_regulatory_body?.split(';')[0]?.split('—')[0]?.trim()??baseDerived.regulator.label,detail:liveProfile.briefing_regulatory_body??baseDerived.regulator.detail},
    }:baseDerived
  }

  const isLocked=panel.state==='unavailable'||panel.state==='request-only'
  const commercialSummary=liveProfile?.commercial_pathway_summary??null
  const regulatoryOutlook=liveProfile?.briefing_regulatory_outlook??null
  const patientAccess=liveProfile?.briefing_patient_access??null
  const physicianAccess=liveProfile?.briefing_physician_access??null
  const publicSummary=liveProfile?.public_summary??null
  const hasCommercial=!!(commercialSummary||regulatoryOutlook||patientAccess||physicianAccess)
  const confidencePct=liveProfile?.confidence_score!=null?Math.round(Number(liveProfile.confidence_score)*100):null
  const lastReviewed=fmtDate(liveProfile?.briefing_last_reviewed??null)

  return(
    <div className="min-h-full p-5 lg:p-7">
      <nav className="mb-6 flex items-center gap-2 text-[11px]" aria-label="Breadcrumb">
        <Link href="/dashboard" className="transition-opacity hover:opacity-70" style={{color:'rgba(198,165,90,0.4)'}}>Dashboard</Link>
        <span style={{color:'rgba(255,255,255,0.15)'}}>›</span>
        <Link href={country.dashboardPath} className="transition-opacity hover:opacity-70" style={{color:'rgba(198,165,90,0.55)'}}>{country.displayName}</Link>
        <span style={{color:'rgba(255,255,255,0.15)'}}>›</span>
        <span style={{color:'rgba(198,165,90,0.85)'}}>Market posture</span>
      </nav>

      <div className="mb-5 overflow-hidden rounded-2xl" style={{background:TONE_BG[badge.tone],border:`1px solid ${TONE_BORDER[badge.tone]}`,borderLeft:`4px solid ${TONE_TEXT[badge.tone]}`}}>
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{color:TONE_TEXT[badge.tone]}}>Regulatory posture · {country.displayName}</p>
            <h1 className="font-serif text-2xl font-semibold text-white">{derived.model.label}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{color:'rgba(243,240,234,0.6)'}}>{derived.model.detail}</p>
          </div>
          <span className="shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em]" style={{background:TONE_BG[badge.tone],borderColor:TONE_BORDER[badge.tone],color:TONE_TEXT[badge.tone]}}>{badge.label}</span>
        </div>
        <div className="border-t px-5 py-3" style={{borderColor:TONE_BORDER[badge.tone]}}>
          <p className="text-[11px] leading-relaxed" style={{color:'rgba(243,240,234,0.55)'}}>{panel.stateCopy.summary}</p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {[{icon:'🏭',heading:'Import framework',data:derived.imports},{icon:'🏢',heading:'Operator framework',data:derived.operators},{icon:'⚖️',heading:'Primary regulator',data:derived.regulator},{icon:'📋',heading:'Public orientation',data:{label:'Published summary',detail:panel.publicSummary}}].map(({icon,heading,data})=>(
          <div key={heading} className="rounded-2xl p-4" style={{background:'rgba(7,15,30,0.7)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="mb-2 flex items-center gap-2"><span className="text-base leading-none">{icon}</span><p className="text-[10px] uppercase tracking-[0.14em]" style={{color:'rgba(198,165,90,0.5)'}}>{heading}</p></div>
            <p className="mb-0.5 text-[13px] font-medium text-white">{data.label}</p>
            <p className="text-[11px] leading-relaxed" style={{color:'rgba(243,240,234,0.45)'}}>{data.detail}</p>
          </div>
        ))}
      </div>

      {hasCommercial&&(
        <div className="mb-5 overflow-hidden rounded-2xl" style={{background:'rgba(7,15,30,0.7)',border:'1px solid rgba(198,165,90,0.15)',borderLeft:'4px solid rgba(198,165,90,0.4)'}}>
          <div className="flex items-center justify-between gap-4 border-b px-5 py-3" style={{borderColor:'rgba(198,165,90,0.1)'}}>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{color:'rgba(198,165,90,0.6)'}}>Commercial intelligence · {country.displayName}</p>
            <div className="flex shrink-0 items-center gap-3">
              {lastReviewed&&<span className="text-[10px]" style={{color:'rgba(243,240,234,0.3)'}}>Reviewed {lastReviewed}</span>}
              {confidencePct!=null&&(
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-16 overflow-hidden rounded-full" style={{background:'rgba(255,255,255,0.08)'}}>
                    <div className="h-full rounded-full" style={{width:`${confidencePct}%`,background:confidencePct>=75?'rgba(34,197,94,0.7)':confidencePct>=55?'rgba(198,165,90,0.7)':'rgba(239,68,68,0.7)'}}/>
                  </div>
                  <span className="text-[10px] tabular-nums" style={{color:'rgba(243,240,234,0.35)'}}>{confidencePct}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.05)'}}>
            {commercialSummary&&<div className="px-5 py-4"><p className="mb-1.5 text-[10px] uppercase tracking-[0.14em]" style={{color:'rgba(198,165,90,0.45)'}}>Commercial pathway</p><p className="text-[13px] leading-relaxed" style={{color:'rgba(243,240,234,0.75)'}}>{commercialSummary}</p></div>}
            {regulatoryOutlook&&<div className="px-5 py-4"><p className="mb-1.5 text-[10px] uppercase tracking-[0.14em]" style={{color:'rgba(198,165,90,0.45)'}}>Regulatory outlook</p><p className="text-[13px] leading-relaxed" style={{color:'rgba(243,240,234,0.75)'}}>{regulatoryOutlook}</p></div>}
            {(patientAccess||physicianAccess)&&(
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                {patientAccess&&<div><p className="mb-1.5 text-[10px] uppercase tracking-[0.14em]" style={{color:'rgba(198,165,90,0.45)'}}>Patient access</p><p className="text-[12px] leading-relaxed" style={{color:'rgba(243,240,234,0.65)'}}>{patientAccess}</p></div>}
                {physicianAccess&&<div><p className="mb-1.5 text-[10px] uppercase tracking-[0.14em]" style={{color:'rgba(198,165,90,0.45)'}}>Physician access</p><p className="text-[12px] leading-relaxed" style={{color:'rgba(243,240,234,0.65)'}}>{physicianAccess}</p></div>}
              </div>
            )}
            {!commercialSummary&&publicSummary&&<div className="px-5 py-4"><p className="mb-1.5 text-[10px] uppercase tracking-[0.14em]" style={{color:'rgba(198,165,90,0.45)'}}>Market summary</p><p className="text-[13px] leading-relaxed" style={{color:'rgba(243,240,234,0.75)'}}>{publicSummary}</p></div>}
          </div>
        </div>
      )}

      {recentSignals.length>0&&(
        <div className="mb-5 overflow-hidden rounded-2xl" style={{background:'rgba(7,15,30,0.7)',border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="flex items-center justify-between border-b px-5 py-3" style={{borderColor:'rgba(255,255,255,0.06)'}}>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{color:'rgba(243,240,234,0.35)'}}>Recent signals · {country.displayName}</p>
            <Link href={`${country.dashboardPath}/signals`} className="text-[10px] transition-opacity hover:opacity-70" style={{color:'rgba(198,165,90,0.5)'}}>View all →</Link>
          </div>
          <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.04)'}}>
            {recentSignals.map(s=>(
              <div key={s.id} className="px-5 py-3.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em]" style={{background:'rgba(255,255,255,0.06)',color:'rgba(243,240,234,0.4)'}}>{SIGNAL_TYPE_LABEL[s.type]??s.type}</span>
                  {s.commercial_impact&&<span className="text-[9px] uppercase tracking-[0.1em]" style={{color:IMPACT_COLOR[s.commercial_impact]??'rgba(243,240,234,0.4)'}}>{s.commercial_impact} impact</span>}
                  {s.detected_at&&<span className="ml-auto text-[9px]" style={{color:'rgba(243,240,234,0.25)'}}>{new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(s.detected_at))}</span>}
                </div>
                <p className="mb-0.5 text-[12px] font-medium leading-snug text-white">{s.title}</p>
                {s.summary&&<p className="text-[11px] leading-relaxed" style={{color:'rgba(243,240,234,0.4)'}}>{s.summary.length>160?s.summary.slice(0,159)+'…':s.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {isLocked&&<div className="mb-5 rounded-2xl p-4 text-center" style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.14)'}}><p className="text-sm" style={{color:'rgba(248,113,113,0.65)'}}>{panel.stateCopy.emptyState}</p></div>}

      <div className="mb-8 flex flex-wrap gap-2.5">
        <Link href={`/contact?intent=market-review&country=${country.slug}`} className="rounded-xl px-4 py-2.5 text-[12px] font-medium transition-all hover:opacity-90" style={{background:'rgba(198,165,90,0.1)',border:'1px solid rgba(198,165,90,0.28)',color:'#F0D39A'}}>Request market review</Link>
        <Link href={`${country.dashboardPath}/compliance`} className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80" style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(243,240,234,0.5)'}}>View compliance →</Link>
        <Link href={`${country.dashboardPath}/signals`} className="rounded-xl px-4 py-2.5 text-[12px] transition-all hover:opacity-80" style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(243,240,234,0.5)'}}>View all signals →</Link>
      </div>

      <div className="pt-4" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
        <Link href={country.dashboardPath} className="text-[11px] transition-opacity hover:opacity-70" style={{color:'rgba(198,165,90,0.38)'}}>← {country.displayName} overview</Link>
      </div>
    </div>
  )
}
