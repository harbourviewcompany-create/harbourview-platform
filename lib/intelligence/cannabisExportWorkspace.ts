import 'server-only'

import { createSupabaseServiceClient } from '@/lib/supabase/server'

export type CannabisExportAccount = {
  id: string
  canonical_key: string
  kind: 'buyer' | 'supplier' | 'route_partner' | 'demand_partner'
  company_name: string
  country: string | null
  tier: string | null
  score: number | null
  priority_band: string | null
  status: string
  last_verified: string | null
  source_urls: string[]
  payload: Record<string, unknown>
  updated_at: string
}

export type CannabisExportContact = {
  id: string
  account_id: string
  contact_key: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  sequence: number | null
  verification: string | null
  outreach_status: string
  last_verified: string | null
  source_urls: string[]
  payload: Record<string, unknown>
  updated_at: string
}

export type CannabisExportProduct = {
  id: string
  supplier_account_id: string | null
  product_key: string
  product_name: string
  format_positioning: string | null
  thc_cbd_signal: string | null
  quality_signal: string | null
  export_evidence: string | null
  availability_status: string | null
  recommended_use: string | null
  last_verified: string | null
  source_url: string | null
  payload: Record<string, unknown>
}

export type CannabisExportMatch = {
  id: string
  match_key: string
  buyer_account_id: string
  supplier_account_id: string
  supplier_rank: number | null
  match_score: number | null
  why_match: string | null
  buyer_specific_offer: string | null
  suggested_pilot: string | null
  status: string
  payload: Record<string, unknown>
  updated_at: string
}

export type CannabisExportRfq = {
  id: string
  rfq_key: string
  supplier_account_id: string
  contact_id: string | null
  priority: number | null
  subject: string | null
  email_draft: string | null
  linkedin_opening: string | null
  primary_ask: string | null
  why_now: string | null
  status: string
  payload: Record<string, unknown>
  updated_at: string
}

export type CannabisExportDeal = {
  id: string
  deal_key: string
  buyer_account_id: string
  supplier_account_id: string | null
  market: string | null
  product_concept: string
  target_kg: number | null
  expected_sell_cad_per_g: number | null
  target_gross_margin: number | null
  non_supplier_variable_cad_per_g: number | null
  max_supplier_buy_cad_per_g: number | null
  public_supply_benchmark_cad_per_g: number | null
  buyer_status: string
  supplier_status: string
  next_action: string | null
  payload: Record<string, unknown>
  updated_at: string
}

export type CannabisExportBenchmark = {
  id: string
  benchmark_key: string
  name: string
  period: string | null
  cad_per_g: number | null
  source_url: string | null
  payload: Record<string, unknown>
  last_verified: string | null
}

export type CannabisExportTask = {
  id: string
  task_key: string
  day_number: number | null
  action: string
  account_key: string | null
  owner_label: string | null
  expected_output: string | null
  dependency: string | null
  status: string
  due_date: string | null
  payload: Record<string, unknown>
  updated_at: string
}

export type CannabisExportWorkspaceData = {
  accounts: CannabisExportAccount[]
  contacts: CannabisExportContact[]
  products: CannabisExportProduct[]
  matches: CannabisExportMatch[]
  rfqs: CannabisExportRfq[]
  deals: CannabisExportDeal[]
  benchmarks: CannabisExportBenchmark[]
  tasks: CannabisExportTask[]
}

type ExportTable =
  | 'cannabis_export_accounts'
  | 'cannabis_export_contacts'
  | 'cannabis_export_products'
  | 'cannabis_export_matches'
  | 'cannabis_export_rfqs'
  | 'cannabis_export_deals'
  | 'cannabis_export_benchmarks'
  | 'cannabis_export_tasks'

const TABLES: ExportTable[] = [
  'cannabis_export_accounts',
  'cannabis_export_contacts',
  'cannabis_export_products',
  'cannabis_export_matches',
  'cannabis_export_rfqs',
  'cannabis_export_deals',
  'cannabis_export_benchmarks',
  'cannabis_export_tasks',
]

export class CannabisExportSchemaUnavailableError extends Error {
  constructor(message = 'Cannabis export workspace schema is not available in the canonical Harbourview database.') {
    super(message)
    this.name = 'CannabisExportSchemaUnavailableError'
  }
}

function isMissingRelation(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01' || /relation .* does not exist/i.test(error?.message ?? '')
}

async function selectTable(table: ExportTable) {
  const client = await createSupabaseServiceClient()
  const query = client.schema('public').from(table).select('*')
  const ordered = table === 'cannabis_export_tasks'
    ? query.order('day_number', { ascending: true, nullsFirst: false })
    : table === 'cannabis_export_rfqs'
      ? query.order('priority', { ascending: true, nullsFirst: false })
      : table === 'cannabis_export_contacts'
        ? query.order('sequence', { ascending: true, nullsFirst: false })
        : query.order('updated_at', { ascending: false })

  const { data, error } = await ordered
  if (error) {
    if (isMissingRelation(error)) throw new CannabisExportSchemaUnavailableError()
    throw new Error(`Unable to read ${table}: ${error.message}`)
  }
  return data ?? []
}

export async function loadCannabisExportWorkspace(): Promise<CannabisExportWorkspaceData> {
  const [
    accounts,
    contacts,
    products,
    matches,
    rfqs,
    deals,
    benchmarks,
    tasks,
  ] = await Promise.all(TABLES.map(selectTable))

  return {
    accounts: accounts as CannabisExportAccount[],
    contacts: contacts as CannabisExportContact[],
    products: products as CannabisExportProduct[],
    matches: matches as CannabisExportMatch[],
    rfqs: rfqs as CannabisExportRfq[],
    deals: deals as CannabisExportDeal[],
    benchmarks: benchmarks as CannabisExportBenchmark[],
    tasks: tasks as CannabisExportTask[],
  }
}

export const cannabisExportMutableFields = {
  account: new Set(['status', 'priority_band', 'last_verified']),
  contact: new Set(['outreach_status', 'last_verified']),
  match: new Set(['status']),
  rfq: new Set(['status']),
  deal: new Set([
    'target_kg',
    'expected_sell_cad_per_g',
    'target_gross_margin',
    'non_supplier_variable_cad_per_g',
    'public_supply_benchmark_cad_per_g',
    'buyer_status',
    'supplier_status',
    'next_action',
  ]),
  task: new Set(['status', 'due_date']),
} as const

export type CannabisExportMutableResource = keyof typeof cannabisExportMutableFields

const resourceTable: Record<CannabisExportMutableResource, ExportTable> = {
  account: 'cannabis_export_accounts',
  contact: 'cannabis_export_contacts',
  match: 'cannabis_export_matches',
  rfq: 'cannabis_export_rfqs',
  deal: 'cannabis_export_deals',
  task: 'cannabis_export_tasks',
}

export async function updateCannabisExportRecord(args: {
  resource: CannabisExportMutableResource
  id: string
  patch: Record<string, unknown>
}) {
  const allowed = cannabisExportMutableFields[args.resource]
  const sanitized = Object.fromEntries(
    Object.entries(args.patch).filter(([key]) => allowed.has(key as never)),
  )
  if (!Object.keys(sanitized).length) {
    throw new Error('No permitted fields supplied.')
  }

  sanitized.updated_at = new Date().toISOString()

  const client = await createSupabaseServiceClient()
  const table = resourceTable[args.resource]
  const { data, error } = await client
    .schema('public')
    .from(table)
    .update(sanitized)
    .eq('id', args.id)
    .select('*')
    .single()

  if (error) {
    if (isMissingRelation(error)) throw new CannabisExportSchemaUnavailableError()
    throw new Error(`Unable to update ${table}: ${error.message}`)
  }
  return data
}
