-- All 7 tables confirmed via real application code (not just migration history)
-- to be actively queried, with RLS SELECT policies already in place for these
-- roles, but the base-table GRANT was never applied — same missing-grant root
-- cause as the earlier form-submission fixes, this time on the read side.

GRANT SELECT ON public.cannabis_operators TO anon;
GRANT SELECT ON public.cc_pathway_step_requirements TO anon, authenticated;
GRANT SELECT ON public.cc_pathway_steps TO anon, authenticated;
GRANT SELECT ON public.cc_pathway_templates TO anon;
GRANT SELECT ON public.clinical_education_country_readiness TO anon, authenticated;
GRANT SELECT ON public.clinical_education_modules TO anon, authenticated;
GRANT SELECT ON public.regulatory_calendar TO anon, authenticated;
