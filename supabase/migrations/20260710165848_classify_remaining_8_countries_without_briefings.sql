-- The 8 countries with no cc_jurisdiction_briefings row. Classified from
-- well-established legal status so the globe has no blank plates. Source noted
-- as manual rather than briefing-derived; still pending human review.

update public.countries set
  regulatory_tier = t.tier,
  regulatory_tier_source = 'manual (no briefing row; 2026-07-10, pending review)',
  regulatory_tier_rationale = t.rationale,
  regulatory_tier_reviewed_at = null
from (values
  ('RU', 'prohibited',            'Cannabis prohibited; strict criminal enforcement. No medical programme.'),
  ('PR', 'domestic_only',         'US territory with its own medical cannabis programme; federal Schedule I blocks cross-border commercial trade.'),
  ('FK', 'prohibited',            'UK Overseas Territory; no domestic cannabis regime.'),
  ('VA', 'prohibited',            'Vatican City; no cannabis market.'),
  ('FM', 'prohibited',            'Federated States of Micronesia; cannabis prohibited.'),
  ('SC', 'prohibited',            'Seychelles; cannabis prohibited.'),
  ('TO', 'prohibited',            'Tonga; cannabis prohibited.'),
  ('EH', 'prohibited',            'Western Sahara; disputed territory, no lawful cannabis regime.')
) as t(iso, tier, rationale)
where public.countries.iso_alpha2 = t.iso;
