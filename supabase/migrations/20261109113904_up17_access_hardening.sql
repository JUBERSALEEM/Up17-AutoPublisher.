-- Add atomic, audited preference writes and tighten browser-writable columns.
alter table public.preferences add column revision integer not null default 1 check (revision > 0);
alter table up17_private.oauth_attempts enable row level security;
alter table up17_private.credentials enable row level security;

revoke update on public.workspaces from authenticated;
grant update(name) on public.workspaces to authenticated;
revoke update on public.videos from authenticated;
grant update(title,game_id,rights_attested) on public.videos to authenticated;
revoke update on public.drafts from authenticated;
grant update(account_id,category_id,title,description,hashtags,tags,settings,version) on public.drafts to authenticated;
revoke update on public.schedules from authenticated;
grant update(scheduled_at,timezone,state) on public.schedules to authenticated;

drop policy editor_insert on public.videos;
create policy editor_insert on public.videos for insert to authenticated
with check (up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[]) and uploaded_by=(select auth.uid()));
drop policy editor_insert on public.drafts;
create policy editor_insert on public.drafts for insert to authenticated
with check (up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[]) and created_by=(select auth.uid()));
drop policy editor_insert on public.research_items;
create policy editor_insert on public.research_items for insert to authenticated
with check (up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[]) and created_by=(select auth.uid()));
drop policy analysis_enqueue on public.analysis_jobs;
create policy analysis_enqueue on public.analysis_jobs for insert to authenticated
with check (up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[]) and created_by=(select auth.uid()) and state='queued' and attempts=0 and lease_token is null and lease_until is null);

alter table public.video_assets add unique(id,workspace_id);
alter table public.analysis_findings add constraint finding_evidence_workspace_fk foreign key(evidence_asset_id,workspace_id) references public.video_assets(id,workspace_id);
alter table public.draft_versions add unique(id,workspace_id);
alter table public.publishing_jobs add constraint publishing_version_workspace_fk foreign key(draft_version_id,workspace_id) references public.draft_versions(id,workspace_id);
alter table public.posts add constraint post_account_workspace_fk foreign key(account_id,workspace_id) references public.social_accounts(id,workspace_id);

create function public.save_workspace_preferences(target_workspace uuid, expected_revision integer, proposed_settings jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare actor uuid := (select auth.uid()); current_revision integer; current_name text;
begin
  if actor is null or not up17_private.is_member(target_workspace) then raise exception 'workspace_access_denied'; end if;
  if jsonb_typeof(proposed_settings) <> 'object' or octet_length(proposed_settings::text) >= 16000 then raise exception 'invalid_preferences'; end if;
  if (select count(*) from jsonb_object_keys(proposed_settings) k where k not in ('name','niche','audience','voice','language','timezone','reduceMotion','notifications')) <> 0 then raise exception 'invalid_preferences'; end if;
  if jsonb_typeof(proposed_settings->'name') <> 'string' or length(trim(proposed_settings->>'name')) not between 2 and 48 then raise exception 'invalid_preferences'; end if;
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
