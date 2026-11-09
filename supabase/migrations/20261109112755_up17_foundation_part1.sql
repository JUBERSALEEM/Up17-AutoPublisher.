-- Up17 foundation. Apply once through the migration history; no demo rows.
-- All exposed public tables have RLS. Authorization derives from auth.uid(),
-- never user-editable profile metadata or a client-supplied owner id.
create schema if not exists up17_private;
revoke all on schema up17_private from public, anon, authenticated;

create type public.member_role as enum ('owner','admin','editor','viewer');
create type public.platform as enum ('youtube','instagram','tiktok');
create type public.connection_state as enum ('pending','connected','limited_permissions','needs_authorisation','error','disconnected');
create type public.video_state as enum ('uploading','uploaded','queued','analysing','ready','needs_attention','failed','deleted');
create type public.job_state as enum ('queued','leased','running','retry_scheduled','succeeded','failed','cancelled','needs_attention');
create type public.publish_state as enum ('draft','ready','scheduled','publishing','published','waiting_for_authorisation','failed','retry_scheduled','needs_attention','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 48),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id),
  unique (workspace_id,user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id,workspace_id);
create table public.preferences (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings)='object' and octet_length(settings::text)<16000),
  updated_at timestamptz not null default now(),
  primary key (workspace_id,user_id),
  foreign key (workspace_id,user_id) references public.workspace_members(workspace_id,user_id) on delete cascade
);

create function up17_private.is_member(w uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.workspace_members where workspace_id=w and user_id=(select auth.uid()));
$$;
create function up17_private.has_role(w uuid, roles public.member_role[]) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.workspace_members where workspace_id=w and user_id=(select auth.uid()) and role=any(roles));
$$;
revoke all on all functions in schema up17_private from public;
grant usage on schema up17_private to authenticated;
grant execute on all functions in schema up17_private to authenticated;

create function up17_private.new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare w uuid;
begin
  insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Creator'),80));
  insert into public.workspaces(name,created_by) values('My creator workspace',new.id) returning id into w;
  insert into public.workspace_members(workspace_id,user_id,role) values(w,new.id,'owner');
  insert into public.preferences(workspace_id,user_id) values(w,new.id);
  return new;
end;
$$;
revoke all on function up17_private.new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function up17_private.new_user();

create function up17_private.touch() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;
revoke all on function up17_private.touch() from public, anon, authenticated;
create trigger profiles_touch before update on public.profiles for each row execute function up17_private.touch();
create trigger workspaces_touch before update on public.workspaces for each row execute function up17_private.touch();
create trigger preferences_touch before update on public.preferences for each row execute function up17_private.touch();

-- Provider identities are separate from credentials. No token columns exist here.
create table public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform public.platform not null,
  provider_account_id text,
  display_name text not null check (length(display_name) between 1 and 120),
  state public.connection_state not null default 'pending',
  granted_scopes text[] not null default '{}',
  token_reference uuid,
  last_verified_at timestamptz,
  last_error_code text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,platform,provider_account_id),
  unique(id,workspace_id,platform),
  check (state not in ('connected','limited_permissions') or (provider_account_id is not null and token_reference is not null and last_verified_at is not null))
);
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  connection_id uuid not null,
  platform public.platform not null,
  display_name text not null check (length(display_name) between 1 and 120),
  handle text,
  avatar_url text,
  capabilities jsonb not null default '{}'::jsonb check (jsonb_typeof(capabilities)='object'),
  publishing_enabled boolean not null default false,
  paused boolean not null default true,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(connection_id,platform),
  foreign key(connection_id,workspace_id,platform) references public.platform_connections(id,workspace_id,platform) on delete cascade,
  unique(id,workspace_id,platform),
  unique(id,workspace_id)
);
create unique index platform_connections_identity_idx on public.platform_connections(workspace_id,platform,provider_account_id) where provider_account_id is not null;
create index social_accounts_workspace_idx on public.social_accounts(workspace_id,platform);
create trigger connections_touch before update on public.platform_connections for each row execute function up17_private.touch();
create trigger accounts_touch before update on public.social_accounts for each row execute function up17_private.touch();
