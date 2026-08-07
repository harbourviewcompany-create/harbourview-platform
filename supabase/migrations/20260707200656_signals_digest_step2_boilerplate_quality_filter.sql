-- Step 2 of the signals-digest-pipeline ticket: a quality gate so scraped
-- page/nav boilerplate (e.g. repeated Jamaica CLA homepage chrome) can't
-- reach stage='qualified' and become digest-eligible.
--
-- Heuristic (two signals, either trips it):
--  1. A fixed list of common site-chrome / nav phrases seen in production
--     junk ("skip to main content", "frontpage |", "apply for a licence" /
--     "renew a licence" concatenated menu items, cookie/privacy banners,
--     "an agency of the ministry of", 404 pages, etc).
--  2. Structural: any repeated 3-word sequence (trigram) within the text.
--     Real prose summaries essentially never repeat a 3-word phrase;
--     concatenated nav menus and boilerplate blocks reliably do (e.g.
--     "Apply for a Licence Renew a Licence Apply for a Licence ..." repeats
--     "apply for a" / "for a licence"). Verified against known-good and
--     known-bad rows in production data before applying.
create or replace function public.is_boilerplate_signal(p_text text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_words text[];
  v_trigram text;
  v_seen jsonb := '{}'::jsonb;
  i int;
begin
  if p_text is null or length(trim(p_text)) = 0 then
    return false;
  end if;

  if p_text ~* '(skip to main content|frontpage\s*\||all rights reserved|cookie policy|privacy policy|terms of service|back to top|get in touch:|apply for a licen[cs]e|renew a licen[cs]e|subscribe to our newsletter|follow us on (facebook|twitter|instagram)|page not found|404 not found|an agency of the ministry of)' then
    return true;
  end if;

  v_words := array_remove(regexp_split_to_array(lower(regexp_replace(p_text, '[^[:alnum:]\s]', ' ', 'g')), '\s+'), '');
  if array_length(v_words, 1) is null or array_length(v_words, 1) < 6 then
    return false;
  end if;

  for i in 1 .. array_length(v_words, 1) - 2 loop
    v_trigram := v_words[i] || ' ' || v_words[i+1] || ' ' || v_words[i+2];
    if v_seen ? v_trigram then
      return true;
    end if;
    v_seen := v_seen || jsonb_build_object(v_trigram, true);
  end loop;

  return false;
end;
$$;

-- Retroactively catch existing mis-tagged rows: downgrade (don't delete --
-- keep audit trail) any currently-qualified boilerplate row to 'archived'
-- so it drops out of anything selecting stage='qualified' (including the
-- digest). 'archived' is the closest fit in the existing stage check
-- constraint (new/needs_review/qualified/converted_to_opportunity/
-- linked_to_counterparty/linked_to_market_pathway/archived) -- no schema
-- change made for this.
update ia_signals
set stage = 'archived',
    updated_at = now(),
    notes = coalesce(nullif(notes, ''), '') || ' [auto-archived 2026-07-07: matched boilerplate/nav-text quality filter, was incorrectly stage=qualified]'
where stage = 'qualified'
  and public.is_boilerplate_signal(summary);
