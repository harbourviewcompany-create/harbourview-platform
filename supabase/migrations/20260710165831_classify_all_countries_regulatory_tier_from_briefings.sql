-- Classifies EVERY country with briefing text (195) into a regulatory_tier,
-- derived deterministically from cc_jurisdiction_briefings.program_status.
-- Supersedes the earlier 56-country curated seed. This is a global product;
-- every jurisdiction with source text gets a tier.
--
-- Ordering matters. Exclusions run before affirmations so that:
--   * "Export Licensing Under Discussion" (Kenya) and "Reform Under
--     Consideration" (Nigeria/Ghana) are NOT read as active regimes.
--   * "No Medical Programme" (Albania, Andorra, Bosnia, Kosovo, Moldova,
--     Türkiye) is NOT read as a medical market.
-- The affirmative "export/industrial legal" signal separates commercial-access
-- markets from medical-only ones.
--
-- rationale stores the source program_status verbatim so every classification
-- is auditable. reviewed_at stays NULL — a human signs off before the flag
-- goes on.

update public.countries c set
  regulatory_tier = t.tier,
  regulatory_tier_source = 'cc_jurisdiction_briefings.program_status (auto-classified 2026-07-10, pending review)',
  regulatory_tier_rationale = 'Derived from briefing: "' || t.program_status || '"',
  regulatory_tier_reviewed_at = null
from (
  select b.country_iso2, b.program_status,
    case
      when b.program_status ~* '(export (industry|hub|industry leader|-oriented)|licensed export|export-oriented)'
           and b.program_status !~* 'export licensing under (discussion|consideration|review)'
        then 'legal_commercial_access'
      when b.program_status ~* 'industrial (cultivation licensed|legal)'
        then 'legal_commercial_access'
      when b.program_status ~* 'adult-use legal — federal'
        then 'legal_commercial_access'
      when b.program_status ~* 'adult-use|personal cultivation legal|social clubs|home cultivation|recreational legal|coffee shop|pilot retail'
        then 'domestic_only'
      when b.program_status ~* '(medical (legal|—|-)|prescription|sativex|epidiolex|mcap|decriminaliz|cbd)'
           and b.program_status !~* '(no medical programme|reform under|under (active )?consideration|under discussion)'
        then 'medical_limited_trade'
      else 'prohibited'
    end as tier
  from public.cc_jurisdiction_briefings b
  where b.jurisdiction_type='country' and coalesce(b.program_status,'')<>''
) t
where c.iso_alpha2 = t.country_iso2;
