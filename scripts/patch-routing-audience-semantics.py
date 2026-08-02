#!/usr/bin/env python3
from pathlib import Path

routing = Path('lib/signals/routing.ts')
text = routing.read_text(encoding='utf-8')
text = text.replace(
    "const LATAM_SUBREGIONS = new Set(['caribbean', 'central america', 'south america'])\n",
    "const LATAM_SUBREGIONS = new Set(['central america', 'south america'])\n"
    "const LATAM_AND_CARIBBEAN_SUBREGIONS = new Set(['caribbean', 'central america', 'south america'])\n",
)
text = text.replace(
    "      case 'latam':\n"
    "      case 'latin america':\n"
    "      case 'latin america and the caribbean':\n"
    "      case 'latin america & caribbean':\n"
    "      case 'latin america and caribbean':\n"
    "        return LATAM_SUBREGIONS.has(metadata.subregion)\n",
    "      case 'latam':\n"
    "      case 'latin america':\n"
    "        return LATAM_SUBREGIONS.has(metadata.subregion)\n"
    "      case 'latin america and the caribbean':\n"
    "      case 'latin america & caribbean':\n"
    "      case 'latin america and caribbean':\n"
    "        return LATAM_AND_CARIBBEAN_SUBREGIONS.has(metadata.subregion)\n",
)
text = text.replace(
    "      case 'middle east':\n",
    "      case 'eastern europe/central asia':\n"
    "      case 'eastern europe and central asia':\n"
    "        return metadata.subregion === 'eastern europe' || metadata.subregion === 'central asia'\n"
    "      case 'middle east':\n",
)
text = text.replace(
    "        return !explicitCountryLabel && UN_MACRO_REGIONS.has(label)\n"
    "          ? metadata.region === label\n"
    "          : UN_MACRO_REGIONS.has(label) && metadata.region === label\n",
    "        return UN_MACRO_REGIONS.has(label) && metadata.region === label\n",
)
routing.write_text(text, encoding='utf-8')

tests = Path('tests/signals/routing.test.ts')
t = tests.read_text(encoding='utf-8')
t = t.replace(
    "    const colombia: OperatorProfile = { countryIso2: ['CO'], roleFamilies: cultivation }\n"
    "    const signal = routed({ geo_scope: 'region', geo_region: 'Americas', country: 'LATAM', role_families: cultivation })\n"
    "    expect(matchesOperatorProfile(signal, usa)).toBe(false)\n"
    "    expect(matchesOperatorProfile(signal, colombia)).toBe(true)\n",
    "    const colombia: OperatorProfile = { countryIso2: ['CO'], roleFamilies: cultivation }\n"
    "    const barbados: OperatorProfile = { countryIso2: ['BB'], roleFamilies: cultivation }\n"
    "    const signal = routed({ geo_scope: 'region', geo_region: 'Americas', country: 'LATAM', role_families: cultivation })\n"
    "    expect(matchesOperatorProfile(signal, usa)).toBe(false)\n"
    "    expect(matchesOperatorProfile(signal, colombia)).toBe(true)\n"
    "    expect(matchesOperatorProfile(signal, barbados)).toBe(false)\n",
)
insert_after = "  it('matches Caribbean as a subregion rather than all Americas', () => {\n"
idx = t.index(insert_after)
end = t.index("  it('matches European Union membership", idx)
block = t[idx:end]
combined = """  it('matches Latin America and the Caribbean as the combined audience', () => {
    const barbados: OperatorProfile = { countryIso2: ['BB'], roleFamilies: cultivation }
    const colombia: OperatorProfile = { countryIso2: ['CO'], roleFamilies: cultivation }
    const usa: OperatorProfile = { countryIso2: ['US'], roleFamilies: cultivation }
    const signal = routed({
      geo_scope: 'region',
      geo_region: 'Americas',
      country: 'Latin America and the Caribbean',
      role_families: cultivation,
    })
    expect(matchesOperatorProfile(signal, barbados)).toBe(true)
    expect(matchesOperatorProfile(signal, colombia)).toBe(true)
    expect(matchesOperatorProfile(signal, usa)).toBe(false)
  })

"""
t = t[:end] + combined + t[end:]
needle = "  it('does not widen Middle East to all of Asia or North Africa', () => {\n"
pos = t.index(needle)
eeca = """  it('preserves the retained Eastern Europe/Central Asia audience', () => {
    const poland: OperatorProfile = { countryIso2: ['PL'], roleFamilies: cultivation }
    const kazakhstan: OperatorProfile = { countryIso2: ['KZ'], roleFamilies: cultivation }
    const germany: OperatorProfile = { countryIso2: ['DE'], roleFamilies: cultivation }
    const singapore: OperatorProfile = { countryIso2: ['SG'], roleFamilies: cultivation }
    const signal = routed({
      geo_scope: 'region',
      geo_region: 'Europe',
      country: 'Eastern Europe/Central Asia',
      role_families: cultivation,
    })
    expect(matchesOperatorProfile(signal, poland)).toBe(true)
    expect(matchesOperatorProfile(signal, kazakhstan)).toBe(true)
    expect(matchesOperatorProfile(signal, germany)).toBe(false)
    expect(matchesOperatorProfile(signal, singapore)).toBe(false)
  })

"""
t = t[:pos] + eeca + t[pos:]
t = t.replace(
    "    // Deliberately not \"where you operate\": a region can match via an export\n"
    "    // destination, or via the fail-open path for an unmapped country, neither of\n"
    "    // which establishes that the operator operates there.\n",
    "    // Deliberately not \"where you operate\": a region can match through an\n"
    "    // export destination, which does not establish that the operator operates there.\n",
)
tests.write_text(t, encoding='utf-8')

docs = Path('docs/control/REGIONAL_ROUTING_DEFINITIONS.md')
d = docs.read_text(encoding='utf-8')
d = d.replace(
    "- `LATAM`, `Latin America`, and `Latin America and the Caribbean` match the UN\n"
    "  M49 Caribbean, Central America, and South America subregions. Northern America\n"
    "  is excluded.\n",
    "- `LATAM` and `Latin America` match the UN M49 Central America and South America\n"
    "  subregions. The separately retained Caribbean audience is excluded.\n"
    "- `Latin America and the Caribbean` matches Caribbean, Central America, and South\n"
    "  America. Northern America is excluded.\n",
)
d = d.replace(
    "- `Middle East` uses Harbourview's explicit operational definition",
    "- `Eastern Europe/Central Asia` matches the UN M49 Eastern Europe and Central Asia\n"
    "  subregions only.\n"
    "- `Middle East` uses Harbourview's explicit operational definition",
)
docs.write_text(d, encoding='utf-8')

evidence = Path('docs/control/EVIDENCE_LOG.md')
e = evidence.read_text(encoding='utf-8')
e = e.replace(
    "- Preserved explicit European Union, LATAM, Caribbean, Middle East, Pacific, and\n"
    "  UN macro-region audience semantics.\n",
    "- Preserved explicit European Union, LATAM, Caribbean, Eastern Europe/Central\n"
    "  Asia, Middle East, Pacific, and UN macro-region audience semantics. LATAM is\n"
    "  kept distinct from the separately retained Caribbean label.\n",
)
evidence.write_text(e, encoding='utf-8')
