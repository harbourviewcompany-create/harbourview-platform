from pathlib import Path

path = Path('scripts/open-pr-repair/build-routing-regional-forward-fix.sh')
text = path.read_text()
old = "for identity, _slug, _name, region, subregion in rows:\n    if not identity.startswith('country_area:'):\n"
new = "for row in rows:\n    if len(row) < 5:\n        raise SystemExit(f'Malformed country identity row: {row}')\n    identity, region, subregion = row[0], row[3] or '', row[4] or ''\n    if not identity.startswith('country_area:'):\n"
if old not in text:
    raise SystemExit('generator loop pattern not found')
text = text.replace(old, new)
needle = "python3 scripts/country-data/generate-iso-region-rows.py\n\npython3 - <<'PY'\n"
replacement = "python3 scripts/country-data/generate-iso-region-rows.py\n\n# The branch checkout occurs inside this repair script, so install the exact\n# target lockfile before invoking Vitest, typecheck, or ESLint.\nnpm ci\n\npython3 - <<'PY'\n"
if needle not in text:
    raise SystemExit('dependency-install insertion point not found')
text = text.replace(needle, replacement)
text = text.replace(
    "return matchesRegionalAudience(row, countries)",
    "return matchesRegionalAudience(row, profileCountries(profile))",
)
text = text.replace(
    "const audience = regionalAudienceLabel(row)\n      return audience ? `Affects ${audience}, a region or bloc you cover${suffix}` : `Matches your watch profile${suffix}`",
    "const audience = typeof row.country === 'string' && row.country.trim()\n        ? row.country.trim()\n        : typeof row.geo_region === 'string' && row.geo_region.trim()\n          ? row.geo_region.trim()\n          : null\n      return audience ? `Affects ${audience}, a region or bloc you cover${suffix}` : `Matches your watch profile${suffix}`",
)
text = text.replace(
    "Affects Europe, a region you cover (cultivation & production)",
    "Affects Europe, a region or bloc you cover (cultivation & production)",
)
path.write_text(text)
