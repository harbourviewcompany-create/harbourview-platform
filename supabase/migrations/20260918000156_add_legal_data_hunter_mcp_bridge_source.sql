
-- Additive, reversible. Registers Legal Data Hunter as a documented source
-- (adapter='mcp_legal_data_hunter') that is intentionally NOT picked up by the
-- HTTP crawler in source-engine-fetch (relevance_status='mcp_bridge', not 'active',
-- so the existing .eq('is_active',true).eq('relevance_status','active') filter skips it).
-- Ingestion happens via a Claude session calling the Legal Data Hunter MCP tool and
-- writing rows into public.signals directly (see legal_data_hunter_pulls log below),
-- because MCP tools are only reachable from a Claude tool-use context, not from
-- Supabase edge functions/pg_net.

insert into public.source_registry
  (id, source_name, source_url, jurisdiction, is_active, country, iso, region,
   language, adapter, crawl_cadence, relevance_status, source_type, content_type,
   requires_auth, crawl_allowed, network_status, notes)
values
  (gen_random_uuid(), 'Legal Data Hunter (MCP bridge)', 'mcp://legal-data-hunter',
   null, false, null, null, null, 'en', 'mcp_legal_data_hunter', 'manual',
   'mcp_bridge', 'legal_database', array['regulatory'], false, false, 'not_applicable',
   'Cross-jurisdiction legislation/case-law/doctrine database (230+ jurisdictions), queried via MCP tool by a Claude session, not HTTP-crawled. Rows inserted into public.signals carry source=''Legal Data Hunter'' and are logged in legal_data_hunter_pulls for idempotency.')
on conflict do nothing;

create table if not exists public.legal_data_hunter_pulls (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  namespace text not null,
  countries text[] not null,
  run_at timestamptz not null default now(),
  hit_count integer not null default 0,
  signal_ids text[] not null default '{}',
  notes text
);
comment on table public.legal_data_hunter_pulls is 'Audit log of Legal Data Hunter MCP queries run against the intelligence pipeline, and which public.signals rows each run produced. Prevents duplicate inserts across runs.';
