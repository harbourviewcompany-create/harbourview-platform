import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260913154800_market_access_evidence_complete_127.sql',
);

const sql = fs.readFileSync(migrationPath, 'utf8');

const expected = ['PR', 'AE', 'GD', 'BA', 'LC', 'EE', 'LA', 'BE', 'BJ', 'NA', 'BT', 'GE', 'LB', 'PK', 'MY', 'FJ', 'GM', 'BS', 'AG', 'SV', 'FK', 'CV', 'CD', 'AM', 'FO', 'SZ', 'LI', 'SM', 'AO', 'EG', 'BO', 'CU', 'KH', 'ET', 'BZ', 'BN', 'ID', 'KM', 'PH', 'VN', 'AD', 'BF', 'BI', 'CM', 'CI', 'DJ', 'LR', 'DM', 'DO', 'NI', 'BH', 'NP', 'RO', 'DZ', 'CF', 'TD', 'GQ', 'ER', 'GA', 'GN', 'GW', 'LY', 'MG', 'ML', 'MR', 'MU', 'MZ', 'NE', 'CG', 'ST', 'SN', 'SC', 'SL', 'SO', 'SS', 'SD', 'TG', 'TN', 'UG', 'EH', 'GL', 'GT', 'HT', 'HN', 'SR', 'VE', 'AF', 'AZ', 'BD', 'HK', 'IR', 'IQ', 'JO', 'KZ', 'KW', 'KG', 'MV', 'MN', 'MM', 'KP', 'OM', 'PS', 'QA', 'SA', 'SY', 'TW', 'TJ', 'TL', 'TM', 'UZ', 'YE', 'VA', 'IS', 'XK', 'LV', 'MC', 'ME', 'KI', 'MH', 'FM', 'NR', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV'];
const allowed = new Set(['prohibited', 'cbd_hemp_only', 'medical_limited_trade', 'domestic_only', 'legal_commercial_access']);

const matches = [...sql.matchAll(/'hv-mkt-complete-([a-z]{2})-20260913','([A-Z]{2})','([^']+)'/g)]
  .map(([, keyIso, iso, tier]) => ({ keyIso, iso, tier }));

if (matches.length !== expected.length) throw new Error(`Expected ${expected.length} evidence rows, found ${matches.length}`);

const seen = new Set<string>();
for (const row of matches) {
  if (row.keyIso.toUpperCase() !== row.iso) throw new Error(`Evidence key ISO mismatch for ${row.iso}`);
  if (!expected.includes(row.iso)) throw new Error(`Unexpected ISO2: ${row.iso}`);
  if (seen.has(row.iso)) throw new Error(`Duplicate evidence row: ${row.iso}`);
  if (!allowed.has(row.tier)) throw new Error(`Invalid tier for ${row.iso}: ${row.tier}`);
  seen.add(row.iso);
}

for (const iso of expected) if (!seen.has(iso)) throw new Error(`Missing evidence row: ${iso}`);
if (!sql.includes("select * from api.refresh_verified_market_access_tiers('market-access-complete-127-20260913')")) throw new Error('Missing verified-tier refresh call');
if (!sql.includes('v_total <> 291')) throw new Error('Missing 291-jurisdiction invariant');
if (!sql.includes('v_published <> 291')) throw new Error('Missing 291-published-tier invariant');
if (!sql.includes('v_missing <> 0')) throw new Error('Missing zero-unpublished invariant');
