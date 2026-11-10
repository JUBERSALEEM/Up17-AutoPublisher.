-- Verified-email, server-side first-workspace bootstrap. Apply once as migration 11.
-- Raw signup creates only a profile. Owner membership is never granted to an
-- unconfirmed user or from a client-supplied user id.
create or replace function up17_private.new_user() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,display_name)
    values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Creator'),80))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function up17_private.new_user() from public, anon, authenticated, service_role;

create function public.up17_ensure_first_workspace() returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_user auth.users%rowtype;
  v_workspace uuid;
  v_memberships integer;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found or v_user.email_confirmed_at is null then
    raise exception 'email_confirmation_required';
  end if;
  perform pg_advisory_xact_lock(hashtext(v_user.id::text)::bigint);
  select count(*) into v_memberships
    from public.workspace_members where user_id = v_user.id;
  if v_memberships > 0 then
    select workspace_id into v_workspace
      from public.workspace_members where user_id = v_user.id
      order by created_at limit 1;
    return v_workspace;
  end if;
  insert into public.workspaces(name,created_by)
    values('My creator workspace',v_user.id) returning id into v_workspace;
  insert into public.workspace_members(workspace_id,user_id,role)
    values(v_workspace,v_user.id,'owner');
  insert into public.preferences(workspace_id,user_id)
    values(v_workspace,v_user.id);
  return v_workspace;
end;
$$;
revoke all on function public.up17_ensure_first_workspace() from public, anon, authenticated, service_role;
grant execute on function public.up17_ensure_first_workspace() to authenticated;
comment on function public.up17_ensure_first_workspace() is
  'Authenticated, email-confirmed first-workspace bootstrap; identity comes only from auth.uid().';
