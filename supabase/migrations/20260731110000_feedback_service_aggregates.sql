-- Ranking and outcome health need cross-operator feedback aggregates.
-- RLS already limits authenticated users to their own rows; service_role
-- bypasses RLS by default — explicit grants make the contract obvious.

grant select, insert on public.signal_relevance_feedback to service_role;

-- Optional: authenticated users may not update/delete others' votes.
revoke update, delete on public.signal_relevance_feedback from authenticated;

comment on table public.signal_relevance_feedback is
  'Operator judgments. Inserts are user-scoped via RLS; aggregates for ranking use service_role.';
