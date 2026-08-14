#!/usr/bin/env node
/**
 * Assert that every file in supabase/migrations is syntactically valid
 * PostgreSQL.
 *
 * WHY THIS EXISTS
 *
 * On 2026-08-14 two migrations reached `main` that could not be replayed:
 *
 *   20260730211141  comment on column ... is 'True for Harbourview's own ...'
 *                   The apostrophe closed the string literal.
 *   20260804222954  $function$ followed by UPDATE with no statement terminator.
 *                   CREATE FUNCTION never ended.
 *
 * Every check in this repository passed on both. The one job that stands up a
 * real database -- "Authenticated Command Centre and marketplace media
 * evidence" -- moves supabase/migrations aside and substitutes a small
 * hand-written schema (see the "Prepare isolated local Supabase schema" and
 * "Restore production migration source tree" steps in
 * mobile-command-centre-v2-visual.yml). That is the right call for a UI visual
 * test, but it means nothing in CI ever parsed the production migration tree.
 * A migration set that cannot rebuild the database it describes was fully
 * green.
 *
 * WHY PARSE AND NOT REPLAY
 *
 * A true `supabase db reset` replay would be the stronger assertion, and it was
 * considered first. It is the wrong gate here: these migrations reference
 * vault.*, cron.*, net.*, auth.* and pgvector, so a clean local database fails
 * them for environmental reasons that have nothing to do with the SQL. A gate
 * that is red for reasons the author cannot fix is a gate people learn to
 * ignore -- the same trap the Vercel preview markers fell into twice.
 *
 * Parsing is the part that is both cheap and unambiguous. libpg-query is the
 * real PostgreSQL parser (the same grammar the server uses), so this is not an
 * approximation: it accepts exactly what Postgres accepts, including
 * dollar-quoted bodies, nested quoting, and apostrophes inside -- comments.
 * It resolves no names, so a missing table or extension is not an error here.
 *
 * An earlier hand-rolled attempt at this check reported six bad files and then
 * three; the real counts were one and one. It could not tell an apostrophe in a
 * comment from one in a literal, or a `$$` opening a cron body from one closing
 * a function. That is why this uses a parser rather than a regex.
 *
 * Cost: ~0.5s for 909 migrations.
 */

import fs from 'node:fs';
import path from 'node:path';
import pgQuery from 'libpg-query';

const parse = pgQuery.parseQuery ?? pgQuery.parse ?? pgQuery.default?.parseQuery;
if (typeof parse !== 'function') {
  console.error('HOLD: libpg-query did not expose a parse function.');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const migrationsDir = 'supabase/migrations';

/** Cases that must hold, so a broken checker fails loudly instead of silently passing everything. */
const SELF_TEST_CASES = [
  // The two defects that motivated this gate.
  ['apostrophe closing a literal', "comment on column t.c is 'Harbourview's own catalog';", false],
  ['that apostrophe escaped', "comment on column t.c is 'Harbourview''s own catalog';", true],
  ['function body not terminated', 'create function f() returns int language sql as $function$ select 1 $function$\n\nUPDATE t SET x = 1;', false],
  ['function body terminated', 'create function f() returns int language sql as $function$ select 1 $function$;\n\nUPDATE t SET x = 1;', true],

  // Forms a regex-based checker got wrong. These must NOT be flagged.
  ['apostrophe inside a -- comment', "-- the view's own WHERE clause\nselect 1;", true],
  ['dollar body opening a cron job', "select cron.schedule('n', '0 1 * * *', $$ select net.http_post(url := 'x') $$);", true],
  ['apostrophe inside a block comment', "/* the table's owner */\nselect 1;", true],

  // Parse-only: unknown objects and extensions must not fail.
  ['unknown table', 'select * from a_table_that_does_not_exist;', true],
  ['vault and cron references', "select vault.create_secret(current_setting('x'), 'n');", true],
];

function describe(error) {
  return String(error?.message ?? error).split('\n')[0].trim();
}

async function parses(sql) {
  try {
    await parse(sql);
    return null;
  } catch (error) {
    return describe(error);
  }
}

async function runSelfTest() {
  const failures = [];
  for (const [name, sql, shouldParse] of SELF_TEST_CASES) {
    const error = await parses(sql);
    const didParse = error === null;
    if (didParse !== shouldParse) {
      failures.push(
        `SELF-TEST FAIL ${name}: expected ${shouldParse ? 'parse' : 'syntax error'}, ` +
        `got ${didParse ? 'parse' : `syntax error (${error})`}`,
      );
    }
  }
  if (failures.length > 0) {
    for (const failure of failures) console.error(failure);
    process.exit(1);
  }
  console.log(`GO: migration SQL parser self-test passed (${SELF_TEST_CASES.length} cases).`);
}

async function checkMigrations() {
  if (!fs.existsSync(migrationsDir)) {
    console.error(`HOLD: ${migrationsDir} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.error(`HOLD: no .sql files found in ${migrationsDir}. Refusing to pass vacuously.`);
    process.exit(1);
  }

  const failures = [];
  for (const file of files) {
    const error = await parses(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
    if (error) failures.push({ file, error });
  }

  console.log('Migration SQL parse check');
  console.log(`Parsed ${files.length} migrations in ${migrationsDir}`);

  if (failures.length > 0) {
    console.error('');
    console.error(`HOLD: ${failures.length} migration(s) are not valid PostgreSQL and cannot be replayed.`);
    for (const { file, error } of failures) {
      console.error(`- ${migrationsDir}/${file}`);
      console.error(`    ${error}`);
    }
    console.error('');
    console.error('These fail `supabase db reset` and any new-environment build, even when');
    console.error('production is unaffected because the version is already applied there.');
    console.error('Names are not resolved by this check, so a missing table, extension or');
    console.error('schema is never the cause -- these are genuine syntax errors.');
    process.exit(1);
  }

  console.log('GO: every migration parses as valid PostgreSQL.');
}

if (args.has('--self-test')) {
  await runSelfTest();
} else {
  await checkMigrations();
}
