
-- Track which LLM provider each async extraction job actually used, so the
-- circuit breaker can compute per-provider health instead of inferring it
-- from error-message text matching (fragile, and blind once we've already
-- switched away from a given provider since it stops generating new
-- error-text samples for that provider).
alter table _sig_extract_jobs add column if not exists provider text not null default 'anthropic';
