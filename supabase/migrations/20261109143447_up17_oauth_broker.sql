-- Batch D: service-only OAuth broker. Browser roles never receive token custody
-- functions or private-schema table access. Actor authorization is explicit
-- because service-role calls do not carry auth.uid().

alter table up17_private.oauth_attempts
  add column binding_hash text not null default '',
  add column encryption_key_id text not null default '';
alter table up17_private.oauth_attempts
  alter column binding_hash drop default,
  alter column encryption_key_id drop default,
  alter column pkce_verifier_ciphertext drop not null;
create index oauth_attempts_user_created_idx on up17_private.oauth_attempts(user_id,created_at desc);
create index oauth_attempts_expiry_idx on up17_private.oauth_attempts(expires_at) where consumed_at is null;

alter table up17_private.credentials
  add column refresh_expires_at timestamptz,
  add column refresh_lease_until timestamptz,
  add column refresh_lease_token uuid,
  add column last_refresh_at timestamptz;
create index credentials_refresh_due_idx on up17_private.credentials(expires_at)
  where revoked_at is null and refresh_ciphertext is not null;

create function up17_private.service_actor_role(w uuid, actor uuid)
returns public.member_role language sql stable security definer set search_path='' as $$
  select role from public.workspace_members where workspace_id=w and user_id=actor;
$$;
revoke all on function up17_private.service_actor_role(uuid,uuid) from public,anon,authenticated;

create function public.up17_oauth_begin(
  p_actor uuid, p_workspace uuid, p_platform public.platform,
  p_state_hash text, p_binding_hash text, p_verifier_ciphertext text,
  p_key_id text, p_redirect_uri text
) returns uuid language plpgsql security definer set search_path='' as $$
declare attempt_id uuid; recent integer;
begin
  if up17_private.service_actor_role(p_workspace,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  if p_state_hash !~ '^[0-9a-f]{64}$' or p_binding_hash !~ '^[0-9a-f]{64}$'
     or length(p_verifier_ciphertext) < 32 or length(p_key_id) not between 1 and 64
     or p_redirect_uri !~ '^https?://' then
    raise exception 'invalid_oauth_attempt';
  end if;
  select count(*) into recent from up17_private.oauth_attempts
    where user_id=p_actor and created_at > now()-interval '1 hour';
  if recent >= 30 then raise exception 'oauth_rate_limited'; end if;
  insert into up17_private.oauth_attempts(
    state_hash,binding_hash,pkce_verifier_ciphertext,encryption_key_id,
    workspace_id,user_id,platform,redirect_uri,expires_at
  ) values (
    p_state_hash,p_binding_hash,p_verifier_ciphertext,p_key_id,
    p_workspace,p_actor,p_platform,p_redirect_uri,now()+interval '10 minutes'
  ) returning id into attempt_id;
  return attempt_id;
end; $$;

create function public.up17_oauth_consume(
  p_state_hash text, p_binding_hash text, p_actor uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare attempt up17_private.oauth_attempts;
begin
  update up17_private.oauth_attempts set consumed_at=now()
    where state_hash=p_state_hash and binding_hash=p_binding_hash and user_id=p_actor
      and consumed_at is null and expires_at > now()
  returning * into attempt;
  if attempt.id is null then raise exception 'oauth_state_invalid_or_replayed'; end if;
  return jsonb_build_object(
    'id',attempt.id,'workspace_id',attempt.workspace_id,'user_id',attempt.user_id,
    'platform',attempt.platform,'redirect_uri',attempt.redirect_uri,
    'verifier_ciphertext',attempt.pkce_verifier_ciphertext,'encryption_key_id',attempt.encryption_key_id
  );
end; $$;

create function public.up17_connection_upsert(
  p_actor uuid, p_workspace uuid, p_platform public.platform,
  p_provider_account_id text, p_display_name text, p_handle text, p_avatar_url text,
  p_scopes text[], p_access_ciphertext text, p_refresh_ciphertext text,
  p_key_id text, p_expires_at timestamptz, p_refresh_expires_at timestamptz,
  p_capabilities jsonb, p_state public.connection_state
) returns uuid language plpgsql security definer set search_path='' as $$
declare connection_id uuid; credential_id uuid;
begin
  if up17_private.service_actor_role(p_workspace,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  if p_provider_account_id is null or length(trim(p_provider_account_id)) not between 1 and 191
     or length(trim(p_display_name)) not between 1 and 120
     or p_state not in ('connected','limited_permissions')
     or length(p_access_ciphertext) < 32 or length(p_key_id) not between 1 and 64
     or jsonb_typeof(p_capabilities) <> 'object' then
    raise exception 'invalid_connection';
  end if;
  insert into public.platform_connections(workspace_id,platform,provider_account_id,display_name,state,created_by)
    values(p_workspace,p_platform,trim(p_provider_account_id),trim(p_display_name),'pending',p_actor)
  on conflict (workspace_id,platform,provider_account_id) where provider_account_id is not null
  do update set display_name=excluded.display_name, updated_at=now()
  returning id into connection_id;
  insert into up17_private.credentials(connection_id,access_ciphertext,refresh_ciphertext,encryption_key_id,scopes,expires_at,refresh_expires_at,revoked_at)
    values(connection_id,p_access_ciphertext,p_refresh_ciphertext,p_key_id,p_scopes,p_expires_at,p_refresh_expires_at,null)
  on conflict (connection_id) do update set
    access_ciphertext=excluded.access_ciphertext,
    refresh_ciphertext=excluded.refresh_ciphertext,
    encryption_key_id=excluded.encryption_key_id,
    scopes=excluded.scopes,
    expires_at=excluded.expires_at,
    refresh_expires_at=excluded.refresh_expires_at,
    revoked_at=null,
    refresh_lease_until=null,
    refresh_lease_token=null,
    updated_at=now()
  returning id into credential_id;
  update public.platform_connections set
    state=p_state, granted_scopes=p_scopes, token_reference=credential_id,
    last_verified_at=now(), last_error_code=null, updated_at=now()
  where id=connection_id;
  insert into public.social_accounts(workspace_id,connection_id,platform,display_name,handle,avatar_url,capabilities,publishing_enabled,paused)
    values(p_workspace,connection_id,p_platform,trim(p_display_name),p_handle,p_avatar_url,p_capabilities,false,true)
  on conflict (connection_id,platform) do update set
    display_name=excluded.display_name, handle=excluded.handle, avatar_url=excluded.avatar_url,
    capabilities=excluded.capabilities, publishing_enabled=false, paused=true, updated_at=now();
  insert into public.audit_logs(workspace_id,actor_id,action,target_type,target_id,summary)
    values(p_workspace,p_actor,'connection.authorized','platform_connection',connection_id::text,
      jsonb_build_object('platform',p_platform,'state',p_state,'scopes',p_scopes));
  return connection_id;
end; $$;

create function public.up17_connection_token(p_actor uuid, p_connection_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare connection public.platform_connections; credential up17_private.credentials;
begin
  select * into connection from public.platform_connections where id=p_connection_id;
  if connection.id is null or up17_private.service_actor_role(connection.workspace_id,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  select * into credential from up17_private.credentials where connection_id=p_connection_id and revoked_at is null;
  if credential.id is null then raise exception 'credential_unavailable'; end if;
  return jsonb_build_object(
    'connection_id',connection.id,'workspace_id',connection.workspace_id,'platform',connection.platform,
    'provider_account_id',connection.provider_account_id,'state',connection.state,
    'access_ciphertext',credential.access_ciphertext,'refresh_ciphertext',credential.refresh_ciphertext,
    'encryption_key_id',credential.encryption_key_id,'scopes',credential.scopes,
    'expires_at',credential.expires_at,'refresh_expires_at',credential.refresh_expires_at
  );
end; $$;

create function public.up17_connection_refresh_begin(p_actor uuid, p_connection_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare connection public.platform_connections; credential up17_private.credentials; lease uuid;
begin
  select * into connection from public.platform_connections where id=p_connection_id;
  if connection.id is null or up17_private.service_actor_role(connection.workspace_id,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  update up17_private.credentials set
    refresh_lease_until=now()+interval '5 minutes', refresh_lease_token=gen_random_uuid()
  where connection_id=p_connection_id and revoked_at is null
    and (refresh_lease_until is null or refresh_lease_until < now())
  returning * into credential;
  if credential.id is null then raise exception 'refresh_busy_or_unavailable'; end if;
  lease := credential.refresh_lease_token;
  return jsonb_build_object(
    'connection_id',connection.id,'workspace_id',connection.workspace_id,'platform',connection.platform,
    'provider_account_id',connection.provider_account_id,'state',connection.state,
    'access_ciphertext',credential.access_ciphertext,'refresh_ciphertext',credential.refresh_ciphertext,
    'encryption_key_id',credential.encryption_key_id,'scopes',credential.scopes,
    'expires_at',credential.expires_at,'refresh_expires_at',credential.refresh_expires_at,
    'lease_token',lease
  );
end; $$;

create function public.up17_connection_refresh_claim(p_limit integer default 20)
returns table(
  connection_id uuid, workspace_id uuid, platform public.platform, provider_account_id text,
  access_ciphertext text, refresh_ciphertext text, encryption_key_id text, scopes text[],
  expires_at timestamptz, refresh_expires_at timestamptz, lease_token uuid
) language plpgsql security definer set search_path='' as $$
begin
  if p_limit not between 1 and 100 then raise exception 'invalid_limit'; end if;
  return query
  with due as (
    select c.id from up17_private.credentials c
      join public.platform_connections pc on pc.id=c.connection_id
    where c.revoked_at is null and c.refresh_ciphertext is not null
      and pc.state in ('connected','limited_permissions')
      and (c.refresh_lease_until is null or c.refresh_lease_until < now())
      and (
        c.expires_at is null or c.expires_at < now()+interval '7 days'
        or (pc.platform='instagram' and c.expires_at < now()+interval '30 days' and c.updated_at < now()-interval '1 day')
      )
    order by c.expires_at nulls first
    limit p_limit
    for update of c skip locked
  ), claimed as (
    update up17_private.credentials c set
      refresh_lease_until=now()+interval '5 minutes',
      refresh_lease_token=gen_random_uuid()
    from due where c.id=due.id
    returning c.id,c.connection_id,c.access_ciphertext,c.refresh_ciphertext,c.encryption_key_id,
      c.scopes,c.expires_at,c.refresh_expires_at,c.refresh_lease_token
  )
  select cl.connection_id,pc.workspace_id,pc.platform,pc.provider_account_id,
    cl.access_ciphertext,cl.refresh_ciphertext,cl.encryption_key_id,cl.scopes,
    cl.expires_at,cl.refresh_expires_at,cl.refresh_lease_token
  from claimed cl join public.platform_connections pc on pc.id=cl.connection_id;
end; $$;

create function public.up17_connection_refresh_finish(
  p_connection_id uuid, p_lease_token uuid,
  p_access_ciphertext text, p_refresh_ciphertext text, p_key_id text,
  p_expires_at timestamptz, p_refresh_expires_at timestamptz,
  p_state public.connection_state, p_error_code text
) returns void language plpgsql security definer set search_path='' as $$
declare credential up17_private.credentials; w uuid;
begin
  select * into credential from up17_private.credentials
    where connection_id=p_connection_id and refresh_lease_token=p_lease_token
      and refresh_lease_until > now()
  for update;
  if credential.id is null then raise exception 'refresh_lease_invalid'; end if;
  if p_state in ('connected','limited_permissions') then
    if length(p_access_ciphertext) < 32 or length(p_key_id) not between 1 and 64 then
      raise exception 'invalid_refresh';
    end if;
    update up17_private.credentials set
      access_ciphertext=p_access_ciphertext,
      refresh_ciphertext=coalesce(p_refresh_ciphertext,refresh_ciphertext),
      encryption_key_id=p_key_id, expires_at=p_expires_at,
      refresh_expires_at=coalesce(p_refresh_expires_at,refresh_expires_at),
      last_refresh_at=now(), refresh_lease_until=null, refresh_lease_token=null, updated_at=now()
    where id=credential.id;
    update public.platform_connections set state=p_state,last_verified_at=now(),last_error_code=null,updated_at=now()
      where id=p_connection_id;
  else
    update up17_private.credentials set
      revoked_at=case when p_state='disconnected' then now() else revoked_at end,
      refresh_lease_until=null, refresh_lease_token=null, updated_at=now()
    where id=credential.id;
    update public.platform_connections set state=p_state,last_error_code=p_error_code,updated_at=now()
      where id=p_connection_id;
    update public.social_accounts set publishing_enabled=false,paused=true,updated_at=now()
      where connection_id=p_connection_id;
  end if;
  select workspace_id into w from public.platform_connections where id=p_connection_id;
  insert into public.audit_logs(workspace_id,actor_id,action,target_type,target_id,summary)
    values(w,null,'connection.refresh','platform_connection',p_connection_id::text,
      jsonb_build_object('state',p_state,'error_code',p_error_code));
end; $$;

create function public.up17_connection_health(
  p_actor uuid, p_connection_id uuid, p_state public.connection_state,
  p_error_code text, p_capabilities jsonb
) returns void language plpgsql security definer set search_path='' as $$
declare w uuid;
begin
  select workspace_id into w from public.platform_connections where id=p_connection_id;
  if w is null or up17_private.service_actor_role(w,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  if jsonb_typeof(p_capabilities) <> 'object' then raise exception 'invalid_capabilities'; end if;
  update public.platform_connections set
    state=p_state, last_error_code=p_error_code,
    last_verified_at=case when p_state in ('connected','limited_permissions') then now() else last_verified_at end,
    updated_at=now()
  where id=p_connection_id;
  update public.social_accounts set
    capabilities=p_capabilities,
    publishing_enabled=case when p_state in ('connected','limited_permissions') then publishing_enabled else false end,
    paused=case when p_state in ('connected','limited_permissions') then paused else true end,
    updated_at=now()
  where connection_id=p_connection_id;
  insert into public.audit_logs(workspace_id,actor_id,action,target_type,target_id,summary)
    values(w,p_actor,'connection.health','platform_connection',p_connection_id::text,
      jsonb_build_object('state',p_state,'error_code',p_error_code));
end; $$;

create function public.up17_connection_disconnect(
  p_actor uuid, p_connection_id uuid, p_remote_revoked boolean, p_error_code text
) returns void language plpgsql security definer set search_path='' as $$
declare w uuid;
begin
  select workspace_id into w from public.platform_connections where id=p_connection_id;
  if w is null or up17_private.service_actor_role(w,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  delete from up17_private.credentials where connection_id=p_connection_id;
  update public.platform_connections set
    state='disconnected', token_reference=null,
    last_error_code=case when p_remote_revoked then null else coalesce(p_error_code,'remote_revoke_unconfirmed') end,
    updated_at=now()
  where id=p_connection_id;
  update public.social_accounts set publishing_enabled=false,paused=true,updated_at=now()
    where connection_id=p_connection_id;
  insert into public.audit_logs(workspace_id,actor_id,action,target_type,target_id,summary)
    values(w,p_actor,'connection.disconnected','platform_connection',p_connection_id::text,
      jsonb_build_object('remote_revoked',p_remote_revoked,'error_code',p_error_code));
end; $$;

create function public.up17_oauth_cleanup() returns integer
language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
  delete from up17_private.oauth_attempts where expires_at < now()-interval '1 day';
  get diagnostics removed = row_count;
  return removed;
end; $$;

revoke all on function public.up17_oauth_begin(uuid,uuid,public.platform,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.up17_oauth_consume(text,text,uuid) from public,anon,authenticated;
revoke all on function public.up17_connection_upsert(uuid,uuid,public.platform,text,text,text,text,text[],text,text,text,timestamptz,timestamptz,jsonb,public.connection_state) from public,anon,authenticated;
revoke all on function public.up17_connection_token(uuid,uuid) from public,anon,authenticated;
revoke all on function public.up17_connection_refresh_begin(uuid,uuid) from public,anon,authenticated;
revoke all on function public.up17_connection_refresh_claim(integer) from public,anon,authenticated;
revoke all on function public.up17_connection_refresh_finish(uuid,uuid,text,text,text,timestamptz,timestamptz,public.connection_state,text) from public,anon,authenticated;
revoke all on function public.up17_connection_health(uuid,uuid,public.connection_state,text,jsonb) from public,anon,authenticated;
revoke all on function public.up17_connection_disconnect(uuid,uuid,boolean,text) from public,anon,authenticated;
revoke all on function public.up17_oauth_cleanup() from public,anon,authenticated;
grant execute on function public.up17_oauth_begin(uuid,uuid,public.platform,text,text,text,text,text) to service_role;
grant execute on function public.up17_oauth_consume(text,text,uuid) to service_role;
grant execute on function public.up17_connection_upsert(uuid,uuid,public.platform,text,text,text,text,text[],text,text,text,timestamptz,timestamptz,jsonb,public.connection_state) to service_role;
grant execute on function public.up17_connection_token(uuid,uuid) to service_role;
grant execute on function public.up17_connection_refresh_begin(uuid,uuid) to service_role;
grant execute on function public.up17_connection_refresh_claim(integer) to service_role;
grant execute on function public.up17_connection_refresh_finish(uuid,uuid,text,text,text,timestamptz,timestamptz,public.connection_state,text) to service_role;
grant execute on function public.up17_connection_health(uuid,uuid,public.connection_state,text,jsonb) to service_role;
grant execute on function public.up17_connection_disconnect(uuid,uuid,boolean,text) to service_role;
grant execute on function public.up17_oauth_cleanup() to service_role;
