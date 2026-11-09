-- Hosted PostgreSQL integration test. Run as the migration role. EVERYTHING ROLLS BACK.
-- Synthetic identities only; no password, token, email delivery or real media.
do $fixture$
begin
create temporary table test_ids (label text primary key, id uuid not null) on commit drop;
insert into test_ids values
 ('owner_a','11111111-1111-4111-8111-111111111111'),
 ('owner_b','22222222-2222-4222-8222-222222222222'),
 ('editor_a','33333333-3333-4333-8333-333333333333'),
 ('viewer_a','44444444-4444-4444-8444-444444444444');
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',label||'@synthetic.invalid',now(),'{"provider":"email","providers":["email"]}'::jsonb,jsonb_build_object('display_name',label),now(),now() from test_ids;
insert into public.workspace_members(workspace_id,user_id,role)
select (select id from public.workspaces where created_by=(select id from test_ids where label='owner_a')),id,'editor' from test_ids where label='editor_a';
insert into public.workspace_members(workspace_id,user_id,role)
select (select id from public.workspaces where created_by=(select id from test_ids where label='owner_a')),id,'viewer' from test_ids where label='viewer_a';
delete from public.workspaces where created_by in (select id from test_ids where label in ('editor_a','viewer_a'));
insert into public.preferences(workspace_id,user_id)
select (select id from public.workspaces where created_by=(select id from test_ids where label='owner_a')),id from test_ids where label in ('editor_a','viewer_a');
insert into public.platform_categories(platform,provider_category_id,label,source_url,retrieved_at) values('instagram','22','Gaming','https://synthetic.invalid/category',now());

execute $test$ do $$
declare a uuid; b uuid; owner_id uuid; owner_b uuid; editor_id uuid; viewer_id uuid; v uuid; d uuid; n uuid; result integer; count_seen integer;
begin
  select id into a from public.workspaces where created_by=(select id from test_ids where label='owner_a');
  select id into b from public.workspaces where created_by=(select id from test_ids where label='owner_b');
  select id into owner_id from test_ids where label='owner_a';
  select id into owner_b from test_ids where label='owner_b';
  select id into editor_id from test_ids where label='editor_a';
  select id into viewer_id from test_ids where label='viewer_a';
  if (select count(*) from public.profiles) <> 4 then raise exception 'signup trigger did not create profiles'; end if;
  if (select count(*) from public.workspace_members where role='owner') <> 2 then raise exception 'owner bootstrap failed'; end if;
  perform set_config('request.jwt.claims',json_build_object('sub',owner_id,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  select count(*) into count_seen from public.workspaces;
  if count_seen <> 1 then raise exception 'owner sees another workspace: %',count_seen; end if;
  insert into public.videos(workspace_id,uploaded_by,title,original_name,mime_type,size_bytes,storage_path) values(a,owner_id,'Test original','original.mp4','video/mp4',100,a::text||'/original.mp4') returning id into v;
  insert into public.drafts(workspace_id,video_id,platform,title,created_by) values(a,v,'youtube','Test draft',owner_id) returning id into d;
  if (select count(*) from public.draft_versions where draft_id=d) <> 1 then raise exception 'initial draft version missing'; end if;
  begin update public.drafts set category_id=(select id from public.platform_categories where platform='instagram' limit 1),version=2 where id=d; raise exception 'cross-platform category allowed'; exception when foreign_key_violation then null; end;
  update public.drafts set title='Version two',version=2 where id=d;
  if (select count(*) from public.draft_versions where draft_id=d) <> 2 then raise exception 'draft version missing'; end if;
  begin update public.drafts set title='Bad version',version=4 where id=d; raise exception 'draft version skip allowed'; exception when raise_exception then if sqlerrm='draft version skip allowed' then raise; end if; end;
  insert into storage.objects(bucket_id,name,owner,owner_id,metadata) values('creator-media',a::text||'/original.mp4',owner_id,owner_id,'{"mimetype":"video/mp4","size":100}'::jsonb);
  select public.save_workspace_preferences(a,1,'{"name":"Renamed A","niche":"BGMI","audience":"","voice":"Clear & encouraging","language":"English","timezone":"UTC","reduceMotion":false,"notifications":{"processing":true,"publishing":true,"accounts":true,"analytics":true}}'::jsonb) into result;
  if result <> 2 then raise exception 'preference revision failed'; end if;
  if not exists(select 1 from public.audit_logs where workspace_id=a and actor_id=owner_id and action='preferences.saved') then raise exception 'settings audit missing'; end if;
  begin perform public.save_workspace_preferences(a,1,'{}'::jsonb); raise exception 'stale preference write allowed'; exception when raise_exception then if sqlerrm='stale preference write allowed' then raise; end if; end;
  begin perform public.save_workspace_preferences(a,2,'{"name":"Renamed A","niche":"BGMI","audience":"","voice":"Clear & encouraging","language":"English","timezone":"UTC","reduceMotion":"yes","notifications":{"processing":true,"publishing":true,"accounts":true,"analytics":true}}'::jsonb); raise exception 'malformed preference boolean allowed'; exception when raise_exception then if sqlerrm='malformed preference boolean allowed' then raise; end if; end;
  begin perform public.save_workspace_preferences(a,2,'{"name":"Renamed A","niche":"BGMI","audience":"","voice":"Clear & encouraging","language":"English","timezone":"UTC","reduceMotion":false,"notifications":{"processing":true,"publishing":true,"accounts":true,"analytics":"yes"}}'::jsonb); raise exception 'malformed notification boolean allowed'; exception when raise_exception then if sqlerrm='malformed notification boolean allowed' then raise; end if; end;
  begin update public.preferences set settings='{}'::jsonb where workspace_id=a and user_id=owner_id; raise exception 'direct preference write allowed'; exception when insufficient_privilege then null; end;
  begin update public.workspaces set name='Direct rename' where id=a; raise exception 'direct workspace rename allowed'; exception when insufficient_privilege then null; end;
  begin update public.workspace_members set role='owner' where user_id=viewer_id; raise exception 'role elevation allowed'; exception when insufficient_privilege then null; end;
  begin update public.videos set storage_path='elsewhere' where id=v; raise exception 'protected video column writable'; exception when insufficient_privilege then null; end;
  begin insert into public.audit_logs(workspace_id,actor_id,action,target_type,target_id) values(a,owner_id,'forged','test','test'); raise exception 'audit forgery allowed'; exception when insufficient_privilege then null; end;
  begin perform * from up17_private.credentials; raise exception 'private credentials readable'; exception when insufficient_privilege then null; end;
  reset role;
  insert into public.notifications(workspace_id,user_id,category,title,dedupe_key) values(a,owner_id,'security','Owner notice','test-owner') returning id into n;
  insert into public.notifications(workspace_id,user_id,category,title,dedupe_key) values(a,editor_id,'security','Editor notice','test-editor');
  perform set_config('request.jwt.claims',json_build_object('sub',editor_id,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  select count(*) into count_seen from public.workspaces;
  if count_seen <> 1 then raise exception 'editor workspace isolation failed'; end if;
  select count(*) into count_seen from public.notifications;
  if count_seen <> 1 then raise exception 'notification isolation failed'; end if;
  update public.notifications set read_at=now() where id=n;
  if exists(select 1 from public.notifications where id=n) then raise exception 'cross-user notification update visible'; end if;
  begin insert into public.videos(workspace_id,uploaded_by,title,original_name,mime_type,size_bytes,storage_path) values(b,editor_id,'Cross tenant','x.mp4','video/mp4',100,b::text||'/x.mp4'); raise exception 'cross tenant video allowed'; exception when sqlstate '42501' then null; end;
  begin insert into public.videos(workspace_id,uploaded_by,title,original_name,mime_type,size_bytes,storage_path) values(a,owner_id,'Forged uploader','x.mp4','video/mp4',100,a::text||'/forged.mp4'); raise exception 'forged uploader allowed'; exception when sqlstate '42501' then null; end;
  begin insert into storage.objects(bucket_id,name,owner,owner_id) values('creator-media',b::text||'/steal.mp4',editor_id,editor_id); raise exception 'cross tenant storage upload allowed'; exception when sqlstate '42501' then null; end;
  select count(*) into count_seen from storage.objects where bucket_id='creator-media';
  if count_seen <> 1 then raise exception 'shared workspace media read failed'; end if;
  begin perform public.save_workspace_preferences(b,1,'{}'::jsonb); raise exception 'foreign preference rpc allowed'; exception when raise_exception then if sqlerrm='foreign preference rpc allowed' then raise; end if; end;
  reset role;
  perform set_config('request.jwt.claims',json_build_object('sub',viewer_id,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  select count(*) into count_seen from public.videos;
  if count_seen <> 1 then raise exception 'viewer cannot read workspace video'; end if;
  begin insert into public.drafts(workspace_id,video_id,platform,title,created_by) values(a,v,'youtube','Viewer write',viewer_id); raise exception 'viewer draft write allowed'; exception when sqlstate '42501' then null; end;
  -- DELETE with RLS denial removes zero rows rather than raising; verify surviving object.
  if up17_private.has_role(a,array['owner','admin','editor']::public.member_role[]) then raise exception 'viewer has media editor role'; end if;
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media_editor_delete' and cmd='DELETE') then raise exception 'media delete policy missing'; end if;
  reset role;
  perform set_config('request.jwt.claims',json_build_object('sub',owner_b,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  select count(*) into count_seen from public.videos;
  if count_seen <> 0 then raise exception 'cross workspace video leak'; end if;
  select count(*) into count_seen from storage.objects where bucket_id='creator-media';
  if count_seen <> 0 then raise exception 'cross workspace storage leak'; end if;
  reset role;
  perform set_config('request.jwt.claims','{}',true);
  perform set_config('role','anon',true);
  begin select count(*) into count_seen from public.videos; raise exception 'anonymous video grant'; exception when insufficient_privilege then null; end;
  begin select count(*) into count_seen from public.workspaces; raise exception 'anonymous workspace grant'; exception when insufficient_privilege then null; end;
end $$; $test$;
raise exception 'ROLLBACK_FIXTURE_COMPLETE';
end; $fixture$;
