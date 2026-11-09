-- Close direct preference writes: the audited, revision-checked RPC is the only browser write path.
revoke insert, update, delete on public.preferences from authenticated;
revoke insert, update, delete on public.workspaces from authenticated;
revoke update(name) on public.workspaces from authenticated;
revoke insert, delete on public.notifications from authenticated;
revoke insert, delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update(display_name) on public.profiles to authenticated;

-- Category choices must belong to the draft platform.
alter table public.platform_categories add unique(id, platform);
alter table public.drafts add constraint draft_category_platform_fk foreign key(category_id, platform) references public.platform_categories(id, platform);

create or replace function public.save_workspace_preferences(target_workspace uuid, expected_revision integer, proposed_settings jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare actor uuid := (select auth.uid()); current_revision integer; current_name text;
begin
  if actor is null or not up17_private.is_member(target_workspace) then raise exception 'workspace_access_denied'; end if;
  if jsonb_typeof(proposed_settings) <> 'object' or octet_length(proposed_settings::text) >= 16000 then raise exception 'invalid_preferences'; end if;
  if (select count(*) from jsonb_object_keys(proposed_settings) k) <> 8
    or (select count(*) from jsonb_object_keys(proposed_settings) k where k not in ('name','niche','audience','voice','language','timezone','reduceMotion','notifications')) <> 0 then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'name') <> 'string' or length(trim(proposed_settings->>'name')) not between 2 and 48 then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'niche') <> 'string' or length(trim(proposed_settings->>'niche')) not between 2 and 80 then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'audience') <> 'string' or length(proposed_settings->>'audience') > 120 then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'voice') <> 'string' or proposed_settings->>'voice' not in ('Clear & encouraging','Direct & analytical','Friendly & conversational') then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'language') <> 'string' or proposed_settings->>'language' not in ('English','Hindi','Arabic') then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'timezone') <> 'string' or proposed_settings->>'timezone' not in ('Asia/Dubai','Asia/Kolkata','UTC','Europe/London','America/New_York') then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'reduceMotion') <> 'boolean' then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'notifications') <> 'object'
    or (select count(*) from jsonb_object_keys(proposed_settings->'notifications') k) <> 4
    or (select count(*) from jsonb_object_keys(proposed_settings->'notifications') k where k not in ('processing','publishing','accounts','analytics')) <> 0 then raise exception 'invalid_preferences'; end if;
  if exists(select 1 from jsonb_each(proposed_settings->'notifications') e where jsonb_typeof(e.value) <> 'boolean') then raise exception 'invalid_preferences'; end if;
  select revision into current_revision from public.preferences where workspace_id=target_workspace and user_id=actor for update;
  if current_revision is null or current_revision <> expected_revision then raise exception 'preferences_conflict'; end if;
  select name into current_name from public.workspaces where id=target_workspace;
  if proposed_settings->>'name' <> current_name and not up17_private.has_role(target_workspace,array['owner','admin']::public.member_role[]) then raise exception 'workspace_rename_denied'; end if;
  update public.workspaces set name=trim(proposed_settings->>'name') where id=target_workspace;
  update public.preferences set settings=proposed_settings, revision=revision+1, updated_at=now()
    where workspace_id=target_workspace and user_id=actor returning revision into current_revision;
  insert into public.audit_logs(workspace_id,actor_id,action,target_type,target_id,summary)
    values(target_workspace,actor,'preferences.saved','preferences',actor::text,jsonb_build_object('revision',current_revision));
  return current_revision;
end; $$;
revoke all on function public.save_workspace_preferences(uuid,integer,jsonb) from public,anon;
grant execute on function public.save_workspace_preferences(uuid,integer,jsonb) to authenticated;
