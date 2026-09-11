-- Creates public.hv_local_classifier_centroids, the table
-- 20260910010532_local_classifier_gate.sql selects from.
--
-- The centroids table already exists in production. This migration restores
-- repository-first replayability for clean databases without seeding trained
-- model state.
--
-- Production shape verified 2026-09-11:
-- quality_label text NOT NULL primary key
-- centroid vector(1024) NOT NULL
-- n integer NOT NULL
-- updated_at timestamptz DEFAULT now(), nullable
-- RLS disabled; access restricted to postgres/service_role.

create table if not exists public.hv_local_classifier_centroids (
  quality_label text not null,
  centroid      vector(1024) not null,
  n             integer not null,
  updated_at    timestamptz default now(),
  constraint hv_local_classifier_centroids_pkey primary key (quality_label)
);

-- Trained centroid rows are intentionally not seeded. A fresh environment
-- safely falls through to the existing LLM classification path when empty.
grant select, insert, update, delete on public.hv_local_classifier_centroids to service_role;
