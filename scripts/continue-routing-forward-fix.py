#!/usr/bin/env python3
from pathlib import Path

feedback = Path('lib/signals/feedbackScores.ts')
feedback_text = feedback.read_text(encoding='utf-8')
needle = 'type AnySchemaSupabaseClient = SupabaseClient<any, any, any, any, any>\n'
replacement = (
    '// Supabase schema generics are invariant and callers use multiple exposed schemas.\n'
    '// This boundary erases compile-time schema parameters only; runtime behavior is unchanged.\n'
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n'
    + needle
)
if replacement not in feedback_text:
    if needle not in feedback_text:
        raise SystemExit('feedback client type alias not found')
    feedback.write_text(feedback_text.replace(needle, replacement), encoding='utf-8')

routing = Path('lib/signals/routing.ts')
routing_text = routing.read_text(encoding='utf-8')
routing_text = routing_text.replace(
    'isoRegionRows.map(([iso2, _iso3, region, subregion]) => [',
    'isoRegionRows.map(([iso2, , region, subregion]) => [',
)
unused = '''function regionalAudienceLabel(row: SignalRoutingRow): string | null {
  return normaliseRegionalLabel(row.country) ?? normaliseRegionalLabel(row.geo_region)
}

'''
routing_text = routing_text.replace(unused, '')
routing.write_text(routing_text, encoding='utf-8')
