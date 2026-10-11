-- Recovery operational marker.
-- The corresponding live recovery action only deferred repeatedly failing source
-- captures to stop wasteful retries. Retry/backoff timestamps are runtime state and
-- must not be reproduced by a database rebuild.
select 1;
