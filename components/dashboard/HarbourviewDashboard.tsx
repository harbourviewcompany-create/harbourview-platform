// @ts-nocheck
import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const C = {
  bg0: '#02070D', bg1: '#06101A', bg2: '#08131F',
  bg3: '#0B1826', bg4: '#0D1E30',
  bDim: 'rgba(255,255,255,0.07)',
  bMid: 'rgba(255,255,255,0.11)',
  bGold: 'rgba(212,164,74,0.35)',
  bGoldHi: 'rgba(212,164,74,0.65)',
  gold: '#D9A441', goldBrt: '#F2C46D',
  goldFill: 'rgba(217,164,65,0.12)',
  goldBg: 'rgba(217,164,65,0.07)',
  tp: '#F7F1E6', ts: '#B8C0C8', tm: '#6F7A86',
  green: '#6FCF7D', greenBg: 'rgba(111,207,125,0.12)',
  red: '#D65C4A',
};

// ═══════════════════════════════════════════════════════════
// TAG PALETTE
// ═══════════════════════════════════════════════════════════
const TAGS = {
  'Equipment':           ['rgba(59,130,160,0.18)',  '#5DAFC8', 'rgba(59,130,160,0.30)'],
  'Verified Seller':     ['rgba(74,154,107,0.18)',  '#6FCF7D', 'rgba(74,154,107,0.30)'],
  'Excellent Condition': ['rgba(255,255,255,0.06)', '#8A949E', 'rgba(255,255,255,0.10)'],
  'Cannabis':            ['rgba(74,154,107,0.18)',  '#6FCF7D', 'rgba(74,154,107,0.30)'],
  'Lab Tested':          ['rgba(139,95,168,0.18)',  '#B07ED4', 'rgba(139,95,168,0.30)'],
  'Consumables':         ['rgba(184,115,51,0.18)',  '#D49560', 'rgba(184,115,51,0.30)'],
  'New':                 ['rgba(217,164,65,0.18)',  '#D9A441', 'rgba(217,164,65,0.35)'],
  'Distressed Equipment':['rgba(214,92,74,0.18)',   '#E07868', 'rgba(214,92,74,0.30)'],
  'Business Opportunity':['rgba(139,95,168,0.18)',  '#B07ED4', 'rgba(139,95,168,0.30)'],
};

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════
const LISTINGS = [
  { id:1, emoji:'🏭', bg:'#091828', title:'Stainless Steel Mixing Tank 500L',   desc:'Food grade 316 stainless steel mixing tank. Excellent condition. Minimal use.',           tags:['Equipment','Verified Seller','Excellent Condition'], loc:'Auckland',    price:'NZD $8,750'     },
  { id:2, emoji:'🌿', bg:'#091408', title:'Premium Flower – Indoor Grown',       desc:'Top shelf indoor grown flower. Lab tested and certified.',                               tags:['Cannabis','Verified Seller','Lab Tested'],           loc:'Wellington',   price:'NZD $4,200 / kg' },
  { id:3, emoji:'🧪', bg:'#0A1610', title:'Nutrient Solution Starter Kit',       desc:'Complete 3-part nutrient solution kit.',                                                  tags:['Consumables','New','Verified Seller'],               loc:'Christchurch', price:'NZD $320'        },
  { id:4, emoji:'⚗️', bg:'#1A0D08', title:'Distressed Extraction Equipment',     desc:'Falling film evaporator system. Needs minor refurbishment.',                             tags:['Distressed Equipment','Verified Seller'],            loc:'Hamilton',     price:'NZD $12,500'    },
  { id:5, emoji:'🏗️', bg:'#08101C', title:'Turnkey Greenhouse Facility',         desc:'1,200m² greenhouse with climate systems. Ready for cultivation.',                       tags:['Business Opportunity','Verified Seller'],            loc:'Auckland',     price:'NZD $950,000'   },
];

const SIGNALS = [
  { id:1, icon:'📋', headline:'NZ government reviews cannabis export licensing framework.',                tag:'REGULATION', ts:['rgba(74,154,107,0.18)',  '#6FCF7D', 'rgba(74,154,107,0.35)'],  time:'2h ago'  },
  { id:2, icon:'📈', headline:'Demand for extraction equipment rising across APAC markets.',             tag:'MARKET',     ts:['rgba(59,130,160,0.18)',  '#5DAFC8', 'rgba(59,130,160,0.35)'],  time:'6h ago'  },
  { id:3, icon:'🌿', headline:'New GMP guidance released for medicinal cannabis manufacturers.',         tag:'COMPLIANCE', ts:['rgba(217,164,65,0.18)', '#D9A441', 'rgba(217,164,65,0.35)'],  time:'1d ago'  },
  { id:4, icon:'🤝', headline:'Australia-NZ trade talks may expand cannabis product access.',            tag:'TRADE',      ts:['rgba(139,95,168,0.18)', '#B07ED4', 'rgba(139,95,168,0.35)'],  time:'2d ago'  },
  { id:5, icon:'💰', headline:'Investor interest in NZ cultivation infrastructure rising.',              tag:'INVESTMENT', ts:['rgba(184,115,51,0.18)', '#D49560', 'rgba(184,115,51,0.35)'],  time:'3d ago'  },
];

const EDU = [
  { icon:'🩺', title:'Doctors & Prescribers', desc:'Clinical guidance & prescribing'   },
  { icon:'💊', title:'Pharmacists',            desc:'Dosing, interactions & safety'     },
  { icon:'📐', title:'Dosage Education',       desc:'Personalize dosing'                },
  { icon:'⚖️', title:'Compliance & Reg.',      desc:'Stay audit-ready'                  },
  { icon:'🗺️', title:'Country Rules (NZ)',     desc:'Adult Use: Limited'                },
];

const CATS = [
  { id:'consumables', label:'Consumables',          count:'1,248' },
  { id:'cannabis',    label:'Cannabis',              count:'892'   },
  { id:'equipment',   label:'Equipment',             count:'1,112' },
  { id:'distressed',  label:'Distressed Equipment',  count:'315'   },
  { id:'services',    label:'Services',              count:'674'   },
];

const NAV_ITEMS = [
  { id:'dashboard',   label:'Dashboard',      icon:'⊞'  },
  { id:'marketplace', label:'Marketplace',    icon:'🛒'  },
  { id:'intel',       label:'Intel Signals',  icon:'📡'  },
  { id:'education',   label:'Education Hub',  icon:'📚'  },
  { id:'connections', label:'Connections',    icon:'🔗'  },
  { id:'activity',    label:'My Activity',    icon:'⚡'  },
  { id:'messages',    label:'Messages',       icon:'✉️',  badge:3 },
  { id:'searches',    label:'Saved Searches', icon:'🔍'  },
  { id:'account',     label:'Account',        icon:'👤'  },
];

// ═══════════════════════════════════════════════════════════
// SVG ATOMS
// ═══════════════════════════════════════════════════════════
const Compass = ({ s=30 }) => (
  <svg width={s} height={s} viewBox="0 0 34 34" fill="none">
    <polygon points="17,1 19.5,15 17,17 14.5,15"         fill="#D9A441"/>
    <polygon points="33,17 19,19.5 17,17 19,14.5"         fill="#D9A441"/>
    <polygon points="17,33 14.5,19 17,17 19.5,19"         fill="#D9A441"/>
    <polygon points="1,17 15,14.5 17,17 15,19.5"          fill="#D9A441"/>
    <polygon points="28.5,5.5 19.2,15.2 17,17 19.5,14.5"  fill="#F2C46D" opacity="0.65"/>
    <polygon points="28.5,28.5 19.2,19.2 17,17 19.5,19.5" fill="#F2C46D" opacity="0.65"/>
    <polygon points="5.5,28.5 14.8,19.2 17,17 14.5,19.5"  fill="#F2C46D" opacity="0.65"/>
    <polygon points="5.5,5.5 14.8,14.8 17,17 14.5,14.5"   fill="#F2C46D" opacity="0.65"/>
    <circle cx="17" cy="17" r="2.8" fill="#02070D"/>
    <circle cx="17" cy="17" r="1.2" fill="#D9A441"/>
  </svg>
);

const ShieldCheck = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{flexShrink:0}}>
    <path d="M6.5 1L11 3.2V6.5C11 9 8.8 11.2 6.5 12C4.2 11.2 2 9 2 6.5V3.2L6.5 1Z"
      fill="rgba(74,154,107,0.25)" stroke="#6FCF7D" strokeWidth="0.8"/>
    <path d="M4.5 6.5L5.8 7.8L9 4.5" stroke="#6FCF7D" strokeWidth="1"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PinIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{flexShrink:0}}>
    <path d="M5 0C2.79 0 1 1.79 1 4C1 7 5 11.5 5 11.5C5 11.5 9 7 9 4C9 1.79 7.21 0 5 0ZM5 5.5C4.17 5.5 3.5 4.83 3.5 4C3.5 3.17 4.17 2.5 5 2.5C5.83 2.5 6.5 3.17 6.5 4C6.5 4.83 5.83 5.5 5 5.5Z"
      fill="#6F7A86"/>
  </svg>
);

const BookmarkIcon = ({ on }) => (
  <svg width="14" height="17" viewBox="0 0 14 17" fill="none">
    <path d="M1 1.5C1 1.22 1.22 1 1.5 1H12.5C12.78 1 13 1.22 13 1.5V15.5L7 11.5L1 15.5V1.5Z"
      fill={on ? 'rgba(217,164,65,0.22)' : 'none'}
      stroke={on ? '#D9A441' : '#6F7A86'}
      strokeWidth="1.2"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════
const TagChip = ({ label }) => {
  const [bg, color, border] = TAGS[label] || ['rgba(255,255,255,0.06)','#8A949E','rgba(255,255,255,0.10)'];
  return (
    <span style={{background:bg, color, border:`1px solid ${border}`, borderRadius:4,
      fontSize:10, fontWeight:500, padding:'2px 6px', whiteSpace:'nowrap', flexShrink:0}}>
      {label}
    </span>
  );
};

const SignalRow = ({ s }) => {
  const [bg, color, border] = s.ts;
  return (
    <div style={{display:'flex', alignItems:'flex-start', gap:9, padding:'9px 10px',
      borderRadius:8, background:C.bg3, border:`1px solid ${C.bDim}`}}>
      <div style={{width:28, height:28, borderRadius:7, background:'rgba(255,255,255,0.05)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0}}>
        {s.icon}
      </div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{color:C.ts, fontSize:11.5, lineHeight:1.4, marginBottom:5}}>{s.headline}</div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{background:bg, color, border:`1px solid ${border}`, borderRadius:4,
            fontSize:9.5, fontWeight:700, padding:'2px 6px', letterSpacing:'0.06em'}}>{s.tag}</span>
          <span style={{color:C.tm, fontSize:10}}>{s.time}</span>
        </div>
      </div>
    </div>
  );
};

const EduCard = ({ item, compact=false }) => (
  <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:5,
    padding:compact?'9px 5px':'10px 6px', borderRadius:10, background:C.bg3,
    border:`1px solid ${C.bDim}`, textAlign:'center', cursor:'pointer', flex:1, minWidth:0}}>
    <div style={{width:32, height:32, borderRadius:8, background:C.goldBg,
      border:`1px solid ${C.bGold}`, display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:15}}>{item.icon}</div>
    <div style={{color:C.ts, fontSize:10, fontWeight:500, lineHeight:1.3}}>{item.title}</div>
    {!compact && <div style={{color:C.tm, fontSize:9.5, lineHeight:1.2}}>{item.desc}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════
// GLOBE PLACEHOLDER
// ═══════════════════════════════════════════════════════════
const GlobePlaceholder = ({ minH=150 }) => (
  <div style={{borderRadius:12, position:'relative', overflow:'hidden', minHeight:minH,
    background:'radial-gradient(ellipse at 30% 45%, rgba(59,130,160,0.25) 0%, rgba(13,30,48,0.97) 55%, #06101A 100%)',
    border:`1px solid ${C.bGold}`, padding:'16px 14px',
    display:'flex', flexDirection:'column', justifyContent:'space-between'}}>

    {/* Decorative globe */}
    <div style={{position:'absolute', right:-28, bottom:-28, width:130, height:130,
      borderRadius:'50%', background:'radial-gradient(circle at 38% 35%, rgba(59,130,160,0.38), rgba(13,30,48,0.7) 55%, transparent)',
      border:'1px solid rgba(59,130,160,0.22)', boxShadow:'0 0 40px rgba(59,130,160,0.18)'}}/>

    {/* Grid lines on globe */}
    <svg style={{position:'absolute', right:-28, bottom:-28, width:130, height:130, opacity:0.2}} viewBox="0 0 130 130">
      {[32,65,98].map(y=><line key={y} x1="0" y1={y} x2="130" y2={y} stroke="white" strokeWidth="0.8"/>)}
      {[32,65,98].map(x=><line key={x} x1={x} y1="0" x2={x} y2="130" stroke="white" strokeWidth="0.8"/>)}
    </svg>

    {/* Network nodes */}
    {[[14,52],[29,24],[50,42],[66,61],[82,30],[42,72],[74,48]].map(([x,y],i)=>(
      <div key={i} style={{position:'absolute', left:`${x}%`, top:`${y}%`,
        width:3, height:3, borderRadius:'50%', background:C.gold,
        boxShadow:`0 0 5px ${C.gold}`, opacity:0.75}}/>
    ))}

    {/* Connection lines */}
    <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.22}} viewBox="0 0 300 150" preserveAspectRatio="none">
      <line x1="42" y1="78"  x2="87" y2="36"  stroke="#D9A441" strokeWidth="0.8"/>
      <line x1="87" y1="36"  x2="150" y2="63" stroke="#D9A441" strokeWidth="0.8"/>
      <line x1="150" y1="63" x2="198" y2="92" stroke="#D9A441" strokeWidth="0.8"/>
      <line x1="126" y1="108" x2="150" y2="63" stroke="#D9A441" strokeWidth="0.8"/>
      <line x1="222" y1="45"  x2="198" y2="92" stroke="#D9A441" strokeWidth="0.8"/>
    </svg>

    <div>
      <div style={{color:C.gold, fontSize:10.5, fontWeight:700, letterSpacing:'0.12em',
        textTransform:'uppercase', marginBottom:3}}>Explore the Globe</div>
      <div style={{color:C.ts, fontSize:11, lineHeight:1.45}}>
        See opportunity across<br/>100+ markets.
      </div>
    </div>

    <button style={{marginTop:12, display:'flex', alignItems:'center', gap:6,
      background:'none', border:`1px solid ${C.bGold}`, borderRadius:7,
      color:C.gold, fontSize:11, fontWeight:600, padding:'7px 13px',
      cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.04em', alignSelf:'flex-start'}}>
      View Globe →
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════
// LISTING ROW (DESKTOP)
// ═══════════════════════════════════════════════════════════
const ListingRow = ({ l, saved, onSave }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      display:'flex', gap:10, padding:'9px 10px', borderRadius:10,
      background:hov?C.bg4:C.bg3, border:`1px solid ${hov?C.bGold:C.bDim}`,
      alignItems:'flex-start', transition:'all 0.15s', cursor:'default'}}>

      {/* Thumbnail */}
      <div style={{width:68, height:62, borderRadius:8, background:l.bg,
        border:`1px solid ${C.bDim}`, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:24, flexShrink:0}}>{l.emoji}</div>

      {/* Body */}
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:3}}>
          <span style={{color:C.tp, fontSize:12.5, fontWeight:500, lineHeight:1.3}}>{l.title}</span>
          <ShieldCheck />
        </div>
        <div style={{color:C.ts, fontSize:11, marginBottom:5, lineHeight:1.4,
          overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1,
          WebkitBoxOrient:'vertical'}}>{l.desc}</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
          {l.tags.map(t=><TagChip key={t} label={t}/>)}
        </div>
      </div>

      {/* Right */}
      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end',
        gap:5, flexShrink:0, minWidth:88}}>
        <div style={{display:'flex', alignItems:'center', gap:3, color:C.tm, fontSize:10.5}}>
          <PinIcon/>{l.loc}
        </div>
        <div style={{color:C.gold, fontSize:12.5, fontWeight:600}}>{l.price}</div>
        <button onClick={onSave} style={{background:'none', border:'none',
          cursor:'pointer', padding:2, display:'flex', alignItems:'center'}}>
          <BookmarkIcon on={saved}/>
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// DESKTOP LAYOUT
// ═══════════════════════════════════════════════════════════
function Desktop({ activeNav, setActiveNav, activeCat, setActiveCat, activeTab, setActiveTab, saved, toggleSave }) {
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif", background:C.bg0, color:C.tp,
      height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden'}}>

      {/* TOP BAR */}
      <div style={{height:56, background:C.bg1, borderBottom:`1px solid ${C.bDim}`,
        display:'flex', alignItems:'center', padding:'0 14px', gap:10,
        flexShrink:0, zIndex:100}}>

        {/* Brand */}
        <div style={{display:'flex', alignItems:'center', gap:8, flexShrink:0}}>
          <Compass s={28}/>
          <div>
            <div style={{fontFamily:"'Cinzel',serif", color:C.gold, fontSize:13,
              fontWeight:700, letterSpacing:'0.14em', lineHeight:1}}>HARBOURVIEW</div>
            <div style={{color:C.tm, fontSize:7.5, letterSpacing:'0.06em', marginTop:1}}>
              MARKET ACCESS. INTELLIGENCE. EDUCATION.
            </div>
          </div>
        </div>

        <div style={{width:1, height:30, background:C.bDim, flexShrink:0}}/>

        {/* Country */}
        <button style={{display:'flex', alignItems:'center', gap:6, background:C.bg3,
          border:`1px solid ${C.bMid}`, borderRadius:7, padding:'5px 9px',
          color:C.tp, fontSize:11.5, flexShrink:0, cursor:'pointer', fontFamily:'inherit'}}>
          <span>🇳🇿</span>
          <div style={{textAlign:'left'}}>
            <div style={{fontWeight:500, lineHeight:1}}>New Zealand</div>
            <div style={{color:C.green, fontSize:9.5, marginTop:1}}>Market Open</div>
          </div>
          <span style={{color:C.tm, fontSize:9, marginLeft:2}}>▾</span>
        </button>

        {/* Role */}
        <button style={{display:'flex', alignItems:'center', gap:6, background:C.bg3,
          border:`1px solid ${C.bMid}`, borderRadius:7, padding:'5px 9px',
          color:C.tp, fontSize:11.5, flexShrink:0, cursor:'pointer', fontFamily:'inherit'}}>
          <div style={{width:20, height:20, borderRadius:'50%', background:'rgba(255,255,255,0.07)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:10}}>👤</div>
          <div style={{textAlign:'left'}}>
            <div style={{color:C.tm, fontSize:8.5, lineHeight:1}}>Role</div>
            <div style={{fontWeight:500, fontSize:11.5, lineHeight:1.3}}>Importer / Buyer</div>
          </div>
          <span style={{color:C.tm, fontSize:9}}>▾</span>
        </button>

        {/* Search */}
        <div style={{flex:1, maxWidth:320, position:'relative'}}>
          <span style={{position:'absolute', left:9, top:'50%', transform:'translateY(-50%)',
            color:C.tm, fontSize:13}}>🔍</span>
          <input type="text" placeholder="Search marketplace, intel, education..."
            style={{width:'100%', background:C.bg2, border:`1px solid ${C.bMid}`,
              borderRadius:7, padding:'6px 9px 6px 28px', color:C.ts,
              fontSize:11, outline:'none', fontFamily:'inherit', boxSizing:'border-box'}}/>
          <span style={{position:'absolute', right:7, top:'50%', transform:'translateY(-50%)',
            color:C.tm, fontSize:9.5, background:C.bg3, padding:'1px 5px',
            borderRadius:3, border:`1px solid ${C.bDim}`}}>⌘K</span>
        </div>

        {/* Right actions */}
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8}}>
          <div style={{position:'relative', cursor:'pointer', flexShrink:0}}>
            <span style={{fontSize:17}}>🔔</span>
            <span style={{position:'absolute', top:-3, right:-4, background:C.red, color:'white',
              fontSize:8.5, fontWeight:700, borderRadius:'50%', width:14, height:14,
              display:'flex', alignItems:'center', justifyContent:'center'}}>3</span>
          </div>
          <button style={{background:'none', border:`1px solid ${C.bMid}`, borderRadius:6,
            padding:'5px 10px', color:C.ts, fontSize:11, cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', gap:4, flexShrink:0}}>
            ⭐ Watchlist
          </button>
          <div style={{display:'flex', alignItems:'center', gap:5, cursor:'pointer', flexShrink:0}}>
            <div style={{width:27, height:27, borderRadius:'50%',
              background:'linear-gradient(135deg, #D9A441, #8B6914)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:C.bg0, fontWeight:700, fontSize:11}}>A</div>
            <span style={{color:C.ts, fontSize:11.5}}>Alex V. ▾</span>
          </div>
          <div style={{width:1, height:26, background:C.bDim}}/>
          <button style={{background:C.goldFill, border:`1px solid ${C.bGold}`, borderRadius:7,
            padding:'6px 12px', color:C.gold, fontSize:11.5, fontWeight:600,
            cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center',
            gap:4, flexShrink:0}}>
            + Post Listing
          </button>
          <button style={{background:'linear-gradient(135deg, #C49025, #8B6914)', border:'none',
            borderRadius:7, padding:'6px 12px', color:'#0A1624', fontSize:11.5,
            fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0}}>
            Upgrade / Subscribe
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{flex:1, display:'flex', overflow:'hidden'}}>

        {/* SIDEBAR */}
        <div style={{width:150, background:C.bg1, borderRight:`1px solid ${C.bDim}`,
          display:'flex', flexDirection:'column', padding:'10px 0',
          flexShrink:0, overflowY:'auto'}}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={()=>setActiveNav(item.id)} style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 13px',
              background:activeNav===item.id?'rgba(217,164,65,0.09)':'none',
              borderLeft:`2px solid ${activeNav===item.id?C.gold:'transparent'}`,
              border:'none', borderRadius:0,
              color:activeNav===item.id?C.tp:C.tm,
              fontSize:12, fontWeight:activeNav===item.id?500:400,
              width:'100%', textAlign:'left', cursor:'pointer',
              fontFamily:'inherit', transition:'color 0.15s'}}>
              <span style={{fontSize:13}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {item.badge && (
                <span style={{background:'rgba(214,92,74,0.85)', color:'white',
                  fontSize:9, fontWeight:700, borderRadius:9, padding:'1px 5px'}}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div style={{marginTop:'auto', padding:'10px 13px 4px',
            borderTop:`1px solid ${C.bDim}`}}>
            <button style={{display:'flex', alignItems:'center', gap:8, background:'none',
              border:'none', color:C.tm, fontSize:12, width:'100%',
              padding:'6px 0', cursor:'pointer', fontFamily:'inherit'}}>
              <span>❓</span> Help Center
            </button>
          </div>
        </div>

        {/* CENTER — MARKETPLACE */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden',
          padding:'14px', gap:10, minWidth:0}}>

          {/* Section header */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{display:'flex', alignItems:'center', gap:9}}>
              <div style={{width:34, height:34, borderRadius:9, background:C.goldBg,
                border:`1px solid ${C.bGold}`, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:17}}>🛒</div>
              <div>
                <div style={{color:C.gold, fontSize:12.5, fontWeight:700,
                  letterSpacing:'0.09em', textTransform:'uppercase'}}>
                  Marketplace & Access
                </div>
                <div style={{color:C.tm, fontSize:10.5}}>Browse opportunities. Connect globally.</div>
              </div>
            </div>
            <button style={{background:'none', border:`1px solid ${C.bGold}`, borderRadius:7,
              padding:'6px 12px', color:C.gold, fontSize:11, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4}}>
              View All Marketplace →
            </button>
          </div>

          {/* Category chips */}
          <div style={{display:'flex', gap:6, flexWrap:'wrap', alignItems:'center'}}>
            {CATS.map(cat => (
              <button key={cat.id} onClick={()=>setActiveCat(activeCat===cat.id?null:cat.id)}
                style={{display:'flex', alignItems:'center', gap:5, padding:'6px 11px',
                  background:activeCat===cat.id?C.goldFill:C.bg3,
                  border:`1px solid ${activeCat===cat.id?C.bGold:C.bDim}`,
                  borderRadius:7, color:activeCat===cat.id?C.gold:C.ts,
                  fontSize:11.5, fontWeight:activeCat===cat.id?600:400,
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s'}}>
                <span style={{color:activeCat===cat.id?C.gold:C.tm,
                  fontSize:10.5, fontWeight:700}}>{cat.count}</span>
                <span>{cat.label}</span>
              </button>
            ))}
            <button style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:5,
              padding:'6px 12px', background:C.goldFill, border:`1px solid ${C.bGoldHi}`,
              borderRadius:7, color:C.gold, fontSize:11.5, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit'}}>
              + Post Listing
            </button>
          </div>

          {/* Tabs */}
          <div style={{display:'flex', alignItems:'center', borderBottom:`1px solid ${C.bDim}`}}>
            {[['featured','Featured Listings'],['recent','Recently Added'],['highdemand','High Demand']].map(([key,label]) => (
              <button key={key} onClick={()=>setActiveTab(key)} style={{
                background:'none', border:'none',
                borderBottom:`2px solid ${activeTab===key?C.gold:'transparent'}`,
                color:activeTab===key?C.tp:C.tm,
                fontSize:12, fontWeight:activeTab===key?600:400,
                padding:'7px 13px 9px', marginBottom:-1,
                cursor:'pointer', fontFamily:'inherit'}}>
                {label}
              </button>
            ))}
            <button style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:4,
              background:'none', border:`1px solid ${C.bDim}`, borderRadius:6,
              padding:'5px 9px', color:C.ts, fontSize:11,
              cursor:'pointer', fontFamily:'inherit'}}>
              ⚙ Filters
            </button>
          </div>

          {/* Listing rows */}
          <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:7}}>
            {LISTINGS.map(l => (
              <ListingRow key={l.id} l={l} saved={saved.has(l.id)} onSave={()=>toggleSave(l.id)}/>
            ))}
            <button style={{width:'100%', padding:'11px', background:'none',
              border:`1px solid ${C.bGold}`, borderRadius:10,
              color:C.gold, fontSize:12.5, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.05em',
              display:'flex', alignItems:'center', justifyContent:'center', gap:7}}>
              Browse All Listings →
            </button>
          </div>

          {/* Country status bar */}
          <div style={{display:'flex', borderRadius:11, overflow:'hidden',
            border:`1px solid ${C.bDim}`, flexShrink:0}}>
            {[
              { label:'COUNTRY STATUS',        val:'Market Open',  sub:'Adult Use: Limited | Medical Use: Legal', color:C.green, icon:'🇳🇿' },
              { label:'MARKET OPPORTUNITY',    val:'High',         sub:'Opportunity Score 78 / 100',              color:C.gold,  icon:'🤝'  },
              { label:'REGULATORY ENVIRONMENT',val:'Favorable',    sub:'Stable regulatory framework',             color:C.green, icon:'⚖️'  },
              { label:'MARKET ACTIVITY',       val:'Strong',       sub:'Active listings & buyer demand',          color:C.gold,  icon:'📈'  },
            ].map((item,i) => (
              <div key={i} style={{flex:1, background:C.bg2, padding:'9px 10px',
                borderLeft:i>0?`1px solid ${C.bDim}`:'none'}}>
                <div style={{display:'flex', alignItems:'center', gap:4, marginBottom:3}}>
                  <span style={{fontSize:12}}>{item.icon}</span>
                  <span style={{color:C.tm, fontSize:8.5, fontWeight:600,
                    letterSpacing:'0.07em', textTransform:'uppercase'}}>{item.label}</span>
                </div>
                <div style={{color:item.color, fontSize:13, fontWeight:700, marginBottom:1}}>{item.val}</div>
                <div style={{color:C.tm, fontSize:9.5}}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:312, background:C.bg1, borderLeft:`1px solid ${C.bDim}`,
          display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0}}>
          <div style={{flex:1, overflowY:'auto', padding:'14px',
            display:'flex', flexDirection:'column', gap:14}}>

            {/* INTEL SIGNALS */}
            <div>
              <div style={{display:'flex', alignItems:'flex-start',
                justifyContent:'space-between', marginBottom:9}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:2}}>
                    <div style={{width:26, height:26, borderRadius:7,
                      background:'rgba(59,130,160,0.15)',
                      border:'1px solid rgba(59,130,160,0.28)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:12}}>📡</div>
                    <span style={{color:C.gold, fontSize:11.5, fontWeight:700,
                      letterSpacing:'0.09em', textTransform:'uppercase'}}>Intel Signals</span>
                  </div>
                  <div style={{color:C.tm, fontSize:10.5, paddingLeft:33}}>
                    Key updates and market movements.
                  </div>
                </div>
                <button style={{background:'none', border:'none', color:C.gold, fontSize:11,
                  cursor:'pointer', fontFamily:'inherit', display:'flex',
                  alignItems:'center', gap:2, flexShrink:0, marginTop:3}}>
                  View All →
                </button>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:7}}>
                {SIGNALS.map(s => <SignalRow key={s.id} s={s}/>)}
              </div>

              {/* Upgrade nudge */}
              <div style={{marginTop:9, padding:'11px 12px',
                background:'rgba(217,164,65,0.06)', border:`1px solid ${C.bGold}`,
                borderRadius:9, display:'flex', alignItems:'center',
                justifyContent:'space-between', gap:8}}>
                <div>
                  <div style={{color:C.gold, fontSize:11.5, fontWeight:600, marginBottom:2}}>
                    🔒 Unlock deeper intelligence
                  </div>
                  <div style={{color:C.ts, fontSize:10.5, lineHeight:1.35}}>
                    Daily signals, exclusive reports, and market alerts.
                  </div>
                </div>
                <button style={{background:'linear-gradient(135deg, #C49025, #8B6914)',
                  border:'none', borderRadius:7, padding:'6px 10px',
                  color:'#0A1624', fontSize:10.5, fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit', flexShrink:0}}>
                  Upgrade Now
                </button>
              </div>
            </div>

            <div style={{height:1, background:C.bDim}}/>

            {/* EDUCATION HUB */}
            <div>
              <div style={{display:'flex', alignItems:'flex-start',
                justifyContent:'space-between', marginBottom:9}}>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:2}}>
                    <div style={{width:26, height:26, borderRadius:7, background:C.goldBg,
                      border:`1px solid ${C.bGold}`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:12}}>📚</div>
                    <span style={{color:C.gold, fontSize:11.5, fontWeight:700,
                      letterSpacing:'0.09em', textTransform:'uppercase'}}>Education Hub</span>
                  </div>
                  <div style={{color:C.tm, fontSize:10.5, paddingLeft:33}}>
                    Learn. Comply. Grow with confidence.
                  </div>
                </div>
                <button style={{background:'none', border:'none', color:C.gold, fontSize:11,
                  cursor:'pointer', fontFamily:'inherit', display:'flex',
                  alignItems:'center', gap:2, flexShrink:0, marginTop:3}}>
                  View All →
                </button>
              </div>
              <div style={{display:'flex', gap:6}}>
                {EDU.map(item => <EduCard key={item.title} item={item}/>)}
              </div>
            </div>

            <div style={{height:1, background:C.bDim}}/>

            {/* GLOBE PLACEHOLDER */}
            <GlobePlaceholder minH={148}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MOBILE LAYOUT
// ═══════════════════════════════════════════════════════════
function Mobile({ activeNav, setActiveNav, saved, toggleSave }) {
  const mobileNav = [
    { id:'dashboard',   label:'Dashboard',   icon:'⊞' },
    { id:'marketplace', label:'Marketplace', icon:'🛒' },
    { id:'post',        label:'Post',        icon:'+', isPrimary:true },
    { id:'intel',       label:'Intel',       icon:'📡' },
    { id:'education',   label:'Education',   icon:'📚' },
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif", background:C.bg0, color:C.tp,
      height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden'}}>

      {/* HEADER */}
      <div style={{padding:'10px 14px', background:C.bg1,
        borderBottom:`1px solid ${C.bDim}`, display:'flex',
        alignItems:'center', justifyContent:'space-between', flexShrink:0}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <Compass s={24}/>
          <span style={{fontFamily:"'Cinzel',serif", color:C.gold,
            fontSize:13.5, fontWeight:700, letterSpacing:'0.12em'}}>HARBOURVIEW</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{position:'relative', cursor:'pointer'}}>
            <span style={{fontSize:17}}>🔔</span>
            <span style={{position:'absolute', top:-3, right:-4, background:C.red,
              color:'white', fontSize:8, fontWeight:700, borderRadius:'50%',
              width:13, height:13, display:'flex', alignItems:'center', justifyContent:'center'}}>3</span>
          </div>
          <span style={{fontSize:19, color:C.ts, cursor:'pointer'}}>☰</span>
        </div>
      </div>

      {/* CONTEXT SELECTORS */}
      <div style={{padding:'9px 12px', background:C.bg1,
        borderBottom:`1px solid ${C.bDim}`, display:'flex', gap:7, flexShrink:0}}>
        <button style={{flex:1, display:'flex', alignItems:'center', gap:6,
          background:C.bg3, border:`1px solid ${C.bMid}`, borderRadius:8,
          padding:'7px 9px', color:C.tp, fontSize:11.5,
          cursor:'pointer', fontFamily:'inherit'}}>
          <span>🇳🇿</span>
          <div style={{textAlign:'left', flex:1}}>
            <div style={{fontWeight:500, fontSize:12}}>New Zealand</div>
            <div style={{color:C.green, fontSize:9.5}}>Market Open</div>
          </div>
          <span style={{color:C.tm, fontSize:9}}>▾</span>
        </button>
        <button style={{flex:1, display:'flex', alignItems:'center', gap:6,
          background:C.bg3, border:`1px solid ${C.bMid}`, borderRadius:8,
          padding:'7px 9px', color:C.tp, fontSize:11.5,
          cursor:'pointer', fontFamily:'inherit'}}>
          <div style={{width:20, height:20, borderRadius:'50%',
            background:'rgba(255,255,255,0.07)', display:'flex',
            alignItems:'center', justifyContent:'center', fontSize:10, flexShrink:0}}>👤</div>
          <div style={{textAlign:'left', flex:1}}>
            <div style={{color:C.tm, fontSize:9}}>My Role</div>
            <div style={{fontWeight:500, fontSize:11.5}}>Importer / Buyer</div>
          </div>
          <span style={{color:C.tm, fontSize:9}}>▾</span>
        </button>
      </div>

      {/* SCROLL AREA */}
      <div style={{flex:1, overflowY:'auto', paddingBottom:76}}>

        {/* GLOBE TEASER PLACEHOLDER */}
        <div style={{margin:'12px 12px 0', borderRadius:13, overflow:'hidden',
          background:'radial-gradient(ellipse at 28% 50%, rgba(59,130,160,0.26) 0%, rgba(6,16,26,0.96) 58%, #02070D 100%)',
          border:`1px solid ${C.bGold}`, padding:'15px', position:'relative', minHeight:108}}>
          <div style={{position:'absolute', right:-22, bottom:-22, width:115, height:115,
            borderRadius:'50%',
            background:'radial-gradient(circle at 38% 35%, rgba(59,130,160,0.4), rgba(13,30,48,0.65) 55%, transparent)',
            border:'1px solid rgba(59,130,160,0.2)'}}/>
          {[[18,45],[35,22],[55,38],[70,58],[82,28]].map(([x,y],i) => (
            <div key={i} style={{position:'absolute', left:`${x}%`, top:`${y}%`,
              width:2.5, height:2.5, borderRadius:'50%', background:C.gold,
              boxShadow:`0 0 4px ${C.gold}`, opacity:0.75}}/>
          ))}
          <div style={{color:C.ts, fontSize:11.5, fontWeight:500, marginBottom:2}}>Global View</div>
          <div style={{color:C.tp, fontSize:13, fontWeight:600, lineHeight:1.3, marginBottom:12}}>
            Track opportunity.<br/>Connect globally.
          </div>
          <button style={{display:'flex', alignItems:'center', gap:6,
            background:'rgba(217,164,65,0.12)', border:`1px solid ${C.bGold}`,
            borderRadius:8, padding:'7px 13px', color:C.gold, fontSize:11.5,
            fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.04em'}}>
            ⊙ VIEW GLOBE
          </button>
        </div>

        {/* MARKETPLACE */}
        <div style={{margin:'12px 12px 0', background:C.bg2,
          borderRadius:13, border:`1px solid ${C.bDim}`}}>
          <div style={{padding:'13px 13px 0'}}>
            <div style={{display:'flex', alignItems:'center',
              justifyContent:'space-between', marginBottom:11}}>
              <span style={{color:C.gold, fontSize:12.5, fontWeight:700,
                letterSpacing:'0.1em', textTransform:'uppercase'}}>Marketplace</span>
              <button style={{background:'none', border:'none', color:C.gold,
                fontSize:11, cursor:'pointer', fontFamily:'inherit'}}>View all →</button>
            </div>

            {/* Category icons */}
            <div style={{display:'flex', gap:6, overflowX:'auto', paddingBottom:11}}>
              {[
                {l:'Consumables', i:'📦'},
                {l:'Cannabis',    i:'🌿'},
                {l:'Equipment',   i:'⚙️'},
                {l:'Distressed',  i:'🔩'},
                {l:'Services',    i:'🛠️'},
              ].map(cat => (
                <div key={cat.l} style={{display:'flex', flexDirection:'column',
                  alignItems:'center', gap:4, minWidth:52, cursor:'pointer'}}>
                  <div style={{width:42, height:42, borderRadius:11, background:C.bg3,
                    border:`1px solid ${C.bDim}`, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:19}}>{cat.i}</div>
                  <span style={{color:C.tm, fontSize:9, textAlign:'center', lineHeight:1.2}}>
                    {cat.l}
                  </span>
                </div>
              ))}
              <div style={{display:'flex', flexDirection:'column',
                alignItems:'center', gap:4, minWidth:52, cursor:'pointer'}}>
                <div style={{width:42, height:42, borderRadius:11, background:C.goldFill,
                  border:`1px solid ${C.bGold}`, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:22, color:C.gold, fontWeight:700}}>+</div>
                <span style={{color:C.gold, fontSize:9, fontWeight:600, textAlign:'center'}}>
                  Post
                </span>
              </div>
            </div>

            <div style={{display:'flex', alignItems:'center',
              justifyContent:'space-between', marginBottom:8}}>
              <span style={{color:C.ts, fontSize:11.5, fontWeight:600}}>Featured Listings</span>
              <button style={{background:'none', border:`1px solid ${C.bDim}`,
                borderRadius:6, padding:'3px 8px', color:C.tm,
                fontSize:10.5, cursor:'pointer', fontFamily:'inherit'}}>
                ⚙ Filters
              </button>
            </div>
          </div>

          {/* Mobile listing rows */}
          {LISTINGS.slice(0,3).map((l,i) => (
            <div key={l.id} style={{display:'flex', gap:9, padding:'9px 13px',
              borderTop:`1px solid ${C.bDim}`, alignItems:'center'}}>
              <div style={{width:56, height:52, borderRadius:8, background:l.bg,
                border:`1px solid ${C.bDim}`, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:21, flexShrink:0}}>{l.emoji}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:4, marginBottom:4}}>
                  <span style={{color:C.tp, fontSize:12, fontWeight:500, lineHeight:1.2}}>
                    {l.title}
                  </span>
                  <ShieldCheck />
                </div>
                <TagChip label={l.tags[0]}/>
              </div>
              <div style={{textAlign:'right', flexShrink:0}}>
                <div style={{display:'flex', alignItems:'center', gap:2, color:C.tm,
                  fontSize:10, marginBottom:3, justifyContent:'flex-end'}}>
                  <PinIcon/>{l.loc}
                </div>
                <div style={{color:C.gold, fontSize:12, fontWeight:600}}>{l.price}</div>
              </div>
            </div>
          ))}

          <div style={{padding:'9px 13px 13px'}}>
            <button style={{width:'100%', padding:'10px', background:'none',
              border:`1px solid ${C.bGold}`, borderRadius:9,
              color:C.gold, fontSize:12, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.05em'}}>
              BROWSE ALL LISTINGS →
            </button>
          </div>
        </div>

        {/* INTEL SIGNALS */}
        <div style={{margin:'10px 12px 0', background:C.bg2,
          borderRadius:13, border:`1px solid ${C.bDim}`, padding:'13px'}}>
          <div style={{display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:10}}>
            <span style={{color:C.gold, fontSize:12.5, fontWeight:700,
              letterSpacing:'0.1em', textTransform:'uppercase'}}>Intel Signals</span>
            <button style={{background:'none', border:'none', color:C.gold,
              fontSize:11, cursor:'pointer', fontFamily:'inherit'}}>View all →</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:7}}>
            {SIGNALS.slice(0,3).map(s => <SignalRow key={s.id} s={s}/>)}
          </div>
        </div>

        {/* EDUCATION */}
        <div style={{margin:'10px 12px 0', background:C.bg2,
          borderRadius:13, border:`1px solid ${C.bDim}`, padding:'13px'}}>
          <div style={{display:'flex', alignItems:'center',
            justifyContent:'space-between', marginBottom:10}}>
            <span style={{color:C.gold, fontSize:12.5, fontWeight:700,
              letterSpacing:'0.1em', textTransform:'uppercase'}}>Education</span>
            <button style={{background:'none', border:'none', color:C.gold,
              fontSize:11, cursor:'pointer', fontFamily:'inherit'}}>View all →</button>
          </div>
          <div style={{display:'flex', gap:7}}>
            {EDU.slice(0,4).map(item => (
              <div key={item.title} style={{display:'flex', flexDirection:'column',
                alignItems:'center', gap:5, padding:'11px 6px', borderRadius:10,
                background:C.bg3, border:`1px solid ${C.bDim}`,
                textAlign:'center', flex:1, minWidth:0, cursor:'pointer'}}>
                <div style={{width:34, height:34, borderRadius:8, background:C.goldBg,
                  border:`1px solid ${C.bGold}`, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:16}}>{item.icon}</div>
                <div style={{color:C.ts, fontSize:9.5, fontWeight:500, lineHeight:1.3}}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM NAV */}
      <div style={{position:'fixed', bottom:0, left:0, right:0, height:70,
        background:C.bg1, borderTop:`1px solid ${C.bDim}`,
        display:'flex', alignItems:'center', zIndex:100}}>
        {mobileNav.map(item => (
          <button key={item.id} onClick={()=>setActiveNav(item.id)} style={{
            flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:4,
            background:'none', border:'none', height:'100%',
            cursor:'pointer', fontFamily:'inherit'}}>
            {item.isPrimary ? (
              <div style={{width:44, height:44, borderRadius:'50%',
                background:'linear-gradient(135deg, #D9A441, #8B6914)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:22, color:C.bg0, fontWeight:700,
                boxShadow:'0 0 18px rgba(217,164,65,0.38)', marginBottom:-4}}>+</div>
            ) : (
              <>
                <span style={{fontSize:17}}>{item.icon}</span>
                <span style={{fontSize:9.5,
                  color:activeNav===item.id?C.gold:C.tm,
                  fontWeight:activeNav===item.id?600:400}}>
                  {item.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════
export default function HarbourviewDashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [activeCat, setActiveCat] = useState(null);
  const [activeTab, setActiveTab] = useState('featured');
  const [saved, setSaved] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 650);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleSave = id => setSaved(p => {
    const n = new Set(p);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; }
        button { cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(217,164,65,0.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(217,164,65,0.45); }
      `}</style>
      {isMobile
        ? <Mobile activeNav={activeNav} setActiveNav={setActiveNav} saved={saved} toggleSave={toggleSave}/>
        : <Desktop activeNav={activeNav} setActiveNav={setActiveNav} activeCat={activeCat} setActiveCat={setActiveCat} activeTab={activeTab} setActiveTab={setActiveTab} saved={saved} toggleSave={toggleSave}/>
      }
    </>
  );
}
