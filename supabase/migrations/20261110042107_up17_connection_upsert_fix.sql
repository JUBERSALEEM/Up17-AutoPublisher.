-- Batch D correctness fix: the upsert RPC's local connection_id variable
-- collided with the credentials column during first execution. Rename locals,
-- preserve the same signature, authorization checks and service-only grants.

create or replace function public.up17_connection_upsert(
  p_actor uuid, p_workspace uuid, p_platform public.platform,
  p_provider_account_id text, p_display_name text, p_handle text, p_avatar_url text,
  p_scopes text[], p_access_ciphertext text, p_refresh_ciphertext text,
  p_key_id text, p_expires_at timestamptz, p_refresh_expires_at timestamptz,
  p_capabilities jsonb, p_state public.connection_state
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_connection_id uuid; v_credential_id uuid;
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
  returning id into v_connection_id;
  insert into up17_private.credentials(connection_id,access_ciphertext,refresh_ciphertext,encryption_key_id,scopes,expires_at,refresh_expires_at,revoked_at)
    values(v_connection_id,p_access_ciphertext,p_refresh_ciphertext,p_key_id,p_scopes,p_expires_at,p_refresh_expires_at,null)
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
  returning id into v_credential_id;
  update public.platform_connections set
    state=p_state, granted_scopes=p_scopes, token_reference=v_credential_id,
    last_verified_at=now(), last_error_code=null, updated_at=now()
  where id=v_connection_id;
  insert into public.social_accounts(workspace_id,connection_id,platform,display_name,handle,avatar_url,capabilities,publishing_enabled,paused)
    values(p_workspace,v_connection_id,p_platform,trim(p_display_name),p_handle,p_avatar_url,p_capabilities,false,true)
  on conflict (connection_id,platform) do update set
    display_name=excluded.display_name, handle=excluded.handle, avatar_url=excluded.avatar_url,
    capabilities=excluded.capabilities, publishing_enabled=false, paused=true, updated_at=now();
  insert into public.audit_logs(workspace_id,actor_id,action,target_type,target_id,summary)
    values(p_workspace,p_actor,'connection.authorized','platform_connection',v_connection_id::text,
      jsonb_build_object('platform',p_platform,'state',p_state,'scopes',p_scopes));
  return v_connection_id;
end; $$;

revoke all on function public.up17_connection_upsert(uuid,uuid,public.platform,text,text,text,text,text[],text,text,text,timestamptz,timestamptz,jsonb,public.connection_state) from public,anon,authenticated;
grant execute on function public.up17_connection_upsert(uuid,uuid,public.platform,text,text,text,text,text[],text,text,text,timestamptz,timestamptz,jsonb,public.connection_state) to service_role;
