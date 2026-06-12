-- =============================================================================
-- Intelligence Automation Tables V1
-- Backing store for /admin/intelligence-automation/* pages.
-- All tables are admin/operator-only (no public read).
-- =============================================================================

-- ── ia_sources ────────────────────────────────────────────────────────────────
-- Maps to AutomationSource. Source registry for intelligence acquisition.
CREATE TABLE IF NOT EXISTS ia_sources (
  id                  text        PRIMARY KEY,
  name                text        NOT NULL,
  category            text        NOT NULL,
  markets             text[]      NOT NULL DEFAULT '{}',
  reliability         text        NOT NULL DEFAULT 'medium'
                                    CHECK (reliability IN ('high','medium','low','unverified')),
  last_checked        date,
  next_check          date,
  signal_yield        integer     NOT NULL DEFAULT 0,
  status              text        NOT NULL DEFAULT 'active'
                                    CHECK (status IN ('active','paused','needs_review','deprecated')),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_sources ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_sources_admin_operator_all on ia_sources;
CREATE POLICY ia_sources_admin_operator_all ON ia_sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_signals ────────────────────────────────────────────────────────────────
-- Maps to AutomationSignal. Generated commercial signals from source observations.
CREATE TABLE IF NOT EXISTS ia_signals (
  id                  text        PRIMARY KEY,
  title               text        NOT NULL,
  type                text        NOT NULL,
  stage               text        NOT NULL DEFAULT 'new'
                                    CHECK (stage IN (
                                      'new','needs_review','qualified',
                                      'converted_to_opportunity','linked_to_counterparty',
                                      'linked_to_market_pathway','archived'
                                    )),
  source_id           text        REFERENCES ia_sources(id) ON DELETE SET NULL,
  source_name         text        NOT NULL,
  market              text        NOT NULL,
  category            text        NOT NULL,
  confidence          integer     NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  commercial_impact   text        NOT NULL DEFAULT 'medium'
                                    CHECK (commercial_impact IN ('high','medium','low')),
  summary             text        NOT NULL,
  detected_at         date        NOT NULL DEFAULT CURRENT_DATE,
  reviewed_at         date,
  reviewed_by         uuid,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_signals ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_signals_admin_operator_all on ia_signals;
CREATE POLICY ia_signals_admin_operator_all ON ia_signals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_counterparties ─────────────────────────────────────────────────────────
-- Maps to RelationshipMemoryRecord. Persistent counterparty memory.
CREATE TABLE IF NOT EXISTS ia_counterparties (
  id                    text        PRIMARY KEY,
  name                  text        NOT NULL,
  role                  text        NOT NULL,
  markets               text[]      NOT NULL DEFAULT '{}',
  categories            text[]      NOT NULL DEFAULT '{}',
  needs_profile         text,
  supply_profile        text,
  interaction_count     integer     NOT NULL DEFAULT 0,
  last_interaction      date,
  introduction_count    integer     NOT NULL DEFAULT 0,
  documentation_status  text        NOT NULL DEFAULT 'missing'
                                      CHECK (documentation_status IN ('complete','partial','missing')),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_counterparties ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_counterparties_admin_operator_all on ia_counterparties;
CREATE POLICY ia_counterparties_admin_operator_all ON ia_counterparties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_scoring_records ────────────────────────────────────────────────────────
-- Maps to ScoringRecord. Fit/readiness/trust scores for counterparties.
CREATE TABLE IF NOT EXISTS ia_scoring_records (
  id                        text        PRIMARY KEY,
  counterparty_id           text        REFERENCES ia_counterparties(id) ON DELETE CASCADE,
  counterparty_name         text        NOT NULL,
  counterparty_role         text        NOT NULL,
  fit_score                 integer     NOT NULL DEFAULT 0 CHECK (fit_score BETWEEN 0 AND 100),
  readiness_score           integer     NOT NULL DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  trust_score               integer     NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  routing_priority          text        NOT NULL DEFAULT 'low'
                                          CHECK (routing_priority IN ('high','medium','low')),
  follow_up_priority        text        NOT NULL DEFAULT 'when_ready'
                                          CHECK (follow_up_priority IN ('urgent','soon','when_ready','dormant')),
  introduction_priority     text        NOT NULL DEFAULT 'not_ready'
                                          CHECK (introduction_priority IN ('high','medium','low','not_ready')),
  market_access_relevance   text[]      NOT NULL DEFAULT '{}',
  scored_at                 date        NOT NULL DEFAULT CURRENT_DATE,
  score_drivers             text[]      NOT NULL DEFAULT '{}',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_scoring_records ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_scoring_admin_operator_all on ia_scoring_records;
CREATE POLICY ia_scoring_admin_operator_all ON ia_scoring_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_agent_tasks ────────────────────────────────────────────────────────────
-- Maps to AgentWorkItem. Agent work queue tasks.
CREATE TABLE IF NOT EXISTS ia_agent_tasks (
  id                text        PRIMARY KEY,
  queue             text        NOT NULL,
  title             text        NOT NULL,
  object_type       text        NOT NULL,
  object_label      text        NOT NULL,
  priority          text        NOT NULL DEFAULT 'medium'
                                  CHECK (priority IN ('urgent','high','medium','low')),
  suggested_action  text        NOT NULL,
  rationale         text        NOT NULL,
  status            text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','in_progress','completed','escalated','deferred')),
  agent_label       text        NOT NULL,
  next_action       text        NOT NULL,
  completed_at      timestamptz,
  completed_by      uuid,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_agent_tasks ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_agent_tasks_admin_operator_all on ia_agent_tasks;
CREATE POLICY ia_agent_tasks_admin_operator_all ON ia_agent_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_evidence_vault ─────────────────────────────────────────────────────────
-- Maps to EvidenceVaultEntry. Private evidence documents linked to counterparties.
CREATE TABLE IF NOT EXISTS ia_evidence_vault (
  id                        text        PRIMARY KEY,
  title                     text        NOT NULL,
  type                      text        NOT NULL,
  linked_counterparty_id    text        REFERENCES ia_counterparties(id) ON DELETE SET NULL,
  linked_counterparty_name  text,
  linked_market             text,
  review_status             text        NOT NULL DEFAULT 'pending'
                                          CHECK (review_status IN ('pending','reviewed','needs_action','archived')),
  tags                      text[]      NOT NULL DEFAULT '{}',
  notes                     text,
  added_at                  date        NOT NULL DEFAULT CURRENT_DATE,
  reviewed_at               timestamptz,
  reviewed_by               uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_evidence_vault ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_evidence_admin_operator_all on ia_evidence_vault;
CREATE POLICY ia_evidence_admin_operator_all ON ia_evidence_vault
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_graph_entities ─────────────────────────────────────────────────────────
-- Maps to GraphEntity. Market graph nodes.
CREATE TABLE IF NOT EXISTS ia_graph_entities (
  id               text        PRIMARY KEY,
  type             text        NOT NULL,
  label            text        NOT NULL,
  market           text,
  category         text,
  connection_count integer     NOT NULL DEFAULT 0,
  signal_count     integer     NOT NULL DEFAULT 0,
  last_activity    date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_graph_entities ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_graph_entities_admin_operator_all on ia_graph_entities;
CREATE POLICY ia_graph_entities_admin_operator_all ON ia_graph_entities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_graph_edges ────────────────────────────────────────────────────────────
-- Maps to GraphEdge. Market graph edges (relationships between entities).
CREATE TABLE IF NOT EXISTS ia_graph_edges (
  id          text        PRIMARY KEY,
  type        text        NOT NULL,
  from_label  text        NOT NULL,
  to_label    text        NOT NULL,
  strength    text        NOT NULL DEFAULT 'medium'
                            CHECK (strength IN ('strong','medium','weak')),
  evidenced   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_graph_edges ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_graph_edges_admin_operator_all on ia_graph_edges;
CREATE POLICY ia_graph_edges_admin_operator_all ON ia_graph_edges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── ia_feedback_events ────────────────────────────────────────────────────────
-- Maps to FeedbackEvent. Outcome events that close the commercial intelligence loop.
CREATE TABLE IF NOT EXISTS ia_feedback_events (
  id                  text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  outcome_type        text        NOT NULL,
  counterparty_name   text,
  market              text        NOT NULL,
  category            text        NOT NULL,
  score_impact        text        NOT NULL DEFAULT 'neutral'
                                    CHECK (score_impact IN ('positive','negative','neutral')),
  routing_impact      text        NOT NULL,
  notes               text,
  logged_at           date        NOT NULL DEFAULT CURRENT_DATE,
  logged_by           uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ia_feedback_events ENABLE ROW LEVEL SECURITY;

drop policy if exists ia_feedback_admin_operator_all on ia_feedback_events;
CREATE POLICY ia_feedback_admin_operator_all ON ia_feedback_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','operator')
    )
  );

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ia_signals_stage       ON ia_signals(stage);
CREATE INDEX IF NOT EXISTS idx_ia_signals_market      ON ia_signals(market);
CREATE INDEX IF NOT EXISTS idx_ia_signals_detected_at ON ia_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_sources_status      ON ia_sources(status);
CREATE INDEX IF NOT EXISTS idx_ia_counterparties_role ON ia_counterparties(role);
CREATE INDEX IF NOT EXISTS idx_ia_scoring_fit         ON ia_scoring_records(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_ia_agent_tasks_priority ON ia_agent_tasks(priority, status);
CREATE INDEX IF NOT EXISTS idx_ia_evidence_review     ON ia_evidence_vault(review_status);
CREATE INDEX IF NOT EXISTS idx_ia_graph_entities_type ON ia_graph_entities(type);
CREATE INDEX IF NOT EXISTS idx_ia_feedback_logged_at  ON ia_feedback_events(logged_at DESC);

-- =============================================================================
-- SEED: Insert fixture data so pages have live data immediately.
-- All inserts use ON CONFLICT DO NOTHING so re-running is safe.
-- =============================================================================

INSERT INTO ia_sources (id, name, category, markets, reliability, last_checked, next_check, signal_yield, status, notes)
VALUES
  ('src-001','BfArM Medical Cannabis Registry','cannabis_licence_database','{Germany}','high','2026-05-27','2026-06-03',8,'active','Validate before live fetch.'),
  ('src-002','UK Home Office Controlled Medicines','regulator_updates','{United Kingdom}','high','2026-05-25','2026-06-01',5,'active',NULL),
  ('src-003','INFARMED Portugal Licence Register','cannabis_licence_database','{Portugal}','medium','2026-05-20','2026-05-27',4,'needs_review',NULL),
  ('src-004','Health Canada Cannabis Act Registry','cannabis_licence_database','{Canada}','high','2026-05-28','2026-06-04',12,'active',NULL),
  ('src-005','EU Importers Directory — Medical Cannabis','importer_distributor_list','{Germany,Netherlands,Poland}','medium','2026-05-15','2026-06-15',7,'active',NULL),
  ('src-006','TGA Therapeutic Goods Register','regulator_updates','{Australia}','high','2026-05-22','2026-05-29',3,'active',NULL),
  ('src-007','BioEurope Conference Exhibitor List','conference_exhibitor','{Germany,United Kingdom,Netherlands}','medium','2026-04-10','2026-10-01',6,'paused',NULL),
  ('src-008','Colombia MinSalud Cannabis Export Registry','cannabis_licence_database','{Colombia}','low','2026-05-01','2026-06-01',2,'needs_review',NULL),
  ('src-009','Israeli Medical Cannabis Export Authority','government_notices','{Israel}','medium','2026-05-10','2026-05-24',3,'active',NULL),
  ('src-010','CannabisTech Equipment Surplus Listings','auction_surplus','{Canada,United States}','low','2026-05-26','2026-06-02',4,'active',NULL),
  ('src-011','EU GMP Packaging Supplier Directory','packaging_supplier','{Germany,Netherlands,Portugal}','medium','2026-05-18','2026-06-18',2,'active',NULL),
  ('src-012','MJBizCon LATAM Operator Profiles','conference_exhibitor','{Colombia,Brazil,Mexico}','low','2026-03-15','2026-11-01',5,'paused',NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_signals (id, title, type, stage, source_id, source_name, market, category, confidence, commercial_impact, summary, detected_at, reviewed_at)
VALUES
  ('sig-001','Germany BfArM updates prescription pathway for flower formats','regulatory_change','needs_review','src-001','BfArM Medical Cannabis Registry','Germany','cannabis inventory',82,'high','BfArM has issued updated guidance on flower-format prescriptions, expanding qualifying conditions. Creates immediate demand signal for EU-GMP certified flower supply.','2026-05-26',NULL),
  ('sig-002','UK importer adds Canada as preferred origin country','importer_activity','qualified','src-002','UK Home Office Controlled Medicines','United Kingdom','cannabis inventory',74,'high','A major UK licensed importer has updated procurement preferences to include Canadian-origin product, signalling a sourcing opportunity for Canadian exporters with EU-GMP certification.','2026-05-24','2026-05-25'),
  ('sig-003','Portuguese producer achieves EU-GMP certification','documentation_readiness','converted_to_opportunity','src-003','INFARMED Portugal Licence Register','Portugal','cannabis inventory',91,'high','A mid-sized Portuguese operator has published EU-GMP certification for their outdoor biomass facility. High-priority for buyer/importer matching in Germany and Netherlands.','2026-05-20','2026-05-21'),
  ('sig-004','Decommissioned CO2 extraction line available — Ontario, Canada','equipment_surplus','new','src-010','CannabisTech Equipment Surplus Listings','Canada','equipment',68,'medium','A Canadian producer is liquidating a GMP-grade CO2 extraction line. Equipment qualifies for European deployment. Potential match for EU buyers seeking cost-effective extraction capacity.','2026-05-27',NULL),
  ('sig-005','Netherlands distributor seeking isolate and distillate supply','buyer_demand','qualified','src-005','EU Importers Directory — Medical Cannabis','Netherlands','cannabis inventory',77,'high','A Dutch licensed distributor is actively seeking consistent THC distillate and CBD isolate supply from EU-GMP or equivalent facilities. Minimum 100kg per month.','2026-05-22','2026-05-23'),
  ('sig-006','Australia TGA approves new qualifying condition — chronic pain expanded','regulatory_change','needs_review','src-006','TGA Therapeutic Goods Register','Australia','cannabis inventory',85,'medium','TGA has expanded SAS Category B eligibility to include a broader chronic pain definition. Expected to increase prescription volume by 20-30% across flower and oil formats.','2026-05-22',NULL),
  ('sig-007','Israeli exporter actively seeking EU distribution partner','relationship_opportunity','new','src-009','Israeli Medical Cannabis Export Authority','Israel','cannabis inventory',65,'medium','A licensed Israeli medical cannabis exporter has publicly noted intent to establish EU distribution agreements. EU-GMP facility, COAs available. Target: Germany, Netherlands.','2026-05-25',NULL),
  ('sig-008','Colombia biomass pricing drop — large volume available Q3','pricing_availability','needs_review','src-008','Colombia MinSalud Cannabis Export Registry','Colombia','cannabis inventory',58,'medium','Multiple Colombian GACP-certified biomass producers are reporting Q3 inventory surplus. Pricing has dropped 15% below market. GACP documentation available but EU-GMP extraction needed.','2026-05-19',NULL),
  ('sig-009','New BioEurope exhibitor specialising in EU-GMP packaging for medical cannabis','new_product_category','archived','src-007','BioEurope Conference Exhibitor List','Germany','packaging',72,'low','A BioEurope exhibitor specialises in pharmaceutical-grade cannabis packaging compliant with EU GMP Annex 16. Potential supplier for EU operators seeking compliant primary packaging.','2026-04-10','2026-04-12'),
  ('sig-010','Polish pharmacy operator group expanding medical cannabis formulary','distributor_activity','qualified','src-005','EU Importers Directory — Medical Cannabis','Poland','cannabis inventory',71,'medium','A Polish pharmacy group (40+ locations) is expanding its medical cannabis formulary to include additional flower strains and oil formats. Sourcing outreach expected in Q3.','2026-05-16','2026-05-18'),
  ('sig-011','Canadian LP achieves EU-GMP certification for dried flower export','documentation_readiness','needs_review','src-004','Health Canada Cannabis Act Registry','Canada','cannabis inventory',88,'high','A mid-sized Canadian LP has achieved EU-GMP certification for their dried flower production facility. High demand signal for European buyers.','2026-05-27',NULL),
  ('sig-012','UK buyer demand for high-CBD oil — consistent monthly supply','buyer_demand','new','src-002','UK Home Office Controlled Medicines','United Kingdom','cannabis inventory',69,'medium','UK licensed operator seeking consistent high-CBD oil supply from EU-adjacent source. Minimum 5L/month pharmaceutical-grade.','2026-05-28',NULL),
  ('sig-013','Portugal genetics facility expanding seed export capacity','facility_expansion','new','src-003','INFARMED Portugal Licence Register','Portugal','genetics',62,'low','A Portuguese licensed genetics operation is expanding certified seed export capacity. Phytosanitary certification update expected Q2 2026.','2026-05-24',NULL),
  ('sig-014','EU GMP logistics provider adds cold-chain cannabis transport service','new_product_category','needs_review','src-011','EU GMP Packaging Supplier Directory','Germany','services',73,'medium','A European logistics company has added a dedicated temperature-controlled cannabis transport service with GDP certification. Covers Germany-Netherlands-Portugal route.','2026-05-21',NULL),
  ('sig-015','Colombian distressed asset — extraction facility for sale','distressed_asset','new','src-008','Colombia MinSalud Cannabis Export Registry','Colombia','equipment',55,'medium','A Colombian extraction operator is selling a complete ethanol extraction and distillation facility. GACP-certified biomass feedstock also available. Early-stage signal.','2026-05-26',NULL),
  ('sig-016','Australia supply gap — indoor-grown high-THC flower','market_entry_opportunity','qualified','src-006','TGA Therapeutic Goods Register','Australia','cannabis inventory',79,'high','TGA prescription data indicates consistent supply shortage for indoor-grown high-THC flower formats (>25% THC). Canadian and Portuguese operators with qualifying products have a near-term entry opportunity.','2026-05-20','2026-05-22')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_counterparties (id, name, role, markets, categories, needs_profile, supply_profile, interaction_count, last_interaction, introduction_count, documentation_status, notes)
VALUES
  ('rm-001','Rheingold Medical GmbH','importer','{Germany}','{cannabis inventory}','EU-GMP flower and oil, THC >18%, consistent monthly supply, COA mandatory',NULL,4,'2026-05-10',1,'partial','Prefers Canadian and Portuguese origin. Requires full COA package before any review.'),
  ('rm-002','CannaLeaf Exports Ltd','seller','{Canada}','{cannabis inventory}',NULL,'EU-GMP certified dried flower, 3 strains, 200kg/month available',6,'2026-05-20',2,'complete','Strong documentation package. Actively seeking EU distribution.'),
  ('rm-003','PharmaDist Netherlands BV','distributor','{Netherlands,Germany,Poland}','{cannabis inventory,services}','Consistent oil and isolate, pharmaceutical-grade, EU-GMP required',NULL,3,'2026-05-15',1,'partial',NULL),
  ('rm-004','GreenMed Portugal SA','seller','{Portugal}','{cannabis inventory,genetics}',NULL,'GACP biomass, EU-GMP oil, seed genetics. Export-ready Q2 2026.',2,'2026-05-01',0,'partial','Recently EU-GMP certified. First contact for EU buyer introductions.'),
  ('rm-005','UK MedAccess Ltd','importer','{United Kingdom}','{cannabis inventory}','SAS Category B qualifying products, high-CBD oil, consistent supply chain',NULL,5,'2026-05-18',2,'complete',NULL),
  ('rm-006','CanPack EU Solutions','packaging_supplier','{Germany,Netherlands,Portugal}','{packaging}',NULL,'EU GMP Annex 16 compliant primary packaging for medical cannabis',2,'2026-04-20',0,'complete',NULL),
  ('rm-007','Tel Aviv Medical Exports','seller','{Israel}','{cannabis inventory}',NULL,'EU-GMP flower and extracts, COA available, targeting Germany and Netherlands',1,'2026-05-25',0,'partial','Early relationship. Needs import partner introduction.'),
  ('rm-008','EuroCanna Compliance GmbH','consultant','{Germany,Austria,Switzerland}','{services}',NULL,NULL,8,'2026-05-22',5,'complete','High-value advisor. Broad network across German medical market.'),
  ('rm-009','BioLatam Exports','seller','{Colombia,Brazil}','{cannabis inventory}',NULL,'GACP biomass large volume, competitive pricing, seeking EU extraction partners',2,'2026-05-05',0,'missing','Needs EU-GMP extraction partner before EU market access.'),
  ('rm-010','GreenPath Logistics EU','logistics_provider','{Germany,Netherlands,Portugal}','{services}',NULL,NULL,3,'2026-05-21',1,'complete',NULL),
  ('rm-011','Australian MedGreen Imports','buyer','{Australia}','{cannabis inventory}','Indoor high-THC flower, TGA-registered, consistent supply, 50kg+/month',NULL,2,'2026-05-22',0,'partial',NULL),
  ('rm-012','Nordic Pharma Distributors','distributor','{Denmark,Sweden,Norway}','{cannabis inventory}','Medical-grade oil and flower, EU-GMP, pharmacy distribution qualified',NULL,1,'2026-04-15',0,'missing','Early stage. Explore pathway requirements for Nordic markets.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_scoring_records (id, counterparty_id, counterparty_name, counterparty_role, fit_score, readiness_score, trust_score, routing_priority, follow_up_priority, introduction_priority, market_access_relevance, scored_at, score_drivers)
VALUES
  ('score-001','rm-001','Rheingold Medical GmbH','importer',88,72,79,'high','soon','high','{Germany,"EU medical"}','2026-05-25','{Strong market position,Active procurement,Partial docs — COA gap}'),
  ('score-002','rm-002','CannaLeaf Exports Ltd','seller',91,95,85,'high','urgent','high','{EU medical,Germany,UK}','2026-05-26','{Complete documentation,EU-GMP certified,Multiple successful interactions}'),
  ('score-003','rm-003','PharmaDist Netherlands BV','distributor',82,68,74,'high','soon','medium','{Netherlands,Germany,Poland}','2026-05-24','{Multi-market reach,Partial docs,Active demand signal}'),
  ('score-004','rm-004','GreenMed Portugal SA','seller',76,65,62,'medium','soon','medium','{Portugal,EU export}','2026-05-20','{Recently certified,Low interaction count,Strong potential}'),
  ('score-005','rm-005','UK MedAccess Ltd','importer',87,88,83,'high','soon','high','{United Kingdom,EU adjacent}','2026-05-25','{Complete documentation,Active import pipeline,Consistent responsiveness}'),
  ('score-006','rm-007','Tel Aviv Medical Exports','seller',64,58,51,'medium','when_ready','medium','{Israel,EU medical}','2026-05-26','{Early relationship,Partial docs,Needs import partner}'),
  ('score-007','rm-008','EuroCanna Compliance GmbH','consultant',94,96,92,'high','soon','high','{Germany,Austria,Switzerland}','2026-05-27','{Deep network,High intro success rate,Complete docs}'),
  ('score-008','rm-009','BioLatam Exports','seller',52,35,44,'low','when_ready','not_ready','{Colombia,LATAM}','2026-05-20','{Missing EU-GMP,No extraction partner,Large supply potential}'),
  ('score-009','rm-010','GreenPath Logistics EU','logistics_provider',79,85,77,'medium','when_ready','medium','{Germany,Netherlands,Portugal}','2026-05-22','{GDP certified,Multi-market coverage,One confirmed introduction}'),
  ('score-010','rm-011','Australian MedGreen Imports','buyer',74,66,68,'medium','soon','medium','{Australia}','2026-05-23','{Active procurement,Partial docs,Market supply gap}'),
  ('score-011','rm-006','CanPack EU Solutions','packaging_supplier',70,88,72,'medium','when_ready','low','{Germany,Netherlands}','2026-05-21','{GMP compliant product,Low interaction frequency,Niche fit}'),
  ('score-012','rm-012','Nordic Pharma Distributors','distributor',58,42,45,'low','dormant','not_ready','{Denmark,Sweden,Norway}','2026-04-16','{Single interaction,Missing docs,Nordic pathway complexity}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_agent_tasks (id, queue, title, object_type, object_label, priority, suggested_action, rationale, status, agent_label, next_action, created_at)
VALUES
  ('aq-001','buyer_seller_matcher','Match CannaLeaf Exports to Rheingold Medical — EU-GMP flower','counterparty_pair','CannaLeaf x Rheingold','urgent','Prepare intro brief — all documentation complete, fit score 88+','CannaLeaf EU-GMP certified flower matches Rheingold active procurement. Both have history with Harbourview.','pending','Buyer/Seller Matcher','Draft intro packet','2026-05-27 00:00:00+00'),
  ('aq-002','signal_analyst','Review BfArM flower pathway update signal','signal','sig-001','high','Assess commercial impact for active German importer relationships','Regulatory change creates immediate demand uplift. Action window: 2 weeks.','in_progress','Signal Analyst','Update Rheingold brief with signal context','2026-05-26 00:00:00+00'),
  ('aq-003','opportunity_qualifier','Qualify Portuguese EU-GMP certification signal','signal','sig-003','high','Convert to opportunity — match to active Netherlands distributor demand','Signal already at converted_to_opportunity stage. Create formal opportunity record.','pending','Opportunity Qualifier','Create opportunity from sig-003 + rm-003','2026-05-21 00:00:00+00'),
  ('aq-004','document_reviewer','Request missing COA package from Rheingold Medical','counterparty','rm-001','high','Send COA checklist request — COA, stability data, spec sheet','rm-001 documentation status partial. COA gap blocking introduction.','pending','Document Reviewer','Draft document request','2026-05-25 00:00:00+00'),
  ('aq-005','source_watcher','Review INFARMED needs_review status — Portugal source','source','src-003','medium','Validate source reliability — check access permissions before next crawl cycle','src-003 marked needs_review. Signal yield declining.','pending','Source Watcher','Validate and update source status','2026-05-24 00:00:00+00'),
  ('aq-006','follow_up_assistant','Follow up with GreenMed Portugal — first EU buyer introduction','counterparty','rm-004','medium','Warm introduction to Netherlands distributor pending documentation review','GreenMed recently EU-GMP certified. 0 introductions to date. Ready for first match.','pending','Follow-Up Assistant','Draft GreenMed follow-up message','2026-05-22 00:00:00+00'),
  ('aq-007','importer_distributor_router','Route Israeli exporter to German importer pathway','signal','sig-007','medium','Identify qualifying German importer for Tel Aviv Medical Exports introduction','Israeli exporter actively seeking EU distribution. EU-GMP facility. Rheingold may qualify.','pending','Importer/Distributor Router','Assess Rheingold fit for Israeli product','2026-05-26 00:00:00+00'),
  ('aq-008','public_card_generator','Generate public supply card — CannaLeaf EU-GMP flower','counterparty','rm-002','medium','Create anonymised marketplace supply listing from rm-002 supply profile','CannaLeaf documentation complete. Public card generation ready.','pending','Public Card Generator','Draft marketplace card from rm-002 profile','2026-05-27 00:00:00+00'),
  ('aq-009','signal_analyst','Assess Australia supply gap signal — high-THC flower','signal','sig-016','high','Identify Canadian or Portuguese sellers qualified for TGA registration route','sig-016 qualified status. Clear supply gap. 2 active sellers may qualify.','in_progress','Signal Analyst','Match sig-016 to rm-002 and rm-004','2026-05-22 00:00:00+00'),
  ('aq-010','deal_flow_copilot','Review stalled Colombian biomass signal','signal','sig-008','low','Assess EU-GMP extraction partner options for Colombian biomass conversion','sig-008 needs_review. Colombian supply available but EU-GMP gap limits routing options.','deferred','Deal Flow Copilot','Identify EU extraction partner candidates','2026-05-21 00:00:00+00'),
  ('aq-011','opportunity_qualifier','Qualify Canadian LP EU-GMP certification signal','signal','sig-011','high','Convert to opportunity — match to active UK and German importer demand','sig-011 needs_review. High confidence (88). Match to rm-001 and rm-005.','pending','Opportunity Qualifier','Create opportunity from sig-011','2026-05-27 00:00:00+00'),
  ('aq-012','document_reviewer','Chase GreenMed Portugal documentation completion','counterparty','rm-004','medium','Request COA and spec sheet — partial docs blocking first introduction','rm-004 partial documentation status. Newly EU-GMP certified. High potential.','pending','Document Reviewer','Send documentation checklist to rm-004','2026-05-20 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_evidence_vault (id, title, type, linked_counterparty_name, linked_market, review_status, tags, notes, added_at)
VALUES
  ('ev-001','CannaLeaf Exports — EU-GMP Certificate of Compliance','eu_gmp_document','CannaLeaf Exports Ltd','Canada','reviewed','{eu-gmp,canada,flower,critical}',NULL,'2026-05-10'),
  ('ev-002','Rheingold Medical — COA Request Checklist','commercial_note','Rheingold Medical GmbH','Germany','needs_action','{germany,importer,coa-gap,urgent}','COA missing for 2 of 3 requested strains.','2026-05-20'),
  ('ev-003','GreenMed Portugal — INFARMED Licence Certificate','licence_document','GreenMed Portugal SA','Portugal','reviewed','{portugal,licence,eu-gmp,seller}',NULL,'2026-05-02'),
  ('ev-004','BfArM Regulatory Update — Flower Pathway Guidance May 2026','regulator_notice',NULL,'Germany','needs_action','{germany,regulatory,urgent,flower}',NULL,'2026-05-26'),
  ('ev-005','EuroCanna Compliance — Market Access Advisory Note Q2 2026','meeting_note','EuroCanna Compliance GmbH','Germany','reviewed','{germany,advisor,market-access}',NULL,'2026-05-22'),
  ('ev-006','CannaLeaf Exports — Product Specification Sheet (3 strains)','spec_sheet','CannaLeaf Exports Ltd','Canada','reviewed','{canada,spec-sheet,flower,complete}',NULL,'2026-05-12'),
  ('ev-007','Netherlands Distributor — Isolate and Distillate Demand Brief','commercial_note','PharmaDist Netherlands BV','Netherlands','reviewed','{netherlands,demand,isolate,distillate}',NULL,'2026-05-23'),
  ('ev-008','Australian MedGreen — TGA Import Requirements Summary','import_document','Australian MedGreen Imports','Australia','pending','{australia,tga,import,flower}',NULL,'2026-05-22'),
  ('ev-009','Colombian Biomass — GACP Certificate Package','gacp_document','BioLatam Exports','Colombia','pending','{colombia,gacp,biomass}','EU-GMP extraction still needed before EU routing.','2026-05-05'),
  ('ev-010','UK MedAccess — SAS Category B Product Requirements','commercial_note','UK MedAccess Ltd','United Kingdom','reviewed','{uk,sas,requirements,complete}',NULL,'2026-05-19'),
  ('ev-011','GreenPath Logistics — GDP Certification Summary','licence_document','GreenPath Logistics EU','Germany','reviewed','{logistics,gdp,germany,netherlands}',NULL,'2026-05-21'),
  ('ev-012','Tel Aviv Medical Exports — EU-GMP Facility Overview','eu_gmp_document','Tel Aviv Medical Exports','Israel','pending','{israel,eu-gmp,seller,pending-review}',NULL,'2026-05-25')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_graph_entities (id, type, label, market, category, connection_count, signal_count, last_activity)
VALUES
  ('ge-001','market','Germany',NULL,NULL,12,8,'2026-05-27'),
  ('ge-002','market','United Kingdom',NULL,NULL,8,5,'2026-05-28'),
  ('ge-003','market','Portugal',NULL,NULL,6,4,'2026-05-24'),
  ('ge-004','market','Canada',NULL,NULL,9,6,'2026-05-28'),
  ('ge-005','market','Australia',NULL,NULL,5,3,'2026-05-22'),
  ('ge-006','market','Netherlands',NULL,NULL,7,4,'2026-05-25'),
  ('ge-007','market','Colombia',NULL,NULL,4,3,'2026-05-26'),
  ('ge-008','importer','Rheingold Medical GmbH','Germany',NULL,5,2,'2026-05-25'),
  ('ge-009','seller','CannaLeaf Exports Ltd','Canada',NULL,6,1,'2026-05-26'),
  ('ge-010','distributor','PharmaDist Netherlands BV','Netherlands',NULL,4,2,'2026-05-23'),
  ('ge-011','seller','GreenMed Portugal SA','Portugal',NULL,3,2,'2026-05-20'),
  ('ge-012','importer','UK MedAccess Ltd','United Kingdom',NULL,5,1,'2026-05-25'),
  ('ge-013','pathway','EU-GMP Medical Import — Germany','Germany',NULL,8,4,'2026-05-27'),
  ('ge-014','pathway','SAS Category B — United Kingdom','United Kingdom',NULL,5,2,'2026-05-25'),
  ('ge-015','pathway','TGA Special Access — Australia','Australia',NULL,4,3,'2026-05-22'),
  ('ge-016','category','Cannabis Inventory — Flower',NULL,'Cannabis Inventory',14,9,NULL),
  ('ge-017','category','Cannabis Inventory — Extracts / Oil',NULL,'Cannabis Inventory',8,4,NULL),
  ('ge-018','category','Equipment',NULL,'Equipment',5,2,NULL),
  ('ge-019','source','BfArM Medical Cannabis Registry','Germany',NULL,3,8,'2026-05-27'),
  ('ge-020','consultant','EuroCanna Compliance GmbH','Germany',NULL,7,0,'2026-05-22')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_graph_edges (id, type, from_label, to_label, strength, evidenced, created_at)
VALUES
  ('edge-001','imports_to','CannaLeaf Exports Ltd','Germany','strong',true,'2026-05-10'),
  ('edge-002','active_in','Rheingold Medical GmbH','Germany','strong',true,'2026-04-01'),
  ('edge-003','matched_to','CannaLeaf Exports Ltd','Rheingold Medical GmbH','strong',true,'2026-05-20'),
  ('edge-004','belongs_to_pathway','CannaLeaf Exports Ltd','EU-GMP Medical Import — Germany','strong',true,'2026-05-10'),
  ('edge-005','requires_document','EU-GMP Medical Import — Germany','Cannabis Inventory — Flower','strong',true,'2026-04-01'),
  ('edge-006','generated_signal','BfArM Medical Cannabis Registry','Germany','strong',true,'2026-05-26'),
  ('edge-007','active_in','GreenMed Portugal SA','Portugal','medium',true,'2026-05-02'),
  ('edge-008','matched_to','GreenMed Portugal SA','PharmaDist Netherlands BV','medium',false,'2026-05-22'),
  ('edge-009','distributes_in','PharmaDist Netherlands BV','Netherlands','strong',true,'2026-04-15'),
  ('edge-010','imports_to','UK MedAccess Ltd','United Kingdom','strong',true,'2026-03-20'),
  ('edge-011','belongs_to_pathway','UK MedAccess Ltd','SAS Category B — United Kingdom','strong',true,'2026-03-20'),
  ('edge-012','relevant_to_market','Cannabis Inventory — Flower','Germany','strong',true,'2026-01-01'),
  ('edge-013','relevant_to_market','Cannabis Inventory — Extracts / Oil','Netherlands','strong',true,'2026-01-01'),
  ('edge-014','converted_to_opportunity','GreenMed Portugal SA','EU-GMP Medical Import — Germany','medium',true,'2026-05-21'),
  ('edge-015','scored_for','EuroCanna Compliance GmbH','Germany','strong',true,'2026-05-27'),
  ('edge-016','exports_from','CannaLeaf Exports Ltd','Canada','strong',true,'2026-04-01'),
  ('edge-017','active_in','Australian MedGreen Imports','Australia','medium',true,'2026-05-22'),
  ('edge-018','belongs_to_pathway','Australian MedGreen Imports','TGA Special Access — Australia','medium',true,'2026-05-22'),
  ('edge-019','matched_to','CannaLeaf Exports Ltd','Australian MedGreen Imports','medium',false,'2026-05-23'),
  ('edge-020','exports_from','GreenMed Portugal SA','Portugal','medium',true,'2026-05-02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ia_feedback_events (id, outcome_type, counterparty_name, market, category, score_impact, routing_impact, notes, logged_at)
VALUES
  ('fb-001','intro_sent','CannaLeaf Exports x Rheingold Medical','Germany','cannabis inventory','positive','Increased Rheingold routing priority; CannaLeaf intro count +1',NULL,'2026-05-18'),
  ('fb-002','docs_received','UK MedAccess Ltd','United Kingdom','cannabis inventory','positive','UK MedAccess documentation status upgraded to complete; readiness score +12',NULL,'2026-05-15'),
  ('fb-003','buyer_passed','PharmaDist Netherlands BV','Netherlands','cannabis inventory','negative','Temporary fit score reduction; route blocked pending alternative supply review','Passed on Colombian biomass — EU-GMP gap.','2026-05-12'),
  ('fb-004','qualified','GreenMed Portugal SA','Portugal','cannabis inventory','positive','GreenMed promoted to medium routing priority; first EU intro queue',NULL,'2026-05-21'),
  ('fb-005','unresponsive','Nordic Pharma Distributors','Denmark','cannabis inventory','negative','Nordic follow-up priority set to dormant; pathway review deferred',NULL,'2026-04-28'),
  ('fb-006','docs_requested','Rheingold Medical GmbH','Germany','cannabis inventory','neutral','COA request sent; Rheingold readiness score holds pending receipt',NULL,'2026-05-20'),
  ('fb-007','in_discussion','CannaLeaf Exports x UK MedAccess','United Kingdom','cannabis inventory','positive','Both parties introduction priority increased; deal room candidate',NULL,'2026-05-22'),
  ('fb-008','valuable_relationship','EuroCanna Compliance GmbH','Germany','services','positive','EuroCanna trust score upgraded to 92; introduction priority maintained high',NULL,'2026-05-23'),
  ('fb-009','weak_fit','BioLatam Exports','Colombia','cannabis inventory','negative','BioLatam routing priority reduced to low; EU-GMP gap blocks all EU routes',NULL,'2026-05-20'),
  ('fb-010','reviewed','Australian MedGreen Imports','Australia','cannabis inventory','neutral','TGA requirements reviewed; supply matching queued for Q3',NULL,'2026-05-22'),
  ('fb-011','needs_future_follow_up','Tel Aviv Medical Exports','Israel','cannabis inventory','neutral','Introduction deferred pending import partner identification; watch status active',NULL,'2026-05-26'),
  ('fb-012','converted_to_opportunity','GreenMed Portugal x PharmaDist Netherlands','Netherlands','cannabis inventory','positive','Formal opportunity created; doc review pending before intro',NULL,'2026-05-21')
ON CONFLICT (id) DO NOTHING;
