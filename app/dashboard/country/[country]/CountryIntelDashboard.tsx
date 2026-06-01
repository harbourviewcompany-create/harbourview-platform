'use client'

import { useState, useEffect, useRef } from 'react'
import type { CountryDashboardSummary } from '@/lib/dashboard/contracts'

// ── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  bg0:'#02070d', bg1:'#060f1a', bg2:'#081320', bg3:'#0b1828', bg4:'#0e1e32',
  bDim:'rgba(255,255,255,0.07)', bMid:'rgba(255,255,255,0.12)',
  bGold:'rgba(198,165,90,0.28)', bGoldHi:'rgba(198,165,90,0.55)',
  gold:'#c6a55a', goldBrt:'#f0d39a', goldBg:'rgba(198,165,90,0.08)',
  tp:'#f3f0ea', ts:'rgba(243,240,234,0.6)', tm:'rgba(243,240,234,0.32)',
  green:'#5dcaa5', greenBg:'rgba(29,158,117,0.1)', greenBdr:'rgba(29,158,117,0.28)',
  amber:'#fbbf24', amberBg:'rgba(245,158,11,0.08)',
  red:'#f87171', redBg:'rgba(239,68,68,0.08)',
  blue:'#7ec8f7',
}

// ── TYPES ────────────────────────────────────────────────────────────────────
type MetricData   = { label: string; score: number; color: string; desc: string; sub: string }
type ChannelRow   = { label: string; icon: string; value?: string; status?: string }
type PartnerCount = { label: string; value: string }
type DistRow      = { name: string; coverage: string; specialties: string; readiness: 'High'|'Medium'|'Low' }
type OpReq        = { label: string; status: 'Required'|'Recommended'|'No' }
type Corridor     = { from: string; to: string; mode: string; efficiency: string; cost: string }
type Movement     = { category: string; change: number; trend: 'up'|'stable'|'down' }
type Opportunity  = { label: string; type: string; fit: number; timeline: string }

type IntelData = {
  accessTier: string; accessScore: number; accessColor: string; viewLabel: string
  reviewStatus: { label: string; gated: boolean }
  metrics: MetricData[]; channelOverview: ChannelRow[]; partnerCounts: PartnerCount[]
  topDistributors: DistRow[]; operatingReqs: OpReq[]; corridors: Corridor[]
  movement: Movement[]; opportunities: Opportunity[]
  atGlance: { label: string; value: string }[]; coverageScore: number
  logisticsReadiness: string; infraQuality: string; customsEfficiency: string
  openOpportunities: number; highFit: number; shortlist: number
}

// ── FIXTURE DATA ─────────────────────────────────────────────────────────────
const INTEL: Record<string, IntelData> = {
  brazil: {
    accessTier:'HIGH ACCESS', accessScore:72, accessColor:'#5dcaa5', viewLabel:'DISTRIBUTOR VIEW',
    reviewStatus:{ label:'Review-Gated', gated:true },
    logisticsReadiness:'High', infraQuality:'Medium', customsEfficiency:'Medium',
    openOpportunities:23, highFit:9, shortlist:6,
    metrics:[
      { label:'Channel Readiness', score:78, color:'#5dcaa5', desc:'High', sub:'Strong multi-tier distribution infrastructure' },
      { label:'Partner Availability', score:72, color:'#c6a55a', desc:'Good', sub:'Active distributors & service partners' },
      { label:'Operating Readiness', score:68, color:'#fbbf24', desc:'Improving', sub:'Operational enablers in place' },
    ],
    channelOverview:[
      { label:'Distribution Model', icon:'⇄', value:'Hybrid (Wholesaler + DSD)' },
      { label:'Retail Access', icon:'🏪', status:'Strong' },
      { label:'Wholesale Access', icon:'📦', status:'Strong' },
      { label:'E-commerce Access', icon:'💻', status:'Developing' },
      { label:'Service Provider Depth', icon:'🔧', status:'High' },
      { label:'Channel Concentration', icon:'📊', status:'Medium' },
      { label:'Avg. Distributor Tier', icon:'◆', value:'Tier 2' },
      { label:'Go-to-Market Complexity', icon:'⬡', status:'Medium' },
    ],
    partnerCounts:[
      { label:'Active Distributors', value:'126' }, { label:'Qualified Partners', value:'89' },
      { label:'Service Providers', value:'214' }, { label:'New in 90 Days', value:'14' },
    ],
    topDistributors:[
      { name:'RD Distribuição', coverage:'National', specialties:'Pharma, Wellness', readiness:'High' },
      { name:'Grupo SCHEILA', coverage:'SE, S, CO', specialties:'Pharma, Personal Care', readiness:'High' },
      { name:'Oncolog Distribuidora', coverage:'SE, S', specialties:'Oncology, Hospital', readiness:'Medium' },
      { name:'Profarma Distribuição', coverage:'National', specialties:'Pharma, OTC', readiness:'Medium' },
      { name:'Dimaster', coverage:'NE, CO', specialties:'OTC, FMCG', readiness:'Medium' },
    ],
    operatingReqs:[
      { label:'Business Registration', status:'Required' }, { label:'Product Registration', status:'Required' },
      { label:'GxP Compliance', status:'Required' }, { label:'Local Technical Rep', status:'Recommended' },
      { label:'Price Control', status:'No' }, { label:'Import Licensing', status:'Required' },
      { label:'Marketing Approval', status:'Required' },
    ],
    corridors:[
      { from:'Santos', to:'São Paulo', mode:'Road', efficiency:'High', cost:'1.1' },
      { from:'Santos', to:'Belo Horizonte', mode:'Road', efficiency:'Medium', cost:'1.3' },
      { from:'Rio de Janeiro', to:'Brasília', mode:'Road', efficiency:'Medium', cost:'1.2' },
      { from:'Paranaguá', to:'Curitiba', mode:'Road', efficiency:'High', cost:'1.0' },
      { from:'Manaus', to:'Norte Region', mode:'River/Road', efficiency:'Low', cost:'1.6' },
    ],
    movement:[
      { category:'Pharma', change:4.8, trend:'up' }, { category:'OTC', change:3.2, trend:'up' },
      { category:'Medical Devices', change:2.6, trend:'up' }, { category:'Supplements', change:6.1, trend:'up' },
      { category:'Payment Terms', change:0, trend:'stable' }, { category:'Inventory Levels', change:0, trend:'stable' },
    ],
    opportunities:[
      { label:'Pharma Distribution – SP', type:'Distributor', fit:92, timeline:'0–30 days' },
      { label:'Hospital Channel – SE', type:'Distributor', fit:88, timeline:'0–30 days' },
      { label:'E-commerce Launch', type:'3PL / Tech', fit:76, timeline:'30–60 days' },
      { label:'OTC Regional Expansion', type:'Distributor', fit:72, timeline:'30–60 days' },
      { label:'D2C Fulfilment Partner', type:'3PL', fit:68, timeline:'60+ days' },
    ],
    atGlance:[
      { label:'Population', value:'215.3M' }, { label:'GDP (Nominal)', value:'$2.17T' },
      { label:'Currency', value:'BRL (R$)' }, { label:'Language', value:'Portuguese' },
      { label:'Ease of Importing', value:'Rank 47 / 190' }, { label:'Logistics Performance', value:'3.2 / 5' },
    ],
    coverageScore:86,
  },
  germany: {
    accessTier:'HIGH ACCESS', accessScore:82, accessColor:'#5dcaa5', viewLabel:'IMPORTER VIEW',
    reviewStatus:{ label:'Accessible', gated:false },
    logisticsReadiness:'High', infraQuality:'High', customsEfficiency:'High',
    openOpportunities:31, highFit:14, shortlist:9,
    metrics:[
      { label:'Channel Readiness', score:82, color:'#5dcaa5', desc:'High', sub:'BfArM licensed pharmacy network established' },
      { label:'Partner Availability', score:75, color:'#c6a55a', desc:'Good', sub:'Active importers & pharmaceutical wholesalers' },
      { label:'Operating Readiness', score:79, color:'#5dcaa5', desc:'Strong', sub:'GKV reimbursement framework operational' },
    ],
    channelOverview:[
      { label:'Distribution Model', icon:'⇄', value:'Pharmacy-led (GKV + Privat)' },
      { label:'Retail Pharmacy Access', icon:'🏪', status:'Strong' },
      { label:'Wholesale Access', icon:'📦', status:'Strong' },
      { label:'Online Pharmacy', icon:'💻', status:'Strong' },
      { label:'Import Pathway Depth', icon:'🔧', status:'High' },
      { label:'Channel Concentration', icon:'📊', status:'Low' },
      { label:'Avg. Importer Tier', icon:'◆', value:'Tier 1' },
      { label:'Go-to-Market Complexity', icon:'⬡', status:'High' },
    ],
    partnerCounts:[
      { label:'Active Importers', value:'47' }, { label:'Qualified Partners', value:'31' },
      { label:'Service Providers', value:'89' }, { label:'New in 90 Days', value:'6' },
    ],
    topDistributors:[
      { name:'Cansativa GmbH', coverage:'National', specialties:'Cannabis, Pharma', readiness:'High' },
      { name:'Sanacorp', coverage:'National', specialties:'Pharma Coop', readiness:'High' },
      { name:'NOWEDA', coverage:'National', specialties:'Pharma Coop', readiness:'High' },
      { name:'Phoenix Group', coverage:'National', specialties:'Pharma, Hospital', readiness:'Medium' },
      { name:'Canify GmbH', coverage:'National', specialties:'Cannabis Specialist', readiness:'High' },
    ],
    operatingReqs:[
      { label:'BfArM Import Permit', status:'Required' }, { label:'EU-GMP Certification', status:'Required' },
      { label:'Narcotics Licence (BtMG)', status:'Required' }, { label:'DEA Certificate', status:'Recommended' },
      { label:'Price Regulation', status:'No' }, { label:'Chain of Custody Docs', status:'Required' },
      { label:'COA / Lab Testing', status:'Required' },
    ],
    corridors:[
      { from:'Hamburg', to:'Berlin', mode:'Road', efficiency:'High', cost:'1.0' },
      { from:'Frankfurt', to:'Munich', mode:'Road', efficiency:'High', cost:'1.0' },
      { from:'Rotterdam', to:'Cologne', mode:'Road', efficiency:'High', cost:'1.0' },
      { from:'Amsterdam', to:'Frankfurt', mode:'Road', efficiency:'High', cost:'1.1' },
      { from:'London', to:'Frankfurt', mode:'Air', efficiency:'High', cost:'1.4' },
    ],
    movement:[
      { category:'Medical Flower', change:12.4, trend:'up' }, { category:'Extracts & Oils', change:8.2, trend:'up' },
      { category:'GKV Prescriptions', change:18.6, trend:'up' }, { category:'Specialist Access', change:4.1, trend:'up' },
      { category:'Price Trends', change:0, trend:'stable' }, { category:'Inventory Levels', change:0, trend:'stable' },
    ],
    opportunities:[
      { label:'GKV Supply Agreement', type:'Importer', fit:94, timeline:'0–30 days' },
      { label:'Pharmacy Chain Integration', type:'Distributor', fit:87, timeline:'0–30 days' },
      { label:'Specialist Clinic Access', type:'Clinical', fit:82, timeline:'30–60 days' },
      { label:'Online Pharmacy Launch', type:'E-commerce', fit:76, timeline:'30–60 days' },
      { label:'Hospital Supply', type:'Distributor', fit:71, timeline:'60+ days' },
    ],
    atGlance:[
      { label:'Population', value:'84.4M' }, { label:'GDP (Nominal)', value:'$4.07T' },
      { label:'Currency', value:'EUR (€)' }, { label:'Language', value:'German' },
      { label:'Ease of Importing', value:'Rank 22 / 190' }, { label:'Logistics Performance', value:'4.2 / 5' },
    ],
    coverageScore:94,
  },
  australia: {
    accessTier:'HIGH ACCESS', accessScore:84, accessColor:'#5dcaa5', viewLabel:'IMPORTER VIEW',
    reviewStatus:{ label:'Accessible', gated:false },
    logisticsReadiness:'High', infraQuality:'High', customsEfficiency:'High',
    openOpportunities:27, highFit:11, shortlist:7,
    metrics:[
      { label:'Channel Readiness', score:84, color:'#5dcaa5', desc:'High', sub:'TGA/ODC dual-authority framework active' },
      { label:'Partner Availability', score:79, color:'#5dcaa5', desc:'Strong', sub:'Licensed distributors & pharmacy chains' },
      { label:'Operating Readiness', score:76, color:'#c6a55a', desc:'Good', sub:'SAS Category B & AP pathways operational' },
    ],
    channelOverview:[
      { label:'Distribution Model', icon:'⇄', value:'Pharmacy + Clinic Direct' },
      { label:'Retail Pharmacy', icon:'🏪', status:'Strong' },
      { label:'Clinic Direct Access', icon:'📦', status:'Strong' },
      { label:'Telehealth / Online', icon:'💻', status:'Strong' },
      { label:'Import Pathway Depth', icon:'🔧', status:'High' },
      { label:'Channel Concentration', icon:'📊', status:'Medium' },
      { label:'Average Tier', icon:'◆', value:'Tier 1–2' },
      { label:'Go-to-Market Complexity', icon:'⬡', status:'Medium' },
    ],
    partnerCounts:[
      { label:'Active Distributors', value:'38' }, { label:'Qualified Partners', value:'24' },
      { label:'Service Providers', value:'126' }, { label:'New in 90 Days', value:'9' },
    ],
    topDistributors:[
      { name:'Novatek International', coverage:'National', specialties:'Cannabis, Pharma', readiness:'High' },
      { name:'Sigma Healthcare', coverage:'National', specialties:'Pharma, OTC', readiness:'High' },
      { name:'API Health', coverage:'National', specialties:'Pharma Coop', readiness:'High' },
      { name:'HealthHouse International', coverage:'National', specialties:'Cannabis Specialist', readiness:'Medium' },
      { name:'Cann Group', coverage:'VIC, NSW', specialties:'Cannabis (Domestic)', readiness:'High' },
    ],
    operatingReqs:[
      { label:'TGA Import Permit', status:'Required' }, { label:'ODC Licence', status:'Required' },
      { label:'GMP Certification', status:'Required' }, { label:'AP Pathway Sponsor', status:'Recommended' },
      { label:'Price Regulation', status:'No' }, { label:'Cold Chain Compliance', status:'Required' },
      { label:'COA / Lab Testing', status:'Required' },
    ],
    corridors:[
      { from:'Sydney', to:'Melbourne', mode:'Road', efficiency:'High', cost:'1.0' },
      { from:'Sydney', to:'Brisbane', mode:'Road', efficiency:'High', cost:'1.1' },
      { from:'Melbourne', to:'Perth', mode:'Air', efficiency:'High', cost:'1.4' },
      { from:'Auckland', to:'Sydney', mode:'Air', efficiency:'High', cost:'1.3' },
      { from:'Brisbane', to:'Adelaide', mode:'Road', efficiency:'Medium', cost:'1.2' },
    ],
    movement:[
      { category:'Flower (Dried)', change:8.2, trend:'up' }, { category:'Oil / Tincture', change:5.4, trend:'up' },
      { category:'AP Prescriptions', change:21.3, trend:'up' }, { category:'SAS Category B', change:12.1, trend:'up' },
      { category:'Payment Terms', change:0, trend:'stable' }, { category:'Inventory Levels', change:0, trend:'stable' },
    ],
    opportunities:[
      { label:'AP Clinic Supply Agreement', type:'Distributor', fit:91, timeline:'0–30 days' },
      { label:'Pharmacy Network Deal', type:'Distributor', fit:86, timeline:'0–30 days' },
      { label:'Telehealth Platform', type:'Tech', fit:78, timeline:'30–60 days' },
      { label:'Export (NZ / Asia)', type:'Exporter', fit:74, timeline:'30–60 days' },
      { label:'Hospital Channel', type:'Distributor', fit:66, timeline:'60+ days' },
    ],
    atGlance:[
      { label:'Population', value:'26.5M' }, { label:'GDP (Nominal)', value:'$1.73T' },
      { label:'Currency', value:'AUD (A$)' }, { label:'Language', value:'English' },
      { label:'Ease of Importing', value:'Rank 14 / 190' }, { label:'Logistics Performance', value:'3.8 / 5' },
    ],
    coverageScore:91,
  },
  canada: {
    accessTier:'ESTABLISHED', accessScore:68, accessColor:'#5dcaa5', viewLabel:'OPERATOR VIEW',
    reviewStatus:{ label:'Accessible', gated:false },
    logisticsReadiness:'High', infraQuality:'High', customsEfficiency:'High',
    openOpportunities:44, highFit:18, shortlist:11,
    metrics:[
      { label:'Channel Readiness', score:72, color:'#5dcaa5', desc:'High', sub:'Health Canada licensed distribution network' },
      { label:'Partner Availability', score:68, color:'#c6a55a', desc:'Good', sub:'Licensed processors and provincial retailers' },
      { label:'Operating Readiness', score:65, color:'#c6a55a', desc:'Moderate', sub:'Complex provincial regulatory frameworks' },
    ],
    channelOverview:[
      { label:'Distribution Model', icon:'⇄', value:'Provincial Board + Licensed' },
      { label:'Retail Access', icon:'🏪', status:'Strong' },
      { label:'Online Retail', icon:'💻', status:'Strong' },
      { label:'Wholesale Access', icon:'📦', status:'Strong' },
      { label:'Import Pathway Depth', icon:'🔧', status:'Medium' },
      { label:'Channel Concentration', icon:'📊', status:'Low' },
      { label:'Average Tier', icon:'◆', value:'Tier 1–2' },
      { label:'Go-to-Market Complexity', icon:'⬡', status:'High' },
    ],
    partnerCounts:[
      { label:'Licensed Producers', value:'878' }, { label:'Qualified Partners', value:'156' },
      { label:'Service Providers', value:'312' }, { label:'New in 90 Days', value:'22' },
    ],
    topDistributors:[
      { name:'Aurora Cannabis', coverage:'National', specialties:'Cannabis, Export', readiness:'High' },
      { name:'Canopy Growth', coverage:'National', specialties:'Cannabis, Medical', readiness:'High' },
      { name:'Tilray Brands', coverage:'National', specialties:'Medical, Rec', readiness:'High' },
      { name:'Cronos Group', coverage:'National', specialties:'Medical, Research', readiness:'Medium' },
      { name:'HEXO Corp', coverage:'QC, ON', specialties:'Rec, Medical', readiness:'Medium' },
    ],
    operatingReqs:[
      { label:'Health Canada Licence', status:'Required' }, { label:'Security Clearance', status:'Required' },
      { label:'GMP Certification', status:'Required' }, { label:'Provincial Registration', status:'Required' },
      { label:'Excise Licensing', status:'Required' }, { label:'Lab Testing (COA)', status:'Required' },
      { label:'Track and Trace', status:'Required' },
    ],
    corridors:[
      { from:'Toronto', to:'Vancouver', mode:'Air', efficiency:'High', cost:'1.2' },
      { from:'Toronto', to:'Montreal', mode:'Road', efficiency:'High', cost:'1.0' },
      { from:'Vancouver', to:'Calgary', mode:'Road', efficiency:'High', cost:'1.1' },
      { from:'Montreal', to:'Halifax', mode:'Road', efficiency:'Medium', cost:'1.2' },
      { from:'Toronto', to:'Winnipeg', mode:'Road', efficiency:'Medium', cost:'1.2' },
    ],
    movement:[
      { category:'Adult-Use Flower', change:6.2, trend:'up' }, { category:'Edibles', change:9.4, trend:'up' },
      { category:'Extracts', change:7.8, trend:'up' }, { category:'Medical Supply', change:3.1, trend:'up' },
      { category:'Price Trends', change:2.1, trend:'down' }, { category:'Inventory Levels', change:0, trend:'stable' },
    ],
    opportunities:[
      { label:'Export to Germany', type:'Exporter', fit:89, timeline:'0–30 days' },
      { label:'Medical Retail Expansion', type:'Distributor', fit:82, timeline:'0–30 days' },
      { label:'Edibles Processing', type:'Processor', fit:76, timeline:'30–60 days' },
      { label:'Research Partnership', type:'Research', fit:71, timeline:'30–60 days' },
      { label:'Export to Australia', type:'Exporter', fit:68, timeline:'60+ days' },
    ],
    atGlance:[
      { label:'Population', value:'38.2M' }, { label:'GDP (Nominal)', value:'$2.14T' },
      { label:'Currency', value:'CAD (C$)' }, { label:'Language', value:'English, French' },
      { label:'Ease of Importing', value:'Rank 23 / 190' }, { label:'Logistics Performance', value:'3.9 / 5' },
    ],
    coverageScore:88,
  },
  israel: {
    accessTier:'HIGH ACCESS', accessScore:76, accessColor:'#5dcaa5', viewLabel:'EXPORTER VIEW',
    reviewStatus:{ label:'Accessible', gated:false },
    logisticsReadiness:'High', infraQuality:'High', customsEfficiency:'Medium',
    openOpportunities:18, highFit:8, shortlist:5,
    metrics:[
      { label:'Channel Readiness', score:76, color:'#5dcaa5', desc:'High', sub:'IMCA/MOH licensed operator network' },
      { label:'Partner Availability', score:71, color:'#c6a55a', desc:'Good', sub:'EU-GMP certified export operators' },
      { label:'Operating Readiness', score:74, color:'#5dcaa5', desc:'High', sub:'120K+ registered patient base' },
    ],
    channelOverview:[
      { label:'Distribution Model', icon:'⇄', value:'HMO + Pharmacy Direct' },
      { label:'Pharmacy Access', icon:'🏪', status:'Strong' },
      { label:'HMO Network', icon:'📦', status:'Strong' },
      { label:'Export Pathway', icon:'💻', status:'Strong' },
      { label:'EU-GMP Operators', icon:'🔧', status:'High' },
      { label:'Channel Concentration', icon:'📊', status:'Medium' },
      { label:'Average Tier', icon:'◆', value:'Tier 1' },
      { label:'Go-to-Market Complexity', icon:'⬡', status:'Medium' },
    ],
    partnerCounts:[
      { label:'Licensed Operators', value:'22' }, { label:'EU-GMP Certified', value:'14' },
      { label:'Service Providers', value:'67' }, { label:'New in 90 Days', value:'3' },
    ],
    topDistributors:[
      { name:'BOL Pharma', coverage:'National', specialties:'Medical, Export', readiness:'High' },
      { name:'Tikun Olam', coverage:'National', specialties:'Medical, Research', readiness:'High' },
      { name:'Cannbit', coverage:'National', specialties:'Medical, EU Export', readiness:'High' },
      { name:'Intercure', coverage:'National', specialties:'Medical, Pharma', readiness:'High' },
      { name:'iCan', coverage:'National', specialties:'Medical Platform', readiness:'Medium' },
    ],
    operatingReqs:[
      { label:'IMCA Export Licence', status:'Required' }, { label:'EU-GMP Certification', status:'Required' },
      { label:'MOH Approval', status:'Required' }, { label:'Local Partner', status:'Recommended' },
      { label:'Price Regulation', status:'No' }, { label:'Lab Testing (COA)', status:'Required' },
      { label:'Import Country Permits', status:'Required' },
    ],
    corridors:[
      { from:'Tel Aviv', to:'Frankfurt', mode:'Air', efficiency:'High', cost:'1.3' },
      { from:'Tel Aviv', to:'London', mode:'Air', efficiency:'High', cost:'1.3' },
      { from:'Tel Aviv', to:'Amsterdam', mode:'Air', efficiency:'High', cost:'1.2' },
      { from:'Tel Aviv', to:'Sydney', mode:'Air', efficiency:'Medium', cost:'1.6' },
      { from:'Tel Aviv', to:'Warsaw', mode:'Air', efficiency:'High', cost:'1.2' },
    ],
    movement:[
      { category:'EU Exports', change:22.4, trend:'up' }, { category:'Flower (Medical)', change:8.6, trend:'up' },
      { category:'Patient Registrations', change:6.2, trend:'up' }, { category:'HMO Prescriptions', change:4.4, trend:'up' },
      { category:'Price Trends', change:0, trend:'stable' }, { category:'Inventory Levels', change:0, trend:'stable' },
    ],
    opportunities:[
      { label:'EU Export Agreement', type:'Exporter', fit:93, timeline:'0–30 days' },
      { label:'German GKV Supply', type:'Importer', fit:88, timeline:'0–30 days' },
      { label:'Polish Market Entry', type:'Importer', fit:82, timeline:'30–60 days' },
      { label:'Australian Supply', type:'Importer', fit:74, timeline:'30–60 days' },
      { label:'UK Medical Supply', type:'Importer', fit:67, timeline:'60+ days' },
    ],
    atGlance:[
      { label:'Population', value:'9.7M' }, { label:'GDP (Nominal)', value:'$522B' },
      { label:'Currency', value:'ILS (₪)' }, { label:'Language', value:'Hebrew, Arabic' },
      { label:'Ease of Exporting', value:'Rank 35 / 190' }, { label:'Logistics Performance', value:'3.6 / 5' },
    ],
    coverageScore:89,
  },
}

function getIntelData(slug: string): IntelData {
  const key = slug.toLowerCase().replace(/\s+/g, '-')
  if (INTEL[key]) return INTEL[key]
  const partials = ['france','italy','netherlands','portugal','poland','united-states']
  if (partials.includes(key)) {
    return {
      accessTier:'PARTIAL ACCESS', accessScore:52, accessColor:'#c6a55a', viewLabel:'INTELLIGENCE VIEW',
      reviewStatus:{ label:'Partial', gated:false },
      logisticsReadiness:'Medium', infraQuality:'Medium', customsEfficiency:'Medium',
      openOpportunities:8, highFit:3, shortlist:1,
      metrics:[
        { label:'Channel Readiness', score:55, color:'#c6a55a', desc:'Partial', sub:'Limited intelligence coverage available' },
        { label:'Partner Availability', score:48, color:'#fbbf24', desc:'Limited', sub:'Review required for full partner access' },
        { label:'Operating Readiness', score:51, color:'#c6a55a', desc:'Partial', sub:'Orientation data only' },
      ],
      channelOverview:[], partnerCounts:[], topDistributors:[], operatingReqs:[],
      corridors:[], movement:[], opportunities:[], atGlance:[], coverageScore:52,
    }
  }
  return {
    accessTier:'REVIEW REQUIRED', accessScore:35, accessColor:'#fbbf24', viewLabel:'INTELLIGENCE VIEW',
    reviewStatus:{ label:'Review Required', gated:true },
    logisticsReadiness:'Unknown', infraQuality:'Unknown', customsEfficiency:'Unknown',
    openOpportunities:0, highFit:0, shortlist:0,
    metrics:[
      { label:'Channel Readiness', score:35, color:'#fbbf24', desc:'Limited', sub:'Request review for full intelligence' },
      { label:'Partner Availability', score:28, color:'#f87171', desc:'Restricted', sub:'Review required for partner access' },
      { label:'Operating Readiness', score:32, color:'#fbbf24', desc:'Limited', sub:'Static orientation data only' },
    ],
    channelOverview:[], partnerCounts:[], topDistributors:[], operatingReqs:[],
    corridors:[], movement:[], opportunities:[], atGlance:[], coverageScore:28,
  }
}

// ── ATOMS ────────────────────────────────────────────────────────────────────
const READINESS_COLOR: Record<string, string> = {
  High:'#5dcaa5', Strong:'#5dcaa5', Good:'#c6a55a', Medium:'#fbbf24', Improving:'#fbbf24',
  Developing:'#fbbf24', Low:'#f87171', Limited:'#f87171', Unknown:'rgba(243,240,234,0.25)',
}
const REQ_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Required:    { bg:'rgba(239,68,68,0.1)',   color:'#f87171', border:'rgba(239,68,68,0.25)' },
  Recommended: { bg:'rgba(198,165,90,0.1)',  color:'#c6a55a', border:'rgba(198,165,90,0.28)' },
  No:          { bg:'rgba(255,255,255,0.04)', color:'rgba(243,240,234,0.35)', border:'rgba(255,255,255,0.08)' },
}
const EFF_COLOR: Record<string, string> = { High:'#5dcaa5', Medium:'#fbbf24', Low:'#f87171' }

function Pill({ children, color, bg, border }: { children: React.ReactNode; color: string; bg: string; border: string }) {
  return (
    <span style={{ background:bg, color, border:`1px solid ${border}`, borderRadius:4, fontSize:10, fontWeight:600, padding:'2px 7px', whiteSpace:'nowrap' as const, letterSpacing:'0.04em' }}>
      {children}
    </span>
  )
}

function DonutGauge({ score, color, size = 72 }: { score: number; color: string; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 6px ${color}66)` }} />
    </svg>
  )
}

function MiniSparkline({ trend, color }: { trend: 'up'|'stable'|'down'; color: string }) {
  const paths: Record<string, string> = {
    up:     'M0 18 L8 14 L16 10 L24 6 L32 2',
    stable: 'M0 10 L8 10 L16 11 L24 10 L32 10',
    down:   'M0 2 L8 6 L16 10 L24 14 L32 18',
  }
  return (
    <svg width={36} height={20} style={{ flexShrink:0 }}>
      <path d={paths[trend]} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MiniGlobe({ lat, lng }: { lat: number; lng: number }) {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(lng)
  const afRef  = useRef<number | null>(null)
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
          s?ctx.lineTo(p.sx,p.sy):(ctx.moveTo(p.sx,p.sy),s=true)
        }
        ctx.strokeStyle=lt===0?'rgba(198,165,90,0.22)':'rgba(198,165,90,0.07)'; ctx.lineWidth=lt===0?.9:.4; ctx.stroke()
      }
      for (let lo=-180;lo<180;lo+=30) {
        ctx.beginPath(); let s=false
        for (let lt=-88;lt<=88;lt+=3) {
          const p=proj(lt,lo); if(p.z<-.08){s=false;continue}
          s?ctx.lineTo(p.sx,p.sy):(ctx.moveTo(p.sx,p.sy),s=true)
        }
        ctx.strokeStyle='rgba(198,165,90,0.05)'; ctx.lineWidth=.35; ctx.stroke()
      }
      const pc=proj(lat,0); if(pc.z>0) {
        const t=(Date.now()%2000)/2000
        const gg=ctx.createRadialGradient(pc.sx,pc.sy,0,pc.sx,pc.sy,22)
        gg.addColorStop(0,'rgba(93,202,165,0.35)'); gg.addColorStop(1,'rgba(0,0,0,0)')
        ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(pc.sx,pc.sy,22,0,Math.PI*2); ctx.fill()
        ctx.strokeStyle=`rgba(93,202,165,${(1-t)*.6})`; ctx.lineWidth=1.2
        ctx.beginPath(); ctx.arc(pc.sx,pc.sy,7+t*10,0,Math.PI*2); ctx.stroke()
        ctx.fillStyle='#5dcaa5'; ctx.beginPath(); ctx.arc(pc.sx,pc.sy,5,0,Math.PI*2); ctx.fill()
      }
      const ev=ctx.createRadialGradient(cx,cy,r*.78,cx,cy,r)
      ev.addColorStop(0,'rgba(0,0,0,0)'); ev.addColorStop(1,'rgba(2,7,13,0.7)')
      ctx.fillStyle=ev; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()
      ctx.restore()
      const ar=ctx.createRadialGradient(cx,cy,r*.98,cx,cy,r+10)
      ar.addColorStop(0,'rgba(59,130,160,0.18)'); ar.addColorStop(1,'rgba(59,130,160,0)')
      ctx.fillStyle=ar; ctx.beginPath(); ctx.arc(cx,cy,r+10,0,Math.PI*2); ctx.arc(cx,cy,r*.98,0,Math.PI*2,true); ctx.fill()
    }
    const tick = () => { rotRef.current = (rotRef.current + .12)%360; draw(); afRef.current = requestAnimationFrame(tick) }
    tick()
    return () => { if(afRef.current!==null) cancelAnimationFrame(afRef.current) }
  }, [lat, lng])
  return <canvas ref={cvRef} style={{ display:'block', borderRadius:8 }} />
}

function SectionCard({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <div style={{ background:C.bg3, border:`1px solid ${C.bDim}`, borderRadius:12, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:`1px solid ${C.bDim}` }}>
        <span style={{ color:C.goldBrt, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>{title}</span>
        {action && <button style={{ background:'none', border:'none', color:C.gold, fontSize:10.5, cursor:'pointer', fontFamily:'inherit', padding:0 }}>{action} →</button>}
      </div>
      <div style={{ padding:'10px 14px' }}>{children}</div>
    </div>
  )
}

const LAYERS = ['Market Access Signal','Channel Readiness','Legal Status','Source Coverage','Corridor Activity']

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function CountryIntelDashboard({ country }: { country: CountryDashboardSummary }) {
  const [layer,    setLayer]    = useState(LAYERS[0])
  const [globeTab, setGlobeTab] = useState<'global'|'regional'>('global')
  const intel = getIntelData(country.slug)
  const isLive = intel.channelOverview.length > 0

  const LATLNG: Record<string, [number,number]> = {
    brazil:[-15,-48], germany:[52,10], australia:[-25,133], canada:[56,-96],
    israel:[31,35], france:[47,2], netherlands:[52,5], italy:[43,12],
    portugal:[39,-8], poland:[52,21],
  }
  const [lat, lng] = LATLNG[country.slug.toLowerCase()] ?? [20, 0]

  return (
    <div style={{ minHeight:'100%', background:C.bg0, padding:'16px', display:'flex', flexDirection:'column', gap:12, fontFamily:"'DM Sans', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' as const }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <h1 style={{ margin:0, fontSize:28, fontWeight:700, color:C.tp, letterSpacing:'-0.01em', fontFamily:"'Cinzel', Georgia, serif" }}>
              {country.displayName}
            </h1>
            <span style={{ background:`${intel.accessColor}18`, color:intel.accessColor, border:`1px solid ${intel.accessColor}45`, borderRadius:20, fontSize:9.5, fontWeight:700, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase' as const }}>
              {intel.accessTier}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' as const }}>
            <span style={{ background:C.goldBg, border:`1px solid ${C.bGold}`, borderRadius:5, color:C.gold, fontSize:9.5, fontWeight:700, padding:'2px 8px', letterSpacing:'0.08em' }}>
              {intel.viewLabel}
            </span>
            {[`${country.iso2} · ${country.iso3}`, country.region, country.subregion].filter(Boolean).map(v => (
              <span key={v} style={{ color:C.tm, fontSize:10.5 }}>
                <span style={{ marginRight:8, color:'rgba(255,255,255,0.12)' }}>|</span>{v}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, marginTop:4 }}>
          <span style={{ color:C.tm, fontSize:10.5 }}>Last reviewed: {country.lastUpdated}</span>
          <button style={{ background:C.goldBg, border:`1px solid ${C.bGoldHi}`, borderRadius:8, padding:'7px 14px', color:C.goldBrt, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.04em' }}>
            Request Harbourview Review
          </button>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
        {intel.metrics.map(m => (
          <div key={m.label} style={{ background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:'14px', display:'flex', flexDirection:'column', gap:8 }}>
            <span style={{ color:C.tm, fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>{m.label}</span>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ position:'relative' as const, flexShrink:0 }}>
                <DonutGauge score={m.score} color={m.color} size={68} />
                <div style={{ position:'absolute' as const, inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                  <span style={{ color:m.color, fontSize:15, fontWeight:700, lineHeight:1 }}>{m.score}</span>
                  <span style={{ color:C.tm, fontSize:8, lineHeight:1.2 }}>/100</span>
                </div>
              </div>
              <div>
                <div style={{ color:m.color, fontSize:14, fontWeight:700, marginBottom:2 }}>{m.desc}</div>
                <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.4 }}>{m.sub}</div>
                <div style={{ color:C.tm, fontSize:9.5, marginTop:4 }}>Score {m.score} / 100</div>
              </div>
            </div>
          </div>
        ))}

        {/* Review Status card */}
        <div style={{ background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:'14px', display:'flex', flexDirection:'column', gap:8 }}>
          <span style={{ color:C.tm, fontSize:9.5, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>Review Status</span>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:68, height:68, borderRadius:'50%', background:intel.reviewStatus.gated?C.amberBg:C.greenBg, border:`1px solid ${intel.reviewStatus.gated?'rgba(245,158,11,0.28)':C.greenBdr}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={intel.reviewStatus.gated?C.amber:C.green} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                {intel.reviewStatus.gated
                  ? <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                  : <><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></>
                }
              </svg>
            </div>
            <div>
              <div style={{ color:intel.reviewStatus.gated?C.amber:C.green, fontSize:14, fontWeight:700, marginBottom:2 }}>{intel.reviewStatus.label}</div>
              <div style={{ color:C.ts, fontSize:10.5, lineHeight:1.4 }}>
                {intel.reviewStatus.gated ? 'Detailed review required before engagement' : 'Market accessible — proceed with standard intake'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN MIDDLE ROW ── */}
      {isLive ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>

          {/* Globe */}
          <div style={{ background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:0, padding:'8px 14px', borderBottom:`1px solid ${C.bDim}` }}>
              {(['global','regional'] as const).map(tab => (
                <button key={tab} onClick={() => setGlobeTab(tab)} style={{ background:'none', border:'none', borderBottom:`2px solid ${globeTab===tab?C.gold:'transparent'}`, color:globeTab===tab?C.tp:C.tm, fontSize:11, fontWeight:globeTab===tab?600:400, padding:'4px 12px 8px', cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase' as const, letterSpacing:'0.08em', marginBottom:-1 }}>
                  {tab === 'global' ? 'Global View' : 'Regional View'}
                </button>
              ))}
            </div>
            <div style={{ padding:'10px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke={C.gold} strokeWidth={1.4}><path d="M2 4h2M6 4h8M2 8h4M8 8h6M2 12h6M10 12h4"/></svg>
                <span style={{ color:C.gold, fontSize:9.5, fontWeight:700, letterSpacing:'0.08em' }}>SELECT LAYER</span>
              </div>
              {LAYERS.map(l => (
                <label key={l} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6, cursor:'pointer' }}>
                  <div style={{ width:14, height:14, borderRadius:'50%', border:`1.5px solid ${layer===l?C.gold:C.bMid}`, background:layer===l?C.goldBg:'none', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {layer===l && <div style={{ width:6, height:6, borderRadius:'50%', background:C.gold }} />}
                  </div>
                  <span onClick={() => setLayer(l)} style={{ color:layer===l?C.tp:C.tm, fontSize:11 }}>{l}</span>
                </label>
              ))}
            </div>
            <div style={{ padding:'0 14px 12px', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <MiniGlobe lat={lat} lng={lng} />
            </div>
            <div style={{ padding:'8px 14px', borderTop:`1px solid ${C.bDim}` }}>
              <button style={{ width:'100%', background:'none', border:`1px solid ${C.bGold}`, borderRadius:8, padding:'7px', color:C.gold, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                View country profile
              </button>
            </div>
          </div>

          {/* Channel Overview */}
          <SectionCard title="Channel Overview" action="View all">
            <table style={{ width:'100%', borderCollapse:'collapse' as const }}>
              <thead>
                <tr>
                  {['', 'Metric', 'Status / Value'].map(h => (
                    <th key={h} style={{ color:C.tm, fontSize:9, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, textAlign:'left' as const, padding:'0 0 8px', borderBottom:`1px solid ${C.bDim}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {intel.channelOverview.map((row, i) => {
                  const sc = row.status ? (READINESS_COLOR[row.status] ?? C.tm) : undefined
                  return (
                    <tr key={i}>
                      <td style={{ padding:'7px 6px 7px 0', borderBottom:`1px solid ${C.bDim}`, color:C.tm, fontSize:12, width:20 }}>{row.icon}</td>
                      <td style={{ padding:'7px 10px 7px 0', borderBottom:`1px solid ${C.bDim}`, color:C.ts, fontSize:11 }}>{row.label}</td>
                      <td style={{ padding:'7px 0', borderBottom:`1px solid ${C.bDim}`, textAlign:'right' as const }}>
                        {row.value ? (
                          <span style={{ color:C.ts, fontSize:11, background:C.bg4, border:`1px solid ${C.bDim}`, borderRadius:4, padding:'1px 7px' }}>{row.value}</span>
                        ) : row.status && sc ? (
                          <span style={{ color:sc, background:`${sc}15`, border:`1px solid ${sc}30`, borderRadius:4, fontSize:10, fontWeight:600, padding:'2px 7px' }}>{row.status}</span>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </SectionCard>

          {/* Partner Landscape */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <SectionCard title="Partner Landscape" action="View all">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                {intel.partnerCounts.map(pc => (
                  <div key={pc.label} style={{ background:C.bg4, borderRadius:8, padding:'9px 10px' }}>
                    <div style={{ color:C.tp, fontSize:18, fontWeight:700, lineHeight:1 }}>{pc.value}</div>
                    <div style={{ color:C.tm, fontSize:9.5, marginTop:3 }}>{pc.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:`1px solid ${C.bDim}`, paddingTop:10 }}>
                <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:8 }}>Top Distributor Partners</div>
                <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:11 }}>
                  <thead>
                    <tr>
                      {['Partner','Coverage','Readiness'].map(h => (
                        <th key={h} style={{ color:C.tm, fontSize:9, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.07em', textAlign:'left' as const, paddingBottom:6, borderBottom:`1px solid ${C.bDim}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intel.topDistributors.map((d, i) => {
                      const rc = d.readiness === 'High' ? C.green : d.readiness === 'Medium' ? C.amber : C.red
                      return (
                        <tr key={i}>
                          <td style={{ padding:'6px 0', borderBottom:`1px solid ${C.bDim}`, color:C.ts }}>{d.name}</td>
                          <td style={{ padding:'6px 0', borderBottom:`1px solid ${C.bDim}`, color:C.tm }}>{d.coverage}</td>
                          <td style={{ padding:'6px 0', borderBottom:`1px solid ${C.bDim}`, textAlign:'right' as const }}>
                            <span style={{ color:rc, background:`${rc}15`, border:`1px solid ${rc}30`, borderRadius:4, fontSize:9.5, fontWeight:600, padding:'1px 6px' }}>{d.readiness}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <button style={{ marginTop:10, background:'none', border:'none', color:C.gold, fontSize:10.5, cursor:'pointer', fontFamily:'inherit', padding:0 }}>View all partners & opportunities →</button>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        <div style={{ background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:'40px', textAlign:'center' as const }}>
          <div style={{ color:C.tm, fontSize:13, marginBottom:12 }}>Full commercial intelligence not available for this market.</div>
          <button style={{ background:C.goldBg, border:`1px solid ${C.bGold}`, borderRadius:8, padding:'8px 18px', color:C.goldBrt, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Request intelligence review →
          </button>
        </div>
      )}

      {/* ── BOTTOM ROW ── */}
      {isLive && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>

          {/* Operating Requirements */}
          <SectionCard title="Operating Requirements">
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {intel.operatingReqs.map((r, i) => {
                const s = REQ_STYLE[r.status]
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <span style={{ color:C.ts, fontSize:11, lineHeight:1.3 }}>{r.label}</span>
                    <Pill color={s.color} bg={s.bg} border={s.border}>{r.status}</Pill>
                  </div>
                )
              })}
            </div>
            <button style={{ marginTop:10, background:'none', border:'none', color:C.gold, fontSize:10.5, cursor:'pointer', fontFamily:'inherit', padding:0 }}>View compliance & regulatory details →</button>
          </SectionCard>

          {/* Logistics & Corridors */}
          <SectionCard title="Logistics & Corridors">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
              {[
                { label:'Logistics Readiness', val:intel.logisticsReadiness },
                { label:'Infrastructure Quality', val:intel.infraQuality },
                { label:'Customs Efficiency', val:intel.customsEfficiency },
              ].map(item => {
                const col = EFF_COLOR[item.val] ?? C.tm
                return (
                  <div key={item.label}>
                    <div style={{ color:C.tm, fontSize:9, textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:4 }}>{item.label}</div>
                    <div style={{ color:col, fontSize:12, fontWeight:700 }}>{item.val}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:8 }}>Key Corridors</div>
            <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:10.5 }}>
              <thead>
                <tr>
                  {['Corridor','Mode','Eff.','Cost'].map(h => (
                    <th key={h} style={{ color:C.tm, fontSize:9, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.06em', textAlign:'left' as const, paddingBottom:5, borderBottom:`1px solid ${C.bDim}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {intel.corridors.map((c, i) => (
                  <tr key={i}>
                    <td style={{ padding:'5px 0', borderBottom:`1px solid ${C.bDim}`, color:C.ts, fontSize:10.5 }}>{c.from} → {c.to}</td>
                    <td style={{ padding:'5px 4px', borderBottom:`1px solid ${C.bDim}`, color:C.tm, fontSize:10 }}>{c.mode}</td>
                    <td style={{ padding:'5px 4px', borderBottom:`1px solid ${C.bDim}` }}>
                      <span style={{ color:EFF_COLOR[c.efficiency]??C.tm, fontSize:10, fontWeight:600 }}>{c.efficiency}</span>
                    </td>
                    <td style={{ padding:'5px 0', borderBottom:`1px solid ${C.bDim}`, color:C.ts, textAlign:'right' as const, fontSize:10 }}>{c.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          {/* Market Movement */}
          <SectionCard title="Market Movement">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ color:C.tm, fontSize:10.5 }}>Demand Indicators (30 Days)</span>
              <span style={{ background:C.bg4, border:`1px solid ${C.bDim}`, borderRadius:5, color:C.ts, fontSize:10, padding:'2px 7px' }}>30D</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {intel.movement.map((m, i) => {
                const isUp = m.trend === 'up', isDown = m.trend === 'down'
                const col = isUp ? C.green : isDown ? C.red : C.tm
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <span style={{ color:C.ts, fontSize:11 }}>{m.category}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                      {m.trend === 'stable' ? (
                        <span style={{ color:C.tm, fontSize:10.5 }}>Stable</span>
                      ) : (
                        <span style={{ color:col, fontSize:10.5, fontWeight:600 }}>{isUp?'↑':'↓'} {Math.abs(m.change)}%</span>
                      )}
                      <MiniSparkline trend={m.trend} color={col} />
                    </div>
                  </div>
                )
              })}
            </div>
            <button style={{ marginTop:10, background:'none', border:'none', color:C.gold, fontSize:10.5, cursor:'pointer', fontFamily:'inherit', padding:0 }}>View market movement dashboard →</button>
          </SectionCard>

          {/* Partner Opportunities */}
          <SectionCard title="Partner Opportunities">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
              {[
                { label:'Open Opportunities', val:intel.openOpportunities },
                { label:'High Fit', val:intel.highFit },
                { label:'Shortlist', val:intel.shortlist },
              ].map(item => (
                <div key={item.label} style={{ background:C.bg4, borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ color:C.tp, fontSize:16, fontWeight:700, lineHeight:1 }}>{item.val}</div>
                  <div style={{ color:C.tm, fontSize:9, marginTop:3 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ color:C.tm, fontSize:9.5, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, marginBottom:8 }}>Top Opportunities</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {intel.opportunities.map((o, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:C.ts, fontSize:11, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{o.label}</div>
                    <div style={{ color:C.tm, fontSize:9.5 }}>{o.type} · {o.timeline}</div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' as const }}>
                    <span style={{ color:C.green, fontSize:11, fontWeight:700 }}>{o.fit}%</span>
                  </div>
                </div>
              ))}
            </div>
            <button style={{ marginTop:10, background:'none', border:'none', color:C.gold, fontSize:10.5, cursor:'pointer', fontFamily:'inherit', padding:0 }}>View all opportunities →</button>
          </SectionCard>
        </div>
      )}

      {/* ── AT A GLANCE + COVERAGE ── */}
      {intel.atGlance.length > 0 && (
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1, background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:'12px 14px' }}>
            <div style={{ color:C.goldBrt, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const, marginBottom:10 }}>
              {country.displayName} at a Glance
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'6px 16px' }}>
              {intel.atGlance.map(item => (
                <div key={item.label}>
                  <div style={{ color:C.tm, fontSize:9.5 }}>{item.label}</div>
                  <div style={{ color:C.ts, fontSize:11.5, fontWeight:500 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ width:180, background:C.bg2, border:`1px solid ${C.bDim}`, borderRadius:12, padding:'12px 14px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
            <div style={{ color:C.goldBrt, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const }}>Data Coverage</div>
            <div style={{ position:'relative' as const, width:72, height:72 }}>
              <DonutGauge score={intel.coverageScore} color={C.gold} size={72} />
              <div style={{ position:'absolute' as const, inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:C.goldBrt, fontSize:16, fontWeight:700 }}>{intel.coverageScore}%</span>
              </div>
            </div>
            <div style={{ color:C.tm, fontSize:10, textAlign:'center' as const }}>Overall Coverage</div>
          </div>
        </div>
      )}
    </div>
  )
}
