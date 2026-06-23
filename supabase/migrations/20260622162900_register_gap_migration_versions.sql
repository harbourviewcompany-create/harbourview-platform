INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260622000001', 'market_metrics_time_series',        ARRAY['-- applied via gap_a_market_metrics_time_series']),
  ('20260622000002', 'trade_flows_structured',             ARRAY['-- applied via gap_b_trade_flows_structured']),
  ('20260622000003', 'operator_entity_graph',              ARRAY['-- applied via gap_c_operator_entity_graph_ddl and gap_c_operator_entity_graph_seed']),
  ('20260622000004', 'jurisdiction_schema_unification',    ARRAY['-- applied via gap_d_jurisdiction_schema_unification']),
  ('20260622000005', 'education_tracks_modules_seed',      ARRAY['-- applied via gap_e_education_tables_ddl, gap_e_education_track1_market_access, gap_e_education_track2_regulatory_compliance, gap_e_education_track3_country_intel, gap_e_education_track4_clinical_med, gap_e_education_track5_industry_intel']),
  ('20260622000006', 'stub_countries_classify',            ARRAY['-- applied via gap_f_add_seed_enum_value and gap_f_stub_countries_classify']),
  ('20260622000007', 'jurisdiction_playbooks_tier1_seed',  ARRAY['-- applied via gap_g_playbook_de, gap_g_playbook_au, gap_g_playbook_gb, gap_g_playbook_ca, gap_g_playbook_il, gap_g_playbook_nl, gap_g_playbook_co, gap_g_playbook_us, gap_g_playbook_uy, gap_g_playbook_th, gap_g_playbook_mt, gap_g_playbook_pt'])
ON CONFLICT (version) DO NOTHING;
