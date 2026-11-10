-- Master task: public OAuth callback bridge and evidence-based readiness.
-- The Edge Function is publicly reachable, but it never receives a provider
-- access token and never writes a provider code to a URL or browser response.
-- All privileged RPCs are service-only and validate actor, workspace role,
-- state, browser binding, expiry and one-time consumption.

create table public.deployment_evidence (
  key text primary key,
  state text not null check (state in (
    'MISSING','CONFIGURED','VERIFIED','OWNER ACTION REQUIRED','BLOCKED','NOT APPLICABLE'
  )),
  evidence text not null,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.deployment_evidence enable row level security;
revoke all on table public.deployment_evidence from public, anon, authenticated;
grant select, insert, update, delete on table public.deployment_evidence to service_role;

create table up17_private.oauth_bridge_sessions (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique check (state_hash ~ '^[0-9a-f]{64}$'),
  binding_hash text not null check (binding_hash ~ '^[0-9a-f]{64}$'),
  actor_id uuid not null,
  workspace_id uuid not null,
  platform public.platform not null,
  redirect_uri text not null check (redirect_uri ~ '^https://[A-Za-z0-9.-]+/functions/v1/up17-oauth-callback[?]mode=callback&platform=(youtube|instagram|tiktok)$'),
  return_origin text not null check (return_origin ~ '^https://[A-Za-z0-9.-]+$'),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);
create index oauth_bridge_sessions_expiry_idx
  on up17_private.oauth_bridge_sessions(expires_at) where consumed_at is null;
alter table up17_private.oauth_bridge_sessions enable row level security;
revoke all on table up17_private.oauth_bridge_sessions from public, anon, authenticated;
grant select, insert, update, delete on table up17_private.oauth_bridge_sessions to service_role;

create table up17_private.oauth_callback_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_token_hash text not null unique check (receipt_token_hash ~ '^[0-9a-f]{64}$'),
  bridge_id uuid not null references up17_private.oauth_bridge_sessions(id) on delete cascade,
  state text not null check (length(state) between 1 and 256),
  code_ciphertext text check (code_ciphertext is null or length(code_ciphertext) >= 32),
  key_id text check (key_id is null or key_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  provider_error text check (provider_error is null or length(provider_error) <= 120),
  binding_hash text not null check (binding_hash ~ '^[0-9a-f]{64}$'),
  actor_id uuid not null,
  workspace_id uuid not null,
  platform public.platform not null,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);
create index oauth_callback_receipts_expiry_idx
  on up17_private.oauth_callback_receipts(expires_at) where consumed_at is null;
alter table up17_private.oauth_callback_receipts enable row level security;
revoke all on table up17_private.oauth_callback_receipts from public, anon, authenticated;
grant select, insert, update, delete on table up17_private.oauth_callback_receipts to service_role;

-- Resumable/upsert uploads require a workspace-scoped UPDATE policy in addition
-- to the existing SELECT/INSERT/DELETE policies. USING and WITH CHECK both keep
-- the object inside the same workspace prefix for editors/owners/admins.
create policy media_editor_update on storage.objects for update to authenticated
using (
  bucket_id = 'creator-media'
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+'
  and up17_private.has_role((split_part(name, '/', 1))::uuid,
    array['owner','admin','editor']::public.member_role[])
)
with check (
  bucket_id = 'creator-media'
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+'
  and up17_private.has_role((split_part(name, '/', 1))::uuid,
    array['owner','admin','editor']::public.member_role[])
);

create function public.up17_oauth_bridge_create(
  p_actor uuid, p_workspace uuid, p_platform public.platform,
  p_state_hash text, p_binding_hash text, p_redirect_uri text, p_return_origin text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_recent integer;
begin
  if up17_private.service_actor_role(p_workspace,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  if p_state_hash is null or p_state_hash !~ '^[0-9a-f]{64}$'
     or p_binding_hash is null or p_binding_hash !~ '^[0-9a-f]{64}$'
     or p_redirect_uri is null
     or p_redirect_uri !~ '^https://[A-Za-z0-9.-]+/functions/v1/up17-oauth-callback[?]mode=callback&platform=(youtube|instagram|tiktok)$'
     or p_return_origin is null or p_return_origin !~ '^https://[A-Za-z0-9.-]+$' then
    raise exception 'invalid_bridge_request';
  end if;
  select count(*) into v_recent from up17_private.oauth_bridge_sessions
    where actor_id=p_actor and created_at > now()-interval '1 hour';
  if v_recent >= 30 then raise exception 'oauth_rate_limited'; end if;
  insert into up17_private.oauth_bridge_sessions(
    state_hash,binding_hash,actor_id,workspace_id,platform,redirect_uri,return_origin
  ) values (
    p_state_hash,p_binding_hash,p_actor,p_workspace,p_platform,p_redirect_uri,p_return_origin
  ) returning id into v_id;
  return v_id;
end; $$;

create function public.up17_oauth_bridge_resolve(
  p_bridge_id uuid, p_state_hash text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare s up17_private.oauth_bridge_sessions;
begin
  select * into s from up17_private.oauth_bridge_sessions
    where id=p_bridge_id and state_hash=p_state_hash
      and consumed_at is null and expires_at > now();
  if s.id is null then raise exception 'bridge_invalid_or_expired'; end if;
  return jsonb_build_object(
    'id',s.id,'state_hash',s.state_hash,'binding_hash',s.binding_hash,
    'actor_id',s.actor_id,'workspace_id',s.workspace_id,'platform',s.platform,
    'redirect_uri',s.redirect_uri,'return_origin',s.return_origin
  );
end; $$;

create function public.up17_oauth_callback_store(
  p_bridge_id uuid, p_state text, p_state_hash text,
  p_code_ciphertext text, p_key_id text,
  p_receipt_token_hash text, p_provider_error text
) returns uuid language plpgsql security definer set search_path='' as $$
declare s up17_private.oauth_bridge_sessions; v_id uuid;
begin
  if p_state is null or length(p_state) not between 1 and 256
     or p_state_hash is null or p_state_hash !~ '^[0-9a-f]{64}$'
     or p_receipt_token_hash is null or p_receipt_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_callback_receipt';
  end if;
  select * into s from up17_private.oauth_bridge_sessions
    where id=p_bridge_id and state_hash=p_state_hash
      and consumed_at is null and expires_at > now()
    for update;
  if s.id is null then raise exception 'bridge_invalid_or_expired'; end if;
  if p_provider_error is null then
    if p_code_ciphertext is null or length(p_code_ciphertext) < 32
       or p_key_id is null or p_key_id !~ '^[A-Za-z0-9_-]{1,64}$' then
      raise exception 'invalid_callback_receipt';
    end if;
  elsif length(p_provider_error) > 120 then
    raise exception 'invalid_callback_receipt';
  end if;
  insert into up17_private.oauth_callback_receipts(
    receipt_token_hash,bridge_id,state,code_ciphertext,key_id,provider_error,
    binding_hash,actor_id,workspace_id,platform
  ) values (
    p_receipt_token_hash,s.id,p_state,
    case when p_provider_error is null then p_code_ciphertext else null end,
    case when p_provider_error is null then p_key_id else null end,
    p_provider_error,s.binding_hash,s.actor_id,s.workspace_id,s.platform
  ) returning id into v_id;
  update up17_private.oauth_bridge_sessions set consumed_at=now() where id=s.id;
  return v_id;
end; $$;

create function public.up17_oauth_callback_consume(
  p_receipt_token_hash text, p_actor uuid, p_binding_hash text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare r up17_private.oauth_callback_receipts;
begin
  if p_receipt_token_hash is null or p_receipt_token_hash !~ '^[0-9a-f]{64}$'
     or p_binding_hash is null or p_binding_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'callback_invalid_or_replayed';
  end if;
  select * into r from up17_private.oauth_callback_receipts
    where receipt_token_hash=p_receipt_token_hash and actor_id=p_actor
      and binding_hash=p_binding_hash and consumed_at is null and expires_at > now()
    for update;
  if r.id is null then raise exception 'callback_invalid_or_replayed'; end if;
  update up17_private.oauth_callback_receipts set consumed_at=now() where id=r.id;
  return jsonb_build_object(
    'platform',r.platform,'state',r.state,'code_ciphertext',r.code_ciphertext,
    'key_id',r.key_id,'provider_error',r.provider_error,
    'workspace_id',r.workspace_id,'binding_hash',r.binding_hash
  );
end; $$;

create function public.up17_oauth_callback_cleanup()
returns void language sql security definer set search_path='' as $$
  delete from up17_private.oauth_callback_receipts
    where consumed_at is not null or expires_at < now()-interval '1 day';
  delete from up17_private.oauth_bridge_sessions
    where consumed_at is not null or expires_at < now()-interval '1 day';
$$;

revoke all on function public.up17_oauth_bridge_create(uuid,uuid,public.platform,text,text,text,text) from public,anon,authenticated;
revoke all on function public.up17_oauth_bridge_resolve(uuid,text) from public,anon,authenticated;
revoke all on function public.up17_oauth_callback_store(uuid,text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.up17_oauth_callback_consume(text,uuid,text) from public,anon,authenticated;
revoke all on function public.up17_oauth_callback_cleanup() from public,anon,authenticated;
grant execute on function public.up17_oauth_bridge_create(uuid,uuid,public.platform,text,text,text,text) to service_role;
grant execute on function public.up17_oauth_bridge_resolve(uuid,text) to service_role;
grant execute on function public.up17_oauth_callback_store(uuid,text,text,text,text,text,text) to service_role;
grant execute on function public.up17_oauth_callback_consume(text,uuid,text) to service_role;
grant execute on function public.up17_oauth_callback_cleanup() to service_role;
