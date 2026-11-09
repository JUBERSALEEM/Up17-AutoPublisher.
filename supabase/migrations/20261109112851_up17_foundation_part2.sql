create table public.games (
  id text primary key check (id ~ '^[a-z0-9_-]+$'),
  name text not null unique,
  publisher text,
  active boolean not null default true
);
insert into public.games(id,name) values ('bgmi','BGMI'),('pubg-mobile','PUBG Mobile');
create table public.platform_categories (
  id uuid primary key default gen_random_uuid(),
  platform public.platform not null,
  provider_category_id text not null,
  label text not null,
  source_url text not null,
  retrieved_at timestamptz not null,
  assignable boolean not null default false,
  unique(platform,provider_category_id)
);
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  title text not null check (length(title) between 1 and 200),
  game_id text references public.games(id),
  state public.video_state not null default 'uploading',
  original_name text not null,
  mime_type text not null check (mime_type in ('video/mp4','video/quicktime','video/webm')),
  size_bytes bigint not null check (size_bytes between 1 and 524288000),
  checksum_sha256 text check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  duration_ms integer check (duration_ms>0),
  width integer check (width>0),
  height integer check (height>0),
  storage_path text not null unique,
  rights_attested boolean not null default false,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,workspace_id),
  check (storage_path like workspace_id::text || '/%')
);
create index videos_workspace_created_idx on public.videos(workspace_id,created_at desc);
create index videos_state_idx on public.videos(workspace_id,state);
create trigger videos_touch before update on public.videos for each row execute function up17_private.touch();
create table public.video_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  video_id uuid not null,
  kind text not null check (kind in ('original','frame','audio','clip','thumbnail','derivative')),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes>=0),
  created_at timestamptz not null default now(),
  foreign key(video_id,workspace_id) references public.videos(id,workspace_id) on delete cascade,
  check(storage_path like workspace_id::text || '/%')
);
create index video_assets_video_idx on public.video_assets(video_id,kind);
create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  video_id uuid not null,
  account_id uuid,
  platform public.platform not null,
  category_id uuid references public.platform_categories(id),
  title text not null default '',
  description text not null default '',
  hashtags text[] not null default '{}',
  tags text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb check(jsonb_typeof(settings)='object'),
  version integer not null default 1 check(version>0),
  created_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(id,workspace_id),
  unique(video_id,account_id,platform),
  foreign key(video_id,workspace_id) references public.videos(id,workspace_id) on delete cascade,
  foreign key(account_id,workspace_id,platform) references public.social_accounts(id,workspace_id,platform) on delete cascade
);
create table public.draft_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null,
  version integer not null check(version>0),
  payload jsonb not null check(jsonb_typeof(payload)='object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(draft_id,version),
  foreign key(draft_id,workspace_id) references public.drafts(id,workspace_id) on delete cascade
);
create index drafts_video_idx on public.drafts(video_id,platform);
create trigger drafts_touch before update on public.drafts for each row execute function up17_private.touch();
create function up17_private.version_draft() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and new.version<>old.version+1 then raise exception 'draft_version_must_increment'; end if;
  insert into public.draft_versions(workspace_id,draft_id,version,payload,created_by)
  values(new.workspace_id,new.id,new.version,to_jsonb(new)-'created_at'-'updated_at',coalesce((select auth.uid()),new.created_by));
  return new;
end; $$;
revoke all on function up17_private.version_draft() from public,anon,authenticated;
create trigger draft_version_insert after insert on public.drafts for each row execute function up17_private.version_draft();
create trigger draft_version_update after update on public.drafts for each row execute function up17_private.version_draft();

create table public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  video_id uuid not null,
  kind text not null check(kind in ('probe','extract','analyse','metadata')),
  state public.job_state not null default 'queued',
  idempotency_key text not null unique,
  input_digest text not null,
  attempts integer not null default 0 check(attempts>=0),
  max_attempts integer not null default 3 check(max_attempts between 1 and 10),
  lease_until timestamptz,
  lease_token uuid,
  next_run_at timestamptz not null default now(),
  checkpoint jsonb not null default '{}'::jsonb,
  last_error_code text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(video_id,workspace_id) references public.videos(id,workspace_id) on delete cascade,
  unique(id,workspace_id)
);
create index analysis_due_idx on public.analysis_jobs(state,next_run_at) where state in ('queued','retry_scheduled');
create table public.analysis_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  job_id uuid not null,
  kind text not null check(kind in ('visual','audio','clip_suggestion','metadata')),
  start_ms integer not null check(start_ms>=0),
  end_ms integer not null check(end_ms>start_ms),
  observation jsonb not null check(jsonb_typeof(observation)='object'),
  confidence numeric check(confidence between 0 and 1),
  evidence_asset_id uuid references public.video_assets(id),
  provenance jsonb not null check(jsonb_typeof(provenance)='object'),
  created_at timestamptz not null default now(),
  foreign key(job_id,workspace_id) references public.analysis_jobs(id,workspace_id) on delete cascade
);
create index findings_job_time_idx on public.analysis_findings(job_id,start_ms);
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  draft_id uuid not null,
  account_id uuid not null,
  scheduled_at timestamptz not null,
  timezone text not null,
  state public.publish_state not null default 'scheduled',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(id,workspace_id),
  foreign key(draft_id,workspace_id) references public.drafts(id,workspace_id) on delete cascade,
  foreign key(account_id,workspace_id) references public.social_accounts(id,workspace_id) on delete cascade
);
create table public.publishing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  schedule_id uuid not null unique,
  draft_version_id uuid not null references public.draft_versions(id),
  state public.publish_state not null default 'scheduled',
  idempotency_key text not null unique,
  content_digest text not null,
  scheduled_at timestamptz not null,
  attempts integer not null default 0 check(attempts>=0),
  lease_until timestamptz,
  lease_token uuid,
  next_run_at timestamptz not null,
  provider_reference text,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(schedule_id,workspace_id) references public.schedules(id,workspace_id) on delete cascade,
  unique(id,workspace_id)
);
create index publishing_due_idx on public.publishing_jobs(state,next_run_at) where state in ('scheduled','retry_scheduled','publishing');
create table public.publishing_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  job_id uuid not null,
  attempt_number integer not null check(attempt_number>0),
  step text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  provider_reference text,
  response_summary jsonb not null default '{}'::jsonb check(jsonb_typeof(response_summary)='object'),
  error_code text,
  unique(job_id,attempt_number),
  foreign key(job_id,workspace_id) references public.publishing_jobs(id,workspace_id) on delete cascade
);
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  job_id uuid not null unique,
  account_id uuid not null references public.social_accounts(id),
  platform public.platform not null,
  provider_post_id text not null,
  url text,
  confirmed_at timestamptz not null,
  response_summary jsonb not null default '{}'::jsonb,
  unique(platform,account_id,provider_post_id),
  foreign key(job_id,workspace_id) references public.publishing_jobs(id,workspace_id) on delete cascade
);
create table public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null,
  post_id uuid references public.posts(id) on delete cascade,
  metric text not null,
  value numeric,
  unavailable_reason text,
  interval_start timestamptz not null,
  interval_end timestamptz not null,
  retrieved_at timestamptz not null default now(),
  source text not null,
  estimated boolean not null default false,
  check(interval_end>interval_start),
  check((value is null) <> (unavailable_reason is null)),
  foreign key(account_id,workspace_id) references public.social_accounts(id,workspace_id) on delete cascade
);
create index analytics_account_time_idx on public.analytics_snapshots(account_id,interval_end desc);
create table public.research_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  topic text not null,
  kind text not null check(kind in ('retrieved','recommendation','note','unavailable')),
  title text not null,
  body text not null default '',
  source_url text,
  source_title text,
  retrieved_at timestamptz,
  published_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check(kind not in ('retrieved') or (source_url is not null and retrieved_at is not null))
);
create index research_workspace_topic_idx on public.research_items(workspace_id,topic,created_at desc);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  category text not null check(category in ('processing','publishing','accounts','analytics','security')),
  title text not null,
  body text not null default '',
  action_path text,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id,dedupe_key),
  foreign key(workspace_id,user_id) references public.workspace_members(workspace_id,user_id) on delete cascade
);
create index notifications_unread_idx on public.notifications(user_id,created_at desc) where read_at is null;
create table public.audit_logs (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  summary jsonb not null default '{}'::jsonb check(jsonb_typeof(summary)='object'),
  created_at timestamptz not null default now()
);
create index audit_workspace_time_idx on public.audit_logs(workspace_id,created_at desc);

-- Credential custody and OAuth attempts are private, not PostgREST tables.
create table up17_private.oauth_attempts (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  pkce_verifier_ciphertext text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  platform public.platform not null,
  redirect_uri text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create table up17_private.credentials (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.platform_connections(id) on delete cascade,
  access_ciphertext text not null,
  refresh_ciphertext text,
  encryption_key_id text not null,
  scopes text[] not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.platform_connections add constraint connection_token_reference_fk foreign key(token_reference) references up17_private.credentials(id) on delete set null;
