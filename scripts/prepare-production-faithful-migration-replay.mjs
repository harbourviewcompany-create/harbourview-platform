#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DECISIONS_FILE = 'supabase/release-controls/pending-production-migration-decisions.json'
const EQUIVALENCE_FILE = 'supabase/release-controls/migration-live-version-equivalences.json'
const MIGRATIONS_DIR = 'supabase/migrations'
const EXCLUDED_SUFFIX = '.replay-excluded'

const REPLAY_ZERO_STATE_SKIPS = [
  '20260714095121_revert_regulatory_signals_orphaned_constraint_drift.sql',
  '20260714224152_create_intel_eval_set_stage0.sql',
  '20260714225601_expose_intel_eval_set_via_api_schema.sql',
  '20260715085610_fix_stale_api_signals_view_missing_reviewer_columns.sql',
  '20260722182917_enable_hv_quality_pipeline_and_promote_crons.sql',
]
