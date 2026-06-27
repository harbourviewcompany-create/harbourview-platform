
-- REGRESSION FIX: 20260622151411_fix_security_definer_views_to_invoker flipped these public
-- DTO views to security_invoker WITHOUT granting anon base-table SELECT, which broke the public
-- marketplace/signals (hard errors) and emptied the country-profile/genetics pages (0 rows for anon).
-- These are intentional curated public DTOs (see comments on each view); restore SECURITY DEFINER.
alter view public.public_country_profile_dto            set (security_invoker = false);
alter view public.marketplace_public_listings_v1        set (security_invoker = false);
alter view public.signals_intelligence_feed             set (security_invoker = false);
alter view public.platform_coverage_summary             set (security_invoker = false);
alter view public.genetics_public_profiles              set (security_invoker = false);
alter view public.genetics_public_cultivar_passports    set (security_invoker = false);
alter view public.genetics_public_cultivar_aliases      set (security_invoker = false);
alter view public.genetics_public_country_opportunities set (security_invoker = false);
alter view public.genetics_public_evidence_summaries    set (security_invoker = false);
alter view public.genetics_public_claims                set (security_invoker = false);
alter view public.genetics_public_collaboration_projects set (security_invoker = false);
alter view public.genetics_public_service_providers     set (security_invoker = false);
