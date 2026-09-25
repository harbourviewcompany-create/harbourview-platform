-- Repository-only replay-fidelity repair.
--
-- Production already records 20260730211147. In the clean replay schema the
-- legacy listings table does not yet contain the full supply-catalog column set
-- used by the production-era view. The following migration supersedes this
-- temporary view shortly afterward, so fail closed by skipping creation when
-- the prerequisite columns are absent.

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'listings'
      AND column_name IN (
        'id','slug','title','description','category','marketplace_section','sku',
        'brand','model','condition','quantity','unit','price_amount','price_currency',
        'price_range','stock_qty','lead_time_days','moq','compliance_flags',
        'target_countries','is_featured','average_rating','review_count',
        'created_at','updated_at','sold_by_harbourview','status','public_visibility'
      )
  ) = 28 THEN
    EXECUTE $view$
      create or replace view api.supply_catalog_v1
      with (security_invoker = on) as
      select
        l.id, l.slug, l.title, l.description, l.category, l.marketplace_section,
        l.sku, l.brand, l.model, l.condition, l.quantity, l.unit,
        l.price_amount, l.price_currency, l.price_range, l.stock_qty,
        l.lead_time_days, l.moq, l.compliance_flags, l.target_countries,
        l.is_featured, l.average_rating, l.review_count, l.created_at, l.updated_at
      from public.listings l
      where l.sold_by_harbourview = true
        and l.status = 'approved'
        and l.public_visibility = true
    $view$;

    EXECUTE 'grant select on api.supply_catalog_v1 to anon, authenticated';
  END IF;
END $$;