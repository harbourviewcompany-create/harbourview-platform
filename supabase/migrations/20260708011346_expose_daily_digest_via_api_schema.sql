create view api.daily_digest as
select id, digest_date, status, headlines, editorial_headlines, markets, generated_at, updated_at
from public.daily_digest;

grant select on api.daily_digest to anon, authenticated;
