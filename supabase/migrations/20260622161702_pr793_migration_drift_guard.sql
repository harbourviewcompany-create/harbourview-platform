INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20260622000001', 'market_metrics_time_series', ARRAY['-- already applied as gap_a_market_metrics_time_series (20260622153559)']),
  ('20260622000002', 'trade_flows_structured', ARRAY['-- already applied as gap_b_trade_flows_structured (20260622153659)']),
  ('20260622000003', 'operator_entity_graph', ARRAY['-- already applied as gap_c_operator_entity_graph_ddl+seed (20260622153739/153821)']),
  ('20260622000004', 'jurisdiction_schema_unification', ARRAY['-- already applied as gap_d_jurisdiction_schema_unification (20260622153847)']),
  ('20260622000005', 'education_tracks_modules_seed', ARRAY['-- already applied as gap_e_education_tables_ddl + tracks 1-5 (20260622154316-155128)']),
  ('20260622000006', 'stub_countries_classify', ARRAY['-- already applied as gap_f_add_seed_enum_value+classify (20260622155532/155755)']),
  ('20260622000007', 'jurisdiction_playbooks_tier1_seed', ARRAY['-- already applied as gap_g_playbook_de through gap_g_playbook_pt (20260622160032-160759)'])
ON CONFLICT (version) DO NOTHING;
