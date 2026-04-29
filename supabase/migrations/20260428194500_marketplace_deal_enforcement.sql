-- Harbourview Marketplace hard deal enforcement
-- Purpose: prevent deals from moving forward without owner, next action, disclosure controls and close data.

create or replace function public.enforce_match_deal_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status not in ('proposed','disclosure_requested','disclosure_approved','introduced','closed_won','closed_lost') then
    raise exception 'Invalid match status: %', new.status;
  end if;

  if new.status not in ('closed_won','closed_lost') then
    if coalesce(trim(new.owner_name), '') = '' then
      raise exception 'Open deal requires owner_name';
    end if;

    if coalesce(trim(new.next_action), '') = '' then
      raise exception 'Open deal requires next_action';
    end if;

    if new.next_action_due_at is null then
      raise exception 'Open deal requires next_action_due_at';
    end if;
  end if;

  if new.status in ('disclosure_approved','introduced','closed_won') then
    if new.buyer_approved_disclosure is not true or new.seller_approved_disclosure is not true then
      raise exception 'Disclosure must be approved by buyer and seller before status %', new.status;
    end if;
  end if;

  if new.status = 'introduced' and new.introduced_at is null then
    new.introduced_at := now();
  end if;

  if new.status = 'closed_won' then
    if new.success_fee_amount is null or new.success_fee_amount <= 0 then
      raise exception 'Closed won deal requires positive success_fee_amount';
    end if;

    if coalesce(trim(new.monetization_path), '') = '' then
      raise exception 'Closed won deal requires monetization_path';
    end if;

    if new.closed_at is null then
      new.closed_at := now();
    end if;
  end if;

  if new.status = 'closed_lost' then
    if coalesce(trim(new.stalled_reason), '') = '' then
      raise exception 'Closed lost deal requires stalled_reason';
    end if;

    if new.closed_at is null then
      new.closed_at := now();
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_enforce_match_deal_rules on public.matches;
create trigger trg_enforce_match_deal_rules
before insert or update on public.matches
for each row execute function public.enforce_match_deal_rules();

create or replace function public.audit_match_deal_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events(entity_type, entity_id, action, actor, metadata)
    values ('match', new.id, 'deal_created', coalesce(new.owner_name, 'system'), jsonb_build_object('status', new.status, 'priority', new.priority));
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      insert into public.status_history(entity_type, entity_id, from_status, to_status, changed_by, reason)
      values ('match', new.id, old.status::text, new.status::text, coalesce(new.owner_name, 'system'), new.stalled_reason);
    end if;

    insert into public.audit_events(entity_type, entity_id, action, actor, metadata)
    values (
      'match',
      new.id,
      'deal_changed',
      coalesce(new.owner_name, 'system'),
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status,
        'priority', new.priority,
        'next_action_due_at', new.next_action_due_at,
        'success_fee_amount', new.success_fee_amount
      )
    );
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_audit_match_deal_changes on public.matches;
create trigger trg_audit_match_deal_changes
after insert or update on public.matches
for each row execute function public.audit_match_deal_changes();
