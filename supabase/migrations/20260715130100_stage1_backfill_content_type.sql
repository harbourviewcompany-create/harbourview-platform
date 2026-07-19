-- Stage 1: backfill content_type for the 1,471 existing intelligence sources,
-- derived from source_type. Reversible: set content_type=null where source_type<>'marketplace'.
-- Debatable buckets (owner may flip): reference->regulatory (could be research);
-- market_research->market (could be research).
update public.source_registry set content_type =
  case
    when source_type in ('regulator','regulator_official','government_official',
      'government_release','regulatory_filing','primary_legislation',
      'legislative_tracking','ngo_policy_tracker','legal_analysis','reference') then array['regulatory']
    when source_type in ('trade','trade_press','industry_press','market_research') then array['market']
    when source_type in ('news','mainstream_media') then array['story']
    when source_type in ('academic') then array['research']
    else array['regulatory']
  end
where content_type is null;
