
import { useState, useEffect, useRef, type RefObject } from "react";

// ═══ TOKENS ═══════════════════════════════════════════════════════════════
const C = {
  bg0:'#02070D', bg1:'#06101A', bg2:'#08131F', bg3:'#0B1826', bg4:'#0D1E30',
  bDim:'rgba(255,255,255,0.07)', bMid:'rgba(255,255,255,0.11)',
  bGold:'rgba(212,164,74,0.35)', bGoldHi:'rgba(212,164,74,0.65)',
  gold:'#D9A441', goldBrt:'#F2C46D', goldFill:'rgba(217,164,65,0.12)', goldBg:'rgba(217,164,65,0.07)',
  tp:'#F7F1E6', ts:'#B8C0C8', tm:'#6F7A86',
  green:'#6FCF7D', greenBg:'rgba(111,207,125,0.12)', red:'#D65C4A',
};

const TAGS = {
  'Equipment':            ['rgba(59,130,160,0.18)',  '#5DAFC8', 'rgba(59,130,160,0.30)'],
  'Verified Seller':      ['rgba(74,154,107,0.18)',  '#6FCF7D', 'rgba(74,154,107,0.30)'],
  'Excellent Condition':  ['rgba(255,255,255,0.06)', '#8A949E', 'rgba(255,255,255,0.10)'],
  'Cannabis':             ['rgba(74,154,107,0.18)',  '#6FCF7D', 'rgba(74,154,107,0.30)'],
  'Lab Tested':           ['rgba(139,95,168,0.18)',  '#B07ED4', 'rgba(139,95,168,0.30)'],
  'Consumables':          ['rgba(184,115,51,0.18)',  '#D49560', 'rgba(184,115,51,0.30)'],
  'New':                  ['rgba(217,164,65,0.18)',  '#D9A441', 'rgba(217,164,65,0.35)'],
  'Distressed Equipment': ['rgba(214,92,74,0.18)',   '#E07868', 'rgba(214,92,74,0.30)'],
  'Business Opportunity': ['rgba(139,95,168,0.18)',  '#B07ED4', 'rgba(139,95,168,0.30)'],
};

// ═══ DATA ════════════════════════════════════════════════════════════════
const COUNTRIES = {
  nz:{ flag:'🇳🇿', name:'New Zealand',  id:'nz', status:'Market Open',  sc:'#6FCF7D', cur:'NZD', c1:'Auckland',    c2:'Wellington', c3:'Christchurch', bar:{opp:'High',     reg:'Favorable',  act:'Strong',     score:78, s1:'Medical Use: Legal',       s2:'Adult Use: Limited'}},
  au:{ flag:'🇦🇺', name:'Australia',    id:'au', status:'Market Open',  sc:'#6FCF7D', cur:'AUD', c1:'Sydney',      c2:'Melbourne',  c3:'Brisbane',     bar:{opp:'High',     reg:'Established',act:'Very Strong', score:84, s1:'TGA Regulated',            s2:'Medical Use: Legal'}},
  de:{ flag:'🇩🇪', name:'Germany',      id:'de', status:'Developing',   sc:'#D9A441', cur:'EUR', c1:'Berlin',      c2:'Hamburg',    c3:'Munich',       bar:{opp:'High',     reg:'Moderate',   act:'Strong',     score:72, s1:'Cannagelb Reform Active',  s2:'Medical Use: Legal'}},
  ca:{ flag:'🇨🇦', name:'Canada',       id:'ca', status:'Established',  sc:'#6FCF7D', cur:'CAD', c1:'Toronto',     c2:'Vancouver',  c3:'Calgary',      bar:{opp:'Medium',   reg:'Established',act:'Moderate',   score:68, s1:'Full Legalization',        s2:'Adult Use: Legal'}},
  uk:{ flag:'🇬🇧', name:'UK',           id:'uk', status:'Restricted',   sc:'#D65C4A', cur:'GBP', c1:'London',      c2:'Manchester', c3:'Bristol',      bar:{opp:'Medium',   reg:'Complex',    act:'Moderate',   score:52, s1:'Medical Use: Limited',     s2:'Adult Use: Illegal'}},
  us:{ flag:'🇺🇸', name:'United States',id:'us', status:'Complex',      sc:'#D9A441', cur:'USD', c1:'Los Angeles', c2:'Denver',     c3:'Portland',     bar:{opp:'Very High',reg:'Complex',    act:'Very Strong',score:71, s1:'Federal: Schedule I',      s2:'State Regulated'}},
};

const mkListings = (ct: {c1:string;c2:string;c3:string;cur:string}) => [
  {id:1,cat:'Equipment',           bg:'linear-gradient(135deg,#091828,#0D2540)', title:'Stainless Steel Mixing Tank 500L',  desc:'Food grade 316 SS mixing tank. Excellent condition. Minimal use.',      tags:['Equipment','Verified Seller','Excellent Condition'], loc:ct.c1, price:`${ct.cur} $8,750`    },
  {id:2,cat:'Cannabis',            bg:'linear-gradient(135deg,#091408,#0A1E10)', title:'Premium Flower – Indoor Grown',      desc:'Top shelf indoor grown flower. Lab tested and certified.',              tags:['Cannabis','Verified Seller','Lab Tested'],           loc:ct.c2, price:`${ct.cur} $4,200 / kg`},
  {id:3,cat:'Consumables',         bg:'linear-gradient(135deg,#0A1610,#0D1C14)', title:'Nutrient Solution Starter Kit',      desc:'Complete 3-part nutrient solution kit.',                               tags:['Consumables','New','Verified Seller'],               loc:ct.c3, price:`${ct.cur} $320`       },
  {id:4,cat:'Distressed Equipment',bg:'linear-gradient(135deg,#1A0D08,#220F08)', title:'Distressed Extraction Equipment',    desc:'Falling film evaporator system. Needs minor refurbishment.',           tags:['Distressed Equipment','Verified Seller'],            loc:ct.c2, price:`${ct.cur} $12,500`   },
  {id:5,cat:'Business Opportunity',bg:'linear-gradient(135deg,#08101C,#0A1530)', title:'Turnkey Greenhouse Facility',        desc:'1,200m² greenhouse with climate systems. Ready for cultivation.',      tags:['Business Opportunity','Verified Seller'],            loc:ct.c1, price:`${ct.cur} $950,000`  },
];

const mkSignals = (name: string) => [
  {id:1,icon:'📋',headline:`${name}: government reviews cannabis export licensing framework.`,   tag:'REGULATION',ts:['rgba(74,154,107,0.18)','#6FCF7D','rgba(74,154,107,0.35)'], time:'2h ago', hot:true },
  {id:2,icon:'📈',headline:'Extraction equipment demand rising across APAC & EU markets.',        tag:'MARKET',    ts:['rgba(59,130,160,0.18)','#5DAFC8','rgba(59,130,160,0.35)'], time:'6h ago', hot:false},
  {id:3,icon:'🌿',headline:'New GMP guidance released for medicinal cannabis manufacturers.',      tag:'COMPLIANCE',ts:['rgba(217,164,65,0.18)','#D9A441','rgba(217,164,65,0.35)'], time:'1d ago', hot:false},
  {id:4,icon:'🤝',headline:'AU-NZ trade discussions may expand cannabis product access.',          tag:'TRADE',     ts:['rgba(139,95,168,0.18)','#B07ED4','rgba(139,95,168,0.35)'], time:'2d ago', hot:false},
  {id:5,icon:'💰',headline:'Investor interest in regional cultivation infrastructure rising.',     tag:'INVESTMENT',ts:['rgba(184,115,51,0.18)','#D49560','rgba(184,115,51,0.35)'], time:'3d ago', hot:false},
];

const NOTIFS = [
  {id:1,icon:'📩',title:'New inquiry on Mixing Tank 500L',       sub:'From: GreenLeaf GmbH (Germany)',          time:'5m ago',  unread:true },
  {id:2,icon:'📈',title:'Price alert: Cannabis flower up 18%',   sub:'APAC market — demand spike detected',     time:'23m ago', unread:true },
  {id:3,icon:'💬',title:'Message from Iberia Extracts SL',       sub:'"We can offer EU-GMP certified batch…"',  time:'1h ago',  unread:true },
  {id:4,icon:'🔖',title:'Saved listing updated',                  sub:'Nutrient Solution Kit — price reduced',   time:'3h ago',  unread:false},
  {id:5,icon:'🔔',title:'Your listing has 4 new views',           sub:'Stainless Steel Mixing Tank 500L',        time:'5h ago',  unread:false},
];

const EDU = [
  {icon:'🩺',title:'Doctors & Prescribers',desc:'Clinical guidance & prescribing'},
  {icon:'💊',title:'Pharmacists',          desc:'Dosing, interactions & safety'  },
  {icon:'📐',title:'Dosage Education',     desc:'Personalize dosing'             },
  {icon:'⚖️',title:'Compliance & Reg.',    desc:'Stay audit-ready'               },
  {icon:'🗺️',title:'Country Rules',        desc:'Regional legal framework'       },
  {icon:'🏛️',title:'GMP Standards',        desc:'Manufacturing compliance'       },
];

const CATS      = [{id:'consumables',label:'Consumables',count:'1,248'},{id:'cannabis',label:'Cannabis',count:'892'},{id:'equipment',label:'Equipment',count:'1,112'},{id:'distressed',label:'Distressed',count:'315'},{id:'services',label:'Services',count:'674'}];
const NAV_ITEMS = [{id:'dashboard',label:'Dashboard',icon:'⊞'},{id:'marketplace',label:'Marketplace',icon:'🛒'},{id:'intel',label:'Intel Signals',icon:'📡'},{id:'education',label:'Education Hub',icon:'📚'},{id:'connections',label:'Connections',icon:'🔗'},{id:'activity',label:'My Activity',icon:'⚡'},{id:'messages',label:'Messages',icon:'✉️',badge:3},{id:'searches',label:'Saved Searches',icon:'🔍'},{id:'account',label:'Account',icon:'👤'}];
const ROLES     = ['Importer / Buyer','Exporter / Supplier','Consultant','Investor','Regulator'];
const HMODES    = ['Demand','Regulatory','Supply Chain','Market Activity'];
const HCOLORS   = {Demand:['rgba(217,164,65,0.9)','rgba(217,164,65,0.35)'],Regulatory:['rgba(111,207,125,0.9)','rgba(111,207,125,0.35)'],['Supply Chain']:['rgba(93,175,200,0.9)','rgba(93,175,200,0.35)'],['Market Activity']:['rgba(176,126,212,0.9)','rgba(176,126,212,0.35)']};

// ═══ SVG ATOMS ═══════════════════════════════════════════════════════════
const Compass = ({s=30}: {s?: number}) => (
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
    <path d="M6.5 1L11 3.2V6.5C11 9 8.8 11.2 6.5 12C4.2 11.2 2 9 2 6.5V3.2L6.5 1Z" fill="rgba(74,154,107,0.25)" stroke="#6FCF7D" strokeWidth="0.8"/>
    <path d="M4.5 6.5L5.8 7.8L9 4.5" stroke="#6FCF7D" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PinIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{flexShrink:0}}>
    <path d="M5 0C2.79 0 1 1.79 1 4C1 7 5 11.5 5 11.5S9 7 9 4C9 1.79 7.21 0 5 0ZM5 5.5C4.17 5.5 3.5 4.83 3.5 4S4.17 2.5 5 2.5 6.5 3.17 6.5 4 5.83 5.5 5 5.5Z" fill="#6F7A86"/>
  </svg>
);
const BK = ({on}: {on: boolean}) => (
  <svg width="14" height="17" viewBox="0 0 14 17" fill="none">
    <path d="M1 1.5C1 1.22 1.22 1 1.5 1H12.5C12.78 1 13 1.22 13 1.5V15.5L7 11.5L1 15.5V1.5Z" fill={on?'rgba(217,164,65,0.22)':'none'} stroke={on?'#D9A441':'#6F7A86'} strokeWidth="1.2"/>
  </svg>
);

// ═══ LISTING THUMBNAIL ═══════════════════════════════════════════════════
const Thumb = ({cat, bg, w=76, h=66}: {cat: string; bg: string; w?: number; h?: number}) => {
  const Art = () => {
    if (cat==='Equipment') return (
      <svg viewBox="0 0 76 66" fill="none"><rect x="18" y="14" width="40" height="38" rx="7" fill="rgba(59,130,160,0.18)" stroke="rgba(59,130,160,0.35)" strokeWidth="1.2"/><rect x="28" y="9" width="20" height="8" rx="3" fill="rgba(59,130,160,0.12)" stroke="rgba(59,130,160,0.28)" strokeWidth="1"/><line x1="18" y1="32" x2="58" y2="32" stroke="rgba(59,130,160,0.25)" strokeWidth="1"/><circle cx="12" cy="35" r="4" fill="rgba(59,130,160,0.15)" stroke="rgba(59,130,160,0.35)" strokeWidth="1"/><rect x="24" y="36" width="6" height="12" rx="1.5" fill="rgba(59,130,160,0.1)" stroke="rgba(59,130,160,0.2)" strokeWidth="0.8"/><rect x="34" y="38" width="6" height="10" rx="1.5" fill="rgba(59,130,160,0.1)" stroke="rgba(59,130,160,0.2)" strokeWidth="0.8"/></svg>
    );
    if (cat==='Cannabis') return (
      <svg viewBox="0 0 76 66" fill="none"><line x1="38" y1="58" x2="38" y2="18" stroke="rgba(74,154,107,0.5)" strokeWidth="1.5"/><path d="M38 28C28 18,12 22,16 36C22 30,33 33,38 42" fill="rgba(74,154,107,0.18)" stroke="rgba(74,154,107,0.4)" strokeWidth="1"/><path d="M38 28C48 18,64 22,60 36C54 30,43 33,38 42" fill="rgba(74,154,107,0.18)" stroke="rgba(74,154,107,0.4)" strokeWidth="1"/><path d="M38 20C30 11,18 14,20 26" fill="rgba(74,154,107,0.12)" stroke="rgba(74,154,107,0.3)" strokeWidth="0.8"/><path d="M38 20C46 11,58 14,56 26" fill="rgba(74,154,107,0.12)" stroke="rgba(74,154,107,0.3)" strokeWidth="0.8"/></svg>
    );
    if (cat==='Consumables') return (
      <svg viewBox="0 0 76 66" fill="none"><rect x="22" y="18" width="14" height="36" rx="5" fill="rgba(184,115,51,0.18)" stroke="rgba(184,115,51,0.38)" strokeWidth="1.2"/><rect x="25" y="12" width="8" height="8" rx="2.5" fill="rgba(184,115,51,0.12)" stroke="rgba(184,115,51,0.28)" strokeWidth="1"/><rect x="42" y="22" width="12" height="30" rx="5" fill="rgba(184,115,51,0.18)" stroke="rgba(184,115,51,0.38)" strokeWidth="1.2"/><rect x="44" y="16" width="8" height="8" rx="2.5" fill="rgba(184,115,51,0.12)" stroke="rgba(184,115,51,0.28)" strokeWidth="1"/></svg>
    );
    if (cat==='Distressed Equipment') return (
      <svg viewBox="0 0 76 66" fill="none"><rect x="12" y="18" width="52" height="32" rx="6" fill="rgba(214,92,74,0.12)" stroke="rgba(214,92,74,0.30)" strokeWidth="1.2"/><path d="M22 18L18 28" stroke="rgba(214,92,74,0.4)" strokeWidth="1.5" strokeLinecap="round"/><path d="M44 18L54 50" stroke="rgba(214,92,74,0.25)" strokeWidth="1" strokeLinecap="round"/><circle cx="38" cy="34" r="9" fill="rgba(214,92,74,0.08)" stroke="rgba(214,92,74,0.28)" strokeWidth="1"/><path d="M33 29L43 39M43 29L33 39" stroke="rgba(214,92,74,0.45)" strokeWidth="1.3" strokeLinecap="round"/></svg>
    );
    return (
      <svg viewBox="0 0 76 66" fill="none"><rect x="8" y="32" width="60" height="26" rx="4" fill="rgba(139,95,168,0.12)" stroke="rgba(139,95,168,0.30)" strokeWidth="1.2"/><rect x="18" y="20" width="40" height="14" rx="3" fill="rgba(139,95,168,0.10)" stroke="rgba(139,95,168,0.25)" strokeWidth="1"/><rect x="30" y="10" width="16" height="12" rx="2.5" fill="rgba(139,95,168,0.08)" stroke="rgba(139,95,168,0.22)" strokeWidth="0.8"/><rect x="30" y="40" width="16" height="18" rx="2" fill="rgba(139,95,168,0.08)" stroke="rgba(139,95,168,0.22)" strokeWidth="0.8"/></svg>
    );
  };
  return (
    <div style={{width:w,height:h,borderRadius:8,background:bg,border:`1px solid ${C.bDim}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden',position:'relative'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 30%,rgba(255,255,255,0.04),transparent 65%)'}}/>
      <div style={{width:w-4,height:h-4,position:'relative',zIndex:1}}><Art/></div>
    </div>
  );
};

// ═══ CANVAS GLOBE ════════════════════════════════════════════════════════
const Globe = ({selectedCountry='nz', heatmode='Demand'}: {selectedCountry?: string; heatmode?: string}) => {
  const cvRef  = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const afRef  = useRef<number | null>(null);

  const NODES = [
    {id:'nz',lat:-41,lng:174,big:true},{id:'au',lat:-25,lng:133,big:true},{id:'de',lat:51,lng:10,big:true},
    {id:'ca',lat:56,lng:-96,big:true},{id:'uk',lat:51,lng:-2,big:true},{id:'us',lat:38,lng:-97,big:true},
    {id:'nl',lat:52,lng:5},{id:'es',lat:40,lng:-4},{id:'jp',lat:36,lng:138},{id:'br',lat:-15,lng:-48},
    {id:'za',lat:-29,lng:25},{id:'il',lat:31,lng:35},{id:'th',lat:15,lng:101},{id:'co',lat:4,lng:-74},
  ];
  const CONNS = [['nz','au'],['au','de'],['de','uk'],['uk','us'],['nz','jp'],['ca','us']];

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const SIZE = 280;
    const dpr  = window.devicePixelRatio || 1;
    cv.width   = SIZE * dpr;
    cv.height  = SIZE * dpr;
    cv.style.width  = '100%';
    cv.style.height = 'auto';
    const ctx  = cv.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const cx = SIZE/2, cy = SIZE/2, r = SIZE * 0.44;
    const hc   = HCOLORS[heatmode as keyof typeof HCOLORS] || HCOLORS['Demand'];

    const proj = (lat: number, lng: number) => {
      const la = lat*Math.PI/180, lo = (lng+rotRef.current)*Math.PI/180;
      const x  = Math.cos(la)*Math.sin(lo);
      const y  = -Math.sin(la);
      const z  = Math.cos(la)*Math.cos(lo);
      return {sx:cx+r*x, sy:cy+r*y, z};
    };

    const draw = () => {
      ctx.clearRect(0,0,SIZE,SIZE);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,r+1,0,Math.PI*2); ctx.clip();

      // Sphere
      const g = ctx.createRadialGradient(cx-r*.3,cy-r*.3,r*.04,cx,cy,r);
      g.addColorStop(0,'#0E2444'); g.addColorStop(.5,'#071428'); g.addColorStop(1,'#02070D');
      ctx.fillStyle=g; ctx.fillRect(0,0,SIZE,SIZE);

      // Lat lines
      for (let lat=-75;lat<=75;lat+=30) {
        ctx.beginPath(); let s=false;
        for (let lo=-180;lo<=181;lo+=3) {
          const p=proj(lat,lo); if (p.z<-.08){s=false;continue;}
          s?(ctx.lineTo(p.sx,p.sy)):(ctx.moveTo(p.sx,p.sy),s=true);
        }
        ctx.strokeStyle=lat===0?'rgba(217,164,65,0.20)':'rgba(217,164,65,0.07)';
        ctx.lineWidth=lat===0?.9:.45; ctx.stroke();
      }
      // Lng lines
      for (let lo=-180;lo<180;lo+=30) {
        ctx.beginPath(); let s=false;
        for (let lat=-88;lat<=88;lat+=3) {
          const p=proj(lat,lo); if (p.z<-.08){s=false;continue;}
          s?(ctx.lineTo(p.sx,p.sy)):(ctx.moveTo(p.sx,p.sy),s=true);
        }
        ctx.strokeStyle='rgba(217,164,65,0.05)'; ctx.lineWidth=.4; ctx.stroke();
      }

      // Connection arcs
      ctx.setLineDash([3,5]);
      CONNS.forEach(([a,b])=>{
        const na=NODES.find(n=>n.id===a), nb=NODES.find(n=>n.id===b);
        if(!na||!nb) return;
        const pa=proj(na.lat,na.lng), pb=proj(nb.lat,nb.lng);
        if(pa.z<0||pb.z<0) return;
        ctx.beginPath(); ctx.moveTo(pa.sx,pa.sy);
        ctx.quadraticCurveTo((pa.sx+pb.sx)/2,(pa.sy+pb.sy)/2-18,pb.sx,pb.sy);
        ctx.strokeStyle='rgba(217,164,65,0.14)'; ctx.lineWidth=.8; ctx.stroke();
      });
      ctx.setLineDash([]);

      // Nodes
      NODES.forEach(nd=>{
        const p=proj(nd.lat,nd.lng); if(p.z<0) return;
        const isSel=nd.id===selectedCountry;
        const nr=isSel?6.5:nd.big?4.5:2.5;
        const col=isSel?hc[0]:nd.big?hc[0]:hc[1];
        const fade=Math.max(0,p.z);
        if(nd.big||isSel){
          const gw=nr*(isSel?5:4);
          const gg=ctx.createRadialGradient(p.sx,p.sy,0,p.sx,p.sy,gw);
          gg.addColorStop(0,col.replace(/[\d.]+\)$/,`${(.38*fade).toFixed(2)})`));
          gg.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(p.sx,p.sy,gw,0,Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha=Math.min(1,fade+.15);
        ctx.fillStyle=col; ctx.beginPath(); ctx.arc(p.sx,p.sy,nr,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
        if(isSel){
          const t=(Date.now()%2000)/2000;
          ctx.strokeStyle=`rgba(242,196,109,${(1-t)*.55})`; ctx.lineWidth=1.2;
          ctx.beginPath(); ctx.arc(p.sx,p.sy,nr+4+t*9,0,Math.PI*2); ctx.stroke();
        }
      });

      // Edge vignette
      const ev=ctx.createRadialGradient(cx,cy,r*.78,cx,cy,r);
      ev.addColorStop(0,'rgba(0,0,0,0)'); ev.addColorStop(1,'rgba(2,7,13,0.65)');
      ctx.fillStyle=ev; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      ctx.restore();

      // Atmosphere ring
      const ar=ctx.createRadialGradient(cx,cy,r*.98,cx,cy,r+12);
      ar.addColorStop(0,'rgba(59,130,160,0.20)'); ar.addColorStop(1,'rgba(59,130,160,0)');
      ctx.fillStyle=ar; ctx.beginPath(); ctx.arc(cx,cy,r+12,0,Math.PI*2); ctx.arc(cx,cy,r*.98,0,Math.PI*2,true); ctx.fill();
    };

    const tick=()=>{ rotRef.current=(rotRef.current+.1)%360; draw(); afRef.current=requestAnimationFrame(tick); };
    tick();
    return ()=>{ if (afRef.current !== null) cancelAnimationFrame(afRef.current); };
  },[selectedCountry,heatmode]);

  return <canvas ref={cvRef} style={{display:'block',borderRadius:10}}/>;
};

// ═══ SHARED COMPONENTS ═══════════════════════════════════════════════════
const TC = ({label}: {label: string}) => {
  const [bg,color,border]=TAGS[label]||['rgba(255,255,255,0.06)','#8A949E','rgba(255,255,255,0.10)'];
  return <span style={{background:bg,color,border:`1px solid ${border}`,borderRadius:4,fontSize:10,fontWeight:500,padding:'2px 6px',whiteSpace:'nowrap',flexShrink:0}}>{label}</span>;
};

const SigRow = ({s}: {s: {id: number; icon: string; headline: string; tag: string; ts: [string, string, string]; time: string; hot: boolean}}) => {
  const [bg,color,border]=s.ts;
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:9,padding:'9px 10px',borderRadius:8,background:C.bg3,border:`1px solid ${C.bDim}`}}>
      <div style={{width:28,height:28,borderRadius:7,background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>{s.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:C.ts,fontSize:11.5,lineHeight:1.4,marginBottom:5}}>{s.headline}</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{background:bg,color,border:`1px solid ${border}`,borderRadius:4,fontSize:9.5,fontWeight:700,padding:'2px 6px',letterSpacing:'0.06em'}}>{s.tag}</span>
          <span style={{display:'flex',alignItems:'center',gap:5,color:C.tm,fontSize:10}}>
            {s.hot&&<span style={{width:6,height:6,borderRadius:'50%',background:C.green,display:'inline-block',boxShadow:`0 0 4px ${C.green}`,animation:'pulse 1.5s ease-in-out infinite'}}/>}
            {s.time}
          </span>
        </div>
      </div>
    </div>
  );
};

const EduCard = ({item}: {item: {icon: string; title: string; desc: string}}) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 6px',borderRadius:10,background:C.bg3,border:`1px solid ${C.bDim}`,textAlign:'center',cursor:'pointer'}}>
    <div style={{width:32,height:32,borderRadius:8,background:C.goldBg,border:`1px solid ${C.bGold}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{item.icon}</div>
    <div style={{color:C.ts,fontSize:10,fontWeight:500,lineHeight:1.3}}>{item.title}</div>
    <div style={{color:C.tm,fontSize:9.5,lineHeight:1.2}}>{item.desc}</div>
  </div>
);

// ═══ OUTSIDE CLICK HOOK ════════════════════════════════════════════════
function useOutside(ref: RefObject<HTMLElement>, fn: () => void) {
  useEffect(()=>{
    const h=(e: MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))fn();};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[fn]);
}

// ═══ DROPDOWNS ═══════════════════════════════════════════════════════════
const CountryDrop = ({current,onSelect}: {current: string; onSelect: (id: string) => void}) => {
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useOutside(ref,()=>setOpen(false));
  const ct=COUNTRIES[current as keyof typeof COUNTRIES];
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(!open)} style={{display:'flex',alignItems:'center',gap:6,background:C.bg3,border:`1px solid ${open?C.bGold:C.bMid}`,borderRadius:7,padding:'5px 9px',color:C.tp,fontSize:11.5,cursor:'pointer',fontFamily:'inherit',transition:'border-color .15s',flexShrink:0}}>
        <span>{ct.flag}</span>
        <div style={{textAlign:'left'}}>
          <div style={{fontWeight:500,lineHeight:1}}>{ct.name}</div>
          <div style={{color:ct.sc,fontSize:9.5,marginTop:1}}>{ct.status}</div>
        </div>
        <span style={{color:C.tm,fontSize:9,marginLeft:2}}>▾</span>
      </button>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:300,background:C.bg2,border:`1px solid ${C.bGold}`,borderRadius:10,boxShadow:'0 16px 48px rgba(0,0,0,0.65)',minWidth:210,overflow:'hidden'}}>
          {Object.values(COUNTRIES).map(c=>(
            <button key={c.id} onClick={()=>{onSelect(c.id);setOpen(false);}}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 12px',background:c.id===current?C.goldBg:'none',border:'none',borderBottom:`1px solid ${C.bDim}`,color:c.id===current?C.gold:C.tp,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
              <span style={{fontSize:16}}>{c.flag}</span>
              <div style={{flex:1,textAlign:'left'}}>
                <div style={{fontWeight:c.id===current?600:400}}>{c.name}</div>
                <div style={{fontSize:9.5,color:c.sc,marginTop:1}}>{c.status}</div>
              </div>
              {c.id===current&&<span style={{color:C.gold,fontSize:12}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RoleDrop = ({role,setRole}: {role: string; setRole: (r: string) => void}) => {
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useOutside(ref,()=>setOpen(false));
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(!open)} style={{display:'flex',alignItems:'center',gap:6,background:C.bg3,border:`1px solid ${open?C.bGold:C.bMid}`,borderRadius:7,padding:'5px 9px',color:C.tp,fontSize:11.5,cursor:'pointer',fontFamily:'inherit',transition:'border-color .15s'}}>
        <div style={{width:20,height:20,borderRadius:'50%',background:'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>👤</div>
        <div style={{textAlign:'left'}}><div style={{color:C.tm,fontSize:8.5,lineHeight:1}}>Role</div><div style={{fontWeight:500,fontSize:11.5,lineHeight:1.3}}>{role}</div></div>
        <span style={{color:C.tm,fontSize:9}}>▾</span>
      </button>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:300,background:C.bg2,border:`1px solid ${C.bGold}`,borderRadius:10,boxShadow:'0 16px 48px rgba(0,0,0,0.65)',overflow:'hidden',minWidth:190}}>
          {ROLES.map(r=>(
            <button key={r} onClick={()=>{setRole(r);setOpen(false);}}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'9px 12px',background:r===role?C.goldBg:'none',border:'none',borderBottom:`1px solid ${C.bDim}`,color:r===role?C.gold:C.tp,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
              {r}{r===role&&<span style={{color:C.gold}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══ NOTIFICATION PANEL ══════════════════════════════════════════════════
const NotifPanel = ({open,onClose}: {open: boolean; onClose: () => void}) => {
  const ref=useRef<HTMLDivElement>(null);
  useOutside(ref,onClose);
  const [items,setItems]=useState(NOTIFS);
  const markAll=()=>setItems(p=>p.map(n=>({...n,unread:false})));
  const unread=items.filter(n=>n.unread).length;
  return (
    <div ref={ref} style={{position:'fixed',top:0,right:0,bottom:0,width:310,zIndex:400,background:C.bg1,borderLeft:`1px solid ${C.bDim}`,boxShadow:'-20px 0 48px rgba(0,0,0,0.55)',transform:`translateX(${open?'0':'100%'})`,transition:'transform .22s cubic-bezier(0.4,0,0.2,1)',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'16px',borderBottom:`1px solid ${C.bDim}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{color:C.tp,fontSize:13.5,fontWeight:600}}>Notifications</div>
          {unread>0&&<div style={{color:C.tm,fontSize:11,marginTop:2}}>{unread} unread</div>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {unread>0&&<button onClick={markAll} style={{background:'none',border:'none',color:C.gold,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Mark all read</button>}
          <button onClick={onClose} style={{background:'none',border:'none',color:C.tm,fontSize:20,cursor:'pointer',fontFamily:'inherit',lineHeight:1}}>×</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
        {items.map(n=>(
          <div key={n.id} onClick={()=>setItems(p=>p.map(i=>i.id===n.id?{...i,unread:false}:i))}
            style={{display:'flex',gap:10,padding:'11px 16px',background:n.unread?'rgba(217,164,65,0.05)':'none',borderLeft:`2px solid ${n.unread?C.gold:'transparent'}`,cursor:'pointer'}}>
            <div style={{width:32,height:32,borderRadius:8,background:n.unread?C.goldBg:'rgba(255,255,255,0.04)',border:`1px solid ${n.unread?C.bGold:C.bDim}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>{n.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:n.unread?C.tp:C.ts,fontSize:12,fontWeight:n.unread?500:400,lineHeight:1.3,marginBottom:2}}>{n.title}</div>
              <div style={{color:C.tm,fontSize:11,lineHeight:1.3,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.sub}</div>
              <div style={{color:C.tm,fontSize:10}}>{n.time}</div>
            </div>
            {n.unread&&<div style={{width:7,height:7,borderRadius:'50%',background:C.gold,flexShrink:0,marginTop:4}}/>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══ DESKTOP ═════════════════════════════════════════════════════════════
function Desktop({activeNav,setActiveNav,country,setCountry,role,setRole,activeCat,setActiveCat,activeTab,setActiveTab,saved,toggleSave,notifOpen,setNotifOpen,heatmode,setHeatmode}: {activeNav:string;setActiveNav:(v:string)=>void;country:string;setCountry:(v:string)=>void;role:string;setRole:(v:string)=>void;activeCat:string|null;setActiveCat:(v:string|null)=>void;activeTab:string;setActiveTab:(v:string)=>void;saved:Set<number>;toggleSave:(id:number)=>void;notifOpen:boolean;setNotifOpen:(v:boolean)=>void;heatmode:string;setHeatmode:(v:string)=>void}) {
  const [search,setSearch]=useState('');
  const ct=COUNTRIES[country as keyof typeof COUNTRIES];
  const listings=mkListings(ct);
  const signals=mkSignals(ct.name);
  const unread=NOTIFS.filter(n=>n.unread).length;

  const filtered=listings.filter(l=>{
    const q=search.toLowerCase();
    const catMap={consumables:'Consumables',cannabis:'Cannabis',equipment:'Equipment',distressed:'Distressed Equipment',services:'Services'};
    const cm=!activeCat||l.cat===catMap[activeCat];
    const tm=!q||l.title.toLowerCase().includes(q)||l.cat.toLowerCase().includes(q)||l.loc.toLowerCase().includes(q)||l.tags.some(t=>t.toLowerCase().includes(q));
    return cm&&tm;
  });

  const Divider=()=><div style={{height:1,background:C.bDim}}/>;

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg0,color:C.tp,height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>

      {/* TOP BAR */}
      <div style={{height:56,background:C.bg1,borderBottom:`1px solid ${C.bDim}`,display:'flex',alignItems:'center',padding:'0 14px',gap:10,flexShrink:0,zIndex:101}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <Compass s={28}/>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:13,fontWeight:700,letterSpacing:'0.14em',lineHeight:1}}>HARBOURVIEW</div>
            <div style={{color:C.tm,fontSize:7.5,letterSpacing:'0.06em',marginTop:1}}>MARKET ACCESS. INTELLIGENCE. EDUCATION.</div>
          </div>
        </div>
        <div style={{width:1,height:30,background:C.bDim,flexShrink:0}}/>
        <CountryDrop current={country} onSelect={setCountry}/>
        <RoleDrop role={role} setRole={setRole}/>
        <div style={{flex:1,maxWidth:320,position:'relative'}}>
          <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:C.tm,fontSize:13}}>🔍</span>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search listings, intel, education…"
            style={{width:'100%',background:C.bg2,border:`1px solid ${search?C.bGold:C.bMid}`,borderRadius:7,padding:'6px 28px 6px 28px',color:C.ts,fontSize:11,outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color .15s'}}/>
          {search&&<button onClick={()=>setSearch('')} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:C.tm,fontSize:15,cursor:'pointer',lineHeight:1,padding:0}}>×</button>}
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>setNotifOpen(!notifOpen)} style={{background:notifOpen?C.goldBg:'none',border:`1px solid ${notifOpen?C.bGold:'transparent'}`,borderRadius:7,padding:'5px 7px',cursor:'pointer',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,transition:'all .15s'}}>
            🔔{unread>0&&<span style={{position:'absolute',top:-3,right:-4,background:C.red,color:'white',fontSize:8.5,fontWeight:700,borderRadius:'50%',width:14,height:14,display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</span>}
          </button>
          <button style={{background:'none',border:`1px solid ${C.bMid}`,borderRadius:6,padding:'5px 10px',color:C.ts,fontSize:11,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>⭐ Watchlist</button>
          <div style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer'}}>
            <div style={{width:27,height:27,borderRadius:'50%',background:'linear-gradient(135deg,#D9A441,#8B6914)',display:'flex',alignItems:'center',justifyContent:'center',color:C.bg0,fontWeight:700,fontSize:11}}>A</div>
            <span style={{color:C.ts,fontSize:11.5}}>Alex V. ▾</span>
          </div>
          <div style={{width:1,height:26,background:C.bDim}}/>
          <button style={{background:C.goldFill,border:`1px solid ${C.bGold}`,borderRadius:7,padding:'6px 12px',color:C.gold,fontSize:11.5,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4}}>+ Post Listing</button>
          <button style={{background:'linear-gradient(135deg,#C49025,#8B6914)',border:'none',borderRadius:7,padding:'6px 12px',color:'#0A1624',fontSize:11.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Upgrade / Subscribe</button>
        </div>
      </div>

      {/* BODY */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* SIDEBAR */}
        <div style={{width:150,background:C.bg1,borderRight:`1px solid ${C.bDim}`,display:'flex',flexDirection:'column',padding:'10px 0',flexShrink:0,overflowY:'auto'}}>
          {NAV_ITEMS.map(item=>(
            <button key={item.id} onClick={()=>setActiveNav(item.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 13px',background:activeNav===item.id?'rgba(217,164,65,0.09)':'none',borderLeft:`2px solid ${activeNav===item.id?C.gold:'transparent'}`,border:'none',borderRadius:0,color:activeNav===item.id?C.tp:C.tm,fontSize:12,fontWeight:activeNav===item.id?500:400,width:'100%',textAlign:'left',cursor:'pointer',fontFamily:'inherit',transition:'color .15s'}}>
              <span style={{fontSize:13}}>{item.icon}</span><span style={{flex:1}}>{item.label}</span>
              {item.badge&&<span style={{background:'rgba(214,92,74,0.85)',color:'white',fontSize:9,fontWeight:700,borderRadius:9,padding:'1px 5px'}}>{item.badge}</span>}
            </button>
          ))}
          <div style={{marginTop:'auto',padding:'10px 13px 4px',borderTop:`1px solid ${C.bDim}`}}>
            <button style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',color:C.tm,fontSize:12,width:'100%',padding:'6px 0',cursor:'pointer',fontFamily:'inherit'}}>❓ Help Center</button>
          </div>
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',padding:'14px',gap:10,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <div style={{width:34,height:34,borderRadius:9,background:C.goldBg,border:`1px solid ${C.bGold}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17}}>🛒</div>
              <div><div style={{color:C.gold,fontSize:12.5,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase'}}>Marketplace & Access</div><div style={{color:C.tm,fontSize:10.5}}>Browse opportunities. Connect globally.</div></div>
            </div>
            <button style={{background:'none',border:`1px solid ${C.bGold}`,borderRadius:7,padding:'6px 12px',color:C.gold,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>View All Marketplace →</button>
          </div>

          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            {CATS.map(cat=>(
              <button key={cat.id} onClick={()=>setActiveCat(activeCat===cat.id?null:cat.id)}
                style={{display:'flex',alignItems:'center',gap:5,padding:'6px 11px',background:activeCat===cat.id?C.goldFill:C.bg3,border:`1px solid ${activeCat===cat.id?C.bGold:C.bDim}`,borderRadius:7,color:activeCat===cat.id?C.gold:C.ts,fontSize:11.5,fontWeight:activeCat===cat.id?600:400,cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                <span style={{color:activeCat===cat.id?C.gold:C.tm,fontSize:10.5,fontWeight:700}}>{cat.count}</span><span>{cat.label}</span>
              </button>
            ))}
            <button style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5,padding:'6px 12px',background:C.goldFill,border:`1px solid ${C.bGoldHi}`,borderRadius:7,color:C.gold,fontSize:11.5,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Post Listing</button>
          </div>

          <div style={{display:'flex',alignItems:'center',borderBottom:`1px solid ${C.bDim}`}}>
            {[['featured','Featured Listings'],['recent','Recently Added'],['highdemand','High Demand']].map(([key,label])=>(
              <button key={key} onClick={()=>setActiveTab(key)} style={{background:'none',border:'none',borderBottom:`2px solid ${activeTab===key?C.gold:'transparent'}`,color:activeTab===key?C.tp:C.tm,fontSize:12,fontWeight:activeTab===key?600:400,padding:'7px 13px 9px',marginBottom:-1,cursor:'pointer',fontFamily:'inherit'}}>{label}</button>
            ))}
            <button style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,background:'none',border:`1px solid ${C.bDim}`,borderRadius:6,padding:'5px 9px',color:C.ts,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>⚙ Filters</button>
          </div>

          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:7}}>
            {filtered.length===0?(
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:C.tm,gap:8,padding:'40px 0'}}>
                <span style={{fontSize:32}}>🔍</span>
                <div style={{fontSize:13}}>No listings match &quot;{search || activeCat}&quot;</div>
                <button onClick={()=>{setSearch('');setActiveCat(null);}} style={{background:'none',border:`1px solid ${C.bDim}`,borderRadius:7,padding:'6px 14px',color:C.gold,fontSize:11,cursor:'pointer',fontFamily:'inherit',marginTop:4}}>Clear filters</button>
              </div>
            ):filtered.map(l=>(
              <div key={l.id}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.bGold}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.bDim}
                style={{display:'flex',gap:10,padding:'9px 10px',borderRadius:10,background:C.bg3,border:`1px solid ${C.bDim}`,alignItems:'flex-start',transition:'all .15s'}}>
                <Thumb cat={l.cat} bg={l.bg}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                    <span style={{color:C.tp,fontSize:12.5,fontWeight:500,lineHeight:1.3}}>{l.title}</span><ShieldCheck/>
                  </div>
                  <div style={{color:C.ts,fontSize:11,marginBottom:5,lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical'}}>{l.desc}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{l.tags.map(t=><TC key={t} label={t}/>)}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0,minWidth:88}}>
                  <div style={{display:'flex',alignItems:'center',gap:3,color:C.tm,fontSize:10.5}}><PinIcon/>{l.loc}</div>
                  <div style={{color:C.gold,fontSize:12.5,fontWeight:600}}>{l.price}</div>
                  <button onClick={()=>toggleSave(l.id)} style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex'}}><BK on={saved.has(l.id)}/></button>
                </div>
              </div>
            ))}
            {filtered.length>0&&<button style={{width:'100%',padding:'11px',background:'none',border:`1px solid ${C.bGold}`,borderRadius:10,color:C.gold,fontSize:12.5,fontWeight:600,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.05em',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>Browse All Listings →</button>}
          </div>

          {/* Status bar */}
          <div style={{display:'flex',borderRadius:11,overflow:'hidden',border:`1px solid ${C.bDim}`,flexShrink:0}}>
            {[
              {label:'COUNTRY STATUS',        val:ct.bar.s2,      sub:ct.bar.s1,                          color:ct.sc,                                                                                     icon:ct.flag},
              {label:'MARKET OPPORTUNITY',    val:ct.bar.opp,     sub:`Opportunity Score ${ct.bar.score} / 100`, color:['High','Very High'].includes(ct.bar.opp)?C.gold:C.ts,                            icon:'🤝'},
              {label:'REGULATORY ENVIRONMENT',val:ct.bar.reg,     sub:'Regulatory framework status',      color:['Favorable','Established'].includes(ct.bar.reg)?C.green:C.ts,                           icon:'⚖️'},
              {label:'MARKET ACTIVITY',       val:ct.bar.act,     sub:'Listings & buyer demand',           color:C.gold,                                                                                    icon:'📈'},
            ].map((item,i)=>(
              <div key={i} style={{flex:1,background:C.bg2,padding:'9px 10px',borderLeft:i>0?`1px solid ${C.bDim}`:'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:3}}><span style={{fontSize:12}}>{item.icon}</span><span style={{color:C.tm,fontSize:8.5,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase'}}>{item.label}</span></div>
                <div style={{color:item.color,fontSize:12.5,fontWeight:700,marginBottom:1}}>{item.val}</div>
                <div style={{color:C.tm,fontSize:9.5}}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:316,background:C.bg1,borderLeft:`1px solid ${C.bDim}`,display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0}}>
          <div style={{flex:1,overflowY:'auto',padding:'14px',display:'flex',flexDirection:'column',gap:14}}>

            {/* INTEL */}
            <div>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:9}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
                    <div style={{width:26,height:26,borderRadius:7,background:'rgba(59,130,160,0.15)',border:'1px solid rgba(59,130,160,0.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>📡</div>
                    <span style={{color:C.gold,fontSize:11.5,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase'}}>Intel Signals</span>
                  </div>
                  <div style={{color:C.tm,fontSize:10.5,paddingLeft:33}}>Key updates and market movements.</div>
                </div>
                <button style={{background:'none',border:'none',color:C.gold,fontSize:11,cursor:'pointer',fontFamily:'inherit',flexShrink:0,marginTop:3}}>View All →</button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:7}}>{signals.map(s=><SigRow key={s.id} s={s}/>)}</div>
              <div style={{marginTop:9,padding:'11px 12px',background:'rgba(217,164,65,0.06)',border:`1px solid ${C.bGold}`,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                <div><div style={{color:C.gold,fontSize:11.5,fontWeight:600,marginBottom:2}}>🔒 Unlock deeper intelligence</div><div style={{color:C.ts,fontSize:10.5,lineHeight:1.35}}>Daily signals, exclusive reports, and market alerts.</div></div>
                <button style={{background:'linear-gradient(135deg,#C49025,#8B6914)',border:'none',borderRadius:7,padding:'6px 10px',color:'#0A1624',fontSize:10.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>Upgrade Now</button>
              </div>
            </div>

            <Divider/>

            {/* EDUCATION — 2-col grid */}
            <div>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:9}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
                    <div style={{width:26,height:26,borderRadius:7,background:C.goldBg,border:`1px solid ${C.bGold}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>📚</div>
                    <span style={{color:C.gold,fontSize:11.5,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase'}}>Education Hub</span>
                  </div>
                  <div style={{color:C.tm,fontSize:10.5,paddingLeft:33}}>Learn. Comply. Grow with confidence.</div>
                </div>
                <button style={{background:'none',border:'none',color:C.gold,fontSize:11,cursor:'pointer',fontFamily:'inherit',flexShrink:0,marginTop:3}}>View All →</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>{EDU.map(item=><EduCard key={item.title} item={item}/>)}</div>
            </div>

            <Divider/>

            {/* GLOBE */}
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:26,height:26,borderRadius:7,background:'rgba(59,130,160,0.12)',border:'1px solid rgba(59,130,160,0.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>🌐</div>
                  <span style={{color:C.gold,fontSize:11.5,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase'}}>Intel Globe</span>
                </div>
                <button style={{background:'none',border:'none',color:C.gold,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Expand →</button>
              </div>
              <div style={{display:'flex',gap:4,marginBottom:10,flexWrap:'wrap'}}>
                {HMODES.map(m=>(
                  <button key={m} onClick={()=>setHeatmode(m)} style={{padding:'4px 8px',borderRadius:5,fontSize:10,background:heatmode===m?C.goldFill:C.bg3,border:`1px solid ${heatmode===m?C.bGold:C.bDim}`,color:heatmode===m?C.gold:C.tm,cursor:'pointer',fontFamily:'inherit',fontWeight:heatmode===m?600:400}}>{m}</button>
                ))}
              </div>
              <Globe selectedCountry={country} heatmode={heatmode}/>
              <div style={{display:'flex',gap:10,marginTop:8,justifyContent:'center'}}>
                {[['High','rgba(217,164,65,0.9)'],['Medium','rgba(217,164,65,0.5)'],['Low','rgba(217,164,65,0.2)']].map(([l,col])=>(
                  <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:col,boxShadow:`0 0 4px ${col}`}}/>
                    <span style={{color:C.tm,fontSize:9.5}}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {notifOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:390}} onClick={()=>setNotifOpen(false)}/>}
      <NotifPanel open={notifOpen} onClose={()=>setNotifOpen(false)}/>
    </div>
  );
}

// ═══ MOBILE ══════════════════════════════════════════════════════════════
function Mobile({activeNav,setActiveNav,country,setCountry,saved,toggleSave,notifOpen,setNotifOpen}: {activeNav:string;setActiveNav:(v:string)=>void;country:string;setCountry:(v:string)=>void;saved:Set<number>;toggleSave:(id:number)=>void;notifOpen:boolean;setNotifOpen:(v:boolean)=>void}) {
  const [search,setSearch]=useState('');
  const ct=COUNTRIES[country as keyof typeof COUNTRIES];
  const listings=mkListings(ct);
  const signals=mkSignals(ct.name);
  const [cOpen,setCOpen]=useState(false);
  const cRef=useRef<HTMLDivElement>(null);
  useOutside(cRef,()=>setCOpen(false));
  const unread=NOTIFS.filter(n=>n.unread).length;
  const filtered=listings.filter(l=>!search||l.title.toLowerCase().includes(search.toLowerCase())||l.loc.toLowerCase().includes(search.toLowerCase()));
  const mNav=[{id:'dashboard',label:'Dashboard',icon:'⊞'},{id:'marketplace',label:'Marketplace',icon:'🛒'},{id:'post',label:'Post',icon:'+',p:true},{id:'intel',label:'Intel',icon:'📡'},{id:'education',label:'Education',icon:'📚'}];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg0,color:C.tp,height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 14px',background:C.bg1,borderBottom:`1px solid ${C.bDim}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><Compass s={24}/><span style={{fontFamily:"'Cinzel',serif",color:C.gold,fontSize:13.5,fontWeight:700,letterSpacing:'0.12em'}}>HARBOURVIEW</span></div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>setNotifOpen(!notifOpen)} style={{background:'none',border:'none',cursor:'pointer',position:'relative',fontSize:17,padding:2}}>
            🔔{unread>0&&<span style={{position:'absolute',top:-2,right:-3,background:C.red,color:'white',fontSize:8,fontWeight:700,borderRadius:'50%',width:13,height:13,display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</span>}
          </button>
          <span style={{fontSize:19,color:C.ts,cursor:'pointer'}}>☰</span>
        </div>
      </div>

      <div style={{padding:'9px 12px',background:C.bg1,borderBottom:`1px solid ${C.bDim}`,display:'flex',gap:7,flexShrink:0}}>
        <div ref={cRef} style={{flex:1,position:'relative'}}>
          <button onClick={()=>setCOpen(!cOpen)} style={{width:'100%',display:'flex',alignItems:'center',gap:6,background:C.bg3,border:`1px solid ${cOpen?C.bGold:C.bMid}`,borderRadius:8,padding:'7px 9px',color:C.tp,fontSize:11.5,cursor:'pointer',fontFamily:'inherit'}}>
            <span>{ct.flag}</span><div style={{flex:1,textAlign:'left'}}><div style={{fontWeight:500,fontSize:12}}>{ct.name}</div><div style={{color:ct.sc,fontSize:9.5}}>{ct.status}</div></div><span style={{color:C.tm,fontSize:9}}>▾</span>
          </button>
          {cOpen&&(
            <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:300,background:C.bg2,border:`1px solid ${C.bGold}`,borderRadius:10,boxShadow:'0 16px 40px rgba(0,0,0,0.7)',overflow:'hidden'}}>
              {Object.values(COUNTRIES).map(c=>(
                <button key={c.id} onClick={()=>{setCountry(c.id);setCOpen(false);}} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 12px',background:c.id===country?C.goldBg:'none',border:'none',borderBottom:`1px solid ${C.bDim}`,color:c.id===country?C.gold:C.tp,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                  <span>{c.flag}</span><div style={{flex:1,textAlign:'left'}}><div style={{fontWeight:c.id===country?600:400}}>{c.name}</div><div style={{fontSize:9.5,color:c.sc}}>{c.status}</div></div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{flex:1,display:'flex',alignItems:'center',gap:6,background:C.bg3,border:`1px solid ${C.bMid}`,borderRadius:8,padding:'7px 9px',color:C.tm,fontSize:11}}><span>👤</span><span>Importer / Buyer</span></div>
      </div>

      <div style={{flex:1,overflowY:'auto',paddingBottom:76}}>
        <div style={{margin:'12px 12px 0',position:'relative'}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:C.tm,fontSize:13}}>🔍</span>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search listings…" style={{width:'100%',background:C.bg2,border:`1px solid ${search?C.bGold:C.bDim}`,borderRadius:9,padding:'9px 9px 9px 30px',color:C.ts,fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color .15s'}}/>
        </div>

        {/* Globe teaser */}
        <div style={{margin:'10px 12px 0',borderRadius:13,overflow:'hidden',background:'radial-gradient(ellipse at 28% 50%,rgba(59,130,160,0.26) 0%,rgba(6,16,26,0.96) 58%,#02070D 100%)',border:`1px solid ${C.bGold}`,padding:'15px',position:'relative',minHeight:100}}>
          <div style={{position:'absolute',right:-22,bottom:-22,width:110,height:110,borderRadius:'50%',background:'radial-gradient(circle at 38% 35%,rgba(59,130,160,0.4),rgba(13,30,48,0.65) 55%,transparent)',border:'1px solid rgba(59,130,160,0.2)'}}/>
          {[[18,45],[35,22],[55,38],[70,58],[82,28]].map(([x,y],i)=><div key={i} style={{position:'absolute',left:`${x}%`,top:`${y}%`,width:3,height:3,borderRadius:'50%',background:C.gold,boxShadow:`0 0 5px ${C.gold}`,opacity:.8}}/>)}
          <div style={{color:C.ts,fontSize:11.5,fontWeight:500,marginBottom:2}}>Global View</div>
          <div style={{color:C.tp,fontSize:13,fontWeight:600,lineHeight:1.3,marginBottom:10}}>Track opportunity. Connect globally.</div>
          <button style={{display:'flex',alignItems:'center',gap:6,background:'rgba(217,164,65,0.12)',border:`1px solid ${C.bGold}`,borderRadius:8,padding:'7px 13px',color:C.gold,fontSize:11.5,fontWeight:600,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.04em'}}>⊙ VIEW GLOBE</button>
        </div>

        {/* Marketplace */}
        <div style={{margin:'10px 12px 0',background:C.bg2,borderRadius:13,border:`1px solid ${C.bDim}`}}>
          <div style={{padding:'13px 13px 0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:11}}>
              <span style={{color:C.gold,fontSize:12.5,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>Marketplace</span>
              <button style={{background:'none',border:'none',color:C.gold,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>View all →</button>
            </div>
            <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:11}}>
              {[{l:'Consumables',i:'📦'},{l:'Cannabis',i:'🌿'},{l:'Equipment',i:'⚙️'},{l:'Distressed',i:'🔩'},{l:'Services',i:'🛠️'}].map(c=>(
                <div key={c.l} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,minWidth:52}}>
                  <div style={{width:42,height:42,borderRadius:11,background:C.bg3,border:`1px solid ${C.bDim}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19}}>{c.i}</div>
                  <span style={{color:C.tm,fontSize:9,textAlign:'center'}}>{c.l}</span>
                </div>
              ))}
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,minWidth:52}}>
                <div style={{width:42,height:42,borderRadius:11,background:C.goldFill,border:`1px solid ${C.bGold}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:C.gold,fontWeight:700}}>+</div>
                <span style={{color:C.gold,fontSize:9,fontWeight:600}}>Post</span>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span style={{color:C.ts,fontSize:11.5,fontWeight:600}}>{search?`Results for "${search}"`:'Featured Listings'}</span>
              <button style={{background:'none',border:`1px solid ${C.bDim}`,borderRadius:6,padding:'3px 8px',color:C.tm,fontSize:10.5,cursor:'pointer',fontFamily:'inherit'}}>⚙ Filters</button>
            </div>
          </div>
          {filtered.slice(0,3).map((l,i)=>(
            <div key={l.id} style={{display:'flex',gap:9,padding:'9px 13px',borderTop:`1px solid ${C.bDim}`,alignItems:'center'}}>
              <Thumb cat={l.cat} bg={l.bg} w={58} h={54}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:4}}><span style={{color:C.tp,fontSize:12,fontWeight:500,lineHeight:1.2}}>{l.title}</span><ShieldCheck/></div>
                <TC label={l.tags[0]}/>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:2,color:C.tm,fontSize:10,marginBottom:3,justifyContent:'flex-end'}}><PinIcon/>{l.loc}</div>
                <div style={{color:C.gold,fontSize:12,fontWeight:600}}>{l.price}</div>
              </div>
            </div>
          ))}
          {filtered.length===0&&<div style={{padding:'18px',textAlign:'center',color:C.tm,fontSize:12}}>No listings match your search</div>}
          <div style={{padding:'9px 13px 13px'}}>
            <button style={{width:'100%',padding:'10px',background:'none',border:`1px solid ${C.bGold}`,borderRadius:9,color:C.gold,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.05em'}}>BROWSE ALL LISTINGS →</button>
          </div>
        </div>

        {/* Intel */}
        <div style={{margin:'10px 12px 0',background:C.bg2,borderRadius:13,border:`1px solid ${C.bDim}`,padding:'13px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{color:C.gold,fontSize:12.5,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>Intel Signals</span>
            <button style={{background:'none',border:'none',color:C.gold,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>View all →</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>{signals.slice(0,3).map(s=><SigRow key={s.id} s={s}/>)}</div>
        </div>

        {/* Education — 2-col grid on mobile too */}
        <div style={{margin:'10px 12px 0',background:C.bg2,borderRadius:13,border:`1px solid ${C.bDim}`,padding:'13px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{color:C.gold,fontSize:12.5,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>Education</span>
            <button style={{background:'none',border:'none',color:C.gold,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>View all →</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
            {EDU.slice(0,4).map(item=>(
              <div key={item.title} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'11px 6px',borderRadius:10,background:C.bg3,border:`1px solid ${C.bDim}`,textAlign:'center'}}>
                <div style={{width:34,height:34,borderRadius:8,background:C.goldBg,border:`1px solid ${C.bGold}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{item.icon}</div>
                <div style={{color:C.ts,fontSize:10,fontWeight:500,lineHeight:1.3}}>{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{position:'fixed',bottom:0,left:0,right:0,height:70,background:C.bg1,borderTop:`1px solid ${C.bDim}`,display:'flex',alignItems:'center',zIndex:100}}>
        {mNav.map(item=>(
          <button key={item.id} onClick={()=>setActiveNav(item.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,background:'none',border:'none',height:'100%',cursor:'pointer',fontFamily:'inherit'}}>
            {item.p?(
              <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#D9A441,#8B6914)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:C.bg0,fontWeight:700,boxShadow:'0 0 18px rgba(217,164,65,0.38)',marginBottom:-4}}>+</div>
            ):(
              <><span style={{fontSize:17}}>{item.icon}</span><span style={{fontSize:9.5,color:activeNav===item.id?C.gold:C.tm,fontWeight:activeNav===item.id?600:400}}>{item.label}</span></>
            )}
          </button>
        ))}
      </div>

      {notifOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:390}} onClick={()=>setNotifOpen(false)}/>}
      <NotifPanel open={notifOpen} onClose={()=>setNotifOpen(false)}/>
    </div>
  );
}

// ═══ ROOT ════════════════════════════════════════════════════════════════
export default function HarbourviewDashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [country,   setCountry]   = useState('nz');
  const [role,      setRole]      = useState('Importer / Buyer');
  const [activeCat, setActiveCat] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState('featured');
  const [saved,     setSaved]     = useState<Set<number>>(new Set());
  const [isMobile,  setIsMobile]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [heatmode,  setHeatmode]  = useState('Demand');

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<650);
    check(); window.addEventListener('resize',check);
    return()=>window.removeEventListener('resize',check);
  },[]);

  const toggleSave=(id: number)=>setSaved(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;} body,html{margin:0;padding:0;} button{cursor:pointer;}
        ::-webkit-scrollbar{width:4px;height:4px;} ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(217,164,65,0.25);border-radius:4px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(217,164,65,0.45);}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(1.35);}}
      `}</style>
      {isMobile
        ?<Mobile activeNav={activeNav} setActiveNav={setActiveNav} country={country} setCountry={setCountry} saved={saved} toggleSave={toggleSave} notifOpen={notifOpen} setNotifOpen={setNotifOpen}/>
        :<Desktop activeNav={activeNav} setActiveNav={setActiveNav} country={country} setCountry={setCountry} role={role} setRole={setRole} activeCat={activeCat} setActiveCat={setActiveCat} activeTab={activeTab} setActiveTab={setActiveTab} saved={saved} toggleSave={toggleSave} notifOpen={notifOpen} setNotifOpen={setNotifOpen} heatmode={heatmode} setHeatmode={setHeatmode}/>
      }
    </>
  );
}
