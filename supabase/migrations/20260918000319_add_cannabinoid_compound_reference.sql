
-- Standalone research module: structured compound reference data (ChEMBL),
-- separate from the news-shaped public.signals table because compounds aren't
-- events with a date/headline, they're persistent reference records.
-- Same MCP-bridge caveat as Legal Data Hunter: ChEMBL/PubMed/Consensus are
-- queried by a Claude session via MCP, not by an edge function (though ChEMBL
-- and PubMed both have open public REST APIs outside MCP -- see note in chat --
-- which is the real path to full automation later if wanted).

create table if not exists public.cannabinoid_compounds (
  id uuid primary key default gen_random_uuid(),
  chembl_id text not null unique,
  pref_name text not null,
  max_phase numeric,
  first_approval integer,
  is_natural_product boolean,
  is_approved_drug boolean,
  therapeutic_flag boolean,
  molecular_formula text,
  synonyms text[],
  atc_codes text[],
  regulatory_notes text,
  source_refs jsonb,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.cannabinoid_compounds is 'Cannabinoid compound reference data pulled from ChEMBL via MCP (compound_search/get_mechanism/drug_search). Feeds the standalone research module and is cross-linked into public.signals (content_type=research) so dossiers/digest surface it too.';

insert into public.cannabinoid_compounds
  (chembl_id, pref_name, max_phase, first_approval, is_natural_product, is_approved_drug,
   therapeutic_flag, molecular_formula, synonyms, atc_codes, regulatory_notes, source_refs)
values
  ('CHEMBL190461', 'Cannabidiol (CBD)', 4, 2018, true, true, true, 'C21H30O2',
   array['Epidiolex','Epidyolex','CBD'], array['N03AX24'],
   'Only cannabinoid with full FDA/EMA drug approval (Epidiolex/Epidyolex, 2018) -- for seizures associated with Lennox-Gastaut, Dravet syndrome, and tuberous sclerosis complex. Relevant baseline for any jurisdiction''s CBD scheduling/exemption analysis.',
   '{"chembl": "CHEMBL190461", "ema": "human/EPAR/epidyolex"}'::jsonb),
  ('CHEMBL498672', 'Cannabidiolic acid (CBDA)', 2, null, true, false, false, 'C22H30O4',
   array['CBDA'], array[]::text[],
   'Raw-plant precursor acid to CBD; Phase 2 only, no approval. Relevant to raw-cannabis vs. processed-extract regulatory distinctions some jurisdictions draw.',
   '{"chembl": "CHEMBL498672"}'::jsonb)
on conflict (chembl_id) do update set
  max_phase = excluded.max_phase, updated_at = now();

-- Dossier-feed integration: a research-content_type editorial row in the existing
-- signals table so it surfaces through the Intel feed / Daily Digest / country
-- dossiers exactly like any other reviewed=true signal, with no new frontend needed.
insert into public.signals
  (id, date, cat, pri, score, headline, summary, source, url, verification,
   tier, lang, country, geo_scope, top_lane, content_type, reviewed, reviewed_by,
   reviewed_at, action, created_at)
values
  ('research-chembl-cbd-approval-status', now(), 'research', 'medium', 60,
   'Reference: Cannabidiol (CBD) is the only cannabinoid with full FDA/EMA drug approval',
   'CBD (ChEMBL190461, marketed as Epidiolex/Epidyolex) reached max_phase=4 in 2018 for rare-seizure indications -- the regulatory benchmark other cannabinoids are measured against. CBDA (the raw-plant precursor) remains Phase 2 with no approval, which is relevant wherever a jurisdiction''s law distinguishes raw plant material from processed extract.',
   'ChEMBL (via Legal/Research MCP pipeline)', 'https://www.ebi.ac.uk/chembl/explore/compound/CHEMBL190461',
   'primary-source', 'Tier 1', 'en', null, 'global', 'Regulatory', 'research', true,
   'research_pipeline', now(), 'Promoted via ChEMBL compound reference pipeline', now())
on conflict (id) do nothing;
