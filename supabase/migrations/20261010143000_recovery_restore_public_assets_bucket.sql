-- Recovery-only restoration of the documented public-assets bucket.
-- Preserve the existing storage.objects RLS policy unchanged.
insert into storage.buckets (id,name,public)
values ('public-assets','public-assets',true)
on conflict (id) do update
set name=excluded.name,
    public=excluded.public;