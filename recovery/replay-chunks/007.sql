
-- RECOVERY BEGIN 20260623212142_security_rls_and_function_hardening.sql

-- ── 1. Enable RLS on public content/education tables (no RLS = PostgREST wide-open)
-- All 11 tables are static reference/educational content → SELECT open to all, no DML from anon/authenticated

ALTER TABLE public.education_tracks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_articles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_systems         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subchapters               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_support_objects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_dependencies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_decision_support_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subchapter_evidence_map   ENABLE ROW LEVEL SECURITY;

-- Public SELECT for all roles (content is intended to be public-facing via PostgREST)
CREATE POLICY "public_read" ON public.education_tracks          FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.education_articles        FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.reference_systems         FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.modules                   FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.chapters                  FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.subchapters               FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.decision_support_objects  FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.evidence_records          FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.module_dependencies       FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.chapter_decision_support_map FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.subchapter_evidence_map   FOR SELECT USING (true);

-- ── 2. Revoke anon EXECUTE from admin role-check functions
-- anon should never be able to call is_hv_staff() or is_genetics_admin_or_reviewer()
REVOKE EXECUTE ON FUNCTION public.is_hv_staff()                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_genetics_admin_or_reviewer()  FROM anon;

-- ── 3. Fix mutable search_path on updated_at trigger functions
-- Recreate with SET search_path = public to prevent search_path injection
CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_market_metrics_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_trade_flows_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260623212142','security_rls_and_function_hardening','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260623212142_security_rls_and_function_hardening.sql

-- RECOVERY BEGIN 20260624032500_prepare_deep_education_section_replacement.sql
-- Replay-only handoff from the concise education seed to the reviewed deep
-- education content series beginning at 20260624032532.
--
-- Production already records the deep series and therefore takes the no-op path.
-- A zero-state replay removes the earlier concise rows only when all 60 rows still
-- match the untouched baseline identity, heading, type, and timestamp signature.
-- Any partial or reviewed environment fails closed instead of deleting content.

do $education_deep_replacement$
declare
  expected_headings constant jsonb := $expected${"03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:1": "Overview", "03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:2": "Scheduling Classifications & Storage Obligations", "03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:3": "Labelling Standards for Dispensing Compliance", "03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:4": "Dispensing Workflow & Patient Counselling", "03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587:5": "Common Pitfalls & Next Steps", "5c3b131f-f733-4295-9f52-5d6cb2058410:1": "Overview", "5c3b131f-f733-4295-9f52-5d6cb2058410:2": "Market Prioritisation Framework", "5c3b131f-f733-4295-9f52-5d6cb2058410:3": "Regulatory Pathway Analysis by Market", "5c3b131f-f733-4295-9f52-5d6cb2058410:4": "Competitive Positioning & Differentiation", "5c3b131f-f733-4295-9f52-5d6cb2058410:5": "Execution Planning & KPIs", "6bff2f95-b4b5-4487-8455-26a5d110e742:1": "Overview", "6bff2f95-b4b5-4487-8455-26a5d110e742:2": "EU-GMP Certification Requirements", "6bff2f95-b4b5-4487-8455-26a5d110e742:3": "Phytosanitary & Import Permits", "6bff2f95-b4b5-4487-8455-26a5d110e742:4": "GDP Logistics Requirements", "6bff2f95-b4b5-4487-8455-26a5d110e742:5": "Common Pitfalls", "7520ef89-8758-4436-860c-e016c53a6d32:1": "Overview", "7520ef89-8758-4436-860c-e016c53a6d32:2": "Plant Variety Protection & Utility Patents", "7520ef89-8758-4436-860c-e016c53a6d32:3": "Cultivar Documentation Standards", "7520ef89-8758-4436-860c-e016c53a6d32:4": "Licensing & Commercialising Cultivar IP", "7520ef89-8758-4436-860c-e016c53a6d32:5": "Common Pitfalls & Next Steps", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:1": "Overview", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:2": "Assessment Domains & Key Questions", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:3": "Running the Assessment: Process & Tools", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:4": "Interpreting Results & Prioritising Remediation", "8d4ba66c-776e-44a2-9bc6-7c1e95054a83:5": "Next Steps: From Assessment to Action", "ac01db02-2182-43a3-a1f3-54fd05e56621:1": "Overview", "ac01db02-2182-43a3-a1f3-54fd05e56621:2": "Monitoring Frameworks & Information Sources", "ac01db02-2182-43a3-a1f3-54fd05e56621:3": "Regulatory Change Impact Assessment", "ac01db02-2182-43a3-a1f3-54fd05e56621:4": "Regulatory Engagement & Advocacy", "ac01db02-2182-43a3-a1f3-54fd05e56621:5": "Building a Regulatory Intelligence System", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:1": "Overview", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:2": "Temperature Control Requirements", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:3": "Narcotics Security in Transit", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:4": "GDP Qualification of Logistics Providers", "af5161a6-07fd-4a1c-9ea7-bd125cd658fe:5": "Deviation Management & Next Steps", "b4882b28-7039-471f-b580-c19786752be6:1": "Overview", "b4882b28-7039-471f-b580-c19786752be6:2": "Regulatory Prescribing Frameworks", "b4882b28-7039-471f-b580-c19786752be6:3": "Product Selection & Cannabinoid Dosing Principles", "b4882b28-7039-471f-b580-c19786752be6:4": "Documentation & Record-Keeping Requirements", "b4882b28-7039-471f-b580-c19786752be6:5": "Common Pitfalls & Next Steps", "b64698bc-edf3-4b93-96fc-0e9c991a0135:1": "Overview", "b64698bc-edf3-4b93-96fc-0e9c991a0135:2": "Required Analyte Panels by Market", "b64698bc-edf3-4b93-96fc-0e9c991a0135:3": "ISO 17025 & GMP Laboratory Qualification", "b64698bc-edf3-4b93-96fc-0e9c991a0135:4": "Batch Release & Specification Management", "b64698bc-edf3-4b93-96fc-0e9c991a0135:5": "Common Pitfalls & Next Steps", "b65b8dbd-4e12-46fe-8928-99cf520770b1:1": "Overview", "b65b8dbd-4e12-46fe-8928-99cf520770b1:2": "Identifying Licensed Importers by Market", "b65b8dbd-4e12-46fe-8928-99cf520770b1:3": "Importer Due Diligence & Qualification", "b65b8dbd-4e12-46fe-8928-99cf520770b1:4": "Distribution Agreement Key Terms", "b65b8dbd-4e12-46fe-8928-99cf520770b1:5": "Common Pitfalls & Next Steps", "cb3bf297-51ed-4c85-bded-7370e1748d94:1": "Overview", "cb3bf297-51ed-4c85-bded-7370e1748d94:2": "Core Documents Every Proof Pack Needs", "cb3bf297-51ed-4c85-bded-7370e1748d94:3": "Market-Specific Documentation Requirements", "cb3bf297-51ed-4c85-bded-7370e1748d94:4": "Maintaining & Updating Your Proof Pack", "cb3bf297-51ed-4c85-bded-7370e1748d94:5": "Presenting Your Proof Pack to Buyers & Regulators", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:1": "Overview", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:2": "Core GMP Principles Applied to Cannabis", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:3": "EU-GMP Certification Process", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:4": "Documentation & Change Control", "edc533ae-e077-4eac-8cb4-01f974a4ce5d:5": "Common Pitfalls & Next Steps"}$expected$::jsonb;
  target_module_ids constant uuid[] := array[
    '03f94ba6-bbd9-4eb5-b3ef-04b3bfa45587'::uuid,
    '5c3b131f-f733-4295-9f52-5d6cb2058410'::uuid,
    '6bff2f95-b4b5-4487-8455-26a5d110e742'::uuid,
    '7520ef89-8758-4436-860c-e016c53a6d32'::uuid,
    '8d4ba66c-776e-44a2-9bc6-7c1e95054a83'::uuid,
    'ac01db02-2182-43a3-a1f3-54fd05e56621'::uuid,
    'af5161a6-07fd-4a1c-9ea7-bd125cd658fe'::uuid,
    'b4882b28-7039-471f-b580-c19786752be6'::uuid,
    'b64698bc-edf3-4b93-96fc-0e9c991a0135'::uuid,
    'b65b8dbd-4e12-46fe-8928-99cf520770b1'::uuid,
    'cb3bf297-51ed-4c85-bded-7370e1748d94'::uuid,
    'edc533ae-e077-4eac-8cb4-01f974a4ce5d'::uuid
  ];
  deep_series_already_applied boolean;
  target_row_count integer;
  exact_baseline_count integer;
  created_timestamp_count integer;
  updated_timestamp_count integer;
  timestamps_untouched boolean;
  deleted_row_count integer;
begin
  if to_regclass('public.education_module_sections') is null then
    raise exception 'education_module_sections must exist before deep-content replacement';
  end if;

  if to_regclass('supabase_migrations.schema_migrations') is null then
    raise exception 'Supabase migration ledger is unavailable; refusing education-content replacement';
  end if;

  select exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '20260624032532'
  )
  into deep_series_already_applied;

  if deep_series_already_applied then
    raise notice 'Deep education section series already recorded; preserving current content';
    return;
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where expected_headings ? (module_id::text || ':' || section_order::text)
        and expected_headings ->> (module_id::text || ':' || section_order::text) = heading
        and block_type = 'text'
    )::integer,
    count(distinct created_at)::integer,
    count(distinct updated_at)::integer,
    coalesce(bool_and(created_at = updated_at), true)
  into
    target_row_count,
    exact_baseline_count,
    created_timestamp_count,
    updated_timestamp_count,
    timestamps_untouched
  from public.education_module_sections
  where module_id = any(target_module_ids);

  if target_row_count = 0 then
    raise notice 'No concise education rows found; deep series will populate the table';
    return;
  end if;

  if target_row_count <> 60
     or exact_baseline_count <> 60
     or created_timestamp_count <> 1
     or updated_timestamp_count <> 1
     or not timestamps_untouched then
    raise exception
      'Education content differs from untouched 60-row baseline (rows %, matches %, created timestamps %, updated timestamps %, untouched %); manual reconciliation required',
      target_row_count,
      exact_baseline_count,
      created_timestamp_count,
      updated_timestamp_count,
      timestamps_untouched;
  end if;

  delete from public.education_module_sections
  where module_id = any(target_module_ids);

  get diagnostics deleted_row_count = row_count;

  if deleted_row_count <> 60 then
    raise exception 'Expected to replace 60 concise education rows, deleted %', deleted_row_count;
  end if;

  raise notice 'Removed untouched concise education seed; reviewed deep-content series now owns the 60 section keys';
end
$education_deep_replacement$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624032500','prepare_deep_education_section_replacement','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624032500_prepare_deep_education_section_replacement.sql

-- RECOVERY BEGIN 20260624032532_seed_education_sections_01.sql
insert into education_module_sections (module_id, section_order, heading, body, block_type) values
  ('7520ef89-8758-4436-860c-e016c53a6d32', 1, 'Why This Matters', 'Cannabis genetics are simultaneously a company''s most valuable asset and its least protected one. Unlike a patent on a mechanical device, a cultivar''s genetic identity can be physically removed from a facility in a single clone cutting or a handful of seeds, and once it leaves, there is no practical way to recall it. Breeders who have spent years stabilizing a phenotype for cannabinoid ratio, terpene expression, yield, or disease resistance are exposed to a category of intellectual property risk that most other industries don''t face: the asset and the product are the same physical, self-replicating object, and every sale of the product is, in effect, a partial transfer of the asset itself.

This matters most acutely at three moments. The first is when a breeder licenses or sells genetics to a third party, where the terms of that transfer determine whether the breeder retains any control over downstream propagation. The second is when plant material crosses a border, where customs, plant health, and sometimes wildlife trade authorities all have independent jurisdiction over the movement, regardless of how the commercial deal was structured. The third is when a counterparty needs to verify that the genetics they''re buying are actually what they''re being told they are, which is a harder problem in cannabis than in almost any other agricultural sector because there is no widely adopted, independent genetic registry that buyers can check against a seller''s claims.

Each of these moments depends on documentation that most operators don''t build until they''re forced to, usually under deal pressure, which is the worst possible time to construct a paper trail from scratch. A breeder approached by a serious buyer with a term sheet on the table has, realistically, days to weeks to produce records that should have been built incrementally over years.

For investors and counterparties evaluating a genetics-based deal, the absence of this documentation is itself a signal worth weighing independently of the genetics themselves. A breeder who can''t produce phenotyping records, chain-of-custody logs, or movement paperwork for their own genetics is implicitly asking a buyer to take their claims on faith, in an industry where a strain''s tested profile is routinely unverifiable after the fact without supporting records. This doesn''t necessarily mean the genetics are misrepresented, but it does mean the buyer is pricing in an information gap that a well-documented competitor wouldn''t be asking them to absorb. In practice, well-capitalized buyers increasingly treat documentation completeness as a proxy for overall operational maturity, on the reasoning that an operator careless with genetics documentation is statistically likely to be careless elsewhere too.

Consider, for illustration, a hypothetical mid-sized breeding operation that has spent four years stabilizing a high-myrcene, moderate-THC line prized for its sedative terpene profile. The breeding team knows the line intimately, but that knowledge lives almost entirely in the heads of two senior cultivators rather than in any written record. When a European cultivation partner expresses interest, the first question their legal team asks is simply: can you show us the line''s history. The honest answer, in this hypothetical, is no, not in any form a lawyer would recognize as evidence, and the deal stalls for months while records are reconstructed from memory and scattered grow logs, a process that is both slower and less credible than building the record properly the first time would have been.', 'text'),
  ('7520ef89-8758-4436-860c-e016c53a6d32', 2, 'The Core Framework', 'Genetics protection in cannabis rests on three distinct legal and operational tools, and conflating them, or assuming one substitutes for another, is the single most common strategic error breeders make.

Trade secret protection covers the breeding methodology and the specific genetic line itself, for as long as it stays confidential. It is, in one sense, the easiest protection to establish, since it costs nothing beyond the discipline of actually keeping the material and the process secret, and it requires no government filing or approval. But it is also the most fragile: it offers zero protection once the material is shared, sold, or grown outside a controlled chain of custody, and unlike a patent, there is no enforcement mechanism against someone who obtains the genetics independently, through legitimate means, even if that''s commercially inconvenient for the original breeder. Trade secret status is destroyed the moment someone else can independently obtain or reproduce the same genetics without restriction, which means every licensing deal, every clone sold to a third-party cultivator, and every seed batch distributed needs to be evaluated for what it does to the underlying secrecy, not just for its immediate commercial value.

Plant breeders'' rights, sometimes called plant variety protection, function similarly in spirit to a utility patent but are specific to new plant varieties, and protect a registered cultivar against unauthorized propagation in jurisdictions that recognize this right for cannabis specifically (recognition varies, and a breeder should not assume a general plant variety protection regime automatically extends to cannabis without confirming it does in the relevant jurisdiction). This protection requires the variety to satisfy four criteria, commonly abbreviated as distinctness, uniformity, stability, and novelty. Distinctness means the variety is clearly differentiable from existing varieties; uniformity means individual plants within the variety are sufficiently similar to each other; stability means those characteristics persist across generations and propagation cycles; and novelty means the variety hasn''t already been commercialized beyond a grace period before filing. These are not automatically satisfied just because a phenotype looks consistent to the breeder''s eye across a handful of grow cycles. Formal distinctness, uniformity, and stability trial data, collected under controlled, often third-party-observed conditions over multiple generations, is usually required for registration, and this is exactly the kind of rigorous phenotyping record most breeders don''t keep in a registration-ready format, because they were optimizing for commercial production consistency rather than for a future legal filing.

Trademark protects the name and brand under which a cultivar is sold, not the genetics themselves, and this distinction trips up more breeders than almost any other. A breeder can hold a valid, defensible trademark on a strain name while someone else legally grows and sells the identical genetic line under a different name, as long as that second party didn''t acquire the genetics through a breach of confidentiality, contract, or trade secret misappropriation. Trademark protects the marketing asset; it does nothing to stop the underlying genetic material from circulating once it''s out of a controlled chain.

The practical implication is that a genetics business needs all three tools, deliberately applied to different layers of the same underlying asset: trade secret protection for the breeding process itself and for pre-release lines that haven''t yet been commercially distributed; plant breeders'' rights, where recognized and where the cost is justified by the cultivar''s commercial scale, for flagship cultivars intended for broad licensing or sale; and trademark for the commercial identity under which the cultivar is marketed, regardless of what happens to the underlying genetics. None of these three tools substitutes for either of the others, and a breeder relying on only one, most commonly trademark alone, because it''s the most familiar and accessible to register, is leaving the other two layers of the asset essentially undefended.

It is worth being explicit about a related distinction that frequently confuses operators new to the IP side of genetics: the difference between owning the genetics and owning the right to exclude others from using them. Trade secret and breeders'' rights both grant the latter, the right to exclude, but only within specific limits, and only against parties who acquired the material improperly. Neither tool grants the breeder any retroactive claim over genetics that a third party obtained entirely independently, through their own separate breeding program that happened to arrive at a similar phenotype. This is why phenotyping and pedigree documentation matter even beyond their evidentiary role in a sale: they are also what would allow a breeder to demonstrate, if ever challenged, that their specific line has a documented, independent origin distinct from a competitor''s superficially similar one.', 'text'),
  ('7520ef89-8758-4436-860c-e016c53a6d32', 3, 'How This Plays Out in Practice', 'Consider a breeder preparing to license a cultivar to an international cultivation partner. Before any genetic material moves, three documentation tracks need to already exist, and ideally have existed for a meaningful period before the deal conversation started, because building them retroactively under deal pressure both takes time the deal timeline may not allow and produces weaker, less credible records than ones built contemporaneously.

Pedigree and breeding records establish what the genetics actually are: the cross history, generation count (whether the line is an F1 hybrid, an F2 or later generation, a backcross, or a stabilized inbred line), and the selection criteria applied at each generation. Without this, a buyer has no way to distinguish a genuinely stabilized line, where offspring reliably express the parent''s characteristics, from an unstable cross still segregating for key traits, where the buyer might receive plants that look nothing like the marketed phenotype. A pedigree record should ideally trace back to identifiable parent lines, note the selection pressure applied at each generation (what traits were selected for and against), and document how many individual plants were evaluated at each stage before advancing the line.

Phenotyping data ties physical and chemical characteristics to specific plants and harvests over time, drawing on cannabinoid and terpene profiles from multiple independent test batches across multiple grow cycles and, ideally, multiple growing environments, rather than a single certificate from a single harvest. A single test result tells a buyer what one plant did once, under one set of conditions; a phenotyping dataset spanning several harvests tells them what the genetic line reliably does, and how much variance to expect from environmental factors versus genetic baseline. This distinction matters enormously to a buyer trying to assess whether the cultivar will perform consistently in their own facility, which will almost certainly have different environmental conditions than the breeder''s.

Phytosanitary and movement documentation becomes relevant the moment plant material crosses a border, and in some cases when it moves between licensed facilities domestically, depending on the jurisdiction''s internal movement rules. Live plant material, clones, and seeds are subject to plant health certification requirements in most jurisdictions, designed to prevent the spread of pests and pathogens through agricultural trade, and these requirements apply to cannabis genetics the same way they apply to any other plant material being moved internationally. Separately, certain wild-collected or hybridized lines may carry additional permitting considerations under wildlife or biodiversity trade frameworks, which is worth checking case by case rather than assuming standard commercial cultivars are automatically exempt. A shipment without the correct phytosanitary certificate is a customs seizure risk regardless of how good the genetics are, and regardless of how clean the commercial paperwork between buyer and seller looks.

The deal that falls apart at this stage almost always falls apart the same way: the buyer''s due diligence team asks for phenotyping history and chain-of-custody records as a standard part of evaluating the asset, and the seller has verbal claims and a strong reputation instead of paper. In a competitive deal process, where the buyer has alternatives, this is often enough on its own to redirect the deal to a better-documented competitor, even if the underlying genetics from the under-documented breeder were objectively superior.

A further practical layer worth building into any genetics documentation system is version control over the pedigree record itself. Breeding programs evolve, selection criteria shift as new information emerges, and a record that simply states the current consensus understanding of a line''s history, without preserving earlier versions and the reasoning behind any revisions, makes it harder to defend the line''s stability claim under scrutiny. A buyer''s technical due diligence team will sometimes ask not just what the current pedigree record says, but whether it has changed, and why, since a record that has been quietly revised multiple times without explanation reads very differently than one that has remained stable with each revision clearly documented and justified.', 'text');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624032532','seed_education_sections_01','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624032532_seed_education_sections_01.sql

-- RECOVERY BEGIN 20260624032627_seed_education_sections_02.sql
insert into education_module_sections (module_id, section_order, heading, body, block_type) values
  ('7520ef89-8758-4436-860c-e016c53a6d32', 4, 'Common Pitfalls', 'The most damaging mistake is treating the phrase "stable genetics" as a marketing claim rather than a documented, testable fact. Stability is a specific property, meaning consistent expression of key traits across multiple generations and across different growing environments, and asserting it without generational test data invites a buyer''s due diligence process to discover the gap during evaluation rather than before a deal is structured, at which point the discovery itself becomes a negotiating disadvantage rather than a neutral fact.

A close second is conflating a single lab result with a genetic profile, treating one certificate of analysis as if it definitively establishes what the strain "is." Cannabinoid and terpene content vary significantly with growing conditions, harvest timing, curing process, and even the specific plant sampled within a batch, so a single certificate describes one plant''s one harvest under one set of conditions, not the genetic line''s underlying baseline. Sophisticated buyers increasingly understand this distinction, and a breeder who presents one favorable test result as proof of a strain''s identity, rather than as one data point within a broader phenotyping dataset, reads as either unsophisticated about their own product or, less charitably, as selectively presenting the most favorable result they have.

Operators also frequently underestimate how casually genetic material moves informally within the industry, through clone trades between growers at trade events, cuttings shared between friends in the business, or seeds distributed as a goodwill gesture, without realizing that each transfer outside a documented, controlled chain breaks the trade secret claim on that material and creates an untraceable population of the genetics circulating outside the original breeder''s control. Once this happens, there is generally no legal remedy, because trade secret protection depends on the material having been kept confidential, and a breeder cannot retroactively claim secrecy over material they voluntarily and informally distributed.

A further pitfall, less obvious but increasingly costly as cross-border genetics trade grows, is discovering phytosanitary and movement requirements only when a shipment is actually held at a border, rather than building the permitting timeline, which can run anywhere from a few weeks to several months depending on the specific material, the origin and destination jurisdictions, and the route, into the commercial schedule from the very start of deal negotiations. A breeder who commits to a delivery date before confirming the phytosanitary pathway is functionally promising something they don''t yet know they can deliver.

Finally, many breeders underinvest in documenting the selection rationale behind their breeding decisions, recording only the outcome (this generation looks good) rather than the process (these specific traits were selected for, against this specific set of competing candidates, for these specific reasons). This matters because a buyer evaluating whether to license a cultivar for their own further breeding program, rather than just for direct commercial production, is often as interested in the breeding methodology as in the specific genetic line, and an undocumented methodology is a much harder asset to value or transfer.

A related and frequently underappreciated pitfall involves geographic indication and naming conflicts. As more jurisdictions develop their own domestic genetics, the same or similar strain names sometimes proliferate across markets with no actual genetic relationship between them, creating confusion that a breeder''s own trademark registration may not fully resolve if the conflicting use predates the registration in that specific market or falls under a different trademark class. Breeders entering multiple international markets should check for naming conflicts in each target jurisdiction independently, rather than assuming a clean trademark search in their home market is sufficient protection elsewhere.', 'text'),
  ('7520ef89-8758-4436-860c-e016c53a6d32', 5, 'Key Takeaways', 'Treat genetics intellectual property as three separate tools rather than one undifferentiated concept: trade secret protection for the breeding process and pre-release lines, plant breeders'' rights for flagship commercial cultivars where the right is recognized and the cost is justified, and trademark for the commercial brand identity. Build the documentation that supports each tool before a deal forces the issue, not in response to a buyer''s due diligence request.

Maintain pedigree records that show cross history, generation count, and the selection rationale applied at each stage, not just a strain name and a general description. Build a phenotyping dataset drawn from multiple independent harvests across multiple grow cycles, rather than relying on a single certificate of analysis as proof of the strain''s identity.

Map any cross-border movement of clones, seeds, or live plant material against phytosanitary certification timelines well before committing to a delivery date with a buyer, since these timelines are often longer than commercial negotiations assume and cannot be meaningfully compressed once a shipment is already scheduled.

Audit how informally genetic material has moved in the past, including casual clone trades, gifted cuttings, and seeds shared at industry events, since every undocumented exchange outside a controlled chain is a potential hole in both the trade secret position and the ability to prove provenance and exclusivity to a future buyer or licensing partner. And document not just the breeding outcomes but the breeding methodology and selection rationale, since this is frequently as valuable to a sophisticated buyer as the specific genetic line itself, and is much harder to reconstruct after the fact than to record contemporaneously.

Finally, breeders should periodically revisit their own IP posture as the business scales, since a documentation and protection strategy appropriate for a small operation selling a handful of licenses domestically is frequently inadequate once the business begins fielding inbound interest from international buyers, larger cultivation partners, or investors conducting formal due diligence. What was an acceptable level of informality at one stage of the business becomes a material gap at the next, and the cost of closing that gap only grows the longer it''s deferred.', 'text'),
  ('b64698bc-edf3-4b93-96fc-0e9c991a0135', 1, 'Why This Matters', 'A Certificate of Analysis is the single document that stands between "this product is safe and matches its label" and an assumption nobody actually verified. In regulated cannabis markets, these certificates determine whether product clears customs, whether a pharmacy can dispense it, whether an institutional buyer''s compliance team will approve a purchase order, and whether an investor can trust the potency and purity claims underlying a valuation. Yet the certificate is also one of the most commonly misunderstood documents in the entire supply chain, routinely treated by buyers, and sometimes by sellers themselves, as a simple pass or fail stamp, when it is actually something narrower and more conditional: a snapshot of one sample, tested by one specific method, against one specific set of reference standards, at one specific point in time, by one specific laboratory operating under its own quality infrastructure.

This narrower reality matters because the gap between a certificate existing and a certificate being trustworthy is where a meaningful share of cannabis supply chain quality failures actually live. A certificate from an unaccredited laboratory, using an unvalidated test method, calibrated against expired or improperly sourced reference standards, can show a clean, professional-looking result for a contaminated, degraded, or mislabeled product, and on the page, it will look essentially identical to a certificate that actually proves what it claims to prove. There is no visual cue on a certificate of analysis that distinguishes rigorous testing from inadequate testing; the difference lives entirely in the testing infrastructure behind the document, which requires active investigation to verify rather than passive review of the document itself.

Knowing how to read past the certificate to the testing infrastructure that produced it is therefore a core competency, not an optional refinement, for anyone buying, investing in, financing, or regulating cannabis product. This applies whether the context is a single wholesale transaction, a due diligence process ahead of an acquisition, or a regulator deciding whether a market''s testing regime is actually protecting consumers or merely creating an appearance of protection.

To make this concrete: imagine a hypothetical wholesale buyer comparing two suppliers, both presenting certificates showing nineteen percent THC on flower from the same general cultivar. Supplier A''s certificate comes from a laboratory accredited specifically for cannabinoid potency testing on flower matrices, tested within two weeks of harvest, with a contaminant panel matching the buyer''s destination market exactly. Supplier B''s certificate shows an identical nineteen percent figure, from a laboratory whose accreditation scope the buyer never checked, tested four months after harvest, against a contaminant panel from a different jurisdiction entirely. On paper, the two certificates look equally convincing. In substance, only one of them tells the buyer anything reliable about what they''re actually purchasing.', 'text'),
  ('b64698bc-edf3-4b93-96fc-0e9c991a0135', 2, 'The Core Framework', 'Four elements determine whether a certificate of analysis is actually trustworthy, and a careful buyer needs to check all four independently; in practice, most buyers check none of them and simply read the numbers on the page.

Laboratory accreditation establishes that the testing laboratory itself operates under a recognized quality management standard, commonly an international standard for testing and calibration competence, and is subject to periodic external audit against that standard by an independent accreditation body. An accredited laboratory has documented, externally verified procedures covering everything from sample handling to equipment calibration to staff competency; an unaccredited laboratory''s procedures are, in effect, whatever that laboratory says they are, with no independent party having verified the claim. Critically, accreditation is typically granted on a per-method, per-matrix basis rather than as a single blanket certification covering everything the laboratory does, which means the real diligence question is never simply "is this lab accredited" but specifically "is this lab accredited for this exact test, on this exact product matrix."

Method validation establishes that the specific test method used, whether for potency, pesticide residues, heavy metals, microbial contamination, mycotoxins, or residual solvents, has been formally proven to reliably detect what it claims to detect, at the concentrations that actually matter for safety or compliance thresholds, without producing significant false positives or false negatives. A method can be scientifically sound and well-validated in general, and still be invalid for a specific product matrix, since flower, concentrates, edibles, and topicals each present different matrix interference challenges that a method validated only on one matrix may not handle reliably on another. A laboratory using a method validated for flower to test a concentrate, without separately validating that method for the concentrate matrix, is producing results of unknown reliability, even though the underlying method is legitimate.

Reference standards are the certified, traceable calibration materials a laboratory uses to calibrate its instruments and verify its results against a known baseline. If reference standards are expired, improperly stored (many degrade under incorrect temperature or light exposure), or sourced from an unverified or non-traceable supplier, every result calibrated against them inherits that underlying uncertainty, even if every other part of the testing process, from sample handling to instrument operation, is executed flawlessly. Reference standard quality is invisible on the final certificate; it has to be checked by asking the laboratory directly about sourcing and expiry management.

Contaminant panel composition, meaning the specific list of compounds actually tested for, varies enormously between jurisdictions and even between different laboratories operating within the same jurisdiction, with pesticide panels in particular sometimes differing by dozens of individual compounds between one laboratory''s standard panel and another''s. A certificate showing a clean pass on a twenty-compound pesticide panel says nothing whatsoever about the sixty or more additional compounds a more comprehensive panel, or a different jurisdiction''s required panel, might have tested for and potentially flagged. The panel composition is, in a real sense, as important to evaluating a certificate as the numerical results themselves, because a clean result on an inadequate panel provides false reassurance.

It''s worth understanding, at a slightly deeper level, why method validation matters so much for a category like pesticide testing specifically. Pesticide residue analysis typically involves detecting trace concentrations of dozens of distinct chemical compounds within a complex plant matrix that itself contains thousands of other compounds, many of which can interfere with detection through a phenomenon analytical chemists call matrix interference. A method that performs reliably on a clean reference sample can behave quite differently on a real-world flower or concentrate sample, which is precisely why validation has to be performed on the actual product matrix being tested, not just on a simplified reference standard in isolation. A laboratory that validated its method only on the latter, while still offering testing services on the former, is offering a service whose actual reliability hasn''t genuinely been established.', 'text');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624032627','seed_education_sections_02','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624032627_seed_education_sections_02.sql

-- RECOVERY BEGIN 20260624032714_seed_education_sections_03.sql
insert into education_module_sections (module_id, section_order, heading, body, block_type) values
  ('b64698bc-edf3-4b93-96fc-0e9c991a0135', 3, 'How This Plays Out in Practice', 'A buyer reviewing a certificate of analysis for an incoming shipment, whether for a single transaction or as part of ongoing supplier qualification, should work through it in a specific, repeatable order rather than simply scanning the numerical results for anything obviously alarming.

First, identify the issuing laboratory by name and check its accreditation status and, critically, its accreditation scope, since accreditation is typically granted per method and per matrix rather than as a blanket lab-wide certification. The real diligence question is whether this specific laboratory is accredited for this specific test, on this specific product matrix, not simply whether the laboratory holds accreditation for something. Second, check the test date relative to both the sample collection date and the product''s expected shelf life, since potency in particular degrades measurably over time through cannabinoid decarboxylation and degradation processes, and a certificate generated at harvest tells a buyer relatively little about a product that has since spent six months in storage and transit.

Third, compare the specific contaminant panel that was actually tested against the panel required by the destination market''s regulations, not the origin market''s, since a certificate that is fully compliant with the exporting jurisdiction''s requirements may be entirely silent on compounds the importing jurisdiction specifically mandates testing for. This comparison requires the buyer to actually know the destination market''s required panel in detail, which is itself a piece of regulatory knowledge worth maintaining proactively rather than discovering reactively. Fourth, look closely at batch and lot traceability on the certificate itself: does it tie unambiguously, through a specific batch or lot identifier, to the physical product actually in front of the buyer, or is the link looser than it first appears, such that the certificate could plausibly correspond to a different batch entirely if record-keeping were sloppy or, in a worse case, deliberately manipulated.

In a structured deal room or formal due diligence context, the standard request to a counterparty should never be limited to "send me your certificates of analysis." It should explicitly include a request for the issuing laboratory''s accreditation scope documentation and a clear statement of the contaminant panel specification used, because the certificate alone, however clean it looks, does not answer the underlying questions that actually determine whether the product is fit for the destination market and for the buyer''s specific regulatory obligations. Institutional buyers with mature compliance functions increasingly build this expanded request into their standard supplier qualification process precisely because they''ve been burned, or have seen peers burned, by certificates that looked complete but weren''t backed by adequate testing infrastructure.

Buyers operating across multiple supply relationships often find it worthwhile to maintain a simple internal registry of which laboratories they''ve personally verified, including the specific accreditation scope confirmed and the date that verification was last checked, since accreditation status is not static and can lapse, be suspended, or be narrowed over time. Treating a laboratory''s accreditation as a one-time check rather than something to periodically reconfirm is a quieter version of the same mistake as never checking accreditation at all; it just takes longer to surface.', 'text'),
  ('b64698bc-edf3-4b93-96fc-0e9c991a0135', 4, 'Common Pitfalls', 'The most frequent and most costly mistake is accepting a certificate of analysis at face value simply because it has the visual format of a professional laboratory report, complete with letterhead, signatures, and precise-looking numerical results, without independently checking whether the issuing laboratory is actually accredited for the specific tests shown on that particular certificate. Professional formatting is not, and should never be treated as, a proxy for underlying testing rigor; a sophisticated-looking certificate from an unaccredited or inappropriately-scoped laboratory carries essentially the same evidentiary weight as an unverified verbal claim, just with better typesetting.

A second common error is comparing potency numbers across certificates issued by different laboratories as though those numbers are directly and meaningfully comparable. Different laboratories using different validated methods, different instrument calibrations, and sometimes different sample preparation protocols can legitimately produce somewhat different potency results for genuinely the same underlying material. This isn''t necessarily evidence of fraud or manipulation; it''s expected methodological variance, and the analytical mistake runs in both directions: treating a modest discrepancy between two reputable, accredited labs as automatic evidence of tampering is just as analytically wrong as dismissing a much larger, genuinely anomalous discrepancy as "just normal lab variance" without further investigation.

Operators also frequently fail to track reference standard expiry and chain of custody internally, simply assuming the contracted laboratory handles all of this invisibly and competently as part of its service, when in many regulated markets the purchasing operator is itself contractually or even legally responsible for having verified the laboratory''s quality infrastructure, not merely for having received and filed the laboratory''s output. This responsibility doesn''t disappear just because the testing was outsourced.

Contaminant panel mismatches between the origin market''s testing requirements and the destination market''s requirements are routinely discovered only at the border, at the worst and most expensive possible point in the process, when a shipment is held by customs or a regulatory authority because the exporting country''s fully compliant, clean-passing certificate simply never tested for a specific pesticide, heavy metal, or other contaminant that the importing country specifically restricts and requires testing for. This is a foreseeable and avoidable failure mode, but only if the panel comparison is done proactively, before the shipment moves, rather than discovered reactively after a hold.

Finally, a subtler but increasingly relevant pitfall involves treating certificate of analysis review as a one-time gate at initial supplier qualification, rather than an ongoing practice applied to every batch and every shipment. A supplier who passed rigorous review on their first shipment can, over time, switch laboratories, let accreditation lapse, or quietly narrow their testing panel to reduce cost, and a buyer who only scrutinized the very first certificate and then treated subsequent ones as a formality can miss a meaningful degradation in testing rigor occurring gradually over many transactions.

A related, less obvious failure mode worth flagging involves sample representativeness rather than laboratory rigor itself. Even a flawlessly executed test, performed by a fully accredited laboratory using a properly validated method, only tells a buyer about the specific sample that was actually submitted for testing. If that sample wasn''t drawn in a way that genuinely represents the full batch, whether due to inconsistent mixing, sampling only from the most accessible portion of a large lot, or sampling before a batch was fully homogenized, the resulting certificate can be entirely accurate about the sample while still being a poor proxy for the batch as a whole. Buyers with meaningful volume at stake increasingly ask suppliers to describe their sampling protocol specifically, not just their testing protocol.', 'text'),
  ('b64698bc-edf3-4b93-96fc-0e9c991a0135', 5, 'Key Takeaways', 'Never evaluate a certificate of analysis in isolation from the testing infrastructure behind it; always pair review of the certificate itself with verification of the issuing laboratory''s accreditation scope for the specific tests shown, not merely the laboratory''s general reputation or marketing claims about its capabilities. Check the contaminant panel actually tested against the destination market''s specific regulatory requirements, rather than the origin market''s requirements, since these frequently differ in ways that aren''t obvious without direct comparison.

Treat potency variance observed between different accredited laboratories as expected methodological noise within a reasonable range, reserving genuine scrutiny for results that are sharply outlying relative to that expected range, rather than either reflexively dismissing all variance or panicking over every minor discrepancy. Confirm reference standard sourcing and expiry management as a standard part of supplier and laboratory qualification, treating it as a substantive diligence item rather than an afterthought to be assumed away.

Build certificate of analysis review into the commercial deal timeline early, well before a shipment is committed to a specific delivery date, since discovering a panel mismatch at the border is fundamentally a logistics and cost failure that a thorough document review conducted days or weeks earlier would have caught at essentially no cost. And treat certificate review as an ongoing, per-shipment practice rather than a one-time supplier qualification gate, since testing rigor on the supplier side can degrade gradually over an ongoing relationship in ways that only continued scrutiny will catch.

Lastly, it is worth noting that contaminant panels themselves evolve over time as regulatory science advances and new compounds of concern are identified, meaning a panel specification that was fully adequate eighteen months ago may already be missing a compound that has since been added to a destination market''s required testing list. Buyers and suppliers who treat their reference panel as a fixed, one-time agreement rather than something to periodically revisit against current regulatory requirements risk a compliance gap opening gradually beneath an otherwise stable, long-running commercial relationship.', 'text'),
  ('af5161a6-07fd-4a1c-9ea7-bd125cd658fe', 1, 'Why This Matters', 'Cannabis product that passes every quality test at the point of manufacture can still arrive at its destination degraded, contaminated, or fully non-compliant, because Good Distribution Practice failures happen after the product leaves the facility that tested and released it, in the part of the supply chain that is hardest to audit retroactively and hardest to attribute responsibility for after the fact. A single temperature excursion during an unplanned layover, a carrier who is not actually qualified to handle controlled or temperature-sensitive cargo despite holding general transport credentials, or a customs delay that leaves product sitting for days in an unconditioned warehouse can each independently undo the quality work done upstream, and unlike a manufacturing defect, transport-related damage frequently leaves no obvious visible trace by the time the product is finally opened and used or sold, making the failure invisible until a downstream quality complaint or test result surfaces it.

This matters disproportionately in cannabis, relative to many other regulated commodities, because the product category sits at an unusual intersection of requirements: it requires pharmaceutical-grade handling discipline in many jurisdictions, including continuous temperature control, documented chain of custody, and meaningful physical security, while simultaneously moving through general logistics networks that were not originally built around controlled substance handling and frequently lack genuine cannabis-specific experience. A freight forwarder who is excellent and experienced at moving conventional pharmaceuticals may have essentially zero practical experience with the additional security protocols, customs classification nuances, and permitting requirements that cannabis specifically triggers, and may not realize the gap exists until a shipment encounters a problem that a cannabis-experienced forwarder would have anticipated and avoided.

To illustrate how this typically unfolds: picture a hypothetical shipment of extract moving from a processing facility to an overseas pharmacy distributor, routed through two intermediate transit hubs due to limited direct flight availability on the preferred carrier. At the first hub, a four-hour ground handling delay pushes the shipment past its scheduled connection, and it sits on an unconditioned tarmac for an additional ninety minutes awaiting the next available flight. The temperature logger captures this excursion in full detail, but because nobody at either the originating facility or the destination reviews the complete trace, only the final delivery-point reading, the excursion goes entirely unnoticed until a downstream stability complaint months later prompts someone to finally pull the full data and discover it.

There is also a documentation dimension to temperature control that goes beyond the data logger itself: the underlying validation that established the acceptable temperature range and excursion tolerance in the first place. A shipper should be able to point to actual stability data showing how the specific product behaves under various temperature and duration combinations, rather than applying a generic, industry-wide rule of thumb borrowed from an unrelated product category. A product-specific stability study, even a relatively modest one, gives the receiving party a defensible basis for deciding whether a given documented excursion is actually consequential for that specific product, rather than relying on a one-size-fits-all threshold that may be either needlessly conservative or, worse, insufficiently protective for the particular formulation involved.', 'text');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624032714','seed_education_sections_03','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624032714_seed_education_sections_03.sql

-- RECOVERY BEGIN 20260624032813_seed_education_sections_04.sql
insert into education_module_sections (module_id, section_order, heading, body, block_type) values
  ('af5161a6-07fd-4a1c-9ea7-bd125cd658fe', 2, 'The Core Framework', 'Good Distribution Practice is built around four control points that need to function as a single connected chain, where compliance at any individual point is meaningless if the chain as a whole has a gap, rather than as a set of independent checkboxes to be satisfied separately.

Temperature and environmental control must be continuous and documented from the point of release at the originating facility through to final delivery at the destination, not merely present and verified at the two endpoints with an unmonitored gap in transit between them. In practice, this generally means continuous electronic data logging throughout the entire journey, rather than periodic manual spot checks at scheduled intervals, because a single undetected excursion occurring during an unplanned layover, a customs hold, or a vehicle breakdown can be completely invisible at both the origin check and the destination check while still meaningfully degrading the product during the unmonitored interval.

Carrier and facility qualification verifies that every party that will physically handle the product at any point in its journey, including the originating facility''s own outbound handling, the local pickup carrier, the airport or port handling agent, the airline or shipping line itself, any customs bonded warehouse the product passes through, and the final-mile delivery carrier, has been independently assessed against equivalent quality and security standards, rather than simply contracted based on price and delivery speed. A single unqualified link anywhere in an otherwise fully compliant chain compromises the compliance status of the entire shipment, regardless of how rigorously every other link was managed.

Chain of custody and security documentation tracks precisely who held physical possession of the product at every point in its journey, with explicit, time-stamped handoff records at each transfer of custody. This matters for two distinct reasons: first, for regulatory compliance, since many jurisdictions specifically require documented chain of custody for controlled substances as a condition of import or domestic transport; and second, for operational accountability, since if a problem does occur, whether a temperature excursion, a security breach, or product loss, having precise custody records is what allows the responsible party and the responsible point in the chain to actually be identified, rather than the failure remaining an unresolved mystery distributed across the whole logistics chain.

Cross-border documentation, including import and export permits, phytosanitary certificates where the shipment involves any live plant material, and customs declarations matched precisely and correctly to the product''s actual classification, has to be fully correct and physically present before the shipment ever moves, not assembled reactively once customs raises a question. Cannabis product classification for customs purposes varies meaningfully by jurisdiction and even relatively small errors in tariff coding or product description can independently trigger a hold, entirely separate from any question about the product''s actual quality or compliance status.

Carrier qualification is worth examining a layer deeper than simply confirming a general certification exists, since the specific scope of that certification matters enormously. A carrier might genuinely hold valid Good Distribution Practice certification for general pharmaceutical cargo, while having no specific experience or documented protocol for the additional security requirements that controlled substances like cannabis specifically trigger, such as enhanced background screening for personnel with physical access to the cargo, or specific chain-of-custody documentation beyond what conventional pharmaceutical shipments typically require. A shipper should ask not simply whether a carrier is certified, but specifically what categories of cargo that certification was assessed against.

Operators should also think carefully about redundancy in their monitoring approach itself, since a single data logger that fails or loses power partway through a shipment leaves a documentation gap that, ironically, can be more damaging than a documented excursion would have been, because it removes the ability to demonstrate compliance at all for the affected portion of the journey. Using a second, independent logger on higher-value or longer-transit shipments, or selecting logger technology with a demonstrated reliability track record specifically for the transit durations involved, reduces this particular risk at relatively modest incremental cost.', 'text'),
  ('af5161a6-07fd-4a1c-9ea7-bd125cd658fe', 3, 'How This Plays Out in Practice', 'A shipment moving from a cultivation or processing facility to an international buyer typically passes through somewhere between five and eight distinct custody transfers over the course of its journey: from the originating facility to a local ground carrier, from that local carrier to an airport or port handling agent, from the handling agent to the airline or shipping line itself, through customs clearance processes at both the origin and destination, and finally from the last international carrier to a final-mile carrier delivering to the buyer''s own facility. Genuine Good Distribution Practice compliance means that every single one of those transfers has a qualified, vetted party on both the sending and receiving side of the handoff, with a documented record of that handoff, and with continuous temperature monitoring spanning across all of them without gaps.

In practice, the most common and most reliable operational approach to the temperature control requirement is a physical data logger that travels inside the shipment itself, rather than a monitoring approach that relies only on monitoring the storage facility''s ambient conditions before dispatch and after arrival. This produces a single continuous record that can be reviewed in full by the receiving party immediately on arrival, before they formally accept the shipment, rather than relying on two disconnected snapshots at the endpoints. A documented temperature excursion during transit does not automatically mean the product has become unusable or non-compliant, since the relevant question is typically the magnitude and duration of the excursion relative to the product''s specific stability profile, but it absolutely does mean the receiving party needs a pre-agreed protocol, decided in advance, for exactly what happens when an excursion is detected, rather than discovering for the first time, under time pressure with a shipment physically sitting at the dock, that no such protocol exists and a decision needs to be improvised on the spot.

Carrier qualification, in practical terms, means proactively requesting and carefully reviewing the carrier''s own internal quality documentation, including their Good Distribution Practice certification or jurisdictional equivalent, their specific prior experience handling controlled substances or comparably sensitive temperature-controlled pharmaceutical cargo, and their documented security protocols, before the carrier is ever booked, rather than only after a problem has already occurred and the relationship is being reassessed under duress. Many operators perform this qualification step diligently and thoroughly for their primary, regularly used shipping lane, while treating backup carriers or expedited carriers brought in during a disruption as automatically acceptable substitutes without equivalent scrutiny, which is precisely the situation in which an unqualified carrier is statistically most likely to actually get used, since disruptions are exactly when normal qualification discipline tends to get bypassed under time pressure.

Another practical consideration involves the choice between active and passive temperature control systems for a given shipment. Passive systems, relying on insulated packaging and phase-change materials, are generally less expensive and simpler to deploy but offer a finite, calculable window of protection that depends heavily on ambient conditions and total transit time; active systems, with their own powered refrigeration units, offer more robust protection across longer or less predictable transit times but introduce their own failure mode, namely power supply interruption, which needs to be separately monitored and mitigated. Neither approach is universally correct; the right choice depends on the specific route''s known transit time variability and the product''s actual stability profile.

It is also worth considering how seasonal variation affects lane risk independently of any change in carriers or routing. A lane that performs reliably during temperate months can behave quite differently during extreme summer heat or winter cold, when ground handling delays, however brief, expose cargo to ambient conditions considerably further from the target range than the same delay would during milder weather. Shippers operating on a fixed annual schedule sometimes apply the same packaging and monitoring approach year-round without adjusting for this seasonal swing, effectively under-protecting shipments during the periods of highest actual risk.', 'text'),
  ('af5161a6-07fd-4a1c-9ea7-bd125cd658fe', 4, 'Common Pitfalls', 'The most common operational failure is treating temperature monitoring as a simple binary check of whether the product arrived at an acceptably cold temperature, rather than actually reviewing the full continuous data log generated throughout the journey. A shipment can easily arrive at the correct final temperature reading while having spent several hours entirely outside the acceptable range during an unplanned layover or transfer delay earlier in transit, a gap that is completely invisible unless someone on the receiving end actually pulls and reviews the full logged trace rather than just checking the single reading taken at the moment of delivery.

A second frequent error is qualifying the primary, regularly used shipping lane and its carriers with real care and rigor, while implicitly treating backup or contingency carriers used specifically during disruptions as automatically acceptable substitutes, without applying the same qualification standard. The carrier that ends up actually being used under time pressure during a genuine disruption is, almost by definition, precisely the one most likely to lack proper qualification, because the qualification process itself was never built into the contingency planning in the first place.

Operators also routinely and significantly underestimate how product classification errors made at customs, even genuinely unintentional clerical ones, can independently trigger holds that then create their own separate Good Distribution Practice problem layered on top of the original paperwork issue, since a shipment sitting for days in an unconditioned, non-temperature-controlled customs holding facility because of a coding error experiences exactly the kind of uncontrolled environmental excursion that the rest of the carefully managed cold chain was specifically built to prevent.

Finally, chain-of-custody documentation is frequently treated by operators as a purely administrative compliance formality to be completed and filed, rather than actually read and reviewed for what it substantively reveals about how the shipment was actually handled. Gaps or inconsistencies in the documented handoff sequence are very often the first visible, detectable sign that a logistics partner is cutting corners elsewhere in their process too, well before that lack of rigor shows up in a more directly costly way like a damaged or compromised shipment.

A further pitfall worth flagging specifically involves documentation that exists but isn''t actually reviewed in time to matter. Some operators do diligently collect full temperature traces and chain-of-custody records for every shipment, but only review them after the fact, for audit or record-keeping purposes, rather than reviewing them at the point of receipt, before the shipment is accepted and before the product enters further distribution. This timing matters enormously: a temperature excursion discovered after the product has already been distributed downstream is a much harder problem to manage than the same excursion discovered and acted on before acceptance.

Beyond the immediate transit chain, it is worth building a feedback loop between the logistics function and the quality function within an organization, so that documented excursions, near misses, and carrier performance issues are systematically reviewed and used to inform future carrier selection and lane design, rather than being filed away as one-off incident reports with no broader influence on operational decisions. Organizations that treat each shipment''s logistics data as disposable, rather than as an accumulating dataset informing future decisions, tend to repeat the same avoidable failure modes across successive shipments without ever identifying the underlying pattern.', 'text');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624032813','seed_education_sections_04','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624032813_seed_education_sections_04.sql

-- RECOVERY BEGIN 20260624032902_seed_education_sections_05.sql
insert into education_module_sections (module_id, section_order, heading, body, block_type) values
  ('af5161a6-07fd-4a1c-9ea7-bd125cd658fe', 5, 'Key Takeaways', 'Require continuous temperature data logging that physically travels with the shipment itself rather than relying on endpoint-only monitoring, and make a habit of reviewing the full logged trace on arrival rather than just checking the single delivery-point reading. Qualify every carrier and every facility in the chain against equivalent Good Distribution Practice standards, explicitly including backup and contingency carriers, well before they''re actually needed under the pressure of a disruption.

Build cross-border documentation requirements, including permits, phytosanitary certificates, and correct customs classification, into the overall commercial timeline with enough genuine lead time to catch and correct errors before they cause an actual hold at the border. Pre-agree, in writing and in advance, a specific protocol for handling a documented temperature excursion before it actually happens, rather than improvising a decision during the live shipment under pressure to simply accept the product and move on.

And treat any chain-of-custody documentation gaps as a meaningful diagnostic signal about a logistics partner''s broader operational rigor, worth investigating proactively, rather than dismissing as a minor paperwork issue to be patched after the fact.

Finally, operators managing recurring shipping lanes benefit from periodically re-validating the lane itself, not just the individual carriers within it, since route changes, seasonal weather pattern shifts, and changes to intermediate hub infrastructure can each independently alter a previously well-understood lane''s risk profile, even when every individual carrier along that lane remains unchanged and remains fully qualified on paper.

Finally, it''s worth building a simple internal escalation protocol specifically for logistics-related compliance issues, defining in advance who needs to be notified, on what timeline, when a significant excursion or chain-of-custody gap is detected, since the value of detecting a problem promptly is significantly reduced if the detection doesn''t trigger a timely, clearly defined response. A documented excursion that sits unreviewed in a shared drive for two weeks before anyone acts on it provides little practical benefit over not having detected it at all.', 'text'),
  ('b4882b28-7039-471f-b580-c19786752be6', 1, 'Why This Matters', 'Cannabis occupies an unusual position within clinical practice: in most jurisdictions where medical use is permitted, it exists within a controlled substance category that imposes a distinct set of prescribing, dispensing, and monitoring obligations that don''t map cleanly onto either the standard pharmaceutical prescribing workflow a clinician is most familiar with, or onto the genuinely unregulated wellness product space at the other end of the spectrum. A prescriber accustomed to either of those two more familiar models can be caught off guard by what''s actually required in this distinct middle category, often discovering the gap only when an audit, a regulatory review, or an adverse event forces the question.

This matters because the additional obligations attached to cannabis prescribing are not arbitrary administrative overhead imposed for its own sake; they exist specifically because cannabis-based medicine, and particularly whole-plant and inhaled formulations, has a meaningfully different evidence base, a wider individual variability profile in patient response, and in some respects a different risk surface than most conventional, highly standardized pharmaceuticals, and the regulatory frameworks built around cannabis prescribing are specifically designed to manage that difference. A prescriber who treats cannabis prescribing as procedurally identical in every respect to prescribing a standard, well-characterized medication is exposed on documentation grounds, on monitoring grounds, and potentially on scope-of-practice grounds, even in situations where the underlying clinical judgment itself was entirely sound and defensible.

For clinic operators specifically, the stakes compound further: a documentation gap traceable to a single individual prescriber can, depending on the regulatory framework, expose the entire practice''s broader authorization to operate, not merely that one prescriber''s individual professional standing, which is why clinic-level oversight of prescribing documentation practices matters as much as individual prescriber diligence.

Consider a hypothetical illustrative scenario: a prescriber sees a patient whose conventional treatment for a chronic condition has produced diminishing results over eighteen months. The prescriber, drawing on genuine clinical experience, judges cannabis-based treatment appropriate and prescribes accordingly. The clinical judgment itself, in this scenario, may be entirely sound. But if the chart simply notes "trialed cannabis given inadequate response to prior treatment" without specifying which treatments were tried, for how long, at what point they were judged inadequate, and why this specific cannabis formulation was selected over alternatives, a subsequent reviewer has no way to distinguish a carefully reasoned decision from a cursory one, and the documentation gap itself becomes the finding, regardless of how good the underlying clinical reasoning actually was.

It''s also worth addressing how this framework interacts with telemedicine specifically, since an increasing share of cannabis prescribing in many regulated markets now occurs through remote consultation rather than in-person visits. Telemedicine-based prescribing typically carries its own additional documentation expectations, including verification of patient identity and location, since the prescriber''s own licensing jurisdiction and the patient''s physical location at the time of consultation can both independently affect which regulatory framework actually applies. A prescriber operating across multiple jurisdictions through telemedicine needs documentation practices robust enough to demonstrate, for each individual consultation, exactly which jurisdiction''s rules were actually in effect, rather than assuming a single home-jurisdiction framework applies uniformly regardless of where the patient is physically located.', 'text'),
  ('b4882b28-7039-471f-b580-c19786752be6', 2, 'The Core Framework', 'Three structural elements together define the prescribing framework that applies in most regulated medical cannabis markets, and understanding how they interact is more useful than treating any one of them in isolation.

Scheduling status determines the baseline regulatory obligations that attach to any given cannabis-based product. Record-keeping requirements, prescription duration limits, refill restrictions, and the specific adverse event reporting obligations that apply all flow downstream from how the relevant national or regional authority classifies that particular cannabis-based product, and this classification can, somewhat counterintuitively, differ between different product formats, such as a specific standardized pharmaceutical-grade extract versus a whole-flower botanical product, even within the same overall jurisdiction and even when both formats are derived from the same underlying plant material.

Patient eligibility frameworks specify the documented clinical justification that must exist before a prescription can be legitimately issued. This typically includes the patient''s prior treatment history for the relevant condition, a documented clinical rationale that explicitly connects the patient''s specific condition to the prescribing decision being made, and in many jurisdictions, an explicit requirement that conventional, more established treatment options have been considered, and often actually attempted, before cannabis-based treatment is pursued. This eligibility documentation is not a bureaucratic formality to be completed after the clinical decision is already made; in an audit or formal regulatory review, it functions as the primary artifact that demonstrates the prescribing decision genuinely met the applicable clinical and regulatory bar at the time it was made, as opposed to being a retrospectively justified decision.

Monitoring obligations require prescribers, and in many frameworks dispensing pharmacists as well, to actively watch for and formally report adverse events through whatever specific reporting mechanism the relevant regulatory authority maintains for that purpose. Because cannabis-based products, particularly less standardized botanical formulations, often exhibit considerably more individual patient-to-patient variability in both effect and side-effect profile than highly standardized conventional pharmaceuticals do, the practical threshold for what should actually be documented and actively monitored is frequently set lower in cannabis-specific frameworks than a prescriber accustomed only to conventional medication monitoring might initially assume.

It''s worth drawing out a related distinction that matters in practice: the difference between scope of practice as a general legal concept and the specific additional training or certification some jurisdictions require before a prescriber can issue cannabis-based prescriptions at all. In many regulated markets, holding a general medical license is necessary but not sufficient; a separate registration, additional continuing education requirement, or specific authorization tied to the relevant controlled substance schedule may also be required, and a prescriber who has the general clinical competence but hasn''t completed the specific additional authorization step is prescribing outside their actual legal scope of practice, regardless of clinical merit.

A further consideration involves how prescribers should handle situations where a patient requests a specific product or brand by name, having perhaps read about it or heard about it from another patient, rather than the prescriber independently arriving at that specific selection through clinical reasoning. Documenting the actual clinical rationale for the product ultimately selected remains necessary even when patient preference initially prompted the conversation, since a chart that simply notes the patient''s request without any independent clinical assessment of appropriateness reads, under review, as the prescriber having deferred entirely to patient preference rather than having exercised independent clinical judgment.', 'text');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624032902','seed_education_sections_05','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624032902_seed_education_sections_05.sql

-- RECOVERY BEGIN 20260624032948_seed_education_sections_06.sql
insert into education_module_sections (module_id, section_order, heading, body, block_type) values
  ('b4882b28-7039-471f-b580-c19786752be6', 3, 'How This Plays Out in Practice', 'A prescribing workflow that genuinely satisfies all three of these structural elements in practice typically looks something like the following. The eligibility assessment itself is documented contemporaneously, at the actual time the prescribing decision is being made, rather than reconstructed retrospectively after the fact if a question arises later, and that documentation explicitly includes which specific alternative treatments were considered and why the cannabis-based prescribing decision was ultimately reached over those alternatives. Product selection criteria, including the specific formulation chosen, the cannabinoid ratio category selected, and the intended route of administration, are documented as an explicit part of the clinical record, with the underlying rationale clearly tied back to the patient''s documented condition and treatment history, rather than being left as an entirely implicit, undocumented clinical judgment call that exists only in the prescriber''s own reasoning.

Follow-up appointment intervals are deliberately scheduled and documented specifically with the purpose of actively capturing adverse event information at defined checkpoints, rather than passively relying on the patient to proactively initiate contact and report problems on their own if something goes wrong. And critically, any adverse event that does occur, even one the prescriber''s own clinical judgment suggests is likely minor or only tenuously related to the cannabis-based treatment, is formally logged through the official reporting channel rather than being handled only informally as a brief clinical note in the patient''s chart, because the formal reporting channel exists precisely to detect aggregate patterns that no single prescriber, looking only at their own individual patient, would be in a position to notice.

Clinic operators who support multiple prescribers under a single practice typically find they need a standardized documentation template applied consistently across all prescribers, precisely because meaningful variability between individual prescribers'' personal documentation habits is itself an independent audit risk in its own right. A clinic where some prescribers document their eligibility rationale and product selection thoroughly while others document only minimally creates a visible inconsistency across the practice''s records that is genuinely difficult to satisfactorily explain during a regulatory review, even in situations where every single individual clinical decision made, considered purely on its own clinical merits, was entirely defensible and appropriate.

Clinic-level systems for surfacing documentation inconsistency don''t need to be elaborate to be effective; a simple periodic internal audit, where a designated reviewer pulls a random sample of charts across all prescribers in the practice on a quarterly basis and checks them against a standard documentation checklist, catches the great majority of drift before it accumulates into a pattern serious enough to draw external attention. The specific cadence matters less than the existence of any cadence at all; practices that rely solely on individual prescriber diligence, without any structured internal check, tend to discover inconsistency only when an external party discovers it for them.

It is also worth building explicit institutional awareness, at the clinic level, of how documentation requirements may differ for different patient populations the practice serves, such as elderly patients on multiple concurrent medications where drug interaction considerations carry additional weight, or patients with a documented history of substance use disorder where additional monitoring considerations may apply. Treating documentation requirements as uniform across the entire patient population, when clinical risk genuinely varies by patient profile, can leave higher-risk cases under-documented relative to what a careful reviewer would expect given that patient''s specific risk profile.', 'text'),
  ('b4882b28-7039-471f-b580-c19786752be6', 4, 'Common Pitfalls', 'The single most common documentation gap is treating the eligibility assessment as something that genuinely happened, in the sense that the prescriber''s underlying clinical judgment was sound, while documenting only the final conclusion reached rather than the actual reasoning process that led to it, leaving no contemporaneous record of which specific alternative treatments were actually considered or why cannabis-based treatment was ultimately judged appropriate over those alternatives. In a formal review or audit context, an undocumented rationale is functionally indistinguishable from the complete absence of any rationale at all, regardless of how sound the actual underlying clinical thinking genuinely was.

A second frequent and consequential issue is under-reporting adverse events specifically because they seem clinically minor to the individual prescriber, or because that prescriber isn''t personally confident the cannabis-based product actually caused the event rather than some unrelated factor. Formal monitoring and reporting systems are deliberately built to detect meaningful patterns across many aggregated reports from many different prescribers; a single ambiguous case might reasonably look entirely unremarkable to the one prescriber who only ever sees their own individual patient, while that same case matters substantially once aggregated into the broader dataset the reporting system was specifically designed to surface patterns within.

Clinic operators frequently discover meaningful documentation inconsistency between their different prescribers only during an external regulatory review process, rather than through any proactive internal audit process, and by the point an external reviewer surfaces the inconsistency, remediating genuinely inconsistent records across an entire existing patient population is considerably harder, slower, and more resource-intensive than catching and correcting the same inconsistency early through routine internal review would have been.

Finally, product selection rationale is very often left entirely implicit, described only as general clinical judgment rather than being made explicit and documented, and this becomes a particular liability specifically because cannabis product formats, across ratio, route of administration, and specific formulation, genuinely vary far more widely than most comparable conventional pharmaceutical categories do, meaning an undocumented selection decision looks considerably more exposed under formal review than an equivalently undocumented choice between two near-identical generic formulations of a standard conventional drug would.

A further pitfall specific to multi-prescriber clinics involves inconsistent product formularies, where different prescribers within the same practice develop their own informal preferences for which products they tend to recommend, without any documented, shared rationale for why the practice''s overall formulary includes the specific options it does. This isn''t necessarily a clinical problem, since individual prescriber judgment legitimately varies, but it can become a documentation problem if the practice can''t articulate, when asked, why its formulary looks the way it does and how individual prescribing choices relate to it.

Clinics should also consider how they handle prescriber transitions, such as when a patient''s regular prescriber leaves the practice or goes on extended leave, and a new prescriber takes over an existing cannabis-based treatment plan without having personally made the original eligibility determination. The receiving prescriber should document their own independent review and continued endorsement of the existing treatment plan, rather than simply continuing to issue refills on the basis of someone else''s earlier, undocumented-to-them clinical reasoning, since a chain of refills issued by a prescriber who never personally reviewed the original rationale is a documentation gap waiting to be discovered.', 'text'),
  ('b4882b28-7039-471f-b580-c19786752be6', 5, 'Key Takeaways', 'Document the eligibility rationale contemporaneously, at the actual time the prescribing decision is made, explicitly including which alternative treatments were considered and why they were set aside, rather than documenting only the final conclusion that was reached. Treat product selection, across formulation, ratio category, and route of administration, as an explicitly documented clinical decision with a clearly stated rationale tied to the patient''s record, rather than allowing it to remain an implicit, undocumented judgment call.

Report adverse events through the formal regulatory reporting channel even in cases where they seem clinically minor or where causation relative to the cannabis-based treatment feels genuinely uncertain to the individual prescriber, since the entire value of the formal reporting system lies in its ability to detect aggregate patterns that no single prescriber working in isolation could reasonably be expected to see. Build follow-up appointment intervals specifically designed to actively surface adverse events at defined checkpoints, rather than relying passively on patient-initiated reporting as the primary detection mechanism.

For clinic operators specifically, proactively standardize documentation templates and expectations across every prescriber in the practice, and conduct internal consistency review on a regular schedule, well before any external regulatory audit forces the question and surfaces gaps under considerably less favorable circumstances.

Finally, it''s worth noting that pharmacovigilance reporting thresholds and mechanisms can differ meaningfully between adjacent jurisdictions even within the same broader region, and a multi-site practice operating across more than one jurisdiction needs to maintain awareness of which specific reporting obligation applies at which specific site, rather than assuming a single unified reporting protocol covers every location the practice operates in.

Finally, it''s worth noting that pharmacovigilance reporting obligations sometimes extend beyond the prescriber to require coordination with the dispensing pharmacy, particularly where the pharmacy is the party that first becomes aware of a patient-reported adverse event during a routine refill interaction. Clinics and their associated dispensing pharmacies benefit from establishing a clear, mutually understood protocol for how adverse event information flows between the two parties, rather than each independently assuming the other is responsible for formal reporting.', 'text'),
  ('b65b8dbd-4e12-46fe-8928-99cf520770b1', 1, 'Why This Matters', 'Becoming a licensed cannabis importer is frequently treated, both internally by the operator pursuing it and externally by counterparties evaluating them, as though it were a single discrete milestone to be achieved and then checked off. In reality, it''s the entry point into an ongoing, continuous set of operational and regulatory obligations that determine both whether the underlying license itself remains valid over time and, separately, whether any individual specific shipment can actually clear at any given moment. The practical gap between holding a valid import license and reliably, repeatedly receiving compliant product on a predictable commercial timeline is precisely where many newly licensed importers lose substantial time and money, because the license itself does not guarantee permit approval for any specific shipment, and permit approval in turn does not guarantee that the importer''s own receiving infrastructure is actually ready and operational by the time product physically arrives.

This matters most acutely for operators entering cannabis import from adjacent industries, such as conventional pharmaceutical distribution or general agricultural commodity trading, who quite reasonably assume that their substantial existing licensing experience and established logistics capability will transfer directly into the cannabis context without significant modification. A meaningful portion of that experience genuinely does transfer well, but cannabis-specific import permit requirements, additional security obligations beyond what conventional pharma distribution typically requires, and a generally narrower available pool of genuinely qualified counterparties, including suppliers, carriers, and customs brokers with real cannabis-specific experience, together mean the established playbook from an adjacent industry isn''t a straightforward, complete port into the cannabis import context.

To make the timeline mismatch concrete, consider a hypothetical first-time importer who secures their underlying license after an eight-month application process, celebrates the milestone, and immediately signs a supply agreement promising delivery within six weeks. The supplier, also relatively new to export, takes nearly three months to assemble a complete and acceptable export documentation package, by which point the importer''s own permit application, which can only meaningfully begin once that supplier documentation is in hand, has barely started. The downstream buyer who was promised six weeks is now looking at a realistic five-month wait, and the commercial relationship absorbs reputational damage that better upfront timeline communication, grounded in a realistic understanding of the permit dependency, would have avoided entirely.

It''s worth examining how importers should think about geographic diversification of their supplier base specifically in light of the permit dependency described above. An importer relying entirely on a single supplier relationship is exposed not only to that supplier''s own operational risk, but specifically to that supplier''s documentation discipline as the binding constraint on the importer''s own permit timeline. Diversifying across two or more qualified suppliers, each independently vetted on documentation track record, reduces this specific dependency, though it does mean running the supplier-specific permit process more than once, which itself carries cost and should be weighed against the risk-reduction benefit.', 'text');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624032948','seed_education_sections_06','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624032948_seed_education_sections_06.sql

-- RECOVERY BEGIN 20260624033036_seed_education_sections_07.sql
insert into education_module_sections (module_id, section_order, heading, body, block_type) values
  ('b65b8dbd-4e12-46fe-8928-99cf520770b1', 2, 'The Core Framework', 'The importer pathway runs through three sequential gates, and attempting to skip ahead or work on a later gate before adequately resolving an earlier one reliably creates downstream problems at the next stage.

Licensing establishes the underlying legal authorization to import cannabis product within the destination jurisdiction in the first place, and typically requires the applicant to meet defined facility physical security standards, designate specific responsible personnel who meet relevant fitness and competency requirements, and provide financial and beneficial ownership disclosure to the licensing authority. This entire process is inherently jurisdiction-specific in its detailed requirements, and in practice often takes substantially longer than first-time applicants initially budget for in their planning, partly because of straightforward application processing backlogs at many licensing authorities, and partly because initial applications quite frequently come back from the authority with formal requests for additional supporting documentation, restarting or extending the review clock.

Permit acquisition operates at the level of a specific shipment, or in some regulatory frameworks at the level of a specific supplier relationship or contract, and sits as an additional, separate layer on top of the underlying license itself. Even a fully and validly licensed importer typically still needs to obtain a distinct, separate import permit for each individual shipment or supply contract, tied specifically to a named supplier, a defined product, and a specified quantity. This permit acquisition step is the single most commonly underestimated item on the overall timeline, precisely because it depends heavily on documentation originating from the supplier''s side of the relationship, including export permits, certificates of analysis, and manufacturing certification, arriving in a form the importing authority will actually accept, which means supplier-side documentation gaps or delays become, in practice, the importer''s own timeline problem regardless of where responsibility for the gap actually originated.

Receiving and distribution controls govern everything that needs to happen operationally once product has physically arrived: compliant, cannabis-appropriate storage, chain-of-custody documentation supporting onward domestic distribution, and, specifically for operators functioning as wholesale distributors, active controls verifying exactly who downstream is legally permitted to receive the product. This entire layer of infrastructure needs to already exist and be fully operational before the very first shipment physically arrives, rather than being something the importer attempts to build reactively once product is already sitting, accruing demurrage costs, at a port or airport.

It''s worth being specific about what "facility security standards" typically actually require in practice, since the phrase can sound abstract until it''s translated into concrete capital expenditure. Requirements commonly include reinforced physical storage areas, controlled and logged access systems, continuous video surveillance with a defined retention period, and often a documented security incident response protocol. Operators budgeting for licensing frequently underestimate this specific cost category, treating it as a minor compliance checkbox rather than what it often actually is, a meaningful facility build-out or retrofit project with its own procurement and installation timeline that needs to be sequenced well before a licensing inspection is scheduled.

A further practical consideration involves how importers should structure their commercial agreements with downstream buyers to reflect genuine permit-related uncertainty, rather than committing to fixed delivery dates before the relevant permit is actually confirmed. Building explicit conditionality into early-stage commercial agreements, such as a delivery window that is only finalized once the permit is confirmed rather than fixed at the point of initial agreement, protects the importer from being contractually bound to a timeline that depends on a regulatory approval still pending and outside their direct control.', 'text'),
  ('b65b8dbd-4e12-46fe-8928-99cf520770b1', 3, 'How This Plays Out in Practice', 'A realistic, well-grounded importer onboarding timeline runs licensing as the genuine first sequential step, frequently measured in months rather than in weeks, with the necessary security infrastructure, including physical facility hardening, access control systems, and surveillance capability, typically needing to be fully built out and formally inspected before licensing approval is granted, rather than being addressable afterward once the license is already in hand. Permit acquisition for the actual first shipment then only meaningfully begins once the underlying license is genuinely active, and depends heavily, in practice, on exactly how organized and complete the supplier''s own export-side documentation already is; an importer working with a genuinely first-time, inexperienced exporter should budget meaningfully more permit-processing time into their planning than one working with an established, experienced export operation that already has a demonstrated track record of producing clean, complete documentation on a predictable schedule.

Receiving infrastructure, specifically configured for cannabis handling and frequently requiring security provisions that go meaningfully beyond what generic pharmaceutical storage facilities typically maintain, needs to be fully operational and, ideally, actually tested through a deliberate dry run exercise before the genuinely first real commercial shipment arrives, because discovering an operational gap in receiving capability only once product is already physically at the border, with demurrage charges actively accruing, creates a costly hold situation with essentially no good available options at that point.

A specific pattern worth deliberately planning around in advance: import permits are very frequently structured as supplier-specific rather than importer-specific in a more general sense, meaning that establishing a relationship with a new supplier, even for an importer who already holds an active underlying license and even for a product category the importer has successfully imported before from a different supplier, generally restarts the permit acquisition clock from the beginning rather than allowing the new relationship to simply inherit or extend an existing approved pathway.

A related practical consideration involves staffing the designated responsible personnel role itself. Many licensing frameworks require this individual to meet specific competency or background requirements, and operators sometimes identify a suitable internal candidate only after the broader license application is already substantially underway, creating an avoidable delay. Identifying and, where necessary, beginning any required training or vetting for this role at the very start of the licensing process, rather than partway through, removes one entirely foreseeable source of delay.

It''s also worth building internal awareness of how permit renewal, as distinct from initial permit issuance, works within a given jurisdiction, since permits are sometimes time-limited or shipment-limited even for an established, ongoing supplier relationship, requiring periodic renewal rather than functioning as a one-time approval covering an indefinite ongoing relationship. An importer who successfully completes an initial permit process but doesn''t track the renewal requirement risks a compliance gap opening on a previously smooth-running supply relationship simply because the original permit''s validity window quietly lapsed.

There is also a useful distinction worth drawing between an importer''s first-ever shipment under a brand new license, and a subsequent shipment once the underlying operational rhythm is established. The very first shipment under a new license tends to surface friction in every part of the process simultaneously, since the licensing authority, the importer''s own staff, and often the supplier as well are all navigating the relationship for the first time, whereas later shipments benefit from accumulated institutional familiarity on all sides. Importers should explicitly expect, and budget for, a meaningfully longer and more friction-prone first transaction than the steady-state pace they reasonably anticipate once the relationship matures.

A further point worth making explicit concerns financial planning around the licensing and permit timeline specifically, since many of the underlying costs, including facility build-out, designated personnel staffing, and consulting or legal support for the application itself, are incurred well before any revenue-generating shipment can actually occur. Operators who model their cash flow only from the point a license is granted, without accounting for this earlier multi-month cost-without-revenue period, frequently find themselves under more financial pressure during the application process than their original business plan anticipated.

It''s also worth noting that the regulatory authority reviewing a license or permit application is, in most cases, a genuine counterparty in its own right, with its own workload, its own internal review cadence, and often its own informal preferences about how an application should be presented, even where those preferences aren''t explicitly documented in published guidance. Importers who treat the authority purely as a passive gatekeeper, rather than actively building a working relationship through clear communication and responsiveness to requests for additional information, sometimes find their applications move more slowly than those of competitors who''ve invested in that relationship.', 'text'),
  ('b65b8dbd-4e12-46fe-8928-99cf520770b1', 4, 'Common Pitfalls', 'The most financially expensive mistake newly licensed importers make is budgeting their overall import timeline as though it consisted of licensing time alone, without separately and explicitly accounting for shipment-specific permit processing as its own distinct timeline item layered on top. Operators who implicitly assume that simply being licensed means the next shipment can essentially ship on demand are frequently and unpleasantly surprised by permit lead times that can run anywhere from several weeks to multiple months, depending heavily on the specific route involved and the underlying documentation quality from the supplier side.

A second common and costly error is significantly underestimating just how much the overall permit timeline depends on supplier-side documentation quality and discipline, and consequently failing to actually qualify prospective suppliers on their documentation track record specifically, rather than purely on product quality and pricing, before committing to a fixed delivery schedule with a buyer further downstream in the commercial chain.

Receiving infrastructure gaps are also very routinely discovered at precisely the worst possible point in the process, namely only once the first shipment is already genuinely inbound and in transit, because the necessary infrastructure build-out work was deliberately or implicitly deprioritized relative to the licensing and permit workstreams, on the mistaken assumption that it could simply happen in parallel without requiring dedicated focus and resources of its own.

Finally, newly licensed importers very often don''t fully appreciate that permits are typically structured on a supplier-specific basis, and consequently mistakenly assume that an existing, previously approved import pathway established for one supplier will transfer or extend automatically to cover a new supplier of essentially the same general product category, leading in practice to a firm shipment commitment being made to a downstream buyer before the necessary new permit for the new supplier relationship is actually confirmed in hand.

Worth flagging as a separate, related pitfall: operators sometimes treat permit acquisition as something the importer alone controls and drives, when in genuine practice it functions more like a relay between exporter and importer, with each party responsible for a distinct portion of the documentation and each capable of independently stalling the process. A permit application that stalls due to missing supplier-side documentation looks, from the importer''s perspective, identical to a permit application stalling due to importer-side error, but the appropriate response, and the party who needs to act, is entirely different depending on which side actually caused the delay, which is why maintaining clear visibility into exactly where in the process a given application currently sits matters operationally.

Importers should also consider building a documented contingency plan for what happens if a permit application is ultimately denied, or significantly delayed beyond what the commercial relationship can reasonably absorb, since treating permit approval as a foregone conclusion throughout the process, rather than as a genuine outcome still subject to denial or modification, leaves the importer without a clear next step if the application doesn''t proceed as expected.', 'text');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624033036','seed_education_sections_07','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624033036_seed_education_sections_07.sql

-- RECOVERY BEGIN 20260624122340_enterprise_and_pi_metrics_rpcs.sql

CREATE OR REPLACE FUNCTION get_enterprise_dashboard_metrics()
RETURNS TABLE (
  id       text,
  category text,
  label    text,
  value    numeric,
  unit     text,
  trend    text,
  target   numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 'ecosystem_coverage'::text, 'ecosystem_coverage'::text, 'Operators in network'::text,        COUNT(*)::numeric, 'operators'::text,  'up'::text,     100::numeric FROM cannabis_operators
  UNION ALL
  SELECT 'market_coverage',          'market_coverage',          'Markets with operators',              COUNT(DISTINCT country_iso2)::numeric, 'markets', 'up', 60 FROM operator_countries
  UNION ALL
  SELECT 'active_listings',          'deal_velocity',            'Approved marketplace listings',       COUNT(*)::numeric, 'listings',         'stable',       200 FROM listings WHERE status = 'approved'
  UNION ALL
  SELECT 'pending_review',           'operator_workload',        'Candidates pending review',           COUNT(*)::numeric, 'candidates',       'stable',       50  FROM marketplace_candidates WHERE status = 'pending_review'
  UNION ALL
  SELECT 'recent_signals',           'source_freshness',         'Signals ingested (30 days)',          COUNT(*)::numeric, 'signals',          'up',           500 FROM signals WHERE created_at > NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT 'evidence_items',           'document_readiness',       'Evidence items in vault',             COUNT(*)::numeric, 'items',            'stable',       100 FROM ia_evidence_vault
  UNION ALL
  SELECT 'counterparty_count',       'network_growth',           'Counterparties tracked',              COUNT(*)::numeric, 'counterparties',   'up',           200 FROM ia_counterparties
  UNION ALL
  SELECT 'trust_scores',             'trust_reputation',         'Scored counterparties',               COUNT(*)::numeric, 'scores',           'stable',       50  FROM ia_scoring_records
  UNION ALL
  SELECT 'opportunities',            'revenue_opportunity',      'Active opportunities',                COUNT(*)::numeric, 'opportunities',    'stable',       25  FROM opportunities
  UNION ALL
  SELECT 'intro_packets',            'introduction_success',     'Approved candidates',                 COUNT(*)::numeric, 'packets',          'up',           100 FROM marketplace_candidates WHERE status IN ('approved', 'promoted')
$$;

CREATE OR REPLACE FUNCTION get_proprietary_strategic_metrics()
RETURNS TABLE (
  id          text,
  metric_type text,
  label       text,
  value       numeric,
  unit        text,
  trend       text,
  target      numeric,
  market      text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 'source_coverage'::text,   'source_coverage'::text,         'Active intelligence sources'::text,   COUNT(*)::numeric, 'sources'::text,     'up'::text,    1000::numeric, null::text FROM source_registry WHERE is_active = true
  UNION ALL
  SELECT 'counterparty_coverage',   'counterparty_coverage',         'Counterparties in network',           COUNT(*)::numeric, 'counterparties',    'up',          500,  null FROM ia_counterparties
  UNION ALL
  SELECT 'signal_total',            'intelligence_freshness',        'Total signals ingested',              COUNT(*)::numeric, 'signals',           'up',          5000, null FROM signals
  UNION ALL
  SELECT 'scoring_records',         'relationship_strength',         'Counterparties scored',               COUNT(*)::numeric, 'records',           'stable',      200,  null FROM ia_scoring_records
  UNION ALL
  SELECT 'evidence_vault',          'documentation_readiness',       'Evidence items in vault',             COUNT(*)::numeric, 'items',             'stable',      500,  null FROM ia_evidence_vault
  UNION ALL
  SELECT 'agent_tasks',             'automation_throughput',         'AI agent tasks',                      COUNT(*)::numeric, 'tasks',             'stable',      1000, null FROM ia_agent_tasks
  UNION ALL
  SELECT 'feedback_events',         'response_rate',                 'Reinforcement events logged',         COUNT(*)::numeric, 'events',            'stable',      500,  null FROM ia_feedback_events
  UNION ALL
  SELECT 'market_metrics_count',    'market_coverage',               'Market metrics tracked',              COUNT(*)::numeric, 'metrics',           'up',          200,  null FROM market_metrics
  UNION ALL
  SELECT 'ia_signals_count',        'deal_velocity',                 'IA signal candidates',                COUNT(*)::numeric, 'candidates',        'up',          1000, null FROM ia_signals
  UNION ALL
  SELECT 'source_snapshots_count',  'intelligence_freshness',        'Source snapshots captured',           COUNT(*)::numeric, 'snapshots',         'up',          10000,null FROM source_snapshots
$$;

CREATE OR REPLACE FUNCTION get_proprietary_datasets()
RETURNS TABLE (
  id                  text,
  name                text,
  category            text,
  record_count        bigint,
  freshness_days      int,
  coverage_markets    text[],
  coverage_categories text[],
  last_updated        timestamptz,
  completeness_pct    int,
  status              text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count bigint;
  v_ts    timestamptz;
BEGIN
  SELECT COUNT(*), MAX(c.updated_at) INTO v_count, v_ts FROM ia_counterparties c;
  id := 'counterparty_network'; name := 'Counterparty Network'; category := 'counterparty';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT m FROM ia_counterparties cx, unnest(cx.markets) t(m) LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT m FROM ia_counterparties cx, unnest(cx.categories) t(m) LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 90 WHEN v_count > 10 THEN 65 ELSE 40 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(s.created_at) INTO v_count, v_ts FROM signals s;
  id := 'intelligence_signals'; name := 'Intelligence Signals Feed'; category := 'signals';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT sx.country FROM signals sx WHERE sx.country IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT sx.cat    FROM signals sx WHERE sx.cat    IS NOT NULL LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 500 THEN 85 WHEN v_count > 100 THEN 65 ELSE 40 END;
  status := CASE WHEN v_count > 500 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(sr.updated_at) INTO v_count, v_ts FROM source_registry sr;
  id := 'source_registry_ds'; name := 'Intelligence Source Registry'; category := 'source_reliability';
  record_count := v_count; freshness_days := 0;
  coverage_markets    := ARRAY(SELECT DISTINCT srx.country     FROM source_registry srx WHERE srx.country     IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY(SELECT DISTINCT srx.source_type FROM source_registry srx WHERE srx.source_type IS NOT NULL LIMIT 10);
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 500 THEN 90 WHEN v_count > 100 THEN 70 ELSE 50 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(l.created_at) INTO v_count, v_ts FROM listings l;
  id := 'marketplace_listings'; name := 'Marketplace Supply & Demand'; category := 'seller_supply';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT lx.location_country FROM listings lx WHERE lx.location_country IS NOT NULL LIMIT 10);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 100 THEN 80 WHEN v_count > 20 THEN 60 ELSE 35 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(ev.created_at) INTO v_count, v_ts FROM ia_evidence_vault ev;
  id := 'evidence_vault_ds'; name := 'Evidence & Document Vault'; category := 'documentation';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets := ARRAY[]::text[]; coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 100 THEN 80 WHEN v_count > 10 THEN 55 ELSE 30 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(sc.created_at) INTO v_count, v_ts FROM ia_scoring_records sc;
  id := 'scoring_records_ds'; name := 'Counterparty Scoring Records'; category := 'relationship_memory';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT m FROM ia_scoring_records scx, unnest(scx.market_access_relevance) t(m) LIMIT 10);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 85 WHEN v_count > 10 THEN 60 ELSE 35 END;
  status := CASE WHEN v_count > 50 THEN 'active' WHEN v_count > 0 THEN 'building' ELSE 'gap' END;
  RETURN NEXT;

  SELECT COUNT(*), MAX(mm.created_at) INTO v_count, v_ts FROM market_metrics mm;
  id := 'market_pathways_ds'; name := 'Market Pathway Intelligence'; category := 'market_pathway';
  record_count := v_count; freshness_days := GREATEST(0, EXTRACT(DAY FROM NOW() - v_ts)::int);
  coverage_markets    := ARRAY(SELECT DISTINCT co.country_iso2 FROM countries co WHERE co.country_iso2 IS NOT NULL LIMIT 20);
  coverage_categories := ARRAY[]::text[];
  last_updated := v_ts;
  completeness_pct := CASE WHEN v_count > 50 THEN 80 WHEN v_count > 0 THEN 50 ELSE 20 END;
  status := CASE WHEN v_count > 0 THEN 'active' ELSE 'gap' END;
  RETURN NEXT;
END;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624122340','enterprise_and_pi_metrics_rpcs','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624122340_enterprise_and_pi_metrics_rpcs.sql

-- RECOVERY BEGIN 20260624170206_drop_duplicate_unique_constraint_hv_public_feed.sql
-- hv_public_feed historically had two separate UNIQUE constraints on artifact_id
-- (hv_public_feed_artifact_id_key and hv_public_feed_artifact_unique),
-- flagged by Supabase performance advisor as duplicate indexes.
--
-- Production removed the explicitly named duplicate and retains
-- hv_public_feed_artifact_id_key. Zero-state replay foundations already create
-- only that canonical constraint, so the cleanup must be state-aware.
alter table public.hv_public_feed
  drop constraint if exists hv_public_feed_artifact_unique;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624170206','drop_duplicate_unique_constraint_hv_public_feed','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624170206_drop_duplicate_unique_constraint_hv_public_feed.sql

-- RECOVERY BEGIN 20260624171409_restore_hv_evidence_documents_foundation.sql
-- Replay-safe restoration of the production hv_evidence_documents, hv_claims,
-- hv_facilities and hv_licences foundations.
--
-- The production relations and their access helpers predate their first
-- recorded migration-ledger reference (20260624171410), but no registered
-- migration owns their creation. Keep later migrations responsible for the
-- foreign-key covering indexes, API view exposure, authenticated SELECT grant,
-- anon-view tightening, and FORCE ROW LEVEL SECURITY.

-- Restore the two production access helpers only when the environment does not
-- already provide them. Existing production definitions therefore remain
-- untouched when this reconciliation migration is eventually applied.
do $restore_hv_evidence_helpers$
begin
  if to_regprocedure('public.hv_is_org_member(uuid)') is null then
    execute $create_function$
      create function public.hv_is_org_member(p_org_id uuid)
      returns boolean
      language sql
      stable
      security definer
      set search_path to public
      as $function$
        select exists (
          select 1
          from public.workspace_members
          where workspace_id = p_org_id
            and user_id = auth.uid()
            and status = 'active'
        );
      $function$
    $create_function$;
  end if;

  if to_regprocedure('public.hv_is_platform_staff()') is null then
    execute $create_function$
      create function public.hv_is_platform_staff()
      returns boolean
      language sql
      stable
      security definer
      set search_path to public
      as $function$
        select exists (
          select 1
          from public.user_roles
          where user_id = auth.uid()
            and role in ('admin', 'super_admin', 'compliance_reviewer')
        );
      $function$
    $create_function$;
  end if;
end
$restore_hv_evidence_helpers$;

create table if not exists public.hv_evidence_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.workspaces(id) on delete cascade,
  document_type text not null,
  display_name text not null,
  storage_path text not null,
  file_hash text,
  file_size_bytes bigint,
  mime_type text,
  uploaded_by uuid references auth.users(id),
  verification_status text not null default 'unverified',
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  expiry_date date,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  constraint hv_evidence_documents_type_check check (
    document_type in (
      'licence',
      'gmp_certificate',
      'gacp_certificate',
      'insurance',
      'export_permit',
      'import_permit',
      'lab_accreditation',
      'financial_reference',
      'coa',
      'recall_notice',
      'iso_certificate',
      'coa_supporting',
      'other'
    )
  ),
  constraint hv_evidence_documents_vstatus_check check (
    verification_status in ('unverified', 'pending', 'verified', 'rejected', 'expired')
  )
);

create index if not exists idx_hv_evidence_org_type
  on public.hv_evidence_documents (org_id, document_type, verification_status);

create index if not exists idx_hv_evidence_expiry
  on public.hv_evidence_documents (expiry_date)
  where expiry_date is not null;

alter table public.hv_evidence_documents enable row level security;

-- Match the live production client-role grant surface. The policies below deny
-- unauthenticated access because both helper predicates resolve false without
-- an authenticated user. Later hardening remains responsible for API-view
-- exposure and SECURITY DEFINER execution grants.
grant select, insert, update, delete
  on table public.hv_evidence_documents
  to anon, authenticated;
grant all privileges
  on table public.hv_evidence_documents
  to service_role;

do $restore_hv_evidence_policies$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_evidence_documents'::regclass
      and polname = 'hv_evidence_org_member_insert'
  ) then
    execute $policy$
      create policy hv_evidence_org_member_insert
        on public.hv_evidence_documents
        as permissive
        for insert
        to public
        with check (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_evidence_documents'::regclass
      and polname = 'hv_evidence_org_member_select'
  ) then
    execute $policy$
      create policy hv_evidence_org_member_select
        on public.hv_evidence_documents
        as permissive
        for select
        to public
        using (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_evidence_documents'::regclass
      and polname = 'hv_evidence_staff_all'
  ) then
    execute $policy$
      create policy hv_evidence_staff_all
        on public.hv_evidence_documents
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;
end
$restore_hv_evidence_policies$;

do $restore_hv_evidence_comment$
begin
  if obj_description('public.hv_evidence_documents'::regclass, 'pg_class') is null then
    execute $comment$
      comment on table public.hv_evidence_documents is
        'Private document vault. storage_path NEVER in API responses. Signed URLs via Edge Function only.'
    $comment$;
  end if;
end
$restore_hv_evidence_comment$;

-- public.hv_claims and public.hv_claim_reviews share this reconciliation slot.
-- They are the same defect: both exist in production, both are referenced for
-- the first time by ledger version 20260624171410 (the covering-index
-- migration indexes hv_claims.evidence_document_id, hv_claim_reviews.claim_id
-- and hv_claim_reviews.reviewed_by), and no registered migration owns their
-- creation. hv_claims carries a foreign key into hv_evidence_documents, so it
-- has to be restored after the block above and before 20260624171410, and
-- scripts/check-migration-filenames.mjs pins migration versions to exactly
-- fourteen digits — there is no free second between the two. Restoring them
-- here keeps the recorded chronology instead of inventing a later timestamp.
--
-- Later migrations stay the owners of everything they already own: the three
-- foreign-key covering indexes belong to 20260624171410, the api.hv_claims
-- view to 20260711012305, and the security-invoker hardening with its
-- companion authenticated grant to 20260711160935.

create table if not exists public.hv_claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.workspaces(id) on delete cascade,
  claim_type text not null,
  claim_text text not null,
  evidence_document_id uuid references public.hv_evidence_documents(id),
  status text not null default 'unreviewed',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hv_claims_type_check check (
    claim_type in (
      'gmp',
      'gacp',
      'organic',
      'export_ready',
      'iso_certified',
      'pesticide_free',
      'solvent_free',
      'heavy_metal_compliant',
      'pharmaceutical_grade',
      'other'
    )
  ),
  constraint hv_claims_status_check check (
    status in ('unreviewed', 'supported', 'unsupported', 'contested', 'withdrawn')
  )
);

create table if not exists public.hv_claim_reviews (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.hv_claims(id) on delete cascade,
  reviewed_by uuid not null references auth.users(id),
  verdict text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint hv_claim_reviews_verdict_check check (
    verdict in (
      'supported',
      'unsupported',
      'contested',
      'insufficient_evidence',
      'deferred'
    )
  )
);

-- idx_hv_claims_org_status also covers the org_id foreign key, which is why
-- production has no separate idx_hv_claims_org_id from 20260624171410.
create index if not exists idx_hv_claims_org_status
  on public.hv_claims (org_id, status);

create index if not exists idx_hv_claims_public
  on public.hv_claims (org_id, is_public)
  where status = 'supported' and is_public = true;

alter table public.hv_claims enable row level security;
alter table public.hv_claim_reviews enable row level security;

-- Same client-role grant surface as hv_evidence_documents above, and safe for
-- the same reason: both policy sets resolve false without an authenticated
-- user, so the anon grant reaches no rows.
grant select, insert, update, delete
  on table public.hv_claims
  to anon, authenticated;
grant all privileges
  on table public.hv_claims
  to service_role;

grant select, insert, update, delete
  on table public.hv_claim_reviews
  to anon, authenticated;
grant all privileges
  on table public.hv_claim_reviews
  to service_role;

do $restore_hv_claims_policies$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claims'::regclass
      and polname = 'hv_claims_org_member_insert'
  ) then
    execute $policy$
      create policy hv_claims_org_member_insert
        on public.hv_claims
        as permissive
        for insert
        to public
        with check (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claims'::regclass
      and polname = 'hv_claims_org_member_select'
  ) then
    execute $policy$
      create policy hv_claims_org_member_select
        on public.hv_claims
        as permissive
        for select
        to public
        using (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claims'::regclass
      and polname = 'hv_claims_org_member_update'
  ) then
    execute $policy$
      create policy hv_claims_org_member_update
        on public.hv_claims
        as permissive
        for update
        to public
        using (public.hv_is_org_member(org_id))
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claims'::regclass
      and polname = 'hv_claims_staff_all'
  ) then
    execute $policy$
      create policy hv_claims_staff_all
        on public.hv_claims
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claim_reviews'::regclass
      and polname = 'hv_claim_reviews_org_read_verdict'
  ) then
    execute $policy$
      create policy hv_claim_reviews_org_read_verdict
        on public.hv_claim_reviews
        as permissive
        for select
        to public
        using (
          claim_id in (
            select hv_claims.id
            from public.hv_claims
            where public.hv_is_org_member(hv_claims.org_id)
          )
        )
    $policy$;
  end if;

  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.hv_claim_reviews'::regclass
      and polname = 'hv_claim_reviews_staff_all'
  ) then
    execute $policy$
      create policy hv_claim_reviews_staff_all
        on public.hv_claim_reviews
        as permissive
        for all
        to public
        using (public.hv_is_platform_staff())
    $policy$;
  end if;
end
$restore_hv_claims_policies$;

do $restore_hv_claims_comments$
begin
  if col_description('public.hv_claims'::regclass, (
    select attnum
    from pg_attribute
    where attrelid = 'public.hv_claims'::regclass
      and attname = 'is_public'
  )) is null then
    execute $comment$
      comment on column public.hv_claims.is_public is
        'Only status=supported AND is_public=true claims appear in PublicPassportSummaryDTO'
    $comment$;
  end if;

  if obj_description('public.hv_claim_reviews'::regclass, 'pg_class') is null then
    execute $comment$
      comment on table public.hv_claim_reviews is
        'Reviewer verdicts on org claims. Notes are PRIVATE — never in org-facing DTOs.'
    $comment$;
  end if;

  if col_description('public.hv_claim_reviews'::regclass, (
    select attnum
    from pg_attribute
    where attrelid = 'public.hv_claim_reviews'::regclass
      and attname = 'notes'
  )) is null then
    execute $comment$
      comment on column public.hv_claim_reviews.notes is
        'FORBIDDEN in org-facing DTOs. Admin/reviewer only.'
    $comment$;
  end if;
end
$restore_hv_claims_comments$;

-- public.hv_facilities and public.hv_licences are the same defect again, with
-- the same evidence profile as hv_claims above: both exist in production, both
-- are first referenced by ledger version 20260624171410, no registered
-- migration creates either, and both carry a foreign key into
-- hv_evidence_documents. They belong in this slot for the same reason.
--
-- Ownership unchanged: 20260624171410 still derives
-- idx_hv_facilities_certification_evidence_id,
-- idx_hv_licences_evidence_document_id and idx_hv_licences_verified_by, and
-- 20260711010651 still creates the api views over both tables.

create table if not exists public.hv_facilities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  facility_type text not null,
  country text not null,
  region text,
  gmp_certified boolean not null default false,
  gacp_certified boolean not null default false,
  certification_evidence_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint hv_facilities_evidence_fk
    foreign key (certification_evidence_id)
    references public.hv_evidence_documents(id),
  constraint hv_facilities_type_check check (
    facility_type in (
      'cultivation',
      'processing',
      'storage',
      'lab',
      'retail',
      'distribution',
      'export_hub'
    )
  ),
  constraint hv_facilities_status_check check (
    status in ('active', 'inactive', 'under_review')
  )
);

create table if not exists public.hv_licences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.workspaces(id) on delete cascade,
  licence_number text not null,
  issuing_authority text not null,
  jurisdiction_country text not null,
  jurisdiction_region text,
  licence_type text not null,
  permitted_activities text[],
  issued_at date,
  expires_at date not null,
  status text not null default 'active',
  evidence_document_id uuid,
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hv_licences_evidence_fk
    foreign key (evidence_document_id)
    references public.hv_evidence_documents(id),
  constraint hv_licences_status_check check (
    status in (
      'active',
      'expired',
      'suspended',
      'revoked',
      'pending_renewal',
      'pending'
    )
  )
);

-- idx_hv_facilities_org and idx_hv_licences_org lead on org_id, which is why
-- production has no separate org_id covering index from 20260624171410.
create index if not exists idx_hv_facilities_org
  on public.hv_facilities (org_id);

create index if not exists idx_hv_licences_org
  on public.hv_licences (org_id);

create index if not exists idx_hv_licences_expiry
  on public.hv_licences (expires_at, status);

create index if not exists idx_hv_licences_type_status
  on public.hv_licences (licence_type, status);

alter table public.hv_facilities enable row level security;
alter table public.hv_licences enable row level security;

grant select, insert, update, delete
  on table public.hv_facilities
  to anon, authenticated;
grant all privileges
  on table public.hv_facilities
  to service_role;

grant select, insert, update, delete
  on table public.hv_licences
  to anon, authenticated;
grant all privileges
  on table public.hv_licences
  to service_role;

do $restore_hv_facilities_licences_policies$
declare
  target record;
begin
  for target in
    select unnest(array['hv_facilities', 'hv_licences']) as table_name
  loop
    if not exists (
      select 1 from pg_policy
      where polrelid = format('public.%I', target.table_name)::regclass
        and polname = target.table_name || '_org_member_insert'
    ) then
      execute format(
        'create policy %I on public.%I as permissive for insert to public '
        || 'with check (public.hv_is_org_member(org_id))',
        target.table_name || '_org_member_insert', target.table_name);
    end if;

    if not exists (
      select 1 from pg_policy
      where polrelid = format('public.%I', target.table_name)::regclass
        and polname = target.table_name || '_org_member_select'
    ) then
      execute format(
        'create policy %I on public.%I as permissive for select to public '
        || 'using (public.hv_is_org_member(org_id))',
        target.table_name || '_org_member_select', target.table_name);
    end if;

    if not exists (
      select 1 from pg_policy
      where polrelid = format('public.%I', target.table_name)::regclass
        and polname = target.table_name || '_org_member_update'
    ) then
      execute format(
        'create policy %I on public.%I as permissive for update to public '
        || 'using (public.hv_is_org_member(org_id))',
        target.table_name || '_org_member_update', target.table_name);
    end if;

    if not exists (
      select 1 from pg_policy
      where polrelid = format('public.%I', target.table_name)::regclass
        and polname = target.table_name || '_staff_all'
    ) then
      execute format(
        'create policy %I on public.%I as permissive for all to public '
        || 'using (public.hv_is_platform_staff())',
        target.table_name || '_staff_all', target.table_name);
    end if;
  end loop;
end
$restore_hv_facilities_licences_policies$;

do $restore_hv_facilities_licences_comments$
begin
  if obj_description('public.hv_facilities'::regclass, 'pg_class') is null then
    execute $comment$
      comment on table public.hv_facilities is
        'Physical facilities. Address below country level stored in settings jsonb or omitted.'
    $comment$;
  end if;

  if col_description('public.hv_facilities'::regclass, (
    select attnum from pg_attribute
    where attrelid = 'public.hv_facilities'::regclass and attname = 'country'
  )) is null then
    execute $comment$
      comment on column public.hv_facilities.country is
        'ISO 3166-1 alpha-2. Only country+region public-safe.'
    $comment$;
  end if;

  if obj_description('public.hv_licences'::regclass, 'pg_class') is null then
    execute $comment$
      comment on table public.hv_licences is
        'Regulatory licences linked to org. Verified by admin.'
    $comment$;
  end if;

  if col_description('public.hv_licences'::regclass, (
    select attnum from pg_attribute
    where attrelid = 'public.hv_licences'::regclass and attname = 'licence_number'
  )) is null then
    execute $comment$
      comment on column public.hv_licences.licence_number is
        'PRIVATE: never in public DTOs'
    $comment$;
  end if;

  if col_description('public.hv_licences'::regclass, (
    select attnum from pg_attribute
    where attrelid = 'public.hv_licences'::regclass and attname = 'verified'
  )) is null then
    execute $comment$
      comment on column public.hv_licences.verified is
        'Admin-asserted: document cross-checked'
    $comment$;
  end if;
end
$restore_hv_facilities_licences_comments$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624171409','restore_hv_evidence_documents_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624171409_restore_hv_evidence_documents_foundation.sql

-- RECOVERY BEGIN 20260624171410_add_covering_indexes_for_unindexed_foreign_keys.sql
-- Add covering indexes for single-column foreign keys in the public and
-- regulatory_signals schemas when no valid index already uses the foreign-key
-- column as its leading key.
--
-- The production migration was generated as a static 102-statement snapshot.
-- Repository zero-state history can legitimately omit production-only optional
-- relations, so replay must derive the same operation from the catalog rather
-- than assuming every historical relation exists.

do $cover_unindexed_foreign_keys$
declare
  foreign_key record;
  index_name text;
begin
  for foreign_key in
    select
      namespace.nspname as schema_name,
      relation.relname as table_name,
      attribute.attname as column_name,
      constraint_record.conrelid as relation_id,
      constraint_record.conkey[1] as column_number
    from pg_constraint constraint_record
    join pg_class relation
      on relation.oid = constraint_record.conrelid
    join pg_namespace namespace
      on namespace.oid = relation.relnamespace
    join pg_attribute attribute
      on attribute.attrelid = constraint_record.conrelid
     and attribute.attnum = constraint_record.conkey[1]
    where constraint_record.contype = 'f'
      and cardinality(constraint_record.conkey) = 1
      and namespace.nspname in ('public', 'regulatory_signals')
      and not exists (
        select 1
        from pg_index index_record
        where index_record.indrelid = constraint_record.conrelid
          and index_record.indisvalid
          and index_record.indisready
          and index_record.indnkeyatts > 0
          and index_record.indkey[0] = constraint_record.conkey[1]
      )
    order by namespace.nspname, relation.relname, attribute.attname
  loop
    index_name := format('idx_%s_%s', foreign_key.table_name, foreign_key.column_name);

    execute format(
      'create index if not exists %I on %I.%I (%I)',
      index_name,
      foreign_key.schema_name,
      foreign_key.table_name,
      foreign_key.column_name
    );
  end loop;
end
$cover_unindexed_foreign_keys$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260624171410','add_covering_indexes_for_unindexed_foreign_keys','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260624171410_add_covering_indexes_for_unindexed_foreign_keys.sql

-- RECOVERY BEGIN 20260625000000_stripe_webhook_events_and_subscription_columns.sql
-- Migration: 20260625000000_stripe_webhook_events_and_subscription_columns
-- 1. Adds columns the Stripe webhook already writes (tier, canceled_at) so
--    subscription upserts no longer fail at runtime.
-- 2. Adds a processed-events table to make webhook handling idempotent against
--    Stripe event replays / retries.
-- Run on Supabase project: zvxdgdkukjrrwamdpqrg

-- 1. Backfill missing columns on subscriptions ------------------------------
alter table public.subscriptions
  add column if not exists tier text;

alter table public.subscriptions
  add column if not exists canceled_at timestamptz;

-- 2. Idempotency ledger for Stripe webhook events ---------------------------
create table if not exists public.stripe_webhook_events (
  id           text primary key,        -- Stripe event id (evt_...)
  type         text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

-- Service role only; never exposed to clients.
drop policy if exists "Service role manages webhook events" on public.stripe_webhook_events;
create policy "Service role manages webhook events"
  on public.stripe_webhook_events for all
  using (auth.role() = 'service_role');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260625000000','stripe_webhook_events_and_subscription_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260625000000_stripe_webhook_events_and_subscription_columns.sql

-- RECOVERY BEGIN 20260625130135_remote_applied_repair.sql
-- Repair stub: migration 20260625130135 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260625130135','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260625130135_remote_applied_repair.sql

-- RECOVERY BEGIN 20260625154948_remote_applied_repair.sql
-- Repair stub: migration 20260625154948 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260625154948','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260625154948_remote_applied_repair.sql

-- RECOVERY BEGIN 20260625155714_remote_applied_repair.sql
-- Repair stub: migration 20260625155714 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260625155714','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260625155714_remote_applied_repair.sql

-- RECOVERY BEGIN 20260625165349_remote_applied_repair.sql
-- Repair stub: migration 20260625165349 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260625165349','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260625165349_remote_applied_repair.sql

-- RECOVERY BEGIN 20260625174211_remote_applied_repair.sql
-- Reconstructed from the exact production migration-ledger statement for
-- version 20260625174211 (add_regulatory_trajectory_and_coverage).
--
-- The repository previously carried only a SELECT 1 parity stub, so a zero-state
-- reset could not create hv_regulatory_trajectory / hv_entity_mentions before
-- later recorded security-policy migrations referenced them. Production already
-- records this version; this restores replay fidelity only.

-- 1. source_registry: yield-scoring column
ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS content_change_rate float DEFAULT 0.5
    CHECK (content_change_rate BETWEEN 0 AND 1);

COMMENT ON COLUMN public.source_registry.content_change_rate IS
  'Exponential-moving-average of content-changed fraction (0=never changes, 1=always changes). '
  'Updated by the crawl worker after each successful fetch. '
  'Used by the scheduler to back off low-yield sources.';

-- 2. hv_regulatory_trajectory — longitudinal trend store
CREATE TABLE IF NOT EXISTS public.hv_regulatory_trajectory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iso             text NOT NULL,
  jurisdiction    text,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  signal_count    integer NOT NULL DEFAULT 0,
  change_count    integer NOT NULL DEFAULT 0,
  sentiment_score float,
  trajectory      text CHECK (trajectory IN (
    'liberalising', 'tightening', 'stable', 'uncertain', 'no_data'
  )) DEFAULT 'no_data',
  key_themes      text[],
  summary_text    text,
  computed_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hv_regulatory_trajectory_iso_period
  ON public.hv_regulatory_trajectory (iso, period_start DESC);

ALTER TABLE public.hv_regulatory_trajectory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.hv_regulatory_trajectory
  USING (true) WITH CHECK (true);

-- 3. get_regulatory_trajectory RPC
CREATE OR REPLACE FUNCTION public.get_regulatory_trajectory(
  p_iso    text,
  p_months int DEFAULT 12
)
RETURNS SETOF public.hv_regulatory_trajectory
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM   public.hv_regulatory_trajectory
  WHERE  iso = p_iso
    AND  period_start >= (CURRENT_DATE - (p_months || ' months')::interval)::date
  ORDER BY period_start DESC;
$$;

-- 4. hv_entity_mentions
CREATE TABLE IF NOT EXISTS public.hv_entity_mentions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id     text NOT NULL REFERENCES public.ia_graph_entities(id) ON DELETE CASCADE,
  snapshot_id   uuid REFERENCES public.source_snapshots(id) ON DELETE SET NULL,
  mention_text  text,
  confidence    float CHECK (confidence BETWEEN 0 AND 1),
  iso           text,
  mentioned_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hv_entity_mentions_entity_id ON public.hv_entity_mentions (entity_id);
CREATE INDEX IF NOT EXISTS hv_entity_mentions_iso       ON public.hv_entity_mentions (iso);

ALTER TABLE public.hv_entity_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.hv_entity_mentions
  USING (true) WITH CHECK (true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260625174211','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260625174211_remote_applied_repair.sql

-- RECOVERY BEGIN 20260625205825_remote_applied_repair.sql
-- Repair stub: migration 20260625205825 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260625205825','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260625205825_remote_applied_repair.sql

-- RECOVERY BEGIN 20260625205911_remote_applied_repair.sql
-- Repair stub: migration 20260625205911 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260625205911','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260625205911_remote_applied_repair.sql

-- RECOVERY BEGIN 20260626102903_remote_applied_repair.sql
-- Repair stub: migration 20260626102903 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626102903','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626102903_remote_applied_repair.sql

-- RECOVERY BEGIN 20260626110922_reconcile_regulatory_signals_signals_columns.sql
-- Replay-safe reconciliation of the regulatory_signals.signals column contract.
--
-- Two migrations read this table by an explicit forty-three column list taken
-- from the live shape: 20260626110925, which creates
-- api."regulatory_signals.signals", and 20260713223057, which replaces it.
-- Zero-state replay fails at the earlier of the two with:
-- column "raw_excerpt" does not exist.
--
-- This therefore sits immediately before 20260626110925, the earliest
-- consumer, rather than next to the later one.
--
-- Cause: production and this repository build two different shapes of the same
-- table. 20260312000000_regulatory_signals_v1.sql creates
-- regulatory_signals.signals with "create table if not exists", and in
-- production the relation already existed out of band, so that creator was a
-- no-op there and production kept its own column set. No migration anywhere in
-- the ledger adds the seven columns below; they only ever appear in the two
-- view migrations that read them.
--
-- Comparing the two shapes at this point in history: thirty-six columns are
-- shared, seven exist only in production (added here), and seven exist only in
-- the repository (captured_at, compliance_relevance, expires_at,
-- next_review_due_at, primary_evidence_id, rejection_reason,
-- uncertainty_note). The repository-only columns are left alone -- they are
-- additive, nothing in the recorded history drops them, and the api view does
-- not select them.
--
-- Every statement is "if not exists" so this is a no-op against production and
-- against any environment that already reconciled.

alter table regulatory_signals.signals
  add column if not exists raw_excerpt text,
  add column if not exists internal_only boolean not null default true,
  add column if not exists requires_diligence boolean not null default false,
  add column if not exists linked_country_slug text,
  add column if not exists linked_product_category text,
  add column if not exists reviewer_id uuid,
  add column if not exists reviewed_at timestamptz;

-- Matches the live signals_reviewer_id_fkey.
do $reconcile_signals_reviewer_fk$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'regulatory_signals.signals'::regclass
      and conname = 'signals_reviewer_id_fkey'
  ) then
    alter table regulatory_signals.signals
      add constraint signals_reviewer_id_fkey
      foreign key (reviewer_id) references auth.users(id) on delete set null;
  end if;
end
$reconcile_signals_reviewer_fk$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626110922','reconcile_regulatory_signals_signals_columns','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626110922_reconcile_regulatory_signals_signals_columns.sql

-- RECOVERY BEGIN 20260626110923_restore_api_schema_foundation.sql
-- Replay-safe restoration of the api schema itself.
--
-- No recorded migration anywhere in the production ledger creates schema api;
-- it was created out of band, like the relations restored elsewhere in this
-- series. The repository only creates it in
-- 20260629210000_expose_cc_jurisdiction_briefings_api_schema.sql, but the
-- first migration that needs it is 20260626110925, three days earlier, so
-- zero-state replay fails there with schema "api" does not exist.
--
-- The three statements below are exactly the ones 20260629210000 already
-- uses. That migration keeps them, and because all three are idempotent it
-- simply becomes a no-op once this has run.
--
-- Matches the live schema: owner postgres, no privileges for PUBLIC, USAGE for
-- anon, authenticated and service_role.

create schema if not exists api authorization postgres;
revoke create on schema api from public;
grant usage on schema api to anon, authenticated, service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626110923','restore_api_schema_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626110923_restore_api_schema_foundation.sql

-- RECOVERY BEGIN 20260626110924_restore_supplier_profiles_foundation.sql
-- Replay-safe restoration of the production supplier_profiles foundation.
--
-- public.supplier_profiles exists in production but no registered migration
-- creates it. Its first recorded ledger reference is 20260626110925, the
-- api-schema admin views migration that proxies it, so it is restored in the
-- slot immediately before that one.
--
-- The table depends on four enum types that zero-state replay does not have
-- here yet: seller_type and listing_status have no creator anywhere in the
-- repository, and region and marketplace_category are only created later, by
-- 20260630233905. They are created below using the same guarded
-- to_regtype pattern that 20260630233905 already uses, with labels taken from
-- production. The region and marketplace_category label sets match that
-- migration's expected_labels arrays exactly, so its contract assertion still
-- passes and its own creation becomes a no-op.
--
-- Ownership left with later migrations: 20260707185511 owns the anon INSERT
-- grant, which is why it is absent below even though production has it.

do $restore_supplier_profile_enums$
begin
  if to_regtype('public.seller_type') is null then
    create type public.seller_type as enum (
      'licensed_producer',
      'distributor',
      'wholesaler',
      'retailer',
      'investor',
      'other'
    );
  end if;

  if to_regtype('public.listing_status') is null then
    create type public.listing_status as enum (
      'pending_review',
      'approved',
      'rejected',
      'archived'
    );
  end if;

  if to_regtype('public.region') is null then
    create type public.region as enum (
      'north_america',
      'europe',
      'asia_pacific',
      'latin_america',
      'middle_east_africa',
      'global'
    );
  end if;

  if to_regtype('public.marketplace_category') is null then
    create type public.marketplace_category as enum (
      'new_products',
      'used_surplus',
      'cannabis_inventory',
      'wanted_requests',
      'services',
      'business_opportunities',
      'supplier_directory',
      'cultivation_equipment',
      'export_ready',
      'import_demand',
      'consumables',
      'distressed_inventory',
      'distressed_businesses',
      'genetics',
      'professional_services',
      'labs_testing',
      'logistics',
      'packaging',
      'processing_equipment'
    );
  end if;
end
$restore_supplier_profile_enums$;

create table if not exists public.supplier_profiles (
  id uuid primary key default uuid_generate_v4(),
  seller_type public.seller_type not null,
  region public.region not null,
  categories public.marketplace_category[] not null default '{}'::public.marketplace_category[],
  description text not null,
  capabilities jsonb not null default '{}'::jsonb,
  status public.listing_status not null default 'pending_review'::public.listing_status,
  company_name text,
  internal_notes text,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_supplier_profiles_region
  on public.supplier_profiles (region);

create index if not exists idx_supplier_profiles_status
  on public.supplier_profiles (status);

alter table public.supplier_profiles enable row level security;

-- anon INSERT is deliberately omitted: 20260707185511 owns that grant.
grant select, update, delete
  on table public.supplier_profiles
  to anon;
grant select, insert, update, delete
  on table public.supplier_profiles
  to authenticated;
grant all privileges
  on table public.supplier_profiles
  to service_role;

do $restore_supplier_profile_policies$
begin
  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.supplier_profiles'::regclass
      and polname = 'supplier_profiles_public_read'
  ) then
    execute $policy$
      create policy supplier_profiles_public_read
        on public.supplier_profiles
        as permissive
        for select
        to anon, authenticated
        using (status = 'approved'::public.listing_status)
    $policy$;
  end if;

  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.supplier_profiles'::regclass
      and polname = 'supplier_profiles_anon_insert'
  ) then
    execute $policy$
      create policy supplier_profiles_anon_insert
        on public.supplier_profiles
        as permissive
        for insert
        to anon
        with check (
          status = 'pending_review'::public.listing_status
          and length(trim(both from description)) > 0
          and length(description) <= 5000
          and (
            contact_email is null
            or (
              length(trim(both from contact_email)) > 0
              and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
              and length(contact_email) <= 254
            )
          )
          and (contact_name is null or length(trim(both from contact_name)) > 0)
          and (company_name is null or length(trim(both from company_name)) > 0)
          and internal_notes is null
          and archived_at is null
        )
    $policy$;
  end if;
end
$restore_supplier_profile_policies$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626110924','restore_supplier_profiles_foundation','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626110924_restore_supplier_profiles_foundation.sql

-- RECOVERY BEGIN 20260626110925_remote_applied_repair.sql
-- Restore the exact production-owned body for migration 20260626110925
-- (create_api_schema_admin_views). The previous stub omitted the api.* proxy
-- views that later migrations expect to exist, including api.source_snapshots,
-- which 20260713070355 hardens.

-- Admin panel proxy views in the api schema
-- The Supabase project exposes only the `api` schema in PostgREST.
-- All admin data fetches use SUPABASE_SERVICE_ROLE_KEY and default to the api
-- schema. These views proxy to the underlying public/regulatory_signals tables
-- so that admin queries work without requiring Accept-Profile headers or
-- PostgREST config changes.

-- ── Public schema: marketplace ────────────────────────────────────────────
CREATE OR REPLACE VIEW api.marketplace_candidates AS
  SELECT * FROM public.marketplace_candidates;

CREATE OR REPLACE VIEW api.marketplace_inquiries AS
  SELECT * FROM public.marketplace_inquiries;

CREATE OR REPLACE VIEW api.marketplace_public_listings_v1 AS
  SELECT * FROM public.marketplace_public_listings_v1;

-- ── Public schema: signals and intelligence ───────────────────────────────
-- Second and last deviation from the recorded body, same cause as the
-- regulatory_signals.signals view below. The recorded statement is
-- "SELECT * FROM public.signals", which in production resolved to the column
-- list below. In zero-state replay public.signals carries fifty-three columns,
-- so SELECT * would produce a wider view.
--
-- 20260720200000 later issues CREATE OR REPLACE VIEW on api.signals with
-- exactly these thirty-two columns, which would require dropping twenty-one --
-- CREATE OR REPLACE cannot do that. 20260801150000 then extends the same list
-- to forty-eight; that list is an exact prefix-extension of this one, so it
-- replays as a pure append.
--
-- All thirty-two columns already exist on public.signals at this version, so
-- pinning here is safe and makes both later replaces succeed with privileges
-- preserved.
CREATE OR REPLACE VIEW api.signals AS
  SELECT
    id,
    date,
    cat,
    pri,
    score,
    headline,
    summary,
    source,
    url,
    verification,
    tier,
    lang,
    company,
    country,
    in_network,
    lane_r,
    lane_e,
    lane_t,
    top_lane,
    query_pack,
    commercial_impact,
    reviewed,
    action,
    created_at,
    embedding_1024,
    embedding_model,
    embedded_at,
    reviewed_by,
    reviewed_at,
    editorial_title,
    editorial_blurb,
    country_iso2
  FROM public.signals;

CREATE OR REPLACE VIEW api.source_registry AS
  SELECT * FROM public.source_registry;

CREATE OR REPLACE VIEW api.source_snapshots AS
  SELECT * FROM public.source_snapshots;

CREATE OR REPLACE VIEW api.ia_counterparties AS
  SELECT * FROM public.ia_counterparties;

CREATE OR REPLACE VIEW api.ia_signals AS
  SELECT * FROM public.ia_signals;

CREATE OR REPLACE VIEW api.candidate_review_events AS
  SELECT * FROM public.candidate_review_events;

-- ── Public schema: genetics / cultivar ───────────────────────────────────
CREATE OR REPLACE VIEW api.cultivar_country_opportunities AS
  SELECT * FROM public.cultivar_country_opportunities;

CREATE OR REPLACE VIEW api.cultivar_passports AS
  SELECT * FROM public.cultivar_passports;

CREATE OR REPLACE VIEW api.genetics_routing_events AS
  SELECT * FROM public.genetics_routing_events;

CREATE OR REPLACE VIEW api.genetics_routing_records AS
  SELECT * FROM public.genetics_routing_records;

-- ── Public schema: professionals and operators ────────────────────────────
CREATE OR REPLACE VIEW api.hv_professionals AS
  SELECT * FROM public.hv_professionals;

CREATE OR REPLACE VIEW api.supplier_profiles AS
  SELECT * FROM public.supplier_profiles;

CREATE OR REPLACE VIEW api.canadian_operator_conflicts AS
  SELECT * FROM public.canadian_operator_conflicts;

CREATE OR REPLACE VIEW api.canadian_operator_exclusions AS
  SELECT * FROM public.canadian_operator_exclusions;

CREATE OR REPLACE VIEW api.canadian_operator_individual_holds AS
  SELECT * FROM public.canadian_operator_individual_holds;

CREATE OR REPLACE VIEW api.canadian_operator_licence_sites AS
  SELECT * FROM public.canadian_operator_licence_sites;

CREATE OR REPLACE VIEW api.canadian_operator_outreach_queue AS
  SELECT * FROM public.canadian_operator_outreach_queue;

-- ── Regulatory signals schema: dot-notation routing ──────────────────────
-- fetchAdminSupabaseJson uses paths like /rest/v1/regulatory_signals.signals
-- PostgREST looks for a table named "regulatory_signals.signals" (with the
-- literal dot) in the api schema. These quoted-identifier views satisfy that.
-- Deviation from the recorded body, and the only one in this file. The
-- recorded statement is "SELECT * FROM regulatory_signals.signals". That is
-- column-set dependent, and production's regulatory_signals.signals is not the
-- shape this repository builds -- see
-- 20260713223056_reconcile_regulatory_signals_signals_columns.sql. In
-- production SELECT * resolved to the column list below; in zero-state replay
-- it resolves to that list plus seven repository-only columns
-- (captured_at, compliance_relevance, expires_at, next_review_due_at,
-- primary_evidence_id, rejection_reason, uncertainty_note).
--
-- 20260713223057 later issues CREATE OR REPLACE VIEW on this view with exactly
-- the explicit list below. CREATE OR REPLACE cannot remove columns, so the
-- wider replay-only shape fails there with "cannot drop columns from view".
-- Dropping and recreating the view instead is not an option: that migration
-- documents that it relies on CREATE OR REPLACE preserving the accumulated
-- privileges, which a drop would discard.
--
-- Pinning the list here makes the later replace an exact match, so it succeeds
-- and privileges are preserved. Net schema is unchanged.
CREATE OR REPLACE VIEW api."regulatory_signals.signals" AS
  SELECT
    id,
    slug,
    source_id,
    headline,
    signal_type,
    confidence,
    impact_level,
    country_code,
    country_name,
    region,
    jurisdiction,
    regulator_name,
    signal_date,
    source_tier,
    source_type,
    canonical_source_url,
    raw_excerpt,
    analyst_notes,
    public_summary,
    public_implication,
    review_status,
    public_safe,
    publish_to_public,
    internal_only,
    requires_diligence,
    commercial_relevance,
    linked_country_slug,
    linked_product_category,
    reviewer_id,
    reviewed_at,
    published_at,
    last_reviewed_at,
    created_by,
    updated_by,
    created_at,
    updated_at,
    source_url,
    source_published_at,
    private_summary,
    private_notes,
    reviewed_by,
    approved_by,
    published_by
  FROM regulatory_signals.signals;

CREATE OR REPLACE VIEW api."regulatory_signals.sources" AS
  SELECT * FROM regulatory_signals.sources;

CREATE OR REPLACE VIEW api."regulatory_signals.source_snapshots" AS
  SELECT * FROM regulatory_signals.source_snapshots;

CREATE OR REPLACE VIEW api."regulatory_signals.source_check_runs" AS
  SELECT * FROM regulatory_signals.source_check_runs;

CREATE OR REPLACE VIEW api."regulatory_signals.review_events" AS
  SELECT * FROM regulatory_signals.review_events;

CREATE OR REPLACE VIEW api."regulatory_signals.signal_evidence_links" AS
  SELECT * FROM regulatory_signals.signal_evidence_links;

CREATE OR REPLACE VIEW api."regulatory_signals.publication_events" AS
  SELECT * FROM regulatory_signals.publication_events;

CREATE OR REPLACE VIEW api."regulatory_signals.evidence" AS
  SELECT * FROM regulatory_signals.evidence;

-- ── Permissions ───────────────────────────────────────────────────────────
-- service_role is used by all admin panel queries (SUPABASE_SERVICE_ROLE_KEY)
GRANT ALL ON ALL TABLES IN SCHEMA api TO service_role;
-- authenticated gets read-only access (underlying table RLS still applies)
GRANT SELECT ON ALL TABLES IN SCHEMA api TO authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626110925','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626110925_remote_applied_repair.sql

-- RECOVERY BEGIN 20260626115010_remote_applied_repair.sql
-- Repair stub: migration 20260626115010 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626115010','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626115010_remote_applied_repair.sql

-- RECOVERY BEGIN 20260626154522_remote_applied_repair.sql
-- Repair stub: migration 20260626154522 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626154522','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626154522_remote_applied_repair.sql

-- RECOVERY BEGIN 20260626173143_remote_applied_repair.sql
-- Repair stub: migration 20260626173143 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626173143','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626173143_remote_applied_repair.sql

-- RECOVERY BEGIN 20260626173208_remote_applied_repair.sql
-- Repair stub: migration 20260626173208 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260626173208','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260626173208_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627000000_regulatory_change_tracking_and_calendar.sql
-- supabase/migrations/20260627000000_regulatory_change_tracking_and_calendar.sql
-- REWRITTEN 2026-07-01 (reconciliation): this version is registered in the prod
-- ledger; the objects below were created in prod out-of-band around Jun 27 with a
-- DIFFERENT design than this file originally described (row_id text key instead of
-- iso2+record_id). This file now mirrors prod truth exactly. It never re-applies to
-- prod (ledger-registered) and is a faithful record for fresh environments.

CREATE TABLE IF NOT EXISTS public.regulatory_field_changes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text        NOT NULL,
  row_id       text        NOT NULL,
  field_name   text        NOT NULL,
  old_value    text,
  new_value    text,
  changed_at   timestamptz NOT NULL DEFAULT now(),
  source_label text
);

CREATE INDEX IF NOT EXISTS idx_rfc_table_row_changed
  ON public.regulatory_field_changes (table_name, row_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS public.regulatory_calendar (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  iso2          text        NOT NULL,
  event_type    text        NOT NULL,
  title         text        NOT NULL,
  summary       text,
  expected_date date,
  confidence    text        NOT NULL DEFAULT 'low',
  source_url    text,
  source_label  text,
  status        text        NOT NULL DEFAULT 'upcoming',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rc_iso2_expected_date
  ON public.regulatory_calendar (iso2, expected_date ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_rc_status
  ON public.regulatory_calendar (status);

-- Change-tracking triggers (mirrors prod implementations exactly)

CREATE OR REPLACE FUNCTION public.trg_track_country_field_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE v_iso2 text := NEW.iso_alpha2; BEGIN
  IF OLD.market_access_status::text IS DISTINCT FROM NEW.market_access_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'market_access_status',OLD.market_access_status::text,NEW.market_access_status::text);
  END IF;
  IF OLD.medical_status::text IS DISTINCT FROM NEW.medical_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'medical_status',OLD.medical_status::text,NEW.medical_status::text);
  END IF;
  IF OLD.adult_use_status::text IS DISTINCT FROM NEW.adult_use_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'adult_use_status',OLD.adult_use_status::text,NEW.adult_use_status::text);
  END IF;
  IF OLD.import_status::text IS DISTINCT FROM NEW.import_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'import_status',OLD.import_status::text,NEW.import_status::text);
  END IF;
  IF OLD.export_status::text IS DISTINCT FROM NEW.export_status::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'export_status',OLD.export_status::text,NEW.export_status::text);
  END IF;
  IF OLD.opportunity_score IS DISTINCT FROM NEW.opportunity_score THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'opportunity_score',OLD.opportunity_score::text,NEW.opportunity_score::text);
  END IF;
  IF OLD.data_completeness::text IS DISTINCT FROM NEW.data_completeness::text THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'data_completeness',OLD.data_completeness::text,NEW.data_completeness::text);
  END IF;
  IF OLD.public_summary IS DISTINCT FROM NEW.public_summary THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('countries',v_iso2,'public_summary',OLD.public_summary,NEW.public_summary);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_track_briefing_field_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE v_row_id text := NEW.country_iso2 || COALESCE(':' || NEW.state_iso2, ''); BEGIN
  IF OLD.program_status IS DISTINCT FROM NEW.program_status THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'program_status',OLD.program_status,NEW.program_status);
  END IF;
  IF OLD.patient_access IS DISTINCT FROM NEW.patient_access THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'patient_access',OLD.patient_access,NEW.patient_access);
  END IF;
  IF OLD.physician_access IS DISTINCT FROM NEW.physician_access THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'physician_access',OLD.physician_access,NEW.physician_access);
  END IF;
  IF OLD.market_dynamics IS DISTINCT FROM NEW.market_dynamics THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'market_dynamics',OLD.market_dynamics,NEW.market_dynamics);
  END IF;
  IF OLD.regulatory_outlook IS DISTINCT FROM NEW.regulatory_outlook THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'regulatory_outlook',OLD.regulatory_outlook,NEW.regulatory_outlook);
  END IF;
  IF OLD.regulatory_body IS DISTINCT FROM NEW.regulatory_body THEN
    INSERT INTO public.regulatory_field_changes(table_name,row_id,field_name,old_value,new_value)
    VALUES('cc_jurisdiction_briefings',v_row_id,'regulatory_body',OLD.regulatory_body,NEW.regulatory_body);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_countries_field_changes ON public.countries;
CREATE TRIGGER trg_countries_field_changes
  AFTER UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.trg_track_country_field_changes();

DROP TRIGGER IF EXISTS trg_briefings_field_changes ON public.cc_jurisdiction_briefings;
CREATE TRIGGER trg_briefings_field_changes
  AFTER UPDATE ON public.cc_jurisdiction_briefings
  FOR EACH ROW EXECUTE FUNCTION public.trg_track_briefing_field_changes();

-- RESTORED 2026-08-05 (zero-state chronology repair, PR #1280): the two RPCs below
-- were part of the original prod migration 20260627033143 (see ledger statements in
-- supabase_migrations.schema_migrations) but were omitted from this file's Jul-01
-- reconciliation rewrite. Their absence made public.get_regulatory_calendar() not
-- exist at zero-state replay time, which broke the api-schema wrapper created later
-- by 20260710123000_expose_actively_broken_tables_api_schema.sql. Bodies below are
-- verbatim from the prod ledger (pre-search_path-hardening; that hardening is applied
-- chronologically later by the existing 20260708212112 migration, already present).

CREATE OR REPLACE FUNCTION public.get_field_changes_for_country(
  p_iso2  text,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id           uuid,
  table_name   text,
  field_name   text,
  old_value    text,
  new_value    text,
  changed_at   timestamptz,
  source_label text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, table_name, field_name, old_value, new_value, changed_at, source_label
  FROM public.regulatory_field_changes
  WHERE row_id = upper(p_iso2) OR row_id LIKE upper(p_iso2) || ':%'
  ORDER BY changed_at DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_regulatory_calendar(
  p_iso2  text DEFAULT NULL,
  p_limit int  DEFAULT 30
)
RETURNS TABLE (
  id            uuid,
  iso2          text,
  event_type    text,
  title         text,
  summary       text,
  expected_date date,
  confidence    text,
  source_url    text,
  source_label  text,
  status        text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id, iso2, event_type, title, summary, expected_date, confidence, source_url, source_label, status
  FROM public.regulatory_calendar
  WHERE (p_iso2 IS NULL OR iso2 = upper(p_iso2))
    AND status = 'upcoming'
  ORDER BY expected_date ASC NULLS LAST
  LIMIT p_limit;
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627000000','regulatory_change_tracking_and_calendar','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627000000_regulatory_change_tracking_and_calendar.sql

-- RECOVERY BEGIN 20260627031317_remote_applied_repair.sql
-- Repair stub: migration 20260627031317 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627031317','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627031317_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627033143_remote_applied_repair.sql
-- Repair stub: migration 20260627033143 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627033143','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627033143_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627124710_remote_applied_repair.sql
-- 1. Fix 40 null source_type entries (all are regulatory bodies)
UPDATE source_registry
SET source_type = 'regulator', updated_at = now()
WHERE source_type IS NULL;

-- 2. Marketplace scraper state table — tracks per-source cadence and failure streak
CREATE TABLE IF NOT EXISTS scraper_source_state (
  source_id            TEXT PRIMARY KEY,
  cadence_hours        INT  NOT NULL DEFAULT 24,
  last_run_at          TIMESTAMPTZ,
  last_success_at      TIMESTAMPTZ,
  consecutive_failures INT  NOT NULL DEFAULT 0,
  last_error           TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE scraper_source_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON scraper_source_state
  FOR ALL USING (auth.role() = 'service_role');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627124710','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627124710_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627131340_remote_applied_repair.sql
-- Repair stub: migration 20260627131340 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627131340','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627131340_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627131423_remote_applied_repair.sql
-- Repair stub: migration 20260627131423 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627131423','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627131423_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627131506_remote_applied_repair.sql
-- Repair stub: migration 20260627131506 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627131506','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627131506_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627131545_remote_applied_repair.sql
-- Repair stub: migration 20260627131545 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627131545','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627131545_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627131637_remote_applied_repair.sql
-- Repair stub: migration 20260627131637 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627131637','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627131637_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627131716_remote_applied_repair.sql
-- Repair stub: migration 20260627131716 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627131716','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627131716_remote_applied_repair.sql

-- RECOVERY BEGIN 20260627131801_remote_applied_repair.sql
-- Repair stub: migration 20260627131801 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260627131801','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260627131801_remote_applied_repair.sql

-- RECOVERY BEGIN 20260628000000_create_cc_jurisdiction_briefings_schema.sql
-- ============================================================
-- supabase/migrations/20260628000000_create_cc_jurisdiction_briefings_schema.sql
--
-- Full DDL for cc_jurisdiction_briefings.
-- Replaces the June 13 stub (20260613210556) which was a SELECT 1
-- applied directly to production; this file satisfies the migration
-- ledger with the actual schema.
--
-- Columns derived from:
--   - All seed migrations (20260621–20260623 batch inserts)
--   - lib/dashboard/dashboardLiveData.ts → getCountryIntelProfile()
--   - app/actions/getJurisdictionBriefing.ts
--   - components/globe/MarketOverviewSheet.tsx
--   - lib/command-centre/jurisdictionBriefingData.ts
--
-- RLS write policy matches 20260618190000_fix_jurisdiction_briefings_write_policy.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cc_jurisdiction_briefings (

  -- ── Identity ────────────────────────────────────────────────
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable URL slug, unique per jurisdiction.
  -- e.g. 'germany', 'ontario', 'bavaria', 'us-virgin-islands'
  jurisdiction_slug    text          NOT NULL,

  -- 'country' → sovereign nation row  (queried by all app consumers)
  -- 'state'   → subnational row (province, Bundesland, territory, overseas dept)
  jurisdiction_type    text          NOT NULL
                         CHECK (jurisdiction_type IN ('country', 'state')),

  -- ISO 3166-1 alpha-2. Always uppercase. Required on every row.
  country_iso2         text          NOT NULL,

  -- ISO 3166-2 subdivision code. NULL on country-type rows.
  -- e.g. 'CA-ON', 'DE-BY', 'AU-ACT', 'US-GU', 'FR-MQ'
  state_iso2           text          NULL,

  -- ── Program Status ──────────────────────────────────────────
  -- One-line status label shown in badges and map tooltips.
  -- e.g. 'Adult-Use Legal; Medical Legal'
  --      'Medical Legal (Limited); CBD Available'
  --      'Prohibited; Death Penalty for Trafficking'
  program_status       text          NOT NULL,

  -- ── Editorial Content ────────────────────────────────────────
  -- Full narrative country/region summary (prose, may contain markdown).
  -- Shown in MarketOverviewSheet and country detail pages.
  public_summary       text          NULL,

  -- Patient access pathway narrative.
  patient_access       text          NULL,

  -- Physician prescribing / access narrative.
  physician_access     text          NULL,

  -- Commercial and investment market dynamics.
  market_dynamics      text          NULL,

  -- Regulatory trajectory and near-term outlook.
  regulatory_outlook   text          NULL,

  -- Governing regulatory body/bodies (prose description).
  regulatory_body      text          NULL,

  -- ── Sourcing & Verification ──────────────────────────────────
  -- Source documents and data origins (comma-separated prose).
  data_source_summary  text          NULL,

  -- Recency and verification statement.
  -- e.g. 'Current as of Q2 2026; verified against ANMAT official guidance'
  verification_summary text          NULL,

  -- Review cadence: 'Annual', 'Quarterly', 'Bi-Annual', etc.
  update_cadence       text          NULL,

  -- Short coverage scope note used in admin/review tooling.
  coverage_summary     text          NULL,

  -- Date content was last manually reviewed and confirmed accurate.
  last_reviewed_date   date          NULL,

  -- ── Operational Metadata ─────────────────────────────────────
  -- Structured watch region tags. Seed default: '[]'::jsonb.
  watch_regions        jsonb         NOT NULL DEFAULT '[]'::jsonb,

  -- Structured change log entries. Seed default: '[]'::jsonb.
  change_notes         jsonb         NOT NULL DEFAULT '[]'::jsonb,

  -- Editorial workflow state gate.
  -- 'draft'     → not yet shown to authenticated users
  -- 'reviewed'  → live; returned by authenticated_read RLS policy
  -- 'published' → reserved for future explicit publish step
  -- 'archived'  → soft-deleted; excluded from all reads
  review_state         text          NOT NULL DEFAULT 'draft'
                         CHECK (review_state IN ('draft', 'reviewed', 'published', 'archived')),

  -- ── Timestamps ───────────────────────────────────────────────
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now(),

  -- ── Uniqueness ───────────────────────────────────────────────
  -- One slug per jurisdiction (used as URL key in app/countries/[slug]).
  CONSTRAINT uq_ccjb_jurisdiction_slug
    UNIQUE (jurisdiction_slug),

  -- One country-level row per ISO2. One state row per (country, state) pair.
  -- NOTE: state_iso2 is nullable; NULL values do not conflict in unique indexes,
  -- which is correct — country-type rows never set state_iso2.
  CONSTRAINT uq_ccjb_country_jurisdiction
    UNIQUE (country_iso2, jurisdiction_type, state_iso2)

);

-- ── Indexes ──────────────────────────────────────────────────────
-- Hot path: all app queries filter on (country_iso2, jurisdiction_type).
CREATE INDEX IF NOT EXISTS idx_ccjb_country_type
  ON public.cc_jurisdiction_briefings (country_iso2, jurisdiction_type);

-- Subnational lookups (Canadian provinces, German Länder, US territories, etc.)
CREATE INDEX IF NOT EXISTS idx_ccjb_state_iso2
  ON public.cc_jurisdiction_briefings (state_iso2)
  WHERE state_iso2 IS NOT NULL;

-- Admin panel: filter to rows needing review (review_state = 'draft')
CREATE INDEX IF NOT EXISTS idx_ccjb_review_state
  ON public.cc_jurisdiction_briefings (review_state);

-- ── updated_at trigger ───────────────────────────────────────────
-- Uses CREATE OR REPLACE — safe to run even if set_updated_at() already
-- exists from signal_engine, network_persistence, or other migrations.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_ccjb_updated_at
  BEFORE UPDATE ON public.cc_jurisdiction_briefings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────
ALTER TABLE public.cc_jurisdiction_briefings ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read rows where review_state = 'reviewed'.
-- Drafts, archived rows, and unpublished content are not exposed.
CREATE POLICY "authenticated_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO authenticated
  USING (review_state = 'reviewed');

-- service_role has unrestricted write access.
-- Matches the patched policy from 20260618190000_fix_jurisdiction_briefings_write_policy.sql
-- (that migration dropped the broken public-role policy; this recreates it correctly).
DROP POLICY IF EXISTS "service_write" ON public.cc_jurisdiction_briefings;
CREATE POLICY "service_write"
  ON public.cc_jurisdiction_briefings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628000000','create_cc_jurisdiction_briefings_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628000000_create_cc_jurisdiction_briefings_schema.sql

-- RECOVERY BEGIN 20260628000001_patch_cc_jurisdiction_briefings.sql
-- ============================================================
-- supabase/migrations/20260628000001_patch_cc_jurisdiction_briefings.sql
--
-- Follow-up patch to 20260628000000_create_cc_jurisdiction_briefings_schema.sql
--
-- Fixes:
--   1. 'published' review_state rows invisible to app (RLS + CHECK gap)
--   2. No anon RLS policy → server components using anon key silently get zero rows
--   3. country_iso2 no format/length enforcement → dirty lowercase/invalid data possible
--   4. confidence block has no backing columns → permanently stuck at 'pending'
--   5. ctas.fullProfileHref / changeActivityHref hardcoded null → no column to store them
--   6. Explicit slug index (unique constraint covers it but named index aids EXPLAIN ANALYZE)
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- FIX 1: review_state CHECK + RLS
--
-- Problem: CHECK allows 'published' but authenticated_read only
-- gates on review_state = 'reviewed', so any row set to 'published'
-- is silently invisible to all app queries.
--
-- Fix A: remove 'published' from the CHECK (it was never used in any
--        seed migration or app write path).
-- Fix B: update authenticated_read to cover both 'reviewed' and
--        'published' so the enum value is usable if introduced later.
-- We do both: clean CHECK + inclusive read policy.
-- ══════════════════════════════════════════════════════════════

-- Drop the original CHECK added inline in the CREATE TABLE.
-- Postgres names inline CHECK constraints after the column by default;
-- the explicit name below matches the constraint as written in migration 00000.
ALTER TABLE public.cc_jurisdiction_briefings
  DROP CONSTRAINT IF EXISTS cc_jurisdiction_briefings_review_state_check;

-- Re-add with 'published' removed — it was unused and created a footgun.
ALTER TABLE public.cc_jurisdiction_briefings
  ADD CONSTRAINT chk_ccjb_review_state
  CHECK (review_state IN ('draft', 'reviewed', 'archived'));

-- Update authenticated_read policy.
-- If a 'published' state is introduced in future it should be a separate
-- migration that re-adds it to both the CHECK and this policy together.
DROP POLICY IF EXISTS "authenticated_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "authenticated_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO authenticated
  USING (review_state = 'reviewed');


-- ══════════════════════════════════════════════════════════════
-- FIX 2: anon read policy
--
-- Problem: server-side Supabase clients initialised with the anon key
-- (e.g. Next.js Server Components that haven't exchanged a user JWT)
-- hit this table with the 'anon' role. Without a policy they get zero
-- rows and no error — a silent failure identical to the original
-- 'No regulatory briefing on file' bug.
--
-- Fix: mirror the authenticated_read policy for the anon role.
-- Only 'reviewed' rows are exposed — same gate as authenticated users.
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "anon_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "anon_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO anon
  USING (review_state = 'reviewed');


-- ══════════════════════════════════════════════════════════════
-- FIX 3: country_iso2 format constraint
--
-- Problem: column is plain text NOT NULL with no enforcement.
-- A lowercase 'gb' or 3-char code would silently miss every app
-- query (all app code calls .toUpperCase() before querying, but
-- seed scripts and direct inserts bypass that).
--
-- Fix: CHECK enforcing uppercase 2-char ISO 3166-1 alpha-2 format.
-- All 32 seed migrations use uppercase 2-char codes so this is
-- safe to add without a data migration.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.cc_jurisdiction_briefings
  ADD CONSTRAINT chk_ccjb_iso2_format
  CHECK (
    country_iso2 = upper(country_iso2)
    AND length(country_iso2) = 2
    AND country_iso2 ~ '^[A-Z]{2}$'
  );


-- ══════════════════════════════════════════════════════════════
-- FIX 4: confidence backing columns
--
-- Problem: buildLiveJurisdictionContract() returns a confidence block
-- with overall: null and all category percentages null / reviewState
-- 'pending' — hardcoded forever because no DB columns exist to store
-- confidence data.
--
-- confidence_score       numeric(5,2) — overall 0-100 score
--                        e.g. 87.50, NULL = not yet scored
--
-- confidence_categories  jsonb — array of per-category scores matching
--                        the shape expected by the contract builder:
--                        [
--                          { "label": "Regulatory",     "pct": 92, "reviewState": "reviewed" },
--                          { "label": "Market Data",    "pct": 78, "reviewState": "reviewed" },
--                          { "label": "Access Pathway", "pct": 85, "reviewState": "reviewed" },
--                          { "label": "Local Intel",    "pct": 60, "reviewState": "pending"  },
--                          { "label": "Education Content", "pct": null, "reviewState": "pending" }
--                        ]
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.cc_jurisdiction_briefings
  ADD COLUMN IF NOT EXISTS confidence_score
    numeric(5,2)
    NULL
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));

ALTER TABLE public.cc_jurisdiction_briefings
  ADD COLUMN IF NOT EXISTS confidence_categories
    jsonb
    NULL
    DEFAULT NULL;

COMMENT ON COLUMN public.cc_jurisdiction_briefings.confidence_score IS
  'Overall confidence score 0-100. NULL = not yet scored. '
  'Backs the confidence.overall field in JurisdictionRouteContract.';

COMMENT ON COLUMN public.cc_jurisdiction_briefings.confidence_categories IS
  'JSONB array of per-category confidence objects. '
  'Shape: [{label, pct, reviewState}]. '
  'Backs the confidence.categories array in JurisdictionRouteContract. '
  'NULL = use default pending stubs in buildLiveJurisdictionContract.';


-- ══════════════════════════════════════════════════════════════
-- FIX 5: CTA deep-link columns
--
-- Problem: ctas.fullProfileHref and ctas.changeActivityHref are
-- unconditionally null / available: false in buildLiveJurisdictionContract
-- because no column exists to store per-jurisdiction deep-link URLs.
--
-- full_profile_href      text — absolute or relative URL to the full
--                        country/jurisdiction profile page.
--                        e.g. '/country/germany/profile'
--
-- change_activity_href   text — URL to the change-log / activity feed
--                        for this jurisdiction.
--                        e.g. '/country/germany/activity'
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.cc_jurisdiction_briefings
  ADD COLUMN IF NOT EXISTS full_profile_href
    text
    NULL;

ALTER TABLE public.cc_jurisdiction_briefings
  ADD COLUMN IF NOT EXISTS change_activity_href
    text
    NULL;

COMMENT ON COLUMN public.cc_jurisdiction_briefings.full_profile_href IS
  'Deep-link URL for the full jurisdiction profile page. '
  'Backs ctas.fullProfileHref in JurisdictionRouteContract. '
  'NULL = CTA rendered as unavailable.';

COMMENT ON COLUMN public.cc_jurisdiction_briefings.change_activity_href IS
  'Deep-link URL for the jurisdiction change-activity feed. '
  'Backs ctas.changeActivityHref in JurisdictionRouteContract. '
  'NULL = CTA rendered as unavailable.';


-- ══════════════════════════════════════════════════════════════
-- FIX 6: explicit jurisdiction_slug index
--
-- The UNIQUE constraint on jurisdiction_slug already creates a btree
-- index, so reads are fast. This named index makes the lookup explicit
-- in EXPLAIN ANALYZE output and matches the naming convention used
-- by the other indexes on this table.
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ccjb_slug
  ON public.cc_jurisdiction_briefings (jurisdiction_slug);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628000001','patch_cc_jurisdiction_briefings','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628000001_patch_cc_jurisdiction_briefings.sql

-- RECOVERY BEGIN 20260628000500_intelligence_job_queue.sql
-- Intelligence job queue table.
-- Workers read from this table via claim_intelligence_job() RPC.
-- Connects scripts/engine/* workers to intelligence_automation_tables.

CREATE TABLE IF NOT EXISTS public.intelligence_jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type      text        NOT NULL,
  payload       jsonb       NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','in_progress','completed','failed')),
  priority      int         NOT NULL DEFAULT 5,
  attempts      int         NOT NULL DEFAULT 0,
  max_attempts  int         NOT NULL DEFAULT 3,
  worker_id     text,
  result        jsonb,
  last_error    text,
  scheduled_at  timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_jobs_claim
  ON public.intelligence_jobs (job_type, status, priority DESC, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_intelligence_jobs_status
  ON public.intelligence_jobs (status, updated_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_intelligence_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_intelligence_jobs_updated_at ON public.intelligence_jobs;
CREATE TRIGGER trg_intelligence_jobs_updated_at
  BEFORE UPDATE ON public.intelligence_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_intelligence_jobs_updated_at();

-- Atomic job claim RPC — FOR UPDATE SKIP LOCKED prevents duplicate processing
CREATE OR REPLACE FUNCTION public.claim_intelligence_job(
  p_job_type  text,
  p_worker_id text
)
RETURNS SETOF public.intelligence_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_job public.intelligence_jobs;
BEGIN
  SELECT *
    INTO v_job
    FROM public.intelligence_jobs
   WHERE job_type   = p_job_type
     AND status     = 'pending'
     AND scheduled_at <= now()
   ORDER BY priority DESC, scheduled_at ASC
   LIMIT 1
     FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.intelligence_jobs
     SET status     = 'in_progress',
         worker_id  = p_worker_id,
         started_at = now(),
         updated_at = now()
   WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN NEXT v_job;
END;
$$;

-- RLS
ALTER TABLE public.intelligence_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_jobs FORCE ROW LEVEL SECURITY;

-- Workers use service_role — no authenticated user policies needed
-- Admin users can read job status
CREATE POLICY "intelligence_jobs_admin_read"
  ON public.intelligence_jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

REVOKE ALL ON public.intelligence_jobs FROM anon;
GRANT SELECT ON public.intelligence_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_intelligence_job(text, text) TO service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628000500','intelligence_job_queue','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628000500_intelligence_job_queue.sql

-- RECOVERY BEGIN 20260628043307_remote_applied_repair.sql
-- Repair stub: migration 20260628043307 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628043307','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628043307_remote_applied_repair.sql

-- RECOVERY BEGIN 20260628043343_remote_applied_repair.sql
-- Repair stub: migration 20260628043343 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628043343','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628043343_remote_applied_repair.sql

-- RECOVERY BEGIN 20260628043422_remote_applied_repair.sql
-- Repair stub: migration 20260628043422 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628043422','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628043422_remote_applied_repair.sql

-- RECOVERY BEGIN 20260628153000_seed_australia_country_briefing.sql
-- Fix: insert missing Australia country-level briefing row
-- The MarketOverviewSheet queries jurisdiction_type='country' AND country_iso2='AU'.
-- This row was never seeded; subnational states exist but the parent country does not.

INSERT INTO cc_jurisdiction_briefings (
  jurisdiction_slug,
  jurisdiction_type,
  country_iso2,
  state_iso2,
  program_status,
  public_summary,
  patient_access,
  physician_access,
  market_dynamics,
  regulatory_outlook,
  regulatory_body,
  data_source_summary,
  verification_summary,
  update_cadence,
  coverage_summary,
  last_reviewed_date,
  watch_regions,
  change_notes,
  review_state
)
SELECT
  'australia',
  'country',
  'AU',
  NULL,
  'Medical Legal',
  'Australia operates a nationally regulated medical cannabis framework administered by the Therapeutic Goods Administration (TGA) and the Office of Drug Control (ODC). The Special Access Scheme (SAS) and Authorised Prescriber (AP) pathway enable patients to access unapproved cannabis medicines. The April 2021 SAS-B reforms were transformative — they streamlined prescriber approval, eliminated mandatory specialist referral for most products, and produced a rapid expansion of patient numbers from ~30,000 in early 2021 to over 350,000 registered patients nationally by mid-2026. Adult-use cannabis remains federally prohibited under the Criminal Code Act 1995, though the ACT territory enacted personal decriminalisation in 2020 (personal possession up to 50g, cultivation up to 2 plants). Australia is a net exporter of medical cannabis oil and dried flower, with licensed producers exporting to Germany, the UK, and New Zealand.',
  'Patients access medical cannabis through GP or specialist SAS-B approvals (most products) or through Authorised Prescriber arrangements. SAS-B approvals are now largely self-managed by practitioners via the TGA''s Electronic SAS portal. Patient registration is maintained by individual approved prescribers; there is no national patient card system. Products range from CBD isolates and THC/CBD oils to dried flower for vaporisation. Pharmacy dispensing is the standard delivery mechanism. Many patients use dedicated cannabis clinics for initial consultations; telehealth is widely used across all states and territories.',
  'Since the April 2021 SAS reforms, any Australian-registered medical practitioner (GP or specialist) may prescribe most medical cannabis products under SAS-B without prior TGA individual approval. Products on the Therapeutic Goods Register (TGR) — predominantly CBD products — require no SAS approval. High-THC products and novel formulations still require SAS-B application. Authorised Prescriber status, available to specialists treating defined patient populations, allows repeated prescribing without individual SAS applications.',
  'Australia''s medical cannabis market was valued at approximately A$750M–900M in 2025 and is growing at 25–35% annually. Approximately 180+ licensed producers, importers, and manufacturers hold ODC licences. Dominant domestic players include Little Green Pharma, Cannatrek, Cann Group, and BOD Science. International supply from Canada, the Netherlands, and Israel supplements domestic production. The dried flower segment has grown fastest since vaporisation-device availability expanded. Cost remains a significant patient access barrier: typical patient spend is A$150–400/month, largely uncovered by Medicare.',
  'The TGA continues to refine the SAS framework. A formal review of medical cannabis scheduling is underway; rescheduling THC from Schedule 8 to a lower schedule for medical products is under active policy consideration as of mid-2026. Adult-use legalisation at the federal level remains politically sensitive — the Greens advocate for it; Labor has not committed; the Coalition opposes it.',
  'Therapeutic Goods Administration (TGA); Office of Drug Control (ODC); Department of Health and Aged Care',
  'TGA SAS patient and prescriber data; ODC licensed producer, importer, and manufacturer lists; TGA Therapeutic Goods Register; ABS health survey data; KPMG/Arcview Australia market research',
  'Current as of Q2 2026; verified against TGA official guidance and ODC licence register',
  'Quarterly',
  'Full country-level briefing covering the SAS-B framework, 350,000+ patient base, A$750M–900M market, export activity, and federal adult-use policy landscape',
  DATE '2026-06-28',
  '[]'::jsonb,
  '[]'::jsonb,
  'reviewed'
WHERE NOT EXISTS (
  SELECT 1 FROM cc_jurisdiction_briefings
  WHERE country_iso2 = 'AU' AND jurisdiction_type = 'country'
);


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628153000','seed_australia_country_briefing','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628153000_seed_australia_country_briefing.sql

-- RECOVERY BEGIN 20260628154000_fix_ccjb_rls_anon_and_auth_read.sql
-- ============================================================
-- Fix: cc_jurisdiction_briefings RLS — anon + authenticated read
--
-- Root cause of "No regulatory briefing on file" for ALL countries:
--
--   1. MarketOverviewSheet.tsx fetches via anon key (direct REST).
--      The table had zero anon SELECT policy → every fetch returned [].
--
--   2. authenticated_read policy gated on review_state = 'reviewed'.
--      Seeds inserted with review_state = 'reviewed' so this was OK,
--      but any draft rows were invisible to logged-in users too.
--
-- Fix:
--   - Add anon_read policy (briefings are public intelligence data)
--   - Replace authenticated_read — remove review_state gate so all
--     non-archived rows are readable by authenticated users
--   - Keep service_role write policy untouched
-- ============================================================

-- 1. Anon read — needed by MarketOverviewSheet direct REST fetch
DROP POLICY IF EXISTS "anon_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "anon_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO anon
  USING (review_state IN ('reviewed', 'published'));

-- 2. Authenticated read — drop review_state gate, show all non-archived
DROP POLICY IF EXISTS "authenticated_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "authenticated_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO authenticated
  USING (review_state != 'archived');


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628154000','fix_ccjb_rls_anon_and_auth_read','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628154000_fix_ccjb_rls_anon_and_auth_read.sql

-- RECOVERY BEGIN 20260628155000_reconcile_ccjb_rls_final.sql
-- ============================================================
-- Reconcile cc_jurisdiction_briefings RLS — canonical final state
--
-- Migration chain so far:
--   20260628000000  CREATE TABLE — authenticated_read (review_state='reviewed' only)
--   20260628000001  patch        — re-creates authenticated_read (same narrow gate)
--                                  adds anon_read (review_state='reviewed')
--   20260628154000  our fix      — broadens authenticated_read (!=archived)
--                                  broadens anon_read (reviewed OR published)
--
-- Problem: 000001 removed 'published' from the CHECK constraint but
-- 154000 wrote an anon_read policy gating on 'published' — a value
-- the constraint no longer allows. That policy clause is harmless
-- (no row can ever have review_state='published') but it is misleading.
--
-- This migration is the canonical final state. Run after all prior
-- migrations. Safe to run multiple times (all DROP IF EXISTS).
--
-- Final rules:
--   anon        → SELECT where review_state = 'reviewed'
--   authenticated → SELECT where review_state IN ('draft','reviewed')
--                   (draft visible to logged-in users for admin preview)
--   service_role  → ALL (unchanged)
-- ============================================================

-- Anon: reviewed rows only (public intelligence, no draft leakage)
DROP POLICY IF EXISTS "anon_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "anon_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO anon
  USING (review_state = 'reviewed');

-- Authenticated: draft + reviewed (enables admin preview of draft rows)
DROP POLICY IF EXISTS "authenticated_read" ON public.cc_jurisdiction_briefings;
CREATE POLICY "authenticated_read"
  ON public.cc_jurisdiction_briefings
  FOR SELECT
  TO authenticated
  USING (review_state IN ('draft', 'reviewed'));


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628155000','reconcile_ccjb_rls_final','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628155000_reconcile_ccjb_rls_final.sql

-- RECOVERY BEGIN 20260628164054_remote_applied_repair.sql
-- Repair stub: migration 20260628164054 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628164054','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628164054_remote_applied_repair.sql

-- RECOVERY BEGIN 20260628164104_remote_applied_repair.sql
-- Repair stub: migration 20260628164104 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628164104','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628164104_remote_applied_repair.sql

-- RECOVERY BEGIN 20260628214714_remote_applied_repair.sql
-- Repair stub: migration 20260628214714 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628214714','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628214714_remote_applied_repair.sql

-- RECOVERY BEGIN 20260628230550_remote_applied_repair.sql
-- Repair stub: migration 20260628230550 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260628230550','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260628230550_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629000000_grant_anon_select_on_core_intel_tables.sql
-- Grant SELECT to anon and authenticated on the three tables used by
-- getCountryIntelProfile (REST/anon-key path) and MarketOverviewSheet.
-- RLS policies already exist with qual=true on all three tables;
-- the missing TABLE-level grants were preventing any rows from being read,
-- causing the entire dashboard to show blank/null data for all countries.

GRANT SELECT ON public.countries               TO anon, authenticated;
GRANT SELECT ON public.country_intel           TO anon, authenticated;
GRANT SELECT ON public.cc_jurisdiction_briefings TO anon, authenticated;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629000000','grant_anon_select_on_core_intel_tables','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629000000_grant_anon_select_on_core_intel_tables.sql

-- RECOVERY BEGIN 20260629015142_remote_applied_repair.sql
-- Restore the exact production-owned body for migration 20260629015142.
-- The previous local reconciliation stub omitted the enum and source-registry
-- foundations required by the immediately following discovery-table migration.

begin;

create extension if not exists pgcrypto;

create type public.source_status as enum (
  'candidate',
  'approved',
  'paused',
  'blocked',
  'retired'
);

create type public.source_kind as enum (
  'regulator',
  'ministry',
  'parliament',
  'court',
  'municipality',
  'registry',
  'dataset',
  'company',
  'exchange_filing',
  'trade_media',
  'industry_association',
  'standards_body',
  'scientific',
  'other'
);

create table public.source_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discovery_sources (
  id uuid primary key default gen_random_uuid(),
  source_group_id uuid references public.source_groups(id) on delete set null,
  status public.source_status not null default 'approved',
  kind public.source_kind not null,
  name text not null,
  canonical_url text not null unique,
  base_domain text not null,
  country_code text,
  region_code text,
  municipality_name text,
  jurisdiction_label text,
  language_codes text[] not null default '{}',
  access_method text not null default 'html',
  parser_key text,
  trust_score numeric(5,2) not null default 0,
  priority_score numeric(5,2) not null default 0,
  freshness_score numeric(5,2) not null default 0,
  commercial_relevance_score numeric(5,2) not null default 0,
  source_depth_tier integer not null default 1,
  last_seen_at timestamptz,
  last_fetched_at timestamptz,
  next_fetch_at timestamptz,
  fetch_interval_minutes integer,
  requires_auth boolean not null default false,
  is_official boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discovery_sources_source_depth_tier_check check (source_depth_tier between 1 and 5)
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  scope_type text not null,
  country_code text,
  region_code text,
  municipality_name text,
  enabled boolean not null default true,
  priority integer not null default 100,
  query_hints text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_watchlist_links (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.discovery_sources(id) on delete cascade,
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  relation_type text not null default 'monitors',
  created_at timestamptz not null default now(),
  unique (source_id, watchlist_id, relation_type)
);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629015142','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629015142_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629015153_remote_applied_repair.sql
-- Restore the exact production-owned body for migration 20260629015153.
-- The previous local reconciliation stub made zero-state replay omit all
-- three discovery tables even though the production migration ledger owns
-- their creation.

begin;

create table public.source_candidates (
  id uuid primary key default gen_random_uuid(),
  discovered_from_source_id uuid references public.discovery_sources(id) on delete set null,
  discovered_from_document_url text,
  status public.source_status not null default 'candidate',
  kind public.source_kind,
  proposed_name text,
  proposed_url text not null,
  normalized_url text,
  base_domain text,
  country_code text,
  region_code text,
  municipality_name text,
  jurisdiction_label text,
  evidence_count integer not null default 1,
  recurrence_score numeric(5,2) not null default 0,
  novelty_score numeric(5,2) not null default 0,
  authority_score numeric(5,2) not null default 0,
  parseability_score numeric(5,2) not null default 0,
  commercial_relevance_score numeric(5,2) not null default 0,
  aggregate_score numeric(5,2) not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  review_required boolean not null default true,
  rejection_reason text,
  merged_into_source_id uuid references public.discovery_sources(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proposed_url)
);

create table public.link_observations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.discovery_sources(id) on delete cascade,
  source_candidate_id uuid references public.source_candidates(id) on delete set null,
  document_url text,
  observed_url text not null,
  normalized_url text not null,
  anchor_text text,
  surrounding_text text,
  rel_flags text[] not null default '{}',
  http_hint integer,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  observation_count integer not null default 1
);

create table public.coverage_gaps (
  id uuid primary key default gen_random_uuid(),
  gap_type text not null,
  country_code text,
  region_code text,
  municipality_name text,
  entity_type text,
  label text not null,
  severity_score numeric(5,2) not null default 0,
  strategic_score numeric(5,2) not null default 0,
  discovered_reason text,
  resolved_at timestamptz,
  resolved_by_source_id uuid references public.discovery_sources(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629015153','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629015153_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629015202_remote_applied_repair.sql
-- Restore the exact production-owned body for migration 20260629015202.
-- The previous local reconciliation stub omitted the collection foundations
-- required by the immediately following intelligence-table migration.

begin;

create type public.fetch_status as enum (
  'queued',
  'claimed',
  'succeeded',
  'failed',
  'skipped',
  'dead'
);

create table public.source_fetch_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.discovery_sources(id) on delete cascade,
  priority integer not null default 100,
  scheduled_for timestamptz not null,
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  claimed_by text,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  status public.fetch_status not null default 'queued',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.source_fetch_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.discovery_sources(id) on delete cascade,
  job_id uuid references public.source_fetch_jobs(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.fetch_status not null,
  http_status integer,
  response_time_ms integer,
  content_type text,
  content_length bigint,
  content_hash text,
  etag text,
  last_modified text,
  fetched_url text,
  final_url text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.discovery_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.discovery_sources(id) on delete cascade,
  fetch_run_id uuid references public.source_fetch_runs(id) on delete set null,
  document_url text not null,
  normalized_url text not null,
  title text,
  language_code text,
  mime_type text,
  published_at timestamptz,
  observed_at timestamptz not null default now(),
  raw_storage_path text,
  extracted_text text,
  text_hash text,
  extraction_version text,
  parser_key text,
  is_changed boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629015202','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629015202_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629015212_remote_applied_repair.sql
-- Restore the exact production-owned body for migration 20260629015212.
-- The previous local reconciliation stub omitted the extracted intelligence
-- tables required by later numeric-type optimization and hardening migrations.

begin;

create table public.extracted_entities (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.discovery_documents(id) on delete cascade,
  entity_type text not null,
  canonical_name text not null,
  raw_name text not null,
  country_code text,
  region_code text,
  municipality_name text,
  confidence numeric(5,2) not null default 0,
  first_offset integer,
  last_offset integer,
  metadata jsonb not null default '{}'::jsonb
);

create table public.extracted_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.discovery_documents(id) on delete cascade,
  event_type text not null,
  event_label text not null,
  event_date timestamptz,
  country_code text,
  region_code text,
  municipality_name text,
  significance_score numeric(5,2) not null default 0,
  confidence numeric(5,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table public.extracted_citations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.discovery_documents(id) on delete cascade,
  cited_url text,
  cited_title text,
  citation_kind text,
  confidence numeric(5,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table public.extraction_contradictions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.discovery_documents(id) on delete cascade,
  subject_type text not null,
  subject_key text not null,
  field_name text not null,
  previous_value text,
  new_value text,
  contradiction_score numeric(5,2) not null default 0,
  resolution_status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

commit;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629015212','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629015212_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629015224_remote_applied_repair.sql
-- Repair stub: migration 20260629015224 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629015224','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629015224_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629015325_remote_applied_repair.sql
-- Repair stub: migration 20260629015325 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629015325','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629015325_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629091814_remote_applied_repair.sql
-- Repair stub: migration 20260629091814 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629091814','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629091814_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629202617_remote_applied_repair.sql
-- Repair stub: migration 20260629202617 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629202617','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629202617_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629202656_remote_applied_repair.sql
-- Repair stub: migration 20260629202656 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629202656','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629202656_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629202758_remote_applied_repair.sql
-- Repair stub: migration 20260629202758 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629202758','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629202758_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629202845_remote_applied_repair.sql
-- Repair stub: migration 20260629202845 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629202845','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629202845_remote_applied_repair.sql

-- RECOVERY BEGIN 20260629210000_expose_cc_jurisdiction_briefings_api_schema.sql
-- cc_jurisdiction_briefings lives in public but PostgREST is configured to
-- expose the api schema. Production recorded this version as a reconciliation
-- marker because the schema and view already existed out of band.
--
-- Restore the missing zero-state foundation without broadening write access.
create schema if not exists api authorization postgres;
revoke create on schema api from public;
grant usage on schema api to anon, authenticated, service_role;

create or replace view api.cc_jurisdiction_briefings as
select * from public.cc_jurisdiction_briefings;

revoke all on table api.cc_jurisdiction_briefings from public, anon, authenticated;
grant select on table api.cc_jurisdiction_briefings to anon, authenticated;
grant all on table api.cc_jurisdiction_briefings to service_role;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629210000','expose_cc_jurisdiction_briefings_api_schema','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629210000_expose_cc_jurisdiction_briefings_api_schema.sql

-- RECOVERY BEGIN 20260629235346_remote_applied_repair.sql
-- Repair stub: migration 20260629235346 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260629235346','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260629235346_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630084842_remote_applied_repair.sql
-- Repair stub: migration 20260630084842 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630084842','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630084842_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630084916_remote_applied_repair.sql
-- Repair stub: migration 20260630084916 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630084916','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630084916_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630084952_remote_applied_repair.sql
-- Repair stub: migration 20260630084952 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630084952','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630084952_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630085032_remote_applied_repair.sql
-- Repair stub: migration 20260630085032 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630085032','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630085032_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630085119_remote_applied_repair.sql
-- Repair stub: migration 20260630085119 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630085119','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630085119_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630085155_remote_applied_repair.sql
-- Repair stub: migration 20260630085155 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630085155','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630085155_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630085232_remote_applied_repair.sql
-- Repair stub: migration 20260630085232 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630085232','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630085232_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630085307_remote_applied_repair.sql
-- Repair stub: migration 20260630085307 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630085307','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630085307_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630085351_remote_applied_repair.sql
-- Repair stub: migration 20260630085351 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630085351','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630085351_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630100731_remote_applied_repair.sql
-- Repair stub: migration 20260630100731 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630100731','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630100731_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630111918_remote_applied_repair.sql
-- Repair stub: migration 20260630111918 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630111918','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630111918_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630184809_remote_applied_repair.sql
-- Repair stub: migration 20260630184809 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630184809','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630184809_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630184845_remote_applied_repair.sql
-- Repair stub: migration 20260630184845 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630184845','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630184845_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630184924_remote_applied_repair.sql
-- Repair stub: migration 20260630184924 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630184924','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630184924_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630185000_remote_applied_repair.sql
-- Repair stub: migration 20260630185000 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630185000','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630185000_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630185034_remote_applied_repair.sql
-- Repair stub: migration 20260630185034 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630185034','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630185034_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630185112_remote_applied_repair.sql
-- Repair stub: migration 20260630185112 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630185112','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630185112_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630185149_remote_applied_repair.sql
-- Repair stub: migration 20260630185149 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630185149','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630185149_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630185224_remote_applied_repair.sql
-- Repair stub: migration 20260630185224 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630185224','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630185224_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630233905_remote_applied_repair.sql
-- Production version 20260630233905 owns the AI match-rationale columns.
-- The marketplace matching tables existed out of band before this migration;
-- restore their exact private workflow foundation during zero-state replay, then
-- apply the production-owned rationale delta. Existing production tables and
-- data are preserved.

do $matching_enum_contracts$
declare
  enum_contract record;
  actual_labels text[];
begin
  for enum_contract in
    select *
    from (values
      ('marketplace_category', array['new_products','used_surplus','cannabis_inventory','wanted_requests','services','business_opportunities','supplier_directory','cultivation_equipment','export_ready','import_demand','consumables','distressed_inventory','distressed_businesses','genetics','professional_services','labs_testing','logistics','packaging','processing_equipment']::text[]),
      ('region', array['north_america','europe','asia_pacific','latin_america','middle_east_africa','global']::text[]),
      ('price_range', array['under_100k','100k_500k','500k_1m','1m_5m','5m_plus','negotiable']::text[]),
      ('buyer_type', array['licensed_producer','distributor','wholesaler','retailer','investor','other']::text[]),
      ('buyer_request_status', array['pending_review','approved','rejected','archived']::text[]),
      ('match_status', array['proposed','disclosure_requested','disclosure_approved','introduced','closed_won','closed_lost']::text[])
    ) as required(type_name, expected_labels)
  loop
    if to_regtype(format('public.%I', enum_contract.type_name)) is null then
      execute format(
        'create type public.%I as enum (%s)',
        enum_contract.type_name,
        (select string_agg(quote_literal(label), ',') from unnest(enum_contract.expected_labels) label)
      );
    else
      select array_agg(enum_value.enumlabel order by enum_value.enumsortorder)
      into actual_labels
      from pg_enum enum_value
      where enum_value.enumtypid = to_regtype(format('public.%I', enum_contract.type_name));

      if actual_labels is distinct from enum_contract.expected_labels then
        raise exception
          'Enum public.% contract mismatch: expected %, found %',
          enum_contract.type_name,
          enum_contract.expected_labels,
          actual_labels;
      end if;
    end if;
  end loop;
end
$matching_enum_contracts$;

create table if not exists public.buyer_requests (
  id uuid primary key default gen_random_uuid(),
  category public.marketplace_category not null,
  title text not null,
  description text not null,
  product_type text not null,
  region public.region not null,
  price_range public.price_range,
  buyer_type public.buyer_type not null,
  requirements jsonb not null default '{}'::jsonb,
  status public.buyer_request_status not null default 'pending_review',
  internal_notes text,
  contact_name text,
  contact_email text,
  contact_phone text,
  legal_entity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_buyer_requests_category
  on public.buyer_requests (category);
create index if not exists idx_buyer_requests_created_at
  on public.buyer_requests (created_at desc);
create index if not exists idx_buyer_requests_status
  on public.buyer_requests (status);

alter table public.buyer_requests enable row level security;

do $buyer_request_policies$
begin
  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.buyer_requests'::regclass
      and polname = 'buyer_requests_anon_insert'
  ) then
    create policy buyer_requests_anon_insert
      on public.buyer_requests
      for insert
      to anon, authenticated
      with check (status = 'pending_review'::public.buyer_request_status);
  end if;

  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.buyer_requests'::regclass
      and polname = 'buyer_requests_public_read'
  ) then
    create policy buyer_requests_public_read
      on public.buyer_requests
      for select
      to anon, authenticated
      using (status = 'approved'::public.buyer_request_status);
  end if;
end
$buyer_request_policies$;

revoke all on table public.buyer_requests from public, anon, authenticated;
grant select, insert on table public.buyer_requests to anon, authenticated;
grant all on table public.buyer_requests to service_role;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id),
  buyer_request_id uuid references public.buyer_requests(id),
  inquiry_id uuid references public.marketplace_inquiries(id),
  status public.match_status not null default 'proposed',
  internal_notes text,
  proposed_at timestamptz not null default now(),
  introduced_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_matches_buyer_request_id
  on public.matches (buyer_request_id);
create index if not exists idx_matches_inquiry_id
  on public.matches (inquiry_id);
create index if not exists idx_matches_listing_id
  on public.matches (listing_id);
create index if not exists idx_matches_status
  on public.matches (status);

alter table public.matches enable row level security;

do $matches_policies$
begin
  if not exists (
    select 1 from pg_policy
    where polrelid = 'public.matches'::regclass
      and polname = 'admin_operator_select'
  ) then
    create policy admin_operator_select
      on public.matches
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_roles
          where user_roles.user_id = (select auth.uid())
            and user_roles.role = any (array['admin'::text, 'operator'::text])
        )
      );
  end if;
end
$matches_policies$;

revoke all on table public.matches from public, anon, authenticated;
grant select on table public.matches to authenticated;
grant all on table public.matches to service_role;

comment on table public.matches is
  'Server-only matching workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';

alter table public.matches
  add column if not exists match_rationale text,
  add column if not exists match_rationale_model text,
  add column if not exists match_rationale_generated_at timestamptz;

comment on column public.matches.match_rationale is
  'Best-effort AI-generated explanation of why this listing/buyer_request pair was matched. Nullable; generation is capped and not guaranteed for every match.';
comment on column public.matches.match_rationale_model is
  'LLM model identifier used to generate match_rationale for provenance and auditing.';
comment on column public.matches.match_rationale_generated_at is
  'Timestamp when match_rationale was generated; null when no rationale has been generated.';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630233905','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630233905_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630233906_marketplace_disclosure_workflow_replay.sql
-- Production had the private disclosure workflow out of band before later
-- dashboard and API migrations referenced it. Zero-state replay can restore it
-- only after the canonical matching foundation at 20260630233905, because the
-- production contract requires disclosure_requests.match_id -> matches.id.
--
-- Additive and idempotent: existing reviewed workflow rows are never replaced,
-- updated, or deleted.

do $restore_disclosure_status$
declare
  actual_labels text[];
begin
  if to_regtype('public.disclosure_status') is null then
    create type public.disclosure_status as enum (
      'requested',
      'approved',
      'rejected'
    );
  else
    select array_agg(e.enumlabel order by e.enumsortorder)
      into actual_labels
    from pg_enum e
    where e.enumtypid = 'public.disclosure_status'::regtype;

    if actual_labels is distinct from array['requested','approved','rejected']::text[] then
      raise exception
        'Enum public.disclosure_status contract mismatch: expected %, found %',
        array['requested','approved','rejected']::text[],
        actual_labels;
    end if;
  end if;
end
$restore_disclosure_status$;

create table if not exists public.disclosure_requests (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id),
  requested_by text not null,
  status public.disclosure_status not null default 'requested',
  approved_at timestamptz,
  rejected_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.disclosure_requests enable row level security;

create index if not exists idx_disclosure_requests_match_id
  on public.disclosure_requests(match_id);

comment on table public.disclosure_requests is
  'Server-only disclosure workflow table. RLS intentionally has no client policies; access must go through trusted server paths.';

do $restore_disclosure_admin_policy$
begin
  if not exists (
    select 1
    from pg_policy
    where polrelid = 'public.disclosure_requests'::regclass
      and polname = 'admin_operator_select'
  ) then
    create policy admin_operator_select
      on public.disclosure_requests
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.user_roles
          where user_roles.user_id = (select auth.uid())
            and user_roles.role = any (array['admin'::text, 'operator'::text])
        )
      );
  end if;
end
$restore_disclosure_admin_policy$;

-- Match production ACLs. RLS permits only the explicit admin/operator SELECT path;
-- all client writes remain denied while service_role retains trusted workflow access.
grant select, insert, update, delete on table public.disclosure_requests
  to anon, authenticated;
grant all privileges on table public.disclosure_requests to service_role;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630233906','marketplace_disclosure_workflow_replay','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630233906_marketplace_disclosure_workflow_replay.sql

-- RECOVERY BEGIN 20260630234415_remote_applied_repair.sql
-- Repair stub: migration 20260630234415 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630234415','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630234415_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630234506_remote_applied_repair.sql
-- Repair stub: migration 20260630234506 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630234506','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630234506_remote_applied_repair.sql

-- RECOVERY BEGIN 20260630234545_remote_applied_repair.sql
-- Repair stub: migration 20260630234545 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260630234545','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260630234545_remote_applied_repair.sql

-- RECOVERY BEGIN 20260701001549_fix_api_schema_views_rls_bypass.sql
-- SECURITY FIX: API-schema views must enforce RLS as the querying role rather
-- than as their postgres owner. Production contained a static snapshot of all
-- API views and their companion underlying-table grants. Repository zero-state
-- history can omit optional production-only relations, so replay applies the
-- same grant map only where the target exists and hardens every API view that is
-- actually present.

do $api_underlying_select_grants$
declare
  grant_target record;
begin
  for grant_target in
    select *
    from (values
      ('public', 'canadian_operator_conflicts', 'authenticated'),
      ('public', 'canadian_operator_exclusions', 'authenticated'),
      ('public', 'canadian_operator_individual_holds', 'authenticated'),
      ('public', 'canadian_operator_licence_sites', 'authenticated'),
      ('public', 'canadian_operator_outreach_queue', 'authenticated'),
      ('public', 'candidate_review_events', 'authenticated'),
      ('public', 'cannabis_operators', 'authenticated'),
      ('public', 'cultivar_country_opportunities', 'authenticated'),
      ('public', 'cultivar_passports', 'authenticated'),
      ('public', 'deal_rooms', 'authenticated'),
      ('public', 'genetics_routing_events', 'authenticated'),
      ('public', 'genetics_routing_records', 'authenticated'),
      ('public', 'hv_import_staging', 'authenticated'),
      ('public', 'hv_professionals', 'anon'),
      ('public', 'hv_professionals', 'authenticated'),
      ('public', 'hv_public_feed', 'anon'),
      ('public', 'hv_public_feed', 'authenticated'),
      ('public', 'ia_agent_tasks', 'authenticated'),
      ('public', 'ia_counterparties', 'authenticated'),
      ('public', 'ia_evidence_vault', 'authenticated'),
      ('public', 'ia_feedback_events', 'authenticated'),
      ('public', 'ia_graph_edges', 'authenticated'),
      ('public', 'ia_graph_entities', 'authenticated'),
      ('public', 'ia_scoring_records', 'authenticated'),
      ('public', 'ia_signals', 'authenticated'),
      ('public', 'ia_sources', 'authenticated'),
      ('public', 'marketplace_candidates', 'authenticated'),
      ('public', 'marketplace_inquiries', 'authenticated'),
      ('public', 'marketplace_public_listings_v1', 'anon'),
      ('public', 'marketplace_public_listings_v1', 'authenticated'),
      ('public', 'network_public_projections', 'authenticated'),
      ('public', 'network_review_items', 'authenticated'),
      ('public', 'opportunities', 'authenticated'),
      ('public', 'signal_candidates', 'authenticated'),
      ('public', 'signals', 'anon'),
      ('public', 'signals', 'authenticated'),
      ('public', 'source_registry', 'anon'),
      ('public', 'source_registry', 'authenticated'),
      ('public', 'source_snapshots', 'authenticated'),
      ('public', 'supplier_profiles', 'anon'),
      ('public', 'supplier_profiles', 'authenticated'),
      ('public', 'user_profiles', 'authenticated'),
      ('public', 'user_roles', 'authenticated')
    ) as mapped(schema_name, relation_name, role_name)
  loop
    if to_regclass(format('%I.%I', grant_target.schema_name, grant_target.relation_name)) is not null then
      execute format(
        'grant select on %I.%I to %I',
        grant_target.schema_name,
        grant_target.relation_name,
        grant_target.role_name
      );
    end if;
  end loop;
end
$api_underlying_select_grants$;

do $api_views_security_invoker$
declare
  api_view record;
begin
  if to_regnamespace('api') is null then
    raise exception 'API schema must exist before API view RLS hardening';
  end if;

  for api_view in
    select relation.relname as view_name
    from pg_class relation
    join pg_namespace namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'api'
      and relation.relkind = 'v'
    order by relation.relname
  loop
    execute format(
      'alter view api.%I set (security_invoker = true)',
      api_view.view_name
    );
  end loop;
end
$api_views_security_invoker$;

notify pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701001549','fix_api_schema_views_rls_bypass','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701001549_fix_api_schema_views_rls_bypass.sql

-- RECOVERY BEGIN 20260701001726_add_missing_api_schema_views.sql
-- Adds api.* views for 10 tables referenced by live application code that
-- never had one at all -- confirmed via information_schema (base table
-- exists in public, no matching view in api). Without these, every query
-- to these tables 404s at the PostgREST layer regardless of role,
-- including service_role (schema exposure is enforced before role-based
-- permission checks). Affects: worker_heartbeats/crawl_domain_circuit_state
-- (v2 distributed worker hardening), the 6 genetics evidence-access tables
-- (lib/genetics/queries.ts#getGranteeAccessGrants + the granted-access
-- page), and country_intel/jurisdiction_briefings (Briefing Room /
-- dashboard live data).
--
-- Unlike the 46 views fixed in 20260630110000_fix_api_schema_views_rls_bypass,
-- these are built correctly from the start: security_invoker = true set at
-- creation time, with GRANTs matching each table's actual RLS policy
-- (queried directly from pg_policy, not guessed) -- least-privilege, no
-- broader access than the table's own RLS already intends.

CREATE VIEW api.worker_heartbeats AS SELECT * FROM public.worker_heartbeats;
ALTER VIEW api.worker_heartbeats SET (security_invoker = true);
GRANT SELECT ON public.worker_heartbeats TO authenticated;
GRANT SELECT ON api.worker_heartbeats TO authenticated;

CREATE VIEW api.crawl_domain_circuit_state AS SELECT * FROM public.crawl_domain_circuit_state;
ALTER VIEW api.crawl_domain_circuit_state SET (security_invoker = true);
GRANT SELECT ON public.crawl_domain_circuit_state TO authenticated;
GRANT SELECT ON api.crawl_domain_circuit_state TO authenticated;

CREATE VIEW api.genetics_profiles AS SELECT * FROM public.genetics_profiles;
ALTER VIEW api.genetics_profiles SET (security_invoker = true);
GRANT SELECT ON public.genetics_profiles TO authenticated;
GRANT SELECT ON api.genetics_profiles TO authenticated;

CREATE VIEW api.genetics_access_grants AS SELECT * FROM public.genetics_access_grants;
ALTER VIEW api.genetics_access_grants SET (security_invoker = true);
GRANT SELECT ON public.genetics_access_grants TO authenticated;
GRANT SELECT ON api.genetics_access_grants TO authenticated;

CREATE VIEW api.genetics_access_requests AS SELECT * FROM public.genetics_access_requests;
ALTER VIEW api.genetics_access_requests SET (security_invoker = true);
GRANT SELECT ON public.genetics_access_requests TO authenticated;
GRANT SELECT ON api.genetics_access_requests TO authenticated;

CREATE VIEW api.genetics_evidence_items AS SELECT * FROM public.genetics_evidence_items;
ALTER VIEW api.genetics_evidence_items SET (security_invoker = true);
GRANT SELECT ON public.genetics_evidence_items TO authenticated;
GRANT SELECT ON api.genetics_evidence_items TO authenticated;

CREATE VIEW api.genetics_claim_reviews AS SELECT * FROM public.genetics_claim_reviews;
ALTER VIEW api.genetics_claim_reviews SET (security_invoker = true);
GRANT SELECT ON public.genetics_claim_reviews TO authenticated;
GRANT SELECT ON api.genetics_claim_reviews TO authenticated;

CREATE VIEW api.genetics_audit_events AS SELECT * FROM public.genetics_audit_events;
ALTER VIEW api.genetics_audit_events SET (security_invoker = true);
GRANT SELECT ON public.genetics_audit_events TO authenticated;
GRANT SELECT ON api.genetics_audit_events TO authenticated;

-- country_intel: public_active_select policy applies to anon+authenticated
-- (filtered to review_status='active'), plus a separate admin/operator/
-- analyst policy for authenticated staff -- so both anon and authenticated
-- need the grant; RLS does the filtering.
CREATE VIEW api.country_intel AS SELECT * FROM public.country_intel;
ALTER VIEW api.country_intel SET (security_invoker = true);
GRANT SELECT ON public.country_intel TO anon, authenticated;
GRANT SELECT ON api.country_intel TO anon, authenticated;

-- jurisdiction_briefings: public_read_published policy has an empty
-- polroles array, which in pg_policy means PUBLIC (applies to every role,
-- not restricted) -- so both anon and authenticated, filtered to
-- status='published'.
CREATE VIEW api.jurisdiction_briefings AS SELECT * FROM public.jurisdiction_briefings;
ALTER VIEW api.jurisdiction_briefings SET (security_invoker = true);
GRANT SELECT ON public.jurisdiction_briefings TO anon, authenticated;
GRANT SELECT ON api.jurisdiction_briefings TO anon, authenticated;

NOTIFY pgrst, 'reload schema';


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701001726','add_missing_api_schema_views','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701001726_add_missing_api_schema_views.sql

-- RECOVERY BEGIN 20260701111452_remote_applied_repair.sql
-- Repair stub: migration 20260701111452 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701111452','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701111452_remote_applied_repair.sql

-- RECOVERY BEGIN 20260701180750_replay_corridor_intelligence_tables_stub.sql
-- Reconstructed from the live production catalog for zero-state migration replay.
-- Seed values below are restored from production migration-ledger evidence.
--
-- Production version 20260701180751 created these tables and seeded 59 processing
-- observations plus 15 regulatory alerts in the same recorded statement. The
-- repository-only 20260701230000 reconstruction is relocated before that version
-- by prepare-production-faithful-migration-replay.mjs so the dependent historical
-- function can compile on a clean database.
--
-- The seed rows are part of the production contract, not disposable fixture data:
-- /intelligence/logistics-trade-routes reads both tables directly and suppresses
-- its benchmark/alert sections when they are empty. Omitting the rows therefore
-- makes a zero-state rebuild materially different from production.
--
-- Production already records version 20260701230000, so this is a
-- repository-only replay-fidelity repair and is not a production migration.
-- It is never reapplied remotely.

create table if not exists public.corridor_processing_times (
  id uuid primary key default gen_random_uuid(),
  corridor_key text not null,
  permit_type text,
  days_taken integer not null,
  submitter_role text,
  verified boolean default false,
  submitted_at timestamptz default now(),
  constraint corridor_processing_times_days_taken_check
    check (days_taken > 0 and days_taken < 1000)
);

create index if not exists idx_cpt_key
  on public.corridor_processing_times (corridor_key);

create table if not exists public.corridor_regulatory_alerts (
  id uuid primary key default gen_random_uuid(),
  corridor_key text not null,
  alert_date date not null,
  severity text not null,
  summary text not null,
  detail text,
  source text,
  created_at timestamptz default now(),
  constraint corridor_regulatory_alerts_severity_check
    check (severity = any (array['major'::text, 'minor'::text, 'watch'::text]))
);

create index if not exists idx_cra_key_date
  on public.corridor_regulatory_alerts (corridor_key, alert_date desc);

-- Exact processing-time seed values recorded in production migration 20260701180751.
insert into public.corridor_processing_times
  (corridor_key, permit_type, days_taken, submitter_role, verified)
values
  ('Netherlands→Germany','BfArM Import Permit',42,'Importer',true),
  ('Netherlands→Germany','BfArM Import Permit',56,'Compliance Officer',true),
  ('Netherlands→Germany','BfArM Import Permit',49,'Importer',true),
  ('Netherlands→Germany','BfArM Import Permit',63,'Regulatory Affairs',true),
  ('Netherlands→Germany','BfArM Import Permit',48,'Importer',true),
  ('Netherlands→Germany','BfArM Import Permit',70,'Compliance Officer',false),
  ('Netherlands→Germany','BfArM Import Permit',44,'Importer',true),
  ('Netherlands→Germany','BfArM Import Permit',52,'Importer',true),
  ('Canada→Germany','EU GMP + BfArM Import',84,'Regulatory Affairs',true),
  ('Canada→Germany','EU GMP + BfArM Import',98,'Compliance Officer',true),
  ('Canada→Germany','EU GMP + BfArM Import',112,'Regulatory Affairs',true),
  ('Canada→Germany','BfArM Import Permit',70,'Importer',true),
  ('Canada→Germany','BfArM Import Permit',91,'Importer',true),
  ('Canada→Germany','BfArM Import Permit',77,'Compliance Officer',true),
  ('Canada→United Kingdom','MHRA Import Licence',63,'Regulatory Affairs',true),
  ('Canada→United Kingdom','MHRA Import Licence',77,'Importer',true),
  ('Canada→United Kingdom','MHRA Import Licence',56,'Compliance Officer',true),
  ('Canada→United Kingdom','MHRA Import Licence',84,'Regulatory Affairs',false),
  ('Canada→United Kingdom','MHRA Import Licence',70,'Importer',true),
  ('Portugal→Germany / EU','EU Import Permit',70,'Regulatory Affairs',true),
  ('Portugal→Germany / EU','EU Import Permit',84,'Compliance Officer',true),
  ('Portugal→Germany / EU','EU Import Permit',63,'Importer',true),
  ('Portugal→Germany / EU','EU Import Permit',91,'Regulatory Affairs',true),
  ('Australia→Global','ODC Export Permit',56,'Exporter',true),
  ('Australia→Global','ODC Export Permit',70,'Regulatory Affairs',true),
  ('Australia→Global','ODC Export Permit',49,'Exporter',true),
  ('Australia→Global','ODC Export Permit',84,'Compliance Officer',true),
  ('Germany→EU Distribution','Wholesale Distribution Licence',28,'Distributor',true),
  ('Germany→EU Distribution','Wholesale Distribution Licence',42,'Compliance Officer',true),
  ('Germany→EU Distribution','Wholesale Distribution Licence',35,'Distributor',true),
  ('Germany→EU Distribution','Wholesale Distribution Licence',56,'Regulatory Affairs',true),
  ('Canada→Australia','ODC Import Permit + TGA GMP',84,'Regulatory Affairs',true),
  ('Canada→Australia','ODC Import Permit + TGA GMP',98,'Importer',true),
  ('Canada→Australia','ODC Import Permit + TGA GMP',77,'Compliance Officer',true),
  ('Canada→France','ANSM Import Authorisation',91,'Regulatory Affairs',true),
  ('Canada→France','ANSM Import Authorisation',112,'Compliance Officer',true),
  ('Canada→France','ANSM Import Authorisation',84,'Regulatory Affairs',true),
  ('Netherlands→United Kingdom','MHRA Import Licence',70,'Compliance Officer',true),
  ('Netherlands→United Kingdom','MHRA Import Licence',84,'Importer',true),
  ('Netherlands→United Kingdom','MHRA Import Licence',63,'Regulatory Affairs',true),
  ('New Zealand→Australia','TGA Import Permit',42,'Exporter',true),
  ('New Zealand→Australia','TGA Import Permit',56,'Regulatory Affairs',true),
  ('New Zealand→Australia','TGA Import Permit',35,'Exporter',true),
  ('Colombia→EU / LATAM','INVIMA Export + EU Import',112,'Regulatory Affairs',true),
  ('Colombia→EU / LATAM','INVIMA Export + EU Import',126,'Compliance Officer',true),
  ('Colombia→EU / LATAM','INVIMA Export + EU Import',98,'Regulatory Affairs',true),
  ('South Africa→Germany / EU','SAHPRA Export + BfArM Import',140,'Regulatory Affairs',true),
  ('South Africa→Germany / EU','SAHPRA Export + BfArM Import',154,'Compliance Officer',true),
  ('Israel→Germany / EU','Research Grade Import',98,'Regulatory Affairs',true),
  ('Israel→Germany / EU','Research Grade Import',126,'Researcher',true),
  ('Israel→Germany / EU','Research Grade Import',112,'Compliance Officer',true),
  ('Canada→Israel','IMCA Import Permit',70,'Regulatory Affairs',true),
  ('Canada→Israel','IMCA Import Permit',84,'Importer',true),
  ('Canada→Israel','IMCA Import Permit',77,'Compliance Officer',true),
  ('Portugal→United Kingdom','MHRA Import Licence',77,'Regulatory Affairs',true),
  ('Portugal→United Kingdom','MHRA Import Licence',91,'Importer',true),
  ('Denmark→Germany / EU','EU Narcotics Export/Import',49,'Regulatory Affairs',true),
  ('Denmark→Germany / EU','EU Narcotics Export/Import',56,'Importer',true),
  ('Denmark→Germany / EU','EU Narcotics Export/Import',63,'Compliance Officer',true);

-- Exact regulatory-alert seed values recorded in production migration 20260701180751.
insert into public.corridor_regulatory_alerts
  (corridor_key, alert_date, severity, summary, detail, source)
values
  ('Germany→EU Distribution','2026-07-01','major','BfArM integrates Anbauvereinigung supply into wholesale GDP framework','Following the adult-use Anbauvereinigung rollout, BfArM issued guidance integrating licensed social club production into the wholesale GDP distribution chain. Wholesalers must now maintain separate batch records for Anbauvereinigung-sourced vs. imported product.','BfArM Guidance Note 2026-07'),
  ('Canada→France','2026-06-28','major','ANSM expands cannabis médicale approved supplier list — 3 new Canadian LPs added','ANSM published updated approved supplier list including Aurora Cannabis, Canopy Growth (Spectrum Therapeutics), and Tilray Medical. Product-level authorisations for specific formats still required per existing procedure.','ANSM Decision 2026-06-28'),
  ('Netherlands→Germany','2026-06-15','minor','BfArM revises import permit application Form 4a — new attestation language required','Import permit applications submitted after 1 July 2026 must use the updated Form 4a, which includes a new section attesting to Anbauvereinigung product segregation compliance. Applications on old form will be returned without processing.','BfArM Announcement 15.06.2026'),
  ('Canada→Germany','2026-05-20','minor','Health Canada updates Export Permit workflow — new end-use attestation required for EU-bound shipments','Health Canada Cannabis Regulation Division issued updated workflow requiring exporters to obtain a destination-country end-use attestation before Export Permit issuance for EU-bound medical cannabis. Adds approximately 2 weeks to permit timeline.','Health Canada HC 2026-132'),
  ('Thailand→Asia-Pacific','2026-04-10','major','Thai FDA tightens export restrictions following 2024 partial re-scheduling','Thai FDA clarified that all cannabis products above 0.2% THC now require ONCB export licence regardless of domestic decriminalisation status. Unlicensed exports intercepted at Bangkok Suvarnabhumi resulted in operator suspensions.','Thai FDA Notification 2026-04'),
  ('Colombia→EU / LATAM','2026-03-22','watch','Colombian peso depreciation — EUR-denominated contracts recommended','COP depreciated 12% vs EUR YTD 2026. EU buyers on COP-denominated contracts face significant FX gains; Colombian exporters on EUR contracts face margin compression. Harbourview recommends EUR or USD denomination with FX hedge clauses in new supply agreements.','Harbourview FX Monitor 2026-Q1'),
  ('Canada→United Kingdom','2026-03-15','minor','MHRA updates Controlled Drug import licence application portal — digital-only from April 2026','MHRA launched updated online portal for Schedule 2 CD import licence applications. Paper applications no longer accepted from 1 April 2026. Digital submission reduces average processing time by an estimated 8 business days.','MHRA Notice 2026-CD-04'),
  ('Israel→Germany / EU','2026-02-14','major','EU-Israel IMC-GMP equivalency decision delayed to Q4 2026 — EMA announcement','EMA confirmed IMC-GMP equivalency assessment will not conclude before Q4 2026, pushing expected full EU GMP parity for Israeli producers to early 2027. Israeli products continue to enter EU only via research pathway until equivalency is confirmed.','EMA/2026/IMC-GMP/012'),
  ('South Africa→Germany / EU','2026-01-30','watch','SAHPRA increases cannabis export permit processing fee to ZAR 18,500 — 23% increase','SAHPRA revised scheduled fees effective 1 February 2026. Cannabis export permit fee increased from ZAR 15,000 to ZAR 18,500. Annual facility inspection fee for export-eligible facilities increased to ZAR 45,000.','SAHPRA Government Gazette Notice 2026-01'),
  ('Australia→Global','2026-01-15','minor','ODC updates online export permit portal — new product database entry required before application','ODC now requires all cannabis export applications to reference an ODC product database entry before permit issuance. New products require database registration (est. 3–4 weeks) before export permit application can proceed.','ODC Notice 2026-001'),
  ('Malta→EU','2025-12-01','major','MRA publishes first commercial cannabis export framework — pilot scheme for 5 operators','Malta Regulatory Authority published the first operational cannabis export framework, initially available to 5 pilot-licensed cultivation operators. Applications open Q1 2026. Export priority given to EU medical markets.','MRA/2025/Cannabis/Export/001'),
  ('Switzerland→EU','2025-11-18','watch','Swiss-EU bilateral cannabis MRA negotiations stalled — export pilot extended 12 months','FOPH confirmed bilateral MRA negotiations with EU have stalled due to disagreements on pharmacovigilance reporting. Existing cannabis export pilot extended 12 months pending resolution.','FOPH Press Release 18.11.2025'),
  ('Morocco→EU','2025-09-12','watch','Morocco tables medical cannabis export bill — legislative passage expected H1 2026','Moroccan parliament received draft legislation enabling licensed medical cannabis cultivation and export with EU GMP requirements. Monitor for passage and implementing regulations.','Harbourview Legislative Watch'),
  ('Poland→EU Distribution','2025-08-20','minor','URPL extends export permit processing to 12 weeks — domestic demand cited','URPL issued notice extending standard export permit processing from 8 to 12 weeks effective September 2025, citing high domestic prescription volumes. Export operators advised to apply 16 weeks before target ship date.','URPL Notice 2025-08'),
  ('Jamaica→North America / EU','2025-10-05','minor','CLA introduces operator verification database — reduces EU due diligence burden','Cannabis Licensing Authority (Jamaica) launched online operator verification portal. EU importers can now verify CLA licence status in 2–3 days vs previous 4–6 week process.','CLA Jamaica Press Release Oct 2025');


-- Fail closed if replay no longer reproduces the production seed cardinalities.
do $corridor_seed_fidelity$
begin
  if (select count(*) from public.corridor_processing_times) <> 59 then
    raise exception 'corridor_processing_times replay seed count mismatch';
  end if;
  if (select count(*) from public.corridor_regulatory_alerts) <> 15 then
    raise exception 'corridor_regulatory_alerts replay seed count mismatch';
  end if;
end
$corridor_seed_fidelity$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701180750','replay_corridor_intelligence_tables_stub','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701180750_replay_corridor_intelligence_tables_stub.sql

-- RECOVERY BEGIN 20260701180751_remote_applied_repair.sql
-- Replay repair for production migration 20260701180751 (corridor_intelligence_tables).
--
-- The repository previously kept this applied production version as a SELECT 1
-- parity stub. Fresh read-only production migration-ledger evidence proves the
-- original migration created public.get_corridor_stats(text). Fresh live catalog
-- metadata also proves the API wrapper api.get_corridor_stats(text) exists in
-- production, although its creation is not represented by any recorded migration
-- statement. Later July 13 migrations revoke EXECUTE from both signatures, so a
-- zero-state replay must reconstruct both functions before those grants can be
-- replayed faithfully.
--
-- Tables: production version 20260701180751 created corridor_* tables and the
-- function together. Repository reconstruction split table DDL into
-- 20260701230000 (later filename). prepare-production-faithful-migration-replay.mjs
-- relocates that file for internal CI replay, but Supabase Preview / Git branching
-- applies migrations in filename order only — so this repair must create the
-- tables first when they are absent. Production is unaffected: version
-- 20260701180751 is already recorded remotely and is never re-executed.

create table if not exists public.corridor_processing_times (
  id uuid primary key default gen_random_uuid(),
  corridor_key text not null,
  permit_type text,
  days_taken integer not null,
  submitter_role text,
  verified boolean default false,
  submitted_at timestamptz default now(),
  constraint corridor_processing_times_days_taken_check
    check (days_taken > 0 and days_taken < 1000)
);

create index if not exists idx_cpt_key
  on public.corridor_processing_times (corridor_key);

create table if not exists public.corridor_regulatory_alerts (
  id uuid primary key default gen_random_uuid(),
  corridor_key text not null,
  alert_date date not null,
  severity text not null,
  summary text not null,
  detail text,
  source text,
  created_at timestamptz default now(),
  constraint corridor_regulatory_alerts_severity_check
    check (severity = any (array['major'::text, 'minor'::text, 'watch'::text]))
);

create index if not exists idx_cra_key_date
  on public.corridor_regulatory_alerts (corridor_key, alert_date desc);

-- Original production-ledger function body.
CREATE OR REPLACE FUNCTION public.get_corridor_stats(p_key text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(json_build_object(
    'count',       COUNT(*),
    'avg_days',    ROUND(AVG(days_taken))::int,
    'median_days', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_taken)::int,
    'min_days',    MIN(days_taken),
    'max_days',    MAX(days_taken),
    'p90_days',    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY days_taken)::int
  ), '{}'::json)
  FROM public.corridor_processing_times
  WHERE corridor_key = p_key;
$$;

-- Current production API wrapper, reconstructed from pg_get_functiondef().
CREATE OR REPLACE FUNCTION api.get_corridor_stats(p_key text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, api, public, signals, regulatory_signals, auth, storage, vault, extensions, net, cron
AS $$
  SELECT public.get_corridor_stats(p_key);
$$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701180751','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701180751_remote_applied_repair.sql

-- RECOVERY BEGIN 20260701185651_remote_applied_repair.sql
-- Repair stub: migration 20260701185651 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701185651','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701185651_remote_applied_repair.sql

-- RECOVERY BEGIN 20260701191146_remote_applied_repair.sql
-- Repair stub: migration 20260701191146 was applied directly to the remote database
-- and has no corresponding local file. This stub reconciles the local
-- migration directory with the remote supabase_migrations.schema_migrations table.
-- The schema changes from this migration are already live in the remote database.
SELECT 1; -- no-op


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701191146','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701191146_remote_applied_repair.sql

-- RECOVERY BEGIN 20260701191208_remote_applied_repair.sql
-- Production version 20260701191208 is fix_cron_trigger_auth_headers_v2.
-- Its original remote statement embeds project-specific authorization material
-- and must not be replayed into local, preview, or another production project.
--
-- The unrelated match-rationale schema delta is restored at its canonical
-- production version, 20260630233905. This file remains an explicit migration
-- ledger reconciliation marker only.
select 1;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701191208','remote_applied_repair','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701191208_remote_applied_repair.sql

-- RECOVERY BEGIN 20260701213000_pin_search_path_on_flagged_functions.sql
-- Pin search_path on the function signatures flagged by the Supabase security
-- advisor. Production contained all 13 functions when this snapshot was
-- generated; repository zero-state history can omit optional pipeline routines.
-- Harden every exact signature that exists without weakening the final state.

do $pin_flagged_function_search_paths$
declare
  function_signature text;
  function_oid regprocedure;
begin
  foreach function_signature in array array[
    'public.claim_pipeline_tasks(text,text,integer)',
    'public.complete_pipeline_task(uuid)',
    'public.fail_pipeline_task(uuid,text,integer)',
    'public.get_corridor_stats(text)',
    'public.get_field_changes_for_country(text,integer)',
    'public.get_regulatory_calendar(text,integer)',
    'public.hv_clean_scraped_headline(text)',
    'public.hv_trigger_embed()',
    'public.hv_trigger_extract()',
    'public.hv_trigger_score()',
    'public.sync_playbook_regulators(text)',
    'public.trg_track_briefing_field_changes()',
    'public.trg_track_country_field_changes()'
  ]
  loop
    function_oid := to_regprocedure(function_signature);

    if function_oid is not null then
      execute format(
        'alter function %s set search_path = public',
        function_oid
      );
    end if;
  end loop;
end
$pin_flagged_function_search_paths$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701213000','pin_search_path_on_flagged_functions','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701213000_pin_search_path_on_flagged_functions.sql

-- RECOVERY BEGIN 20260701213500_cover_remaining_unindexed_foreign_keys.sql
-- Close any foreign-key index gaps remaining after the July advisor snapshot.
-- Production contained a static list of 23 relations, including optional
-- production-only tables. Replay derives the same operation from the schema that
-- actually exists and creates an index only when the FK column is not already a
-- leading key of a valid index.

do $cover_remaining_unindexed_foreign_keys$
declare
  foreign_key record;
  index_name text;
begin
  for foreign_key in
    select
      namespace.nspname as schema_name,
      relation.relname as table_name,
      attribute.attname as column_name
    from pg_constraint constraint_record
    join pg_class relation
      on relation.oid = constraint_record.conrelid
    join pg_namespace namespace
      on namespace.oid = relation.relnamespace
    join pg_attribute attribute
      on attribute.attrelid = constraint_record.conrelid
     and attribute.attnum = constraint_record.conkey[1]
    where constraint_record.contype = 'f'
      and cardinality(constraint_record.conkey) = 1
      and namespace.nspname in ('public', 'regulatory_signals')
      and not exists (
        select 1
        from pg_index index_record
        where index_record.indrelid = constraint_record.conrelid
          and index_record.indisvalid
          and index_record.indisready
          and index_record.indnkeyatts > 0
          and index_record.indkey[0] = constraint_record.conkey[1]
      )
    order by namespace.nspname, relation.relname, attribute.attname
  loop
    index_name := format('idx_%s_%s', foreign_key.table_name, foreign_key.column_name);

    execute format(
      'create index if not exists %I on %I.%I (%I)',
      index_name,
      foreign_key.schema_name,
      foreign_key.table_name,
      foreign_key.column_name
    );
  end loop;
end
$cover_remaining_unindexed_foreign_keys$;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260701213500','cover_remaining_unindexed_foreign_keys','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260701213500_cover_remaining_unindexed_foreign_keys.sql

-- RECOVERY BEGIN 20260702014108_seed_module2_sections_21.sql
-- Reconstructed from production.
--
-- This file previously contained no DDL. It carried a short comment saying it
-- had been applied directly to production via Supabase MCP and existed only to
-- satisfy local/remote migration history parity, followed by `SELECT 1;`.
--
-- That placeholder satisfied the version-number ledger while executing nothing,
-- so `supabase db reset --local` could not rebuild the schema this migration is
-- supposed to create. The statements below are the verbatim text production
-- ran, read back from supabase_migrations.schema_migrations.statements for
-- version 20260702014108.
--
-- Rewriting this file cannot affect production: 20260702014108 is already recorded
-- in schema_migrations, so `supabase db push` skips it. This is a
-- repository-only repair of replay fidelity.
--
-- Regenerate with: node scripts/reconstruct-stub-migrations.mjs

insert into education_module_sections (module_id, section_order, heading, body, block_type)
select m.id, v.section_order, v.heading, v.body, v.block_type
from (values
  ('drug-interactions', 1, 'Why This Matters', 'Cannabis-based products interact with a meaningful share of commonly prescribed medications through well-characterized pharmacological mechanisms, and a prescriber or pharmacist who treats cannabis as pharmacologically isolated from a patient''s broader medication regimen is missing a genuinely consequential clinical consideration, not just a theoretical one. This matters disproportionately for the patient population most likely to be considered for cannabis-based treatment, since patients pursuing cannabis-based options after conventional treatments have proven inadequate are frequently managing multiple chronic conditions with correspondingly complex existing medication regimens, precisely the population where interaction risk is highest.

This matters for documentation reasons covered directly in the clinical prescribing module elsewhere in this track: a prescribing decision''s documented rationale needs to reflect that the broader medication context was actually considered, and a pharmacist''s counselling obligation specifically extends to addressing potential interactions in combination therapy situations, as flagged in the pharmacy dispensing module. Neither of those documentation obligations can be genuinely satisfied without an actual working understanding of which interaction mechanisms are clinically relevant and why.

This module covers interaction mechanisms and categories at an educational, conceptual level; it does not provide patient-specific interaction assessment or dosing adjustment guidance, which remains the responsibility of the treating clinician and pharmacist applying their own clinical judgment and current reference resources to the specific patient and medication combination in front of them.

A concrete illustrative scenario shows how an unflagged hepatic enzyme interaction can surface clinically. Picture a hypothetical patient stable on a long-standing anticoagulant regimen who begins a cannabis-based treatment for an unrelated chronic condition. Neither the prescribing clinician nor the patient''s existing anticoagulant management team specifically flags the new treatment as interaction-relevant, since neither medication''s name or general category obviously suggests an interaction to someone without a working understanding of the underlying shared hepatic metabolic pathway. Weeks later, routine anticoagulant monitoring reveals the patient''s blood levels have shifted meaningfully outside the expected therapeutic range, a change ultimately traced back to the cannabinoid''s effect on the relevant metabolic enzyme altering how the anticoagulant itself is processed, an interaction that a documented, mechanism-specific interaction check at the time of the original cannabis-based prescribing decision would have flagged proactively rather than requiring discovery through an adverse monitoring result after the fact.

The interaction mechanisms covered in this module operate identically regardless of jurisdiction, meaning the clinical substance of interaction screening doesn''t vary across the global markets covered throughout this track even though the specific documentation format and regulatory reporting obligations attached to that screening, covered in the clinical prescribing and pharmacy dispensing modules elsewhere in this track, do vary by jurisdiction, a useful distinction for any organization building standardized clinical protocols across a multi-jurisdiction footprint.', 'text'),
  ('drug-interactions', 2, 'The Core Framework', 'Cannabis-drug interactions operate through a small number of distinct mechanisms, and understanding which mechanism is relevant for a given concurrent medication matters for assessing the interaction''s likely clinical significance.

Hepatic enzyme-mediated metabolic interactions are the most clinically significant category: THC and CBD are both metabolized through, and can themselves inhibit or induce, hepatic cytochrome P450 enzyme pathways shared by a substantial number of other commonly prescribed medications, meaning concurrent use can alter the blood levels of those other medications, in either direction, independent of any direct pharmacological interaction between the cannabinoid and the other drug''s own mechanism of action.

Additive central nervous system effects represent a more straightforward mechanism, where cannabis''s own sedating or psychoactive effects combine with other CNS-depressant medications, such as benzodiazepines, opioids, or certain antihistamines, to produce greater sedation, impairment, or respiratory depression risk than either substance alone, a mechanism that doesn''t require any metabolic interaction to be clinically relevant.

Cardiovascular interaction considerations are relevant given THC''s documented effects on heart rate and blood pressure, which can interact with medications managing cardiovascular conditions, particularly in patients where the underlying cardiovascular condition itself increases baseline risk.

Anticoagulant and antiplatelet interaction risk has been specifically documented for certain cannabinoid combinations affecting medications managing blood clotting, relevant given how commonly anticoagulant therapy appears in the same patient population frequently considered for cannabis-based treatment of chronic conditions.

Route-of-administration-dependent interaction timing means the practical interaction risk and onset can differ between inhaled and oral cannabis products even for the same underlying mechanism, since the pharmacokinetic profile differences covered in the cannabinoid pharmacology module elsewhere in this track affect not just the cannabinoid''s own behavior but the timing and intensity of its interaction with concurrent medications.

It is worth examining the hepatic enzyme interaction mechanism in slightly more technical depth, since understanding why it''s so broadly consequential helps explain its priority position in the interaction framework. THC and CBD both interact with a small number of hepatic cytochrome P450 enzyme families that are also responsible for metabolizing a very large share of commonly prescribed medications across many therapeutic categories, meaning the interaction risk isn''t limited to medications that share an obvious clinical similarity with cannabis-based treatment, but extends to any medication processed through the same shared metabolic pathway regardless of how clinically unrelated the two treatments otherwise appear, which is precisely why a mechanism-based check, rather than an intuition-based one, is necessary to reliably catch this category of interaction.

It is worth connecting interaction-screening discipline explicitly to the broader documentation-currency principle that recurs throughout this education track, since a patient''s medication list, like a supplier''s compliance documentation or a market''s regulatory status, is a perishable data point requiring periodic re-verification rather than a one-time intake item; building interaction re-screening into a standard recurring clinical workflow, rather than treating it as a single initial-consultation step, mirrors the same currency-maintenance discipline this track applies to proof-pack documentation and regulatory intelligence monitoring.', 'text'),
  ('drug-interactions', 3, 'How This Plays Out in Practice', 'A prescriber documenting a cannabis-based treatment decision for a patient on an existing medication regimen, consistent with the documentation discipline covered in the clinical prescribing module elsewhere in this track, should document not just that the broader medication list was reviewed, but specifically which interaction categories were assessed as relevant or not relevant for this particular patient''s actual medication combination, since a generic note that interactions were "considered" carries the same documentation weakness flagged elsewhere in this track for any undocumented clinical rationale.

Given that hepatic enzyme-mediated interactions can affect a wide range of medications through a shared pathway rather than through any obvious surface-level similarity between drugs, a prescriber or pharmacist should specifically check a patient''s full medication list against current interaction reference resources rather than relying on intuition about which medications "seem like" they might interact with cannabis, since the actual mechanism frequently isn''t obvious without that specific check.

For pharmacists specifically, the counselling obligation around combination therapy covered in the pharmacy dispensing module elsewhere in this track is best satisfied by addressing the specific interaction category relevant to that patient''s actual concurrent medications, rather than providing only generic combination-therapy caution language, since a patient on an anticoagulant benefits from meaningfully different specific counselling than a patient on a CNS-depressant, even though both fall under the broader "combination therapy" documentation category.

Given that interaction risk and timing can differ by route of administration for the same underlying medication combination, a patient transitioning between cannabis product formats, an event that already triggers re-counselling under the pharmacy dispensing module''s framework, should have that re-counselling specifically address whether the interaction profile with their existing medications changes meaningfully with the new format, not just whether the cannabinoid product itself behaves differently.

A further consideration concerns how interaction risk should be reassessed, not just initially screened, over the course of an extended treatment relationship, since a patient''s broader medication regimen frequently changes over time independent of their cannabis-based treatment, with new medications added for unrelated conditions or dosages adjusted for existing ones; a single interaction screen performed only at the original cannabis-based prescribing decision, without a corresponding re-screen whenever the patient''s broader medication list subsequently changes, leaves a documentation and clinical gap that mirrors the broader documentation-currency principle covered throughout this education track.

A globally operating clinic or telemedicine platform should build a single, standardized interaction-screening protocol and reference resource used consistently across every jurisdiction served, since the underlying pharmacological interaction mechanisms don''t differ by jurisdiction, while still layering jurisdiction-specific documentation requirements for how that screening is recorded on top of the shared underlying clinical protocol, avoiding the inefficiency and inconsistency risk of building separate interaction-screening processes independently for each market served.', 'text'),
  ('drug-interactions', 4, 'Common Pitfalls', 'The most common mistake is assessing interaction risk based on superficial similarity between drug names or categories rather than actual shared mechanism, missing genuinely significant hepatic enzyme-mediated interactions that aren''t obvious without specifically checking the metabolic pathway, while sometimes over-flagging interactions between medications that share no actual mechanistic overlap with cannabinoids.

A second frequent error is documenting that a medication review occurred without specifying which interaction categories were actually assessed and found relevant or not relevant, the same generic-documentation weakness flagged throughout the clinical prescribing module elsewhere in this track, leaving a reviewer unable to distinguish a genuinely thorough interaction assessment from a cursory check.

Pharmacists and prescribers also commonly treat combination-therapy counselling as a single generic caution rather than tailoring it to the patient''s actual specific concurrent medications and the corresponding interaction mechanism most relevant to them, missing the opportunity to provide counselling that''s actually clinically specific and actionable for that patient.

Finally, route-of-administration-dependent interaction timing is sometimes overlooked entirely when a patient changes product format, with re-counselling at that transition point focused only on the cannabinoid product''s own behavior rather than also addressing whether the interaction profile with the patient''s existing medications shifts meaningfully alongside the format change.

Pharmacists specifically should think about building interaction-screening discipline into routine dispensing workflow even for refills of an already-established cannabis-based prescription, not just at initial dispensing, since the dispensing pharmacist is frequently the party best positioned to notice a new medication has been added to a patient''s broader regimen, given that community pharmacy dispensing records often capture a fuller, more current picture of a patient''s overall medication list than any single prescriber''s own records might.

Operators building multi-jurisdiction clinical operations should specifically anticipate that patient medication-list completeness and accuracy may vary by market depending on how integrated that jurisdiction''s pharmacy and prescribing record systems are, meaning a market with less integrated health-record infrastructure may require correspondingly more deliberate, proactive intake effort to assemble a genuinely complete medication picture than a market with more centralized prescribing and dispensing records the clinician can more easily cross-reference.', 'text')
) as v(slug, section_order, heading, body, block_type)
join education_modules m on m.slug = v.slug;


insert into supabase_migrations.schema_migrations(version,name,created_by) values ('20260702014108','seed_module2_sections_21','harbourview-recovery') on conflict (version) do update set name=excluded.name;
-- RECOVERY END 20260702014108_seed_module2_sections_21.sql
