INSERT INTO public.jurisdiction_playbooks (
  country_iso2, country_name, difficulty, typical_timeline_months,
  estimated_cost_range, legal_framework_summary, steps, key_regulators,
  common_pitfalls, status, last_reviewed
) VALUES (
  'NL',
  'Netherlands',
  'high',
  12,
  '€200K–£700K',
  'The Netherlands has a unique dual system: a tolerated (gedoogd) adult-use market through licensed coffee shops, and a regulated medicinal cannabis programme. Medicinal cannabis is regulated under the Opium Act (Opiumwet) and managed by the Office of Medicinal Cannabis (OMC/BMC) under the Ministry of Health. The OMC is both the national regulator and the sole wholesale supplier of medicinal cannabis to pharmacies. Imported medicinal cannabis must be channelled through the OMC. The Netherlands also participates in the EU pilot for recreational cannabis regulation (Experiment Gesloten Coffeeshopketen) in select municipalities, but this does not create an import pathway. For export from the Netherlands, Dutch GMP-certified manufacturers can supply to EU and international markets. The Netherlands is an important EU hub for cannabis logistics and processing.',
  '[
    {"step": 1, "title": "Engage OMC as the mandatory wholesale intermediary", "description": "The Office of Medicinal Cannabis (OMC) is the sole legal wholesaler of medicinal cannabis to Dutch pharmacies. Foreign suppliers wishing to supply the Dutch market must contract with the OMC. Contact OMC to understand their current product needs, quality specifications, and tender/procurement processes. OMC periodically issues tenders for additional product supply.", "estimated_weeks": 10, "required": true},
    {"step": 2, "title": "Meet OMC quality and GMP specifications", "description": "OMC specifies strict quality requirements: EU-GMP for manufacturing, specific chemotype (THC/CBD content ranges), pesticide/heavy metals/microbiological limits per Dutch Pharmacopoeia (NF) and European Pharmacopoeia (Ph.Eur.). All products must have a Certificate of Analysis from an EU-accredited laboratory. Contact OMC quality department for current specifications before investing in product development.", "estimated_weeks": 6, "required": true},
    {"step": 3, "title": "Obtain Dutch import permit via OMC/Ministry of Health", "description": "Import permits for cannabis are issued by the Ministry of Health (VWS) under the Opium Act. As OMC acts as the importer, they will manage the permit process. However, foreign exporters must provide: product specification, COA, manufacturing licence, origin country export permit. INCB procedures apply for per-shipment certificates.", "estimated_weeks": 8, "required": true},
    {"step": 4, "title": "Negotiate supply agreement with OMC", "description": "Supply contracts with OMC typically cover pricing, volumes, delivery schedules, quality warranties, and recall procedures. OMC pricing is regulated and margins are controlled. Contracts typically run 1-3 years with options to extend. OMC has stringent change control requirements; product specification changes require re-approval.", "estimated_weeks": 12, "required": true},
    {"step": 5, "title": "Establish EU-GDP compliant logistics to Netherlands", "description": "All logistics must comply with EU Good Distribution Practice (GDP). Cold chain validation required for temperature-sensitive products. Dutch Customs (Douane) handles controlled substance clearance. Ensure NVWA (Netherlands Food and Consumer Product Safety Authority) import requirements are met if product involves agricultural components.", "estimated_weeks": 4, "required": true},
    {"step": 6, "title": "Manage ongoing OMC compliance and quality reviews", "description": "OMC conducts annual supplier audits and requires ongoing batch-by-batch COA submission. Any quality deviations must be reported immediately. OMC may require field safety corrective actions (FSCAs) for quality issues detected post-distribution to pharmacies. Maintain a Dutch-language product information file accessible to OMC.", "estimated_weeks": 2, "required": true}
  ]'::jsonb,
  '[
    {"name": "OMC (Office of Medicinal Cannabis / Bureau voor Medicinale Cannabis)", "role": "Sole wholesale supplier of medicinal cannabis to Dutch pharmacies; manages import permits and quality standards", "website": "https://www.cannabisbureau.nl", "country": "NL"},
    {"name": "Ministry of Health, Welfare and Sport (VWS)", "role": "Issues import/export permits under the Opium Act; policy oversight of OMC", "website": "https://www.government.nl/ministries/ministry-of-health-welfare-and-sport", "country": "NL"},
    {"name": "IGJ (Healthcare Inspectorate)", "role": "Inspects pharmacies and healthcare providers for compliance with medicinal cannabis dispensing rules", "website": "https://www.igj.nl", "country": "NL"},
    {"name": "Dutch Customs (Douane)", "role": "Controlled substance customs clearance at Dutch ports and airports", "website": "https://www.belastingdienst.nl/wps/wcm/connect/en/customs", "country": "NL"}
  ]'::jsonb,
  ARRAY[
    'OMC is the mandatory intermediary; direct pharmacy supply is not permitted',
    'OMC tender cycles are infrequent; missing a tender cycle means waiting 12-24 months for next opportunity',
    'OMC pricing is regulated; margins are lower than other European markets',
    'EU-GMP is mandatory; OMC will not accept products from non-EU-GMP certified manufacturers',
    'Product specification changes require OMC re-approval; build change control processes before contracting',
    'Dutch coffeeshop system does not create a commercial import pathway for foreign companies'
  ],
  'published',
  '2026-06-22'
)
ON CONFLICT (country_iso2) DO UPDATE SET
  country_name             = EXCLUDED.country_name,
  difficulty               = EXCLUDED.difficulty,
  typical_timeline_months  = EXCLUDED.typical_timeline_months,
  estimated_cost_range     = EXCLUDED.estimated_cost_range,
  legal_framework_summary  = EXCLUDED.legal_framework_summary,
  steps                    = EXCLUDED.steps,
  key_regulators           = EXCLUDED.key_regulators,
  common_pitfalls          = EXCLUDED.common_pitfalls,
  status                   = EXCLUDED.status,
  last_reviewed            = EXCLUDED.last_reviewed,
  updated_at               = now();
