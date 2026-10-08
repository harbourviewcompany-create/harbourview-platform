-- Recovery-only replay foundation.
-- Some late authoritative depth migrations use
-- ON CONFLICT (country_id, slug). The reconstructed zero-state schema has a
-- global UNIQUE(slug) but no matching composite arbiter. A redundant composite
-- unique index preserves the stricter global slug uniqueness while allowing
-- those historical upserts to replay unchanged.

create unique index if not exists regulatory_pathways_country_slug_uidx
  on public.regulatory_pathways (country_id, slug);
