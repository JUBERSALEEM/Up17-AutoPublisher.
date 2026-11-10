-- Batch D correctness fix: clear state/token_reference before deleting credentials.
-- Otherwise the foreign key ON DELETE SET NULL action evaluates the connected-state
-- CHECK before the disconnect RPC can mark the connection disconnected.

create or replace function public.up17_connection_disconnect(
  p_actor uuid, p_connection_id uuid, p_remote_revoked boolean, p_error_code text
) returns void language plpgsql security definer set search_path='' as $$
declare w uuid;
begin
  select workspace_id into w from public.platform_connections where id=p_connection_id;
  if w is null or up17_private.service_actor_role(w,p_actor) not in ('owner','admin') then
    raise exception 'workspace_access_denied';
  end if;
  update public.platform_connections set
    state='disconnected', token_reference=null,
    last_error_code=case when p_remote_revoked then null else coalesce(p_error_code,'remote_revoke_unconfirmed') end,
    updated_at=now()
  where id=p_connection_id;
  delete from up17_private.credentials where connection_id=p_connection_id;
  update public.social_accounts set publishing_enabled=false,paused=true,updated_at=now()
    where connection_id=p_connection_id;
  insert into public.audit_logs(workspace_id,actor_id,action,target_type,target_id,summary)
    values(w,p_actor,'connection.disconnected','platform_connection',p_connection_id::text,
      jsonb_build_object('remote_revoked',p_remote_revoked,'error_code',p_error_code));
end; $$;

revoke all on function public.up17_connection_disconnect(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.up17_connection_disconnect(uuid,uuid,boolean,text) to service_role;
