-- Recovery-only replay foundation.
-- The authoritative evidence tranches use
-- ON CONFLICT (jurisdiction_key, regulator_name), which requires a unique
-- constraint/index that existed in the production shape but is absent from the
-- reconstructed zero-state migration history.

create unique index if not exists jurisdiction_regulators_key_name_uidx
  on public.jurisdiction_regulators (jurisdiction_key, regulator_name);
