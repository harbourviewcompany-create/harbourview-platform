/**
 * lib/marketplace/geneticsShowcase.ts
 *
 * Public-safe genetics profile projection.
 *
 * Pulls live data from cultivar_passports + cultivar_country_opportunities
 * via the service-role client (bypasses RLS so we control exactly what is
 * public — only rows where is_public = true are ever surfaced here).
 *
 * Falls back to fixture data if SUPABASE_SERVICE_ROLE_KEY is not set so that
 * the marketplace page always renders something (e.g. local dev without env).
 */

import 'server-only'
import { fetchAdminSupabaseJson } from '@/lib/supabase/adminDataClient'

// ─── Shape of what we read from the DB ────────────────────────────────────────

type CultivarRow = {
  id: string
  slug: string
  display_name: string
  public_summary: string
  cultivar_category: string
  cannabis_category: string | null
  origin_country_code: string | null
  origin_jurisdiction_label: string | null
  claim_status: string
  claim_review_status: string
  evidence_score_summary: string | null
  verification_summary: string | null
  public_disclaimer: string
  is_public: boolean
  created_at: string
}

type OpportunityRow = {
  id: string
  cultivar_id: string
  country_code: string
  jurisdiction_label: string | null
  opportunity_type: string
  status: string
  material_transfer_status: string
  jurisdiction_gate_status: string
  public_note: string | null
  review_status: string
  created_at: string
}

// ─── Public-facing DTOs ───────────────────────────────────────────────────────

export type GeneticsDrop = {
  id: string
  name: string
  type: 'Licensing window' | 'Territory opportunity' | 'Tissue-culture program' | 'Collaboration'
  summary: string
  signals: string[]
  targetMarkets: string[]
  cta: string
}

export type GeneticsProfile = {
  slug: string
  name: string
  type: string
  region: string
  summary: string
  publicFocus: string[]
  publicFields: string[]
  privateFields: string[]
  drops: GeneticsDrop[]
}

export type PublicGeneticsProfile = Omit<GeneticsProfile, 'privateFields'> & {
  privateFieldPolicy: string
}

// ─── DB → DTO helpers ─────────────────────────────────────────────────────────

function opportunityTypeLabel(type: string): GeneticsDrop['type'] {
  switch (type) {
    case 'licensing':        return 'Licensing window'
    case 'territory':        return 'Territory opportunity'
    case 'tissue_culture':   return 'Tissue-culture program'
    case 'collaboration':    return 'Collaboration'
    default:                 return 'Territory opportunity'
  }
}

function categoryCta(materialTransferStatus: string): string {
  switch (materialTransferStatus) {
    case 'none':             return 'Request licensing discussion'
    case 'discussion_only':  return 'Request territory discussion'
    case 'information_only': return 'Request information package'
    default:                 return 'Request access'
  }
}

function regionFromCode(code: string | null): string {
  if (!code) return 'International'
  const map: Record<string, string> = {
    DEU: 'Europe', FRA: 'Europe', GBR: 'Europe', NLD: 'Europe', CHE: 'Europe',
    AUT: 'Europe', ESP: 'Europe', ITA: 'Europe', PRT: 'Europe',
    BRA: 'Latin America', COL: 'Latin America', ARG: 'Latin America', MEX: 'Latin America',
    CAN: 'North America', USA: 'North America',
    AUS: 'Oceania', NZL: 'Oceania',
    ZAF: 'Africa', THA: 'Asia', ISR: 'Middle East',
  }
  return map[code] ?? 'International'
}

function signals(cultivar: CultivarRow): string[] {
  const out: string[] = []
  if (cultivar.claim_status !== 'not_assessed') out.push('Verified claim')
  if (['approved_public','approved_private_only'].includes(cultivar.claim_review_status)) out.push('Admin approved')
  if (cultivar.cannabis_category === 'cbd_dominant')  out.push('CBD dominant')
  if (cultivar.cannabis_category === 'thc_dominant')  out.push('THC dominant')
  if (cultivar.cannabis_category === 'balanced')      out.push('Balanced')
  if (cultivar.cultivar_category === 'research')      out.push('Research grade')
  if (cultivar.cultivar_category === 'tissue_culture')out.push('Tissue culture')
  return out.length ? out : ['Harbourview controlled access']
}

function toPublicProfile(
  cultivar: CultivarRow,
  opportunities: OpportunityRow[],
): GeneticsProfile {
  const drops: GeneticsDrop[] = opportunities.map((opp) => ({
    id: opp.id,
    name: `${opp.jurisdiction_label ?? opp.country_code} – ${opportunityTypeLabel(opp.opportunity_type)}`,
    type: opportunityTypeLabel(opp.opportunity_type),
    summary: opp.public_note ?? `Controlled access opportunity in ${opp.jurisdiction_label ?? opp.country_code}.`,
    signals: signals(cultivar),
    targetMarkets: [opp.jurisdiction_label ?? opp.country_code],
    cta: categoryCta(opp.material_transfer_status),
  }))

  return {
    slug: cultivar.slug,
    name: cultivar.display_name,
    type: `${cultivar.cultivar_category.replace(/_/g, ' ')} genetics`,
    region: regionFromCode(cultivar.origin_country_code),
    summary: cultivar.public_summary,
    publicFocus: signals(cultivar),
    publicFields: ['Approved program name', 'Region', 'Public summary', 'Approved drops', 'Target markets'],
    privateFields: ['Direct contact details', 'Pricing', 'Breeding notes', 'Private documents', 'Negotiation terms'],
    drops,
  }
}

// ─── Fixture fallback ─────────────────────────────────────────────────────────
// Shown when SUPABASE_SERVICE_ROLE_KEY is not configured (local dev without env).

const FIXTURE_PROFILES: GeneticsProfile[] = [
  {
    slug: 'nordline-cbd-program',
    name: 'Nordline CBD Genetics Program',
    type: 'CBD genetics licensing',
    region: 'Europe',
    summary:
      'A CBD-focused genetics program for qualified operators exploring low-THC commercial pathways, licensing discussions and controlled international rollout opportunities.',
    publicFocus: ['CBD genetics', 'Low-THC pathways', 'Licensing', 'Tissue-culture compatible'],
    publicFields: ['Approved brand/program name', 'Region', 'Public program summary', 'Approved drops', 'Target markets'],
    privateFields: ['Direct contact details', 'Pricing', 'Sensitive breeding notes', 'Private documents', 'Negotiation terms'],
    drops: [
      {
        id: 'alpine-cbd-line',
        name: 'Alpine CBD Line — EU licensing window',
        type: 'Licensing window',
        summary: 'A controlled licensing discussion window for qualified EU operators.',
        signals: ['EU-pathway aligned', 'Novel food compliant', 'Validated THC ceiling'],
        targetMarkets: ['Germany', 'Switzerland', 'Austria'],
        cta: 'Request licensing discussion',
      },
    ],
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

export type GeneticsShowcaseResult = {
  profiles: GeneticsProfile[]
  source: 'db' | 'fixture'
}

export async function getPublicGeneticsProfiles(): Promise<GeneticsShowcaseResult> {
  const [cultivarsRes, oppsRes] = await Promise.all([
    fetchAdminSupabaseJson<CultivarRow[]>(
      '/rest/v1/cultivar_passports?select=id,slug,display_name,public_summary,cultivar_category,cannabis_category,origin_country_code,origin_jurisdiction_label,claim_status,claim_review_status,evidence_score_summary,verification_summary,public_disclaimer,is_public,created_at&is_public=eq.true&order=created_at.asc',
    ),
    fetchAdminSupabaseJson<OpportunityRow[]>(
      '/rest/v1/cultivar_country_opportunities?select=id,cultivar_id,country_code,jurisdiction_label,opportunity_type,status,material_transfer_status,jurisdiction_gate_status,public_note,review_status,created_at&status=in.(open_to_discussion,invite_only)&review_status=in.(approved_public,approved_private_only)&order=created_at.asc',
    ),
  ])

  if (!cultivarsRes.ok || !oppsRes.ok) {
    return { profiles: FIXTURE_PROFILES, source: 'fixture' }
  }

  const cultivars = cultivarsRes.data ?? []
  if (cultivars.length === 0) {
    return { profiles: FIXTURE_PROFILES, source: 'fixture' }
  }

  const oppsByCultivar = new Map<string, OpportunityRow[]>()
  for (const opp of (oppsRes.data ?? [])) {
    const list = oppsByCultivar.get(opp.cultivar_id) ?? []
    list.push(opp)
    oppsByCultivar.set(opp.cultivar_id, list)
  }

  const profiles = cultivars.map((c) =>
    toPublicProfile(c, oppsByCultivar.get(c.id) ?? []),
  )

  return { profiles, source: 'db' }
}

export async function getPublicGeneticsProfile(slug: string): Promise<PublicGeneticsProfile | null> {
  const { profiles } = await getPublicGeneticsProfiles()
  const profile = profiles.find((p) => p.slug === slug)
  if (!profile) return null
  const { privateFields: _, ...rest } = profile
  return {
    ...rest,
    privateFieldPolicy: 'Direct contact details, pricing, breeding notes, and private documents are controlled through Harbourview review and only shared with approved counterparties.',
  }
}

// Legacy sync accessor kept for publicProjection.ts compatibility —
// returns the fixture data synchronously. Pages should prefer the async
// getPublicGeneticsProfiles() so they reflect live DB data.
export function getPublicGeneticsProfilesSync(): GeneticsProfile[] {
  return FIXTURE_PROFILES
}
