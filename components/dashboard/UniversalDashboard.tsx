'use client'

import { useState, useEffect, useRef, useCallback, type RefObject } from 'react'
import type { RoleId } from '@/types/globe-router'
import type { DashboardSignal } from '@/lib/dashboard/dashboardServerData'
import { ROLE_PROFILES } from '@/lib/dashboard/dashboardServerData'

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  bg0: '#02070D', bg1: '#06101A', bg2: '#08131F', bg3: '#0B1826',
  bDim: 'rgba(255,255,255,0.07)', bMid: 'rgba(255,255,255,0.11)',
  bGold: 'rgba(212,164,74,0.35)', bGoldHi: 'rgba(212,164,74,0.60)',
  gold: '#D9A441', goldBrt: '#F2C46D', goldFill: 'rgba(217,164,65,0.10)', goldBg: 'rgba(217,164,65,0.07)',
  tp: '#F7F1E6', ts: '#B8C0C8', tm: '#6F7A86',
  green: '#6FCF7D', greenBg: 'rgba(111,207,125,0.12)', red: '#D65C4A',
}

const TAGS: Record<string, [string, string, string]> = {
  'Equipment':              ['rgba(59,130,160,0.18)',  '#5DAFC8', 'rgba(59,130,160,0.30)'],
  'Verified Seller':        ['rgba(74,154,107,0.18)',  '#6FCF7D', 'rgba(74,154,107,0.30)'],
  'Excellent Condition':    ['rgba(255,255,255,0.06)', '#8A949E', 'rgba(255,255,255,0.10)'],
  'Cannabis':               ['rgba(74,154,107,0.18)',  '#6FCF7D', 'rgba(74,154,107,0.30)'],
  'Lab Tested':             ['rgba(139,95,168,0.18)',  '#B07ED4', 'rgba(139,95,168,0.30)'],
  'Consumables':            ['rgba(184,115,51,0.18)',  '#D49560', 'rgba(184,115,51,0.30)'],
  'New':                    ['rgba(217,164,65,0.18)',  '#D9A441', 'rgba(217,164,65,0.35)'],
  'Distressed Equipment':   ['rgba(214,92,74,0.18)',   '#E07868', 'rgba(214,92,74,0.30)'],
  'Business Opportunity':   ['rgba(139,95,168,0.18)',  '#B07ED4', 'rgba(139,95,168,0.30)'],
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface CountryOption {
  iso2: string
  flag: string
  name: string
  status: string
  statusColor: string
  dashboardStatus: string
}

export interface UniversalDashboardProps {
  signals: DashboardSignal[]
  eduCategories: { icon: string; title: string; desc: string }[]
  countryBar: {
    status: string; statusColor: string
    opportunity: string; opportunityColor: string
    regulatory: string; regulatoryColor: string
    activity: string; activityColor: string
    score: number; adultUse: string; medicalUse: string
  }
  initialCountryIso2?: string | null
  initialRoleId?: string | null
}

// ─── Static fixture listings ─────────────────────────────────────────────────
const mkListings = (cur: string, c1: string, c2: string, c3: string) => [
  { id: 1, cat: 'Equipment',          title: 'Stainless Steel Mixing Tank 500L',  desc: 'Food grade 316 SS mixing tank. Excellent condition.', tags: ['Equipment', 'Verified Seller', 'Excellent Condition'], loc: c1, price: `${cur} $8,750`   },
  { id: 2, cat: 'Cannabis',           title: 'Premium Flower – Indoor Grown',      desc: 'Top shelf indoor grown flower. Lab tested & certified.',tags: ['Cannabis', 'Verified Seller', 'Lab Tested'],           loc: c2, price: `${cur} $4,200 / kg`},
  { id: 3, cat: 'Consumables',        title: 'Nutrient Solution Starter Kit',      desc: 'Complete 3-part nutrient solution kit.',               tags: ['Consumables', 'New', 'Verified Seller'],               loc: c3, price: `${cur} $320`       },
  { id: 4, cat: 'Distressed Equipment', title: 'Distressed Extraction Equipment', desc: 'Falling film evaporator. Needs minor refurbishment.',   tags: ['Distressed Equipment', 'Verified Seller'],             loc: c2, price: `${cur} $12,500`   },
  { id: 5, cat: 'Business Opportunity', title: 'Turnkey Greenhouse Facility',      desc: '1,200m² greenhouse with climate systems.',             tags: ['Business Opportunity', 'Verified Seller'],             loc: c1, price: `${cur} $950,000`  },
]

const COUNTRIES: CountryOption[] = [
  { iso2: 'DE', flag: '🇩🇪', name: 'Germany',        status: 'Market Open',    statusColor: '#6FCF7D', dashboardStatus: 'live'     },
  { iso2: 'AU', flag: '🇦🇺', name: 'Australia',       status: 'Market Open',    statusColor: '#6FCF7D', dashboardStatus: 'live'     },
  { iso2: 'CA', flag: '🇨🇦', name: 'Canada',          status: 'Market Open',    statusColor: '#6FCF7D', dashboardStatus: 'live'     },
  { iso2: 'IL', flag: '🇮🇱', name: 'Israel',          status: 'Market Open',    statusColor: '#6FCF7D', dashboardStatus: 'live'     },
  { iso2: 'BR', flag: '🇧🇷', name: 'Brazil',          status: 'Developing',     statusColor: '#D9A441', dashboardStatus: 'live'     },
  { iso2: 'FR', flag: '🇫🇷', name: 'France',          status: 'Partial Access', statusColor: '#D9A441', dashboardStatus: 'partial'  },
  { iso2: 'IT', flag: '🇮🇹', name: 'Italy',           status: 'Partial Access', statusColor: '#D9A441', dashboardStatus: 'partial'  },
  { iso2: 'NL', flag: '🇳🇱', name: 'Netherlands',     status: 'Partial Access', statusColor: '#D9A441', dashboardStatus: 'partial'  },
  { iso2: 'PT', flag: '🇵🇹', name: 'Portugal',        status: 'Partial Access', statusColor: '#D9A441', dashboardStatus: 'partial'  },
  { iso2: 'PL', flag: '🇵🇱', name: 'Poland',          status: 'Partial Access', statusColor: '#D9A441', dashboardStatus: 'partial'  },
  { iso2: 'US', flag: '🇺🇸', name: 'United States',   status: 'Complex',        statusColor: '#D9A441', dashboardStatus: 'partial'  },
  { iso2: 'GB', flag: '🇬🇧', name: 'United Kingdom',  status: 'Under Review',   statusColor: '#5DAFC8', dashboardStatus: 'review-required'},
  { iso2: 'CZ', flag: '🇨🇿', name: 'Czechia',         status: 'Under Review',   statusColor: '#5DAFC8', dashboardStatus: 'review-required'},
  { iso2: 'DK', flag: '🇩🇰', name: 'Denmark',         status: 'Under Review',   statusColor: '#5DAFC8', dashboardStatus: 'review-required'},
  { iso2: 'CH', flag: '🇨🇭', name: 'Switzerland',     status: 'Under Review',   statusColor: '#5DAFC8', dashboardStatus: 'review-required'},
  { iso2: 'NZ', flag: '🇳🇿', name: 'New Zealand',     status: 'Market Open',    statusColor: '#6FCF7D', dashboardStatus: 'live'     },
  { iso2: 'CO', flag: '🇨🇴', name: 'Colombia',        status: 'Request Only',   statusColor: '#6F7A86', dashboardStatus: 'request-only'},
  { iso2: 'TH', flag: '🇹🇭', name: 'Thailand',        status: 'Partial Access', statusColor: '#D9A441', dashboardStatus: 'partial'  },
  { iso2: 'MT', flag: '🇲🇹', name: 'Malta',           status: 'Request Only',   statusColor: '#6F7A86', dashboardStatus: 'request-only'},
  { iso2: 'LU', flag: '🇱🇺', name: 'Luxembourg',      status: 'Request Only',   statusColor: '#6F7A86', dashboardStatus: 'request-only'},
]

const COUNTRY_DATA: Record<string, { cur: string; c1: string; c2: string; c3: string }> = {
  DE: { cur: 'EUR', c1: 'Berlin',    c2: 'Hamburg',    c3: 'Munich'       },
  AU: { cur: 'AUD', c1: 'Sydney',    c2: 'Melbourne',  c3: 'Brisbane'     },
  CA: { cur: 'CAD', c1: 'Toronto',   c2: 'Vancouver',  c3: 'Calgary'      },
  IL: { cur: 'ILS', c1: 'Tel Aviv',  c2: 'Haifa',      c3: 'Jerusalem'    },
  BR: { cur: 'BRL', c1: 'São Paulo', c2: 'Rio',        c3: 'Brasília'     },
  FR: { cur: 'EUR', c1: 'Paris',     c2: 'Lyon',       c3: 'Marseille'    },
  IT: { cur: 'EUR', c1: 'Milan',     c2: 'Rome',       c3: 'Turin'        },
  NL: { cur: 'EUR', c1: 'Amsterdam', c2: 'Rotterdam',  c3: 'Utrecht'      },
  PT: { cur: 'EUR', c1: 'Lisbon',    c2: 'Porto',      c3: 'Faro'         },
  PL: { cur: 'PLN', c1: 'Warsaw',    c2: 'Kraków',     c3: 'Gdańsk'       },
  US: { cur: 'USD', c1: 'Denver',    c2: 'Los Angeles',c3: 'Portland'     },
  GB: { cur: 'GBP', c1: 'London',    c2: 'Manchester', c3: 'Bristol'      },
  CZ: { cur: 'CZK', c1: 'Prague',    c2: 'Brno',       c3: 'Ostrava'      },
  DK: { cur: 'DKK', c1: 'Copenhagen',c2: 'Aarhus',     c3: 'Odense'       },
  CH: { cur: 'CHF', c1: 'Zurich',    c2: 'Basel',      c3: 'Geneva'       },
  NZ: { cur: 'NZD', c1: 'Auckland',  c2: 'Wellington', c3: 'Christchurch' },
  CO: { cur: 'COP', c1: 'Bogotá',    c2: 'Medellín',   c3: 'Cali'         },
  TH: { cur: 'THB', c1: 'Bangkok',   c2: 'Chiang Mai', c3: 'Phuket'       },
  MT: { cur: 'EUR', c1: 'Valletta',  c2: 'Sliema',     c3: 'Mdina'        },
  LU: { cur: 'EUR', c1: 'Luxembourg City',c2: 'Esch',  c3: 'Differdange'  },
}

const CATS = [
  { id: 'consumables',  label: 'Consumables', count: '1,248' },
  { id: 'cannabis',     label: 'Cannabis',    count: '892'   },
  { id: 'equipment',    label: 'Equipment',   count: '1,112' },
  { id: 'distressed',   label: 'Distressed',  count: '315'   },
  { id: 'services',     label: 'Services',    count: '674'   },
]

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',     icon: '⊞'  },
  { id: 'marketplace', label: 'Marketplace',   icon: '🛒'  },
  { id: 'intel',       label: 'Intel Signals', icon: '📡'  },
  { id: 'education',   label: 'Education Hub', icon: '📚'  },
  { id: 'connections', label: 'Connections',   icon: '🔗'  },
  { id: 'activity',    label: 'My Activity',   icon: '⚡'   },
  { id: 'messages',    label: 'Messages',      icon: '✉️',  badge: 3 },
  { id: 'searches',    label: 'Saved Searches', icon: '🔍' },
  { id: 'account',     label: 'Account',       icon: '👤'  },
]

const ALL_ROLES = Object.entries(ROLE_PROFILES).map(([id, p]) => ({ id: id as RoleId, ...p }))

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useOutside(ref: RefObject<HTMLElement | null>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [fn])
}

// ─── Atoms ───────────────────────────────────────────────────────────────────
const TC = ({ label }: { label: string }) => {
  const [bg, color, border] = TAGS[label] || ['rgba(255,255,255,0.06)', '#8A949E', 'rgba(255,255,255,0.10)']
  return <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 4, fontSize: 10, fontWeight: 500, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
}

const ShieldCheck = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <path d="M6.5 1L11 3.2V6.5C11 9 8.8 11.2 6.5 12C4.2 11.2 2 9 2 6.5V3.2L6.5 1Z" fill="rgba(74,154,107,0.25)" stroke="#6FCF7D" strokeWidth="0.8" />
    <path d="M4.5 6.5L5.8 7.8L9 4.5" stroke="#6FCF7D" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const BK = ({ on }: { on: boolean }) => (
  <svg width="14" height="17" viewBox="0 0 14 17" fill="none">
    <path d="M1 1.5C1 1.22 1.22 1 1.5 1H12.5C12.78 1 13 1.22 13 1.5V15.5L7 11.5L1 15.5V1.5Z" fill={on ? 'rgba(217,164,65,0.22)' : 'none'} stroke={on ? '#D9A441' : '#6F7A86'} strokeWidth="1.2" />
  </svg>
)

// ─── Signal Row ───────────────────────────────────────────────────────────────
const SigRow = ({ s }: { s: DashboardSignal }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 10px', borderRadius: 8, background: C.bg3, border: `1px solid ${C.bDim}` }}>
    <div style={{ width: 28, height: 28, borderRadius: 7, background: s.tag.bg, border: `1px solid ${s.tag.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: s.tag.color }}>
      {s.type.includes('regulatory') || s.type.includes('change') ? '📋' :
       s.type.includes('equipment') || s.type.includes('distressed') ? '⚙️' :
       s.type.includes('buyer') || s.type.includes('demand') ? '📈' :
       s.type.includes('relationship') || s.type.includes('trade') ? '🤝' :
       s.type.includes('invest') || s.type.includes('expan') ? '💰' : '🌐'}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: C.ts, fontSize: 11.5, lineHeight: 1.4, marginBottom: 5 }}>{s.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: s.tag.bg, color: s.tag.color, border: `1px solid ${s.tag.border}`, borderRadius: 4, fontSize: 9.5, fontWeight: 700, padding: '2px 6px', letterSpacing: '0.06em' }}>{s.tag.label}</span>
        <span style={{ color: C.tm, fontSize: 10 }}>{s.timeAgo}</span>
        {s.commercialImpact === 'high' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />}
      </div>
    </div>
  </div>
)

// ─── Country Dropdown ─────────────────────────────────────────────────────────
const CountryDrop = ({ current, onSelect }: { current: CountryOption | null; onSelect: (c: CountryOption) => void }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, useCallback(() => setOpen(false), []))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bg3, border: `1px solid ${open ? C.bGold : C.bMid}`, borderRadius: 7, padding: '5px 9px', color: C.tp, fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s', minWidth: 148 }}>
        {current ? (
          <>
            <span style={{ fontSize: 17 }}>{current.flag}</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontWeight: 500, lineHeight: 1 }}>{current.name}</div>
              <div style={{ color: current.statusColor, fontSize: 9.5, marginTop: 1 }}>{current.status}</div>
            </div>
          </>
        ) : (
          <div style={{ color: C.tm, flex: 1 }}>Select country…</div>
        )}
        <span style={{ color: C.tm, fontSize: 9, marginLeft: 2 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: C.bg2, border: `1px solid ${C.bGold}`, borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.65)', minWidth: 220, overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
          {COUNTRIES.map(c => (
            <button key={c.iso2} onClick={() => { onSelect(c); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: current?.iso2 === c.iso2 ? C.goldBg : 'none', border: 'none', borderBottom: `1px solid ${C.bDim}`, color: current?.iso2 === c.iso2 ? C.gold : C.tp, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 16 }}>{c.flag}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: current?.iso2 === c.iso2 ? 600 : 400 }}>{c.name}</div>
                <div style={{ fontSize: 9.5, color: c.statusColor, marginTop: 1 }}>{c.status}</div>
              </div>
              {current?.iso2 === c.iso2 && <span style={{ color: C.gold, fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Role Dropdown ────────────────────────────────────────────────────────────
const RoleDrop = ({ roleId, onSelect }: { roleId: string | null; onSelect: (id: string) => void }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, useCallback(() => setOpen(false), []))
  const label = roleId ? (ROLE_PROFILES[roleId as RoleId]?.label ?? roleId) : 'Select role…'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bg3, border: `1px solid ${open ? C.bGold : C.bMid}`, borderRadius: 7, padding: '5px 9px', color: C.tp, fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s', minWidth: 165 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>👤</div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <div style={{ color: C.tm, fontSize: 8.5, lineHeight: 1 }}>Role</div>
          <div style={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1.3, color: roleId ? C.tp : C.tm }}>{label}</div>
        </div>
        <span style={{ color: C.tm, fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: C.bg2, border: `1px solid ${C.bGold}`, borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.65)', overflow: 'hidden', minWidth: 210, maxHeight: 380, overflowY: 'auto' }}>
          {ALL_ROLES.map(r => (
            <button key={r.id} onClick={() => { onSelect(r.id); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 12px', background: roleId === r.id ? C.goldBg : 'none', border: 'none', borderBottom: `1px solid ${C.bDim}`, color: roleId === r.id ? C.gold : C.tp, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              {r.label}{roleId === r.id && <span style={{ color: C.gold }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Notification Panel ───────────────────────────────────────────────────────
const NOTIFS = [
  { id: 1, icon: '📩', title: 'New inquiry on Mixing Tank 500L',     sub: 'From: GreenLeaf GmbH (Germany)',         time: '5m ago',  unread: true  },
  { id: 2, icon: '📈', title: 'Price alert: Cannabis flower up 18%', sub: 'APAC market — demand spike detected',    time: '23m ago', unread: true  },
  { id: 3, icon: '💬', title: 'Message from Iberia Extracts SL',     sub: '"We can offer EU-GMP certified batch…"', time: '1h ago',  unread: true  },
  { id: 4, icon: '🔖', title: 'Saved listing updated',               sub: 'Nutrient Solution Kit — price reduced',  time: '3h ago',  unread: false },
  { id: 5, icon: '🔔', title: 'Your listing has 4 new views',        sub: 'Stainless Steel Mixing Tank 500L',       time: '5h ago',  unread: false },
]

const NotifPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, useCallback(() => { if (open) onClose() }, [open, onClose]))
  const [items, setItems] = useState(NOTIFS)
  const markAll = () => setItems(p => p.map(n => ({ ...n, unread: false })))
  const unread = items.filter(n => n.unread).length

  return (
    <div ref={ref} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 310, zIndex: 400, background: C.bg1, borderLeft: `1px solid ${C.bDim}`, boxShadow: '-20px 0 48px rgba(0,0,0,0.55)', transform: `translateX(${open ? '0' : '100%'})`, transition: 'transform .22s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${C.bDim}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: C.tp, fontSize: 13.5, fontWeight: 600 }}>Notifications</div>
          {unread > 0 && <div style={{ color: C.tm, fontSize: 11, marginTop: 2 }}>{unread} unread</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unread > 0 && <button onClick={markAll} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Mark all read</button>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.tm, fontSize: 20, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {items.map(n => (
          <div key={n.id} onClick={() => setItems(p => p.map(i => i.id === n.id ? { ...i, unread: false } : i))}
            style={{ display: 'flex', gap: 10, padding: '11px 16px', background: n.unread ? 'rgba(217,164,65,0.05)' : 'none', borderLeft: `2px solid ${n.unread ? C.gold : 'transparent'}`, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: n.unread ? C.goldBg : 'rgba(255,255,255,0.04)', border: `1px solid ${n.unread ? C.bGold : C.bDim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{n.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: n.unread ? C.tp : C.ts, fontSize: 12, fontWeight: n.unread ? 500 : 400, lineHeight: 1.3, marginBottom: 2 }}>{n.title}</div>
              <div style={{ color: C.tm, fontSize: 11, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.sub}</div>
              <div style={{ color: C.tm, fontSize: 10 }}>{n.time}</div>
            </div>
            {n.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Compass logo ─────────────────────────────────────────────────────────────
const Compass = () => (
  <svg width="26" height="26" viewBox="0 0 34 34" fill="none">
    <polygon points="17,1 19.5,15 17,17 14.5,15"         fill="#D9A441" />
    <polygon points="33,17 19,19.5 17,17 19,14.5"         fill="#D9A441" />
    <polygon points="17,33 14.5,19 17,17 19.5,19"         fill="#D9A441" />
    <polygon points="1,17 15,14.5 17,17 15,19.5"          fill="#D9A441" />
    <circle cx="17" cy="17" r="2.8" fill="#02070D" />
    <circle cx="17" cy="17" r="1.2" fill="#D9A441" />
  </svg>
)

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UniversalDashboard({ signals, eduCategories, countryBar: initialBar, initialCountryIso2, initialRoleId }: UniversalDashboardProps) {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    initialCountryIso2 ? (COUNTRIES.find(c => c.iso2 === initialCountryIso2.toUpperCase()) ?? null) : null
  )
  const [roleId, setRoleId] = useState<string | null>(initialRoleId ?? null)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('featured')
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const [notifOpen, setNotifOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [countryBar, setCountryBar] = useState(initialBar)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 680)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const unread = NOTIFS.filter(n => n.unread).length

  const persistPrefs = useCallback(async (iso2: string | null, role: string | null) => {
    try {
      // localStorage fast-write
      if (iso2) localStorage.setItem('harbourview.dashboard.countryIso2', iso2)
      if (role) localStorage.setItem('harbourview.dashboard.roleId', role)
      // Supabase async write — fire and forget
      await fetch('/api/dashboard/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country_iso2: iso2, role_id: role }),
      })
    } catch { /* non-blocking */ }
  }, [])

  const handleCountrySelect = useCallback(async (c: CountryOption) => {
    setSelectedCountry(c)
    await persistPrefs(c.iso2, roleId)
    // Fetch live status bar for this country
    try {
      const r = await fetch(`/api/dashboard/country-bar?iso2=${c.iso2}`)
      if (r.ok) {
        const data = await r.json() as typeof countryBar
        setCountryBar(data)
      }
    } catch { /* keep current bar */ }
  }, [roleId, persistPrefs])

  const handleRoleSelect = useCallback((id: string) => {
    setRoleId(id)
    persistPrefs(selectedCountry?.iso2 ?? null, id)
  }, [selectedCountry, persistPrefs])

  const toggleSave = (id: number) => setSaved(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  const cd = selectedCountry ? (COUNTRY_DATA[selectedCountry.iso2] ?? COUNTRY_DATA['DE']) : COUNTRY_DATA['DE']
  const listings = mkListings(cd.cur, cd.c1, cd.c2, cd.c3)

  const catMap: Record<string, string> = { consumables: 'Consumables', cannabis: 'Cannabis', equipment: 'Equipment', distressed: 'Distressed Equipment', services: 'Services' }
  const filtered = listings.filter(l => {
    const q = search.toLowerCase()
    const cm = !activeCat || l.cat === catMap[activeCat]
    const tm = !q || l.title.toLowerCase().includes(q) || l.cat.toLowerCase().includes(q)
    return cm && tm
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;} button{cursor:pointer;}
        ::-webkit-scrollbar{width:4px;height:4px;} ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(217,164,65,0.22);border-radius:4px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(217,164,65,0.42);}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.45;}}
      `}</style>

      <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg0, color: C.tp, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Topbar ── */}
        <header style={{ height: 56, background: C.bg1, borderBottom: `1px solid ${C.bDim}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0, zIndex: 101 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Compass />
            <div>
              <div style={{ fontFamily: "'Cinzel',serif", color: C.gold, fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', lineHeight: 1 }}>HARBOURVIEW</div>
              <div style={{ color: C.tm, fontSize: 7.5, letterSpacing: '0.06em', marginTop: 1 }}>MARKET ACCESS · INTELLIGENCE · EDUCATION</div>
            </div>
          </div>
          <div style={{ width: 1, height: 30, background: C.bDim, flexShrink: 0 }} />
          <CountryDrop current={selectedCountry} onSelect={handleCountrySelect} />
          <RoleDrop roleId={roleId} onSelect={handleRoleSelect} />
          <div style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.tm, fontSize: 13 }}>🔍</span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings, intel, education…"
              style={{ width: '100%', background: C.bg2, border: `1px solid ${search ? C.bGold : C.bMid}`, borderRadius: 7, padding: '6px 28px 6px 28px', color: C.ts, fontSize: 11, outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s' }} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.tm, fontSize: 15, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{ background: notifOpen ? C.goldBg : 'none', border: `1px solid ${notifOpen ? C.bGold : 'transparent'}`, borderRadius: 7, padding: '5px 7px', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, transition: 'all .15s' }}>
              🔔{unread > 0 && <span style={{ position: 'absolute', top: -3, right: -4, background: C.red, color: 'white', fontSize: 8.5, fontWeight: 700, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>}
            </button>
            <button style={{ background: 'none', border: `1px solid ${C.bMid}`, borderRadius: 6, padding: '5px 10px', color: C.ts, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>⭐ Watchlist</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <div style={{ width: 27, height: 27, borderRadius: '50%', background: 'linear-gradient(135deg,#D9A441,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.bg0, fontWeight: 700, fontSize: 11 }}>A</div>
              <span style={{ color: C.ts, fontSize: 11.5 }}>Alex V. ▾</span>
            </div>
            <div style={{ width: 1, height: 26, background: C.bDim }} />
            <button style={{ background: C.goldFill, border: `1px solid ${C.bGold}`, borderRadius: 7, padding: '6px 12px', color: C.gold, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>+ Post Listing</button>
            <button style={{ background: 'linear-gradient(135deg,#C49025,#8B6914)', border: 'none', borderRadius: 7, padding: '6px 12px', color: '#0A1624', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Upgrade / Subscribe</button>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Sidebar */}
          {!isMobile && (
            <nav style={{ width: 150, background: C.bg1, borderRight: `1px solid ${C.bDim}`, display: 'flex', flexDirection: 'column', padding: '10px 0', flexShrink: 0, overflowY: 'auto' }} aria-label="Main navigation">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => setActiveNav(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px', background: activeNav === item.id ? 'rgba(217,164,65,0.09)' : 'none', borderLeft: `2px solid ${activeNav === item.id ? C.gold : 'transparent'}`, border: 'none', borderRadius: 0, color: activeNav === item.id ? C.tp : C.tm, fontSize: 12, fontWeight: activeNav === item.id ? 500 : 400, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 13 }}>{item.icon}</span><span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && <span style={{ background: 'rgba(214,92,74,0.85)', color: 'white', fontSize: 9, fontWeight: 700, borderRadius: 9, padding: '1px 5px' }}>{item.badge}</span>}
                </button>
              ))}
              <div style={{ marginTop: 'auto', padding: '10px 13px 4px', borderTop: `1px solid ${C.bDim}` }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: C.tm, fontSize: 12, width: '100%', padding: '6px 0', cursor: 'pointer', fontFamily: 'inherit' }}>❓ Help Center</button>
              </div>
            </nav>
          )}

          {/* Center — Marketplace */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '14px', gap: 10, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: C.goldBg, border: `1px solid ${C.bGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🛒</div>
                <div>
                  <div style={{ color: C.gold, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>Marketplace & Access</div>
                  <div style={{ color: C.tm, fontSize: 10.5 }}>Browse opportunities. Connect globally.</div>
                </div>
              </div>
              <button style={{ background: 'none', border: `1px solid ${C.bGold}`, borderRadius: 7, padding: '6px 12px', color: C.gold, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>View All Marketplace →</button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {CATS.map(cat => (
                <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', background: activeCat === cat.id ? C.goldFill : C.bg3, border: `1px solid ${activeCat === cat.id ? C.bGold : C.bDim}`, borderRadius: 7, color: activeCat === cat.id ? C.gold : C.ts, fontSize: 11.5, fontWeight: activeCat === cat.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                  <span style={{ color: activeCat === cat.id ? C.gold : C.tm, fontSize: 10.5, fontWeight: 700 }}>{cat.count}</span><span>{cat.label}</span>
                </button>
              ))}
              <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: C.goldFill, border: `1px solid ${C.bGoldHi}`, borderRadius: 7, color: C.gold, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Post Listing</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C.bDim}` }}>
              {[['featured', 'Featured Listings'], ['recent', 'Recently Added'], ['highdemand', 'High Demand']].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{ background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === key ? C.gold : 'transparent'}`, color: activeTab === key ? C.tp : C.tm, fontSize: 12, fontWeight: activeTab === key ? 600 : 400, padding: '7px 13px 9px', marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
              ))}
              <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${C.bDim}`, borderRadius: 6, padding: '5px 9px', color: C.ts, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>⚙ Filters</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {filtered.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.tm, gap: 8, padding: '40px 0' }}>
                  <span style={{ fontSize: 32 }}>🔍</span>
                  <div style={{ fontSize: 13 }}>No listings match &ldquo;{search || activeCat}&rdquo;</div>
                  <button onClick={() => { setSearch(''); setActiveCat(null) }} style={{ background: 'none', border: `1px solid ${C.bDim}`, borderRadius: 7, padding: '6px 14px', color: C.gold, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>Clear filters</button>
                </div>
              ) : filtered.map(l => (
                <div key={l.id}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.bGold)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.bDim)}
                  style={{ display: 'flex', gap: 10, padding: '9px 10px', borderRadius: 10, background: C.bg3, border: `1px solid ${C.bDim}`, alignItems: 'flex-start', transition: 'all .15s' }}>
                  <div style={{ width: 76, height: 66, borderRadius: 8, background: C.bg2, border: `1px solid ${C.bDim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                    {l.cat === 'Equipment' ? '⚙️' : l.cat === 'Cannabis' ? '🌿' : l.cat === 'Consumables' ? '🧪' : l.cat === 'Distressed Equipment' ? '🔩' : '🏗️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span style={{ color: C.tp, fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{l.title}</span><ShieldCheck />
                    </div>
                    <div style={{ color: C.ts, fontSize: 11, marginBottom: 5, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{l.desc}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{l.tags.map(t => <TC key={t} label={t} />)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0, minWidth: 88 }}>
                    <div style={{ color: C.tm, fontSize: 10.5 }}>📍 {l.loc}</div>
                    <div style={{ color: C.gold, fontSize: 12.5, fontWeight: 600 }}>{l.price}</div>
                    <button onClick={() => toggleSave(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}><BK on={saved.has(l.id)} /></button>
                  </div>
                </div>
              ))}
              {filtered.length > 0 && (
                <button style={{ width: '100%', padding: '11px', background: 'none', border: `1px solid ${C.bGold}`, borderRadius: 10, color: C.gold, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>Browse All Listings →</button>
              )}
            </div>

            {/* ── Status Bar ── */}
            <div style={{ display: 'flex', borderRadius: 11, overflow: 'hidden', border: `1px solid ${C.bDim}`, flexShrink: 0 }}>
              {[
                { label: 'COUNTRY STATUS',         val: countryBar.status,      sub: `${countryBar.adultUse !== '—' ? `Adult: ${countryBar.adultUse} · ` : ''}Medical: ${countryBar.medicalUse}`, color: countryBar.statusColor,       icon: selectedCountry?.flag ?? '🌐' },
                { label: 'MARKET OPPORTUNITY',     val: countryBar.opportunity, sub: `Opportunity Score ${countryBar.score} / 100`,                                                                  color: countryBar.opportunityColor,  icon: '🤝' },
                { label: 'REGULATORY ENVIRONMENT', val: countryBar.regulatory,  sub: 'Regulatory framework status',                                                                                   color: countryBar.regulatoryColor,   icon: '⚖️' },
                { label: 'MARKET ACTIVITY',        val: countryBar.activity,    sub: 'Listings & buyer demand',                                                                                        color: countryBar.activityColor,     icon: '📈' },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, background: C.bg2, padding: '9px 10px', borderLeft: i > 0 ? `1px solid ${C.bDim}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}><span style={{ fontSize: 12 }}>{item.icon}</span><span style={{ color: C.tm, fontSize: 8.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{item.label}</span></div>
                  <div style={{ color: item.color, fontSize: 12.5, fontWeight: 700, marginBottom: 1 }}>{item.val}</div>
                  <div style={{ color: C.tm, fontSize: 9.5 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ width: 316, background: C.bg1, borderLeft: `1px solid ${C.bDim}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Intel Signals */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 9 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(59,130,160,0.15)', border: '1px solid rgba(59,130,160,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📡</div>
                      <span style={{ color: C.gold, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>Intel Signals</span>
                    </div>
                    <div style={{ color: C.tm, fontSize: 10.5, paddingLeft: 33 }}>Key updates and market movements.</div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: C.gold, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginTop: 3 }}>View All →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {signals.slice(0, 5).map(s => <SigRow key={s.id} s={s} />)}
                </div>
                <div style={{ marginTop: 9, padding: '11px 12px', background: 'rgba(217,164,65,0.06)', border: `1px solid ${C.bGold}`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ color: C.gold, fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>🔒 Unlock deeper intelligence</div>
                    <div style={{ color: C.ts, fontSize: 10.5, lineHeight: 1.35 }}>Daily signals, exclusive reports, and market alerts.</div>
                  </div>
                  <button style={{ background: 'linear-gradient(135deg,#C49025,#8B6914)', border: 'none', borderRadius: 7, padding: '6px 10px', color: '#0A1624', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Upgrade Now</button>
                </div>
              </div>

              <div style={{ height: 1, background: C.bDim }} />

              {/* Education Hub */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 9 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: C.goldBg, border: `1px solid ${C.bGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📚</div>
                      <span style={{ color: C.gold, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>Education Hub</span>
                    </div>
                    <div style={{ color: C.tm, fontSize: 10.5, paddingLeft: 33 }}>Learn. Comply. Grow with confidence.</div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: C.gold, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginTop: 3 }}>View All →</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {eduCategories.map(item => (
                    <div key={item.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 6px', borderRadius: 10, background: C.bg3, border: `1px solid ${C.bDim}`, textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: C.goldBg, border: `1px solid ${C.bGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{item.icon}</div>
                      <div style={{ color: C.ts, fontSize: 10, fontWeight: 500, lineHeight: 1.3 }}>{item.title}</div>
                      <div style={{ color: C.tm, fontSize: 9.5, lineHeight: 1.2 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: C.bDim }} />

              {/* Globe teaser — links to /  */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(59,130,160,0.12)', border: '1px solid rgba(59,130,160,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🌐</div>
                    <span style={{ color: C.gold, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>Explore the Globe</span>
                  </div>
                  <a href="/" style={{ background: 'none', border: 'none', color: C.gold, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' }}>View Globe →</a>
                </div>
                <div style={{ borderRadius: 10, overflow: 'hidden', background: 'radial-gradient(ellipse at 28% 50%, rgba(59,130,160,0.22) 0%, rgba(6,16,26,0.96) 55%, #02070D 100%)', border: `1px solid ${C.bGold}`, padding: '14px', position: 'relative', minHeight: 90 }}>
                  <div style={{ position: 'absolute', right: -18, bottom: -18, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle at 38% 35%, rgba(59,130,160,0.35), rgba(13,30,48,0.6) 55%, transparent)', border: '1px solid rgba(59,130,160,0.18)' }} />
                  {[[18, 45], [35, 22], [55, 38], [70, 58], [82, 28]].map(([x, y], i) => (
                    <div key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 3, height: 3, borderRadius: '50%', background: C.gold, opacity: 0.8 }} />
                  ))}
                  <div style={{ color: C.ts, fontSize: 11, fontWeight: 500, marginBottom: 2 }}>See opportunity across 100+ markets.</div>
                  <div style={{ color: C.tp, fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 9 }}>Track signals. Connect globally.</div>
                  <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217,164,65,0.10)', border: `1px solid ${C.bGold}`, borderRadius: 7, padding: '6px 12px', color: C.gold, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em', textDecoration: 'none' }}>⊙ VIEW GLOBE</a>
                </div>
              </div>

            </div>
          </div>

        </div>

        {notifOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 390 }} onClick={() => setNotifOpen(false)} />}
        <NotifPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>
    </>
  )
}
