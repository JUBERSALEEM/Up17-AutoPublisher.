-- Batch D corrections: fail closed when a service caller supplies an actor with
-- no workspace membership, make Instagram's absent PKCE verifier explicit,
-- require a verifier for PKCE platforms, and include long-lived Instagram tokens
-- in the scheduled refresh claim. No prior migration is reapplied.

create or replace function up17_private.service_actor_role(w uuid, actor uuid)
returns public.member_role language sql stable security definer set search_path='' as $$
  select coalesce(
    (select role from public.workspace_members where workspace_id=w and user_id=actor),
    'viewer'::public.member_role
  );
$$;
revoke all on function up17_private.service_actor_role(uuid,uuid) from public,anon,authenticated;

create or replace function public.up17_oauth_begin(
  p_actor uuid, p_workspace uuid, p_platform public.platform,
  p_state_hash text, p_binding_hash text, p_verifier_ciphertext text,
  p_key_id text, p_redirect_uri text
) returns uuid language plpgsql security definer set search_path='' as $$
declare attempt_id uuid; recent integer;
begin
  if up17_private.service_actor_role(p_workspace,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  if p_platform = 'instagram' then
    if p_verifier_ciphertext is not null or p_key_id is distinct from 'none' then
      raise exception 'invalid_oauth_attempt';
    end if;
  elsif p_verifier_ciphertext is null
     or length(p_verifier_ciphertext) < 32
     or length(p_verifier_ciphertext) > 4096
     or p_key_id is null
     or p_key_id !~ '^[A-Za-z0-9_-]{1,64}$' then
    raise exception 'invalid_oauth_attempt';
  end if;
  if p_state_hash is null or p_state_hash !~ '^[0-9a-f]{64}$'
     or p_binding_hash is null or p_binding_hash !~ '^[0-9a-f]{64}$'
     or p_redirect_uri is null or p_redirect_uri !~ '^https?://'
     or length(p_redirect_uri) > 2048 then
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

create or replace function public.up17_connection_refresh_claim(p_limit integer default 20)
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
    where c.revoked_at is null
      and (c.refresh_ciphertext is not null or pc.platform='instagram')
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

revoke all on function public.up17_oauth_begin(uuid,uuid,public.platform,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.up17_connection_refresh_claim(integer) from public,anon,authenticated;
grant execute on function public.up17_oauth_begin(uuid,uuid,public.platform,text,text,text,text,text) to service_role;
grant execute on function public.up17_connection_refresh_claim(integer) to service_role;
