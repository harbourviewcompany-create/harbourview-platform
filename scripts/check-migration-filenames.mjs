import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.resolve('supabase/migrations');
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

const prefixPattern = /^(\d{14})_[a-z0-9_]+\.sql$/;
const seenPrefixes = new Map();
const problems = [];

for (const file of migrationFiles) {
  const match = file.match(prefixPattern);

  if (!match) {
    problems.push(`Invalid migration filename format: ${file} (expected YYYYMMDDHHMMSS_description.sql)`);
    continue;
  }

  const prefix = match[1];
  if (seenPrefixes.has(prefix)) {
    problems.push(`Duplicate migration prefix ${prefix}: ${seenPrefixes.get(prefix)} and ${file}`);
  } else {
    seenPrefixes.set(prefix, file);
  }
}

if (problems.length > 0) {
  console.error('Migration filename check failed:\n');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(`Migration filename check passed for ${migrationFiles.length} migration files.`);
