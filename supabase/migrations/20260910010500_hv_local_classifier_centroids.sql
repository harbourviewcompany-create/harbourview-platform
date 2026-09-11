-- Creates public.hv_local_classifier_centroids, the table
-- 20260910010532_local_classifier_gate.sql selects from.
--
-- Why this file exists. The centroids table was created directly against
-- production on 2026-08-30/31 from an unmerged branch that never got a PR --
-- the same branch 20260910010532 came from. When that work was reconstructed
-- into the repository, the FUNCTION was committed and the TABLE it reads was
-- not. Production is fine; the repository was not. Replaying the migration set
-- onto an empty database died here:
--
--   Applying migration 20260910010532_local_classifier_gate.sql...
--   ERROR: relation "public.hv_local_classifier_centroids" does not exist
--          (SQLSTATE 42P01)
--
-- so no fresh environment -- CI's isolated Supabase, a local `supabase db
-- reset`, a preview branch -- could be built from the repository at all.
--
-- Shape read from live production on 2026-09-11 rather than inferred:
-- quality_label text NOT NULL primary key, centroid vector(1024) NOT NULL
-- (atttypmod 1024), n integer NOT NULL, updated_at timestamptz default now()
-- and nullable; primary key the only constraint and only index; RLS NOT
-- enabled; grants to postgres and service_role only, none to anon or
-- authenticated.
--
-- Versioned 20260910010500 so it sorts immediately before the 010532 function
-- that depends on it. Guarded with IF NOT EXISTS because production already
-- holds the table with exactly this shape: applying this there is a verified
-- no-op that only reconciles the ledger, and it is the replay path that
-- actually needed fixing.
--
-- Deliberately NOT included: the four centroid rows. They are trained model
-- state, not reference data, and hv_local_classify_gate degrades safely on an
-- empty table -- the dists CTE returns no rows, the rnk = 2 join matches
-- nothing, the function returns no row, and hv_classify_corpus_dispatch falls
-- through to the LLM exactly as it did before the gate existed. A fresh
-- environment therefore gets correct behaviour without the gate's cost saving,
-- which is the right default for one.

create table if not exists public.hv_local_classifier_centroids (
  quality_label text not null,
  centroid      vector(1024) not null,
  n             integer not null,
  updated_at    timestamptz default now(),
  constraint hv_local_classifier_centroids_pkey primary key (quality_label)
);

-- Matches production: no anon/authenticated access. The table is read only by
-- hv_local_classify_gate, which runs inside SECURITY DEFINER dispatch code.
grant select, insert, update, delete on public.hv_local_classifier_centroids to service_role;
