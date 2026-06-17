-- ============================================================================
-- Sherlock evidence-only verification workspace.
-- Adds sessions, chat messages, reports, saved reports, and audit logs.
-- ============================================================================

create table if not exists public.sherlock_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  candidate_display_name text,
  target_role text,
  status text not null default 'draft'
    check (status in ('draft', 'collecting', 'analyzing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sherlock_sessions_owner_idx on public.sherlock_sessions(owner_user_id);

create table if not exists public.sherlock_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sherlock_sessions(id) on delete cascade,
  sender text not null check (sender in ('user', 'sherlock', 'system')),
  content text not null default '',
  attachment_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists sherlock_messages_session_idx on public.sherlock_messages(session_id, created_at);

create table if not exists public.sherlock_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sherlock_sessions(id) on delete cascade,
  title text not null,
  artifact_envelope jsonb not null,
  share_token text unique,
  created_at timestamptz not null default now()
);
create index if not exists sherlock_reports_session_idx on public.sherlock_reports(session_id, created_at);

create table if not exists public.sherlock_saved_reports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  report_id uuid not null references public.sherlock_reports(id) on delete cascade,
  title text not null,
  summary text not null default '',
  tags text[] not null default '{}',
  saved_at timestamptz not null default now()
);
create index if not exists sherlock_saved_reports_owner_idx on public.sherlock_saved_reports(owner_user_id, saved_at desc);

create table if not exists public.sherlock_audit_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sherlock_sessions(id) on delete cascade,
  actor_type text not null check (actor_type in ('system', 'user', 'model', 'collector')),
  event_type text not null,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists sherlock_audit_log_session_idx on public.sherlock_audit_log(session_id, created_at);

alter table public.sherlock_sessions enable row level security;
alter table public.sherlock_messages enable row level security;
alter table public.sherlock_reports enable row level security;
alter table public.sherlock_saved_reports enable row level security;
alter table public.sherlock_audit_log enable row level security;

drop policy if exists sherlock_sessions_own on public.sherlock_sessions;
create policy sherlock_sessions_own on public.sherlock_sessions for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists sherlock_messages_own on public.sherlock_messages;
create policy sherlock_messages_own on public.sherlock_messages for all to authenticated
  using (exists (
    select 1 from public.sherlock_sessions s
    where s.id = sherlock_messages.session_id and s.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.sherlock_sessions s
    where s.id = sherlock_messages.session_id and s.owner_user_id = auth.uid()
  ));

drop policy if exists sherlock_reports_own on public.sherlock_reports;
create policy sherlock_reports_own on public.sherlock_reports for all to authenticated
  using (exists (
    select 1 from public.sherlock_sessions s
    where s.id = sherlock_reports.session_id and s.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.sherlock_sessions s
    where s.id = sherlock_reports.session_id and s.owner_user_id = auth.uid()
  ));

drop policy if exists sherlock_saved_reports_own on public.sherlock_saved_reports;
create policy sherlock_saved_reports_own on public.sherlock_saved_reports for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists sherlock_audit_log_own on public.sherlock_audit_log;
create policy sherlock_audit_log_own on public.sherlock_audit_log for all to authenticated
  using (exists (
    select 1 from public.sherlock_sessions s
    where s.id = sherlock_audit_log.session_id and s.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.sherlock_sessions s
    where s.id = sherlock_audit_log.session_id and s.owner_user_id = auth.uid()
  ));

drop trigger if exists sherlock_sessions_touch on public.sherlock_sessions;
create trigger sherlock_sessions_touch before update on public.sherlock_sessions
  for each row execute function public.touch_updated_at();
