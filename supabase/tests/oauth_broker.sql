-- Verified after the disconnect order fix; every run still uses the rollback sentinel.
-- Hosted Batch D broker isolation fixture. Run as migration role. EVERYTHING ROLLS BACK.
-- Synthetic identities and opaque synthetic ciphertext only; no provider tokens.
do $fixture$
begin
create temporary table test_ids (label text primary key, id uuid not null) on commit drop;
insert into test_ids values
 ('owner_a','55555555-5555-4555-8555-555555555555'),
 ('owner_b','66666666-6666-4666-8666-666666666666'),
 ('viewer_a','77777777-7777-4777-8777-777777777777');
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',label||'@synthetic.invalid',now(),jsonb_build_object('provider','email','providers',jsonb_build_array('email')),jsonb_build_object('display_name',label),now(),now() from test_ids;
insert into public.workspace_members(workspace_id,user_id,role)
select (select id from public.workspaces where created_by=(select id from test_ids where label='owner_a')),id,'viewer' from test_ids where label='viewer_a';
delete from public.workspaces where created_by in (select id from test_ids where label='viewer_a');

execute $test$ do $$
declare
  owner_a uuid := '55555555-5555-4555-8555-555555555555';
  owner_b uuid := '66666666-6666-4666-8666-666666666666';
  viewer_a uuid := '77777777-7777-4777-8777-777777777777';
  a uuid; b uuid; attempt uuid; ig_attempt uuid; connection uuid; ig_connection uuid;
  token jsonb; ig_token jsonb; lease uuid; lease2 uuid; count_seen integer;
  state_hash text := repeat('a',64);
  binding_hash text := repeat('b',64);
  cipher text := 'v1.synthetic.' || repeat('c',64);
  redirect text := 'https://app.invalid/api/connections/callback/youtube';
begin
  select id into a from public.workspaces where created_by=owner_a;
  select id into b from public.workspaces where created_by=owner_b;
  if a is null or b is null then raise exception 'workspace bootstrap missing'; end if;
  if up17_private.service_actor_role(a,owner_b) <> 'viewer'::public.member_role then
    raise exception 'non-member service actor did not fail closed';
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'up17_%'
      and (
        has_function_privilege('anon',p.oid::regprocedure::text,'EXECUTE')
        or has_function_privilege('authenticated',p.oid::regprocedure::text,'EXECUTE')
      )
  ) then raise exception 'browser service rpc grant'; end if;

  perform set_config('request.jwt.claims',json_build_object('sub',viewer_a,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  begin
    perform public.up17_oauth_begin(viewer_a,a,'youtube',state_hash,binding_hash,cipher,'k1',redirect);
    raise exception 'authenticated broker rpc allowed';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm = 'authenticated broker rpc allowed' then raise;
      else raise exception 'authenticated broker rpc was executable: %', sqlerrm; end if;
  end;
  begin
    perform public.up17_connection_token(viewer_a,gen_random_uuid());
    raise exception 'authenticated token rpc allowed';
  exception
    when insufficient_privilege then null;
    when others then
      if sqlerrm = 'authenticated token rpc allowed' then raise;
      else raise exception 'authenticated token rpc was executable: %', sqlerrm; end if;
  end;
  begin
    select count(*) into count_seen from up17_private.credentials;
    raise exception 'authenticated private credentials readable';
  exception when insufficient_privilege then null; end;
  reset role;

  begin
    perform public.up17_oauth_begin(owner_b,a,'youtube',repeat('1',64),repeat('2',64),cipher,'k1',redirect);
    raise exception 'cross workspace broker begin allowed';
  exception when raise_exception then
    if sqlerrm = 'cross workspace broker begin allowed' then raise; end if;
  end;
  begin
    perform public.up17_oauth_begin(viewer_a,a,'youtube',repeat('3',64),repeat('4',64),cipher,'k1',redirect);
    raise exception 'viewer role broker begin allowed';
  exception when raise_exception then
    if sqlerrm = 'viewer role broker begin allowed' then raise; end if;
  end;

  attempt := public.up17_oauth_begin(owner_a,a,'youtube',state_hash,binding_hash,cipher,'k1',redirect);
  if attempt is null then raise exception 'broker begin failed'; end if;
  begin
    perform public.up17_oauth_consume(state_hash,repeat('c',64),owner_a);
    raise exception 'binding mismatch allowed';
  exception when raise_exception then
    if sqlerrm = 'binding mismatch allowed' then raise; end if;
  end;
  begin
    perform public.up17_oauth_consume(state_hash,binding_hash,owner_b);
    raise exception 'actor mismatch allowed';
  exception when raise_exception then
    if sqlerrm = 'actor mismatch allowed' then raise; end if;
  end;
  token := public.up17_oauth_consume(state_hash,binding_hash,owner_a);
  if token->>'workspace_id' <> a::text or token->>'verifier_ciphertext' <> cipher then
    raise exception 'consume payload mismatch';
  end if;
  begin
    perform public.up17_oauth_consume(state_hash,binding_hash,owner_a);
    raise exception 'state replay allowed';
  exception when raise_exception then
    if sqlerrm = 'state replay allowed' then raise; end if;
  end;

  -- Instagram Business Login has no PKCE verifier; this is explicit, not NULL semantics.
  ig_attempt := public.up17_oauth_begin(owner_a,a,'instagram',repeat('d',64),repeat('e',64),null,'none','https://app.invalid/api/connections/callback/instagram');
  if ig_attempt is null then raise exception 'instagram null verifier rejected'; end if;
  ig_token := public.up17_oauth_consume(repeat('d',64),repeat('e',64),owner_a);
  if ig_token->>'verifier_ciphertext' is not null or ig_token->>'encryption_key_id' <> 'none' then
    raise exception 'instagram null verifier payload mismatch';
  end if;
  begin
    perform public.up17_oauth_begin(owner_a,a,'youtube',repeat('f',64),repeat('1',64),null,'none',redirect);
    raise exception 'null youtube verifier allowed';
  exception when raise_exception then
    if sqlerrm = 'null youtube verifier allowed' then raise; end if;
  end;
  begin
    perform public.up17_oauth_begin(owner_a,a,'instagram',repeat('2',64),repeat('3',64),cipher,'k1',redirect);
    raise exception 'instagram verifier allowed';
  exception when raise_exception then
    if sqlerrm = 'instagram verifier allowed' then raise; end if;
  end;

  connection := public.up17_connection_upsert(owner_a,a,'youtube','synthetic-channel','Synthetic Channel','@synthetic',null,array['scope.a'],cipher,cipher,'k1',now()+interval '1 hour',null,jsonb_build_object('publishing',false),'connected');
  if connection is null then raise exception 'connection upsert failed'; end if;
  ig_connection := public.up17_connection_upsert(owner_a,a,'instagram','synthetic-ig','Synthetic IG','@syntheticig',null,array['instagram_business_basic','instagram_business_content_publish'],cipher,null,'k1',now()+interval '3 days',null,jsonb_build_object('publishing',false),'connected');
  if exists(select 1 from public.social_accounts where connection_id in (connection,ig_connection) and (publishing_enabled or not paused)) then
    raise exception 'publishing enabled by connection';
  end if;

  token := public.up17_connection_token(owner_a,connection);
  if token->>'access_ciphertext' <> cipher then raise exception 'token broker payload mismatch'; end if;
  begin
    perform public.up17_connection_token(owner_b,connection);
    raise exception 'cross workspace token allowed';
  exception when raise_exception then
    if sqlerrm = 'cross workspace token allowed' then raise; end if;
  end;
  begin
    perform public.up17_connection_upsert(owner_b,a,'youtube','foreign-account','Other',null,null,array['scope.a'],cipher,null,'k1',null,null,'{}'::jsonb,'connected');
    raise exception 'foreign workspace upsert allowed';
  exception when raise_exception then
    if sqlerrm = 'foreign workspace upsert allowed' then raise; end if;
  end;

  token := public.up17_connection_refresh_begin(owner_a,connection);
  lease := (token->>'lease_token')::uuid;
  if lease is null then raise exception 'refresh lease missing'; end if;
  begin
    perform public.up17_connection_refresh_begin(owner_a,connection);
    raise exception 'concurrent refresh allowed';
  exception when raise_exception then
    if sqlerrm = 'concurrent refresh allowed' then raise; end if;
  end;
  perform public.up17_connection_refresh_finish(connection,lease,cipher,cipher,'k1',now()+interval '2 hours',null,'connected',null);
  begin
    perform public.up17_connection_refresh_finish(connection,lease,cipher,null,'k1',null,null,'connected',null);
    raise exception 'stale lease allowed';
  exception when raise_exception then
    if sqlerrm = 'stale lease allowed' then raise; end if;
  end;

  -- The broker's failure payload is intentionally all-null for ciphertext/expiry fields.
  token := public.up17_connection_refresh_begin(owner_a,connection);
  lease2 := (token->>'lease_token')::uuid;
  perform public.up17_connection_refresh_finish(connection,lease2,null,null,null,null,null,'needs_authorisation','synthetic_failure');
  if not exists(select 1 from public.platform_connections where id=connection and state='needs_authorisation' and last_error_code='synthetic_failure') then
    raise exception 'all-null refresh failure payload not tolerated';
  end if;
  if not exists(select 1 from public.social_accounts where connection_id=connection and paused and not publishing_enabled) then
    raise exception 'failure did not pause publishing';
  end if;

  perform public.up17_connection_health(owner_a,connection,'connected',null,jsonb_build_object('publishing',false));
  if not exists(select 1 from public.platform_connections where id=connection and state='connected') then
    raise exception 'health success not recorded';
  end if;
  if not exists(select 1 from public.up17_connection_refresh_claim(20) where connection_id=ig_connection) then
    raise exception 'instagram long-lived refresh not claimable';
  end if;

  perform public.up17_connection_disconnect(owner_a,connection,false,'synthetic_remote_unsupported');
  if exists(select 1 from up17_private.credentials where connection_id=connection) then
    raise exception 'disconnect retained ciphertext';
  end if;
  if not exists(select 1 from public.platform_connections where id=connection and state='disconnected' and token_reference is null) then
    raise exception 'disconnect state mismatch';
  end if;

  perform set_config('request.jwt.claims',json_build_object('sub',owner_a,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  if current_user <> 'authenticated' then raise exception 'authenticated role switch failed'; end if;
  select count(*) into count_seen from public.platform_connections where workspace_id=a;
  if count_seen <> 2 then raise exception 'owner connection read failed'; end if;
  begin
    update public.platform_connections set display_name='Forged by browser' where id=connection;
    raise exception 'browser connection write allowed';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from public.platform_connections where id=connection and display_name<>'Synthetic Channel') then
    raise exception 'browser connection write changed data';
  end if;
  reset role;
end; $$ $test$;
raise exception 'ROLLBACK_BROKER_FIXTURE_COMPLETE';
end; $fixture$;
