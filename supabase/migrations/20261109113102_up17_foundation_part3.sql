-- Deny by default. Browser roles get only the operations needed for their role.
do $$ declare t text; begin
  foreach t in array array['profiles','workspaces','workspace_members','preferences','platform_connections','social_accounts','games','platform_categories','videos','video_assets','drafts','draft_versions','analysis_jobs','analysis_findings','schedules','publishing_jobs','publishing_attempts','posts','analytics_snapshots','research_items','notifications','audit_logs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  end loop;
end $$;
revoke insert,update,delete on public.games,public.platform_categories,public.draft_versions,public.publishing_attempts,public.posts,public.analytics_snapshots,public.audit_logs from authenticated;
revoke update,delete on public.publishing_jobs,public.analysis_jobs from authenticated;
revoke insert,update,delete on public.workspace_members from authenticated;

create policy profiles_own on public.profiles for all to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy workspaces_member_read on public.workspaces for select to authenticated using(up17_private.is_member(id));
create policy workspaces_owner_update on public.workspaces for update to authenticated using(up17_private.has_role(id,array['owner']::public.member_role[])) with check(up17_private.has_role(id,array['owner']::public.member_role[]));
create policy members_read on public.workspace_members for select to authenticated using(up17_private.is_member(workspace_id));
create policy preferences_own on public.preferences for all to authenticated using(workspace_id in (select workspace_id from public.workspace_members where user_id=(select auth.uid())) and user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and up17_private.is_member(workspace_id));

-- Editor content tables: viewers read; editors/admins/owners write.
do $$ declare t text; begin
  foreach t in array array['videos','video_assets','drafts','research_items'] loop
    execute format('create policy member_read on public.%I for select to authenticated using(up17_private.is_member(workspace_id))',t);
    execute format('create policy editor_insert on public.%I for insert to authenticated with check(up17_private.has_role(workspace_id,array[''owner'',''admin'',''editor'']::public.member_role[]))',t);
    execute format('create policy editor_update on public.%I for update to authenticated using(up17_private.has_role(workspace_id,array[''owner'',''admin'',''editor'']::public.member_role[])) with check(up17_private.has_role(workspace_id,array[''owner'',''admin'',''editor'']::public.member_role[]))',t);
    execute format('create policy editor_delete on public.%I for delete to authenticated using(up17_private.has_role(workspace_id,array[''owner'',''admin'',''editor'']::public.member_role[]))',t);
  end loop;
end $$;
create policy games_read on public.games for select to authenticated using(active);
create policy categories_read on public.platform_categories for select to authenticated using(true);
create policy draft_versions_read on public.draft_versions for select to authenticated using(up17_private.is_member(workspace_id));
create policy findings_read on public.analysis_findings for select to authenticated using(up17_private.is_member(workspace_id));
create policy analysis_read on public.analysis_jobs for select to authenticated using(up17_private.is_member(workspace_id));
create policy analysis_enqueue on public.analysis_jobs for insert to authenticated with check(up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[]) and state='queued' and attempts=0 and lease_token is null and lease_until is null);

-- Account connection writes require admin/owner; a connected state cannot be
-- inserted by a browser. The future OAuth broker uses a private server path.
create policy connections_read on public.platform_connections for select to authenticated using(up17_private.is_member(workspace_id));
create policy accounts_read on public.social_accounts for select to authenticated using(up17_private.is_member(workspace_id));
create policy accounts_admin_update on public.social_accounts for update to authenticated
using(up17_private.has_role(workspace_id,array['owner','admin']::public.member_role[]))
with check(up17_private.has_role(workspace_id,array['owner','admin']::public.member_role[]));
-- Restrict account updates to operational fields, never identity/credential state.
revoke update on public.platform_connections from authenticated;
revoke update on public.social_accounts from authenticated;
grant update(paused,publishing_enabled,timezone) on public.social_accounts to authenticated;

create policy schedules_read on public.schedules for select to authenticated using(up17_private.is_member(workspace_id));
create policy schedules_write on public.schedules for insert to authenticated with check(up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[]) and created_by=(select auth.uid()));
create policy schedules_update on public.schedules for update to authenticated using(up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[])) with check(up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[]));
create policy schedules_delete on public.schedules for delete to authenticated using(up17_private.has_role(workspace_id,array['owner','admin','editor']::public.member_role[]));
create policy publishing_read on public.publishing_jobs for select to authenticated using(up17_private.is_member(workspace_id));
create policy attempts_read on public.publishing_attempts for select to authenticated using(up17_private.is_member(workspace_id));
create policy posts_read on public.posts for select to authenticated using(up17_private.is_member(workspace_id));
create policy analytics_read on public.analytics_snapshots for select to authenticated using(up17_private.is_member(workspace_id));
create policy notifications_own on public.notifications for select to authenticated using(user_id=(select auth.uid()) and up17_private.is_member(workspace_id));
create policy notifications_mark_read on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
revoke update on public.notifications from authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy audit_owner_read on public.audit_logs for select to authenticated using(up17_private.has_role(workspace_id,array['owner']::public.member_role[]));

-- Private original media. Object paths start with the workspace UUID. Members
-- may read; editors may upload only below their workspace prefix. Bucket limits
-- are enforced by Storage as well as the videos table. No public bucket URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('creator-media','creator-media',false,524288000,array['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp','audio/wav','audio/mpeg']);
create policy media_member_read on storage.objects for select to authenticated using(bucket_id='creator-media' and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+' and up17_private.is_member((split_part(name,'/',1))::uuid));
create policy media_editor_upload on storage.objects for insert to authenticated with check(bucket_id='creator-media' and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+' and up17_private.has_role((split_part(name,'/',1))::uuid,array['owner','admin','editor']::public.member_role[]));
create policy media_editor_delete on storage.objects for delete to authenticated using(bucket_id='creator-media' and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+' and up17_private.has_role((split_part(name,'/',1))::uuid,array['owner','admin','editor']::public.member_role[]));
