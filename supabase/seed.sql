-- SEED: development only, not for production
-- =============================================================================
-- Harbourview Signal Engine V1 — Development Seed Data
-- All names, URLs, and identifiers are fictional and for local dev only.
-- Wrap in transaction so all-or-nothing on failure.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Fixed UUIDs for predictable cross-table references in dev
-- ---------------------------------------------------------------------------
-- source_documents
DO $$ BEGIN
  INSERT INTO source_documents (
    id, source_url, source_title, source_domain,
    source_access_type, source_permission_status, source_date,
    raw_text, cleaned_text, raw_text_retention_status,
    language_code, checksum, source_credibility_score
  ) VALUES
  (
    '00000000-0001-0001-0001-000000000001',
    'https://dev-source-001.example/article/cannabis-equipment-liquidation',
    'Dev: Extraction Equipment Liquidation Notice (fictitious)',
    'dev-source-001.example',
    'public_web', 'uncertain', '2026-04-01',
    'Acme Cannabis GmbH (Dev) announces surplus CO₂ extraction units available for immediate sale.',
    'Acme Cannabis GmbH (Dev) announces surplus CO₂ extraction units available for immediate sale.',
    'retained', 'en',
    'devchecksum001aaaabbbbccccdddd',
    0.6200
  ),
  (
    '00000000-0001-0001-0001-000000000002',
    'https://dev-source-002.example/press/new-lp-germany',
    'Dev: New Licensed Producer — Germany (fictitious)',
    'dev-source-002.example',
    'public_web', 'allowed', '2026-04-10',
    'Fictitious GmbH Pharma GmbH has received GMP certification for cannabis flower production.',
    'Fictitious GmbH Pharma GmbH has received GMP certification for cannabis flower production.',
    'retained', 'de',
    'devchecksum002eeeeffff00001111',
    0.7500
  ),
  (
    '00000000-0001-0001-0001-000000000003',
    null,
    'Dev: Manual Admin Entry — Packaging Surplus (fictitious)',
    null,
    'manual_admin_entry', 'allowed', '2026-04-15',
    'Internal note: Dev operator XYZ Corp has 500,000 child-resistant pouches to offload.',
    'Dev operator XYZ Corp has 500,000 child-resistant pouches to offload.',
    'retained', 'en',
    'devchecksum003222233334444',
    0.8000
  );
END $$;

-- ---------------------------------------------------------------------------
-- source_chunks (8 rows — 3 from doc-1, 3 from doc-2, 2 from doc-3)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO source_chunks (
    id, source_document_id, chunk_index, chunk_text, token_estimate
  ) VALUES
  ('00000000-0002-0001-0001-000000000001', '00000000-0001-0001-0001-000000000001', 0,
   'Acme Cannabis GmbH (Dev) announces surplus CO₂ extraction units.', 12),
  ('00000000-0002-0001-0001-000000000002', '00000000-0001-0001-0001-000000000001', 1,
   'Equipment includes three 10L systems. All units tested and certified.', 14),
  ('00000000-0002-0001-0001-000000000003', '00000000-0001-0001-0001-000000000001', 2,
   'Available for immediate sale. Contact via Harbourview platform.', 12),
  ('00000000-0002-0001-0001-000000000004', '00000000-0001-0001-0001-000000000002', 0,
   'Fictitious GmbH Pharma GmbH has received GMP certification.', 11),
  ('00000000-0002-0001-0001-000000000005', '00000000-0001-0001-0001-000000000002', 1,
   'Production capacity: 500kg dried flower per annum. EU-GMP compliant.', 13),
  ('00000000-0002-0001-0001-000000000006', '00000000-0001-0001-0001-000000000002', 2,
   'Available for licensed import partners in UK and EU markets.', 12),
  ('00000000-0002-0001-0001-000000000007', '00000000-0001-0001-0001-000000000003', 0,
   'Dev operator XYZ Corp has 500,000 child-resistant pouches to offload.', 13),
  ('00000000-0002-0001-0001-000000000008', '00000000-0001-0001-0001-000000000003', 1,
   'Various sizes. Minimum order 10,000 units. POA.', 9);
END $$;

-- ---------------------------------------------------------------------------
-- entities (2 rows — referenced by signal_entity_mentions)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO entities (id, entity_type, name, domain, country, region, verification_status)
  VALUES
  (
    '00000000-0003-0001-0001-000000000001',
    'operator', 'Acme Cannabis GmbH (Dev)', 'acme-dev.example',
    'DE', 'Bavaria', 'unverified'
  ),
  (
    '00000000-0003-0001-0001-000000000002',
    'operator', 'Dev Operator XYZ Corp', 'xyz-dev.example',
    'US', 'Colorado', 'unverified'
  );
END $$;

-- ---------------------------------------------------------------------------
-- model_prompt_versions (3 rows)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO model_prompt_versions (id, task_name, version, prompt_or_query, labels, active)
  VALUES
  (
    '00000000-0004-0001-0001-000000000001',
    'signal_classification', 'v0.1-dev',
    'Classify the following text as a cannabis industry commercial signal. Return JSON with signal_type and marketplace_category.',
    '{"stage": "dev", "model": "mock"}', false
  ),
  (
    '00000000-0004-0001-0001-000000000002',
    'jurisdiction_extraction', 'v0.1-dev',
    'Extract jurisdiction (country, region, city) from the following text. Return JSON.',
    '{"stage": "dev", "model": "mock"}', false
  ),
  (
    '00000000-0004-0001-0001-000000000003',
    'entity_recognition', 'v0.1-dev',
    'Identify company or operator names in the following text. Return JSON array.',
    '{"stage": "dev", "model": "mock"}', false
  );
END $$;

-- ---------------------------------------------------------------------------
-- signal_duplicate_groups (2 rows — created before signal_candidates)
-- canonical_signal_candidate_id left null here, updated after candidates inserted
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO signal_duplicate_groups (id, duplicate_reason, similarity_score)
  VALUES
  (
    '00000000-0005-0001-0001-000000000001',
    'dev: near-duplicate extraction equipment listings from same source domain', 0.9200
  ),
  (
    '00000000-0005-0001-0001-000000000002',
    'dev: same packaging surplus signal observed in two manual entries', 0.8800
  );
END $$;

-- ---------------------------------------------------------------------------
-- signal_candidates (6 rows)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO signal_candidates (
    id, source_document_id, source_chunk_id, duplicate_group_id,
    signal_type, marketplace_category,
    title, summary,
    inferred_company_name, inferred_location, inferred_product_type,
    jurisdiction_country, jurisdiction_region, jurisdiction_confidence, jurisdiction_source,
    model_confidence_score, source_credibility_score, final_signal_score,
    score_breakdown, status
  ) VALUES
  -- 1: extraction equipment liquidation
  (
    '00000000-0006-0001-0001-000000000001',
    '00000000-0001-0001-0001-000000000001',
    '00000000-0002-0001-0001-000000000001',
    '00000000-0005-0001-0001-000000000001',
    'used_equipment', 'used_surplus',
    'Dev: CO₂ Extraction Units Surplus — Acme Cannabis GmbH',
    'Three 10L CO₂ extraction systems available for immediate sale from licensed German operator (fictitious dev data).',
    'Acme Cannabis GmbH (Dev)', 'Bavaria, Germany', 'CO₂ extraction systems',
    'DE', 'Bavaria', 0.8500, 'model_inference',
    0.7800, 0.6200, 0.7200,
    '{"model_confidence": 0.78, "source_credibility": 0.62, "category_fit": 0.80}',
    'needs_review'
  ),
  -- 2: near-duplicate of candidate 1 (same dup group)
  (
    '00000000-0006-0001-0001-000000000002',
    '00000000-0001-0001-0001-000000000001',
    '00000000-0002-0001-0001-000000000002',
    '00000000-0005-0001-0001-000000000001',
    'used_equipment', 'used_surplus',
    'Dev: Extraction Equipment Sale — duplicate signal (dev)',
    'Duplicate of signal 001 — same source, different chunk. Marked for dedup review (fictitious).',
    'Acme Cannabis GmbH (Dev)', 'Germany', 'extraction equipment',
    'DE', null, 0.6000, 'model_inference',
    0.5500, 0.6200, 0.5800,
    '{"model_confidence": 0.55, "source_credibility": 0.62, "novelty": 0.10}',
    'duplicate'
  ),
  -- 3: German LP GMP flower (approved)
  (
    '00000000-0006-0001-0001-000000000003',
    '00000000-0001-0001-0001-000000000002',
    '00000000-0002-0001-0001-000000000004',
    null,
    'cannabis_inventory', 'cannabis_inventory',
    'Dev: EU-GMP Dried Flower — Fictitious GmbH Pharma (Dev)',
    'GMP-certified licensed producer in Germany offering dried flower for licensed EU/UK import partners (fictitious).',
    'Fictitious GmbH Pharma GmbH', 'Germany', 'GMP dried flower',
    'DE', null, 0.9200, 'model_inference',
    0.9000, 0.7500, 0.8600,
    '{"model_confidence": 0.90, "source_credibility": 0.75, "commercial_actionability": 0.85}',
    'approved'
  ),
  -- 4: packaging surplus (needs source check)
  (
    '00000000-0006-0001-0001-000000000004',
    '00000000-0001-0001-0001-000000000003',
    '00000000-0002-0001-0001-000000000007',
    '00000000-0005-0001-0001-000000000002',
    'packaging_supply', 'used_surplus',
    'Dev: Child-Resistant Pouch Surplus — XYZ Corp (Dev)',
    '500,000 CR pouches for offload. Various sizes. Manual admin entry (fictitious dev).',
    'Dev Operator XYZ Corp', 'Colorado, USA', 'child-resistant pouches',
    'US', 'Colorado', 0.9500, 'operator_verification',
    0.8500, 0.8000, 0.8300,
    '{"model_confidence": 0.85, "source_credibility": 0.80, "category_fit": 0.82}',
    'needs_source_check'
  ),
  -- 5: regulatory signal (rejected — not actionable)
  (
    '00000000-0006-0001-0001-000000000005',
    '00000000-0001-0001-0001-000000000002',
    '00000000-0002-0001-0001-000000000005',
    null,
    'regulatory_signal', 'policy_regulatory_signal',
    'Dev: EU GMP Compliance Update Notice (Dev)',
    'Generic EU GMP update reference — insufficient commercial detail. Rejected (dev data).',
    null, 'EU', 'regulatory update',
    null, null, 0.4000, 'model_inference',
    0.3500, 0.7500, 0.2800,
    '{"model_confidence": 0.35, "commercial_actionability": 0.10}',
    'rejected'
  ),
  -- 6: priority review
  (
    '00000000-0006-0001-0001-000000000006',
    '00000000-0001-0001-0001-000000000003',
    '00000000-0002-0001-0001-000000000008',
    null,
    'seller_listing', 'used_surplus',
    'Dev: High-Priority Packaging Opportunity (Dev)',
    'Large volume packaging surplus with confirmed operator — elevated for priority review (fictitious).',
    'Dev Operator XYZ Corp', 'Colorado, USA', 'packaging',
    'US', 'Colorado', 0.9500, 'operator_verification',
    0.9200, 0.8000, 0.9100,
    '{"model_confidence": 0.92, "source_credibility": 0.80, "commercial_actionability": 0.95}',
    'priority_review'
  );
END $$;

-- Update canonical_signal_candidate_id now that candidates exist
UPDATE signal_duplicate_groups
SET canonical_signal_candidate_id = '00000000-0006-0001-0001-000000000001'
WHERE id = '00000000-0005-0001-0001-000000000001';

UPDATE signal_duplicate_groups
SET canonical_signal_candidate_id = '00000000-0006-0001-0001-000000000004'
WHERE id = '00000000-0005-0001-0001-000000000002';

-- ---------------------------------------------------------------------------
-- signal_evidence (8 rows)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO signal_evidence (
    id, signal_candidate_id, source_document_id, source_chunk_id,
    evidence_type, evidence_claim_type, evidence_text, source_url, confidence_score
  ) VALUES
  ('00000000-0007-0001-0001-000000000001', '00000000-0006-0001-0001-000000000001',
   '00000000-0001-0001-0001-000000000001', '00000000-0002-0001-0001-000000000001',
   'listing_text', 'source_statement',
   'Acme Cannabis GmbH (Dev) announces surplus CO₂ extraction units.',
   'https://dev-source-001.example/article/cannabis-equipment-liquidation', 0.8500),

  ('00000000-0007-0001-0001-000000000002', '00000000-0006-0001-0001-000000000001',
   '00000000-0001-0001-0001-000000000001', '00000000-0002-0001-0001-000000000002',
   'specification_detail', 'source_statement',
   'Equipment includes three 10L systems. All units tested and certified.',
   'https://dev-source-001.example/article/cannabis-equipment-liquidation', 0.8200),

  ('00000000-0007-0001-0001-000000000003', '00000000-0006-0001-0001-000000000001',
   null, null,
   'jurisdiction_inference', 'model_inference',
   'Jurisdiction inferred as Bavaria, Germany based on company name and domain. (Dev mock output)',
   null, 0.7800),

  ('00000000-0007-0001-0001-000000000004', '00000000-0006-0001-0001-000000000003',
   '00000000-0001-0001-0001-000000000002', '00000000-0002-0001-0001-000000000004',
   'licence_claim', 'source_statement',
   'Fictitious GmbH Pharma GmbH has received GMP certification.',
   'https://dev-source-002.example/press/new-lp-germany', 0.9000),

  ('00000000-0007-0001-0001-000000000005', '00000000-0006-0001-0001-000000000003',
   '00000000-0001-0001-0001-000000000002', '00000000-0002-0001-0001-000000000005',
   'capacity_detail', 'source_statement',
   'Production capacity: 500kg dried flower per annum. EU-GMP compliant.',
   'https://dev-source-002.example/press/new-lp-germany', 0.8900),

  ('00000000-0007-0001-0001-000000000006', '00000000-0006-0001-0001-000000000004',
   '00000000-0001-0001-0001-000000000003', '00000000-0002-0001-0001-000000000007',
   'supply_claim', 'operator_verification',
   'Dev operator XYZ Corp has 500,000 child-resistant pouches to offload.',
   null, 0.8500),

  ('00000000-0007-0001-0001-000000000007', '00000000-0006-0001-0001-000000000006',
   '00000000-0001-0001-0001-000000000003', '00000000-0002-0001-0001-000000000008',
   'pricing_detail', 'source_statement',
   'Various sizes. Minimum order 10,000 units. POA.',
   null, 0.7500),

  ('00000000-0007-0001-0001-000000000008', '00000000-0006-0001-0001-000000000005',
   '00000000-0001-0001-0001-000000000002', '00000000-0002-0001-0001-000000000006',
   'regulatory_reference', 'source_statement',
   'Available for licensed import partners in UK and EU markets.',
   'https://dev-source-002.example/press/new-lp-germany', 0.6000);
END $$;

-- ---------------------------------------------------------------------------
-- signal_risk_flags (3 rows)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO signal_risk_flags (id, signal_candidate_id, flag, severity, reason)
  VALUES
  (
    '00000000-0008-0001-0001-000000000001',
    '00000000-0006-0001-0001-000000000002',
    'duplicate', 'high',
    'Dev: Near-duplicate of candidate 001 — same source domain and chunk window.'
  ),
  (
    '00000000-0008-0001-0001-000000000002',
    '00000000-0006-0001-0001-000000000005',
    'insufficient_evidence', 'medium',
    'Dev: Regulatory signal with no actionable commercial detail.'
  ),
  (
    '00000000-0008-0001-0001-000000000003',
    '00000000-0006-0001-0001-000000000001',
    'unverified_licence_claim', 'low',
    'Dev: Operator licence status not independently confirmed.'
  );
END $$;

-- ---------------------------------------------------------------------------
-- model_call_logs (2 rows)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO model_call_logs (
    id, provider, model_name, model_task, prompt_version_id,
    input_hash, input_excerpt, output_json, latency_ms, token_or_unit_count, status
  ) VALUES
  (
    '00000000-0009-0001-0001-000000000001',
    'mock', 'dev-mock-classifier', 'signal_classification',
    '00000000-0004-0001-0001-000000000001',
    'devhash001aabbcc', 'Acme Cannabis GmbH (Dev) announces surplus CO₂...',
    '{"signal_type": "used_equipment", "marketplace_category": "used_surplus", "confidence": 0.78}',
    142, 48, 'mock'
  ),
  (
    '00000000-0009-0001-0001-000000000002',
    'mock', 'dev-mock-ner', 'entity_recognition',
    '00000000-0004-0001-0001-000000000003',
    'devhash002ddeeff', 'Fictitious GmbH Pharma GmbH has received GMP...',
    '{"entities": [{"name": "Fictitious GmbH Pharma GmbH", "type": "operator"}]}',
    98, 32, 'mock'
  );
END $$;

-- ---------------------------------------------------------------------------
-- signal_jobs (2 rows)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO signal_jobs (
    id, job_type, target_type, target_id, status, attempts,
    scheduled_at, completed_at, metadata
  ) VALUES
  (
    '00000000-0010-0001-0001-000000000001',
    'embed_chunk', 'source_chunk',
    '00000000-0002-0001-0001-000000000001',
    'completed', 1,
    now() - interval '1 hour', now() - interval '59 minutes',
    '{"model": "mock-embed-384", "dev": true}'
  ),
  (
    '00000000-0010-0001-0001-000000000002',
    'classify_signal', 'signal_candidate',
    '00000000-0006-0001-0001-000000000004',
    'queued', 0,
    now() + interval '5 minutes', null,
    '{"priority": "normal", "dev": true}'
  );
END $$;

-- ---------------------------------------------------------------------------
-- signal_entity_mentions (2 rows)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO signal_entity_mentions (
    id, signal_candidate_id, entity_id, mentioned_name, mention_role, confidence_score
  ) VALUES
  (
    '00000000-0011-0001-0001-000000000001',
    '00000000-0006-0001-0001-000000000001',
    '00000000-0003-0001-0001-000000000001',
    'Acme Cannabis GmbH (Dev)', 'seller', 0.8500
  ),
  (
    '00000000-0011-0001-0001-000000000002',
    '00000000-0006-0001-0001-000000000004',
    '00000000-0003-0001-0001-000000000002',
    'Dev Operator XYZ Corp', 'seller', 0.9200
  );
END $$;

-- ---------------------------------------------------------------------------
-- signal_conversions (1 row)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO signal_conversions (
    id, signal_candidate_id, conversion_type,
    converted_record_id, converted_record_table, conversion_notes
  ) VALUES
  (
    '00000000-0012-0001-0001-000000000001',
    '00000000-0006-0001-0001-000000000003',
    'marketplace_listing',
    null, 'marketplace_listings',
    'Dev: Approved German LP signal queued for manual listing creation (fictitious). cannabis_inventory type maps to marketplace_listing.'
  );
END $$;

-- ---------------------------------------------------------------------------
-- signal_processing_errors (1 row)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO signal_processing_errors (
    id, signal_job_id, source_document_id, signal_candidate_id,
    error_code, error_message, error_context, resolved
  ) VALUES
  (
    '00000000-0013-0001-0001-000000000001',
    '00000000-0010-0001-0001-000000000001',
    '00000000-0001-0001-0001-000000000001',
    null,
    'EMBED_DIM_MISMATCH',
    'Dev: Mock embedding returned 768 dimensions; table expects 384.',
    '{"expected_dim": 384, "received_dim": 768, "dev": true}',
    false
  );
END $$;

COMMIT;
