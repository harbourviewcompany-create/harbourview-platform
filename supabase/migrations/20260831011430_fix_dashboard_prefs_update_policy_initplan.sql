-- Reconstructed from production. Verbatim statements for version 20260831011430.
begin;

alter policy "Users can update their own dashboard preferences"
  on public.user_dashboard_preferences
  using ((select auth.uid()) = user_id)
  with check (
    ((select auth.uid()) = user_id)
    and (
      active_workspace_id is null
      or exists (
        select 1
        from workspace_members wm
        join workspaces w on w.id = wm.workspace_id
        where wm.workspace_id = user_dashboard_preferences.active_workspace_id
          and wm.user_id = (select auth.uid())
          and wm.status = 'active'
          and w.status = 'active'
      )
    )
  );

commit;
