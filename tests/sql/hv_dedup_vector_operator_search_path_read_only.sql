-- Read-only reproduction/closure probe for the 2026-08-14 hv-quality-promote failure.
-- Expected result: the first operator resolution attempt must raise undefined_function
-- under public-only search_path; the second must resolve under the corrected path.

begin transaction read only;

do $$
begin
  perform set_config('search_path', 'public', true);
  begin
    perform null::extensions.vector <=> null::extensions.vector;
    raise exception 'expected public-only search_path to fail pgvector operator resolution';
  exception
    when undefined_function then
      null;
  end;

  perform set_config('search_path', 'pg_catalog, public, extensions', true);
  perform null::extensions.vector <=> null::extensions.vector;
end
$$;

rollback;
