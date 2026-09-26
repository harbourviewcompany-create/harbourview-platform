#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DECISIONS_FILE = 'supabase/release-controls/pending-production-migration-decisions.json'
const EQUIVALENCE_FILE = 'supabase/release-controls/migration-live-version-equivalences.json'
const MIGRATIONS_DIR = 'supabase/migrations'
const EXCLUDED_SUFFIX = '.replay-excluded'
