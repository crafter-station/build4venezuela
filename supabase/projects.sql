create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'published' check (status in ('draft', 'published', 'hidden')),
  lifecycle_status text not null default 'ready_to_use' check (lifecycle_status in ('ready_to_use', 'in_development', 'idea')),
  project_url text not null,
  countries text[] not null default '{}',
  participant_name text not null,
  video_url text not null default '',
  contribute_in_url text not null default '',
  description_markdown text not null,
  owner_user_id text not null,
  owner_name text not null default '',
  owner_image_url text not null default '',
  spam_score numeric,
  spam_reason text,
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects alter column video_url set default '';
alter table public.projects add column if not exists status text not null default 'published';
alter table public.projects add column if not exists lifecycle_status text not null default 'ready_to_use';
alter table public.projects add column if not exists published_at timestamptz default now();
alter table public.projects add column if not exists contribute_in_url text not null default '';
alter table public.projects add column if not exists owner_name text not null default '';
alter table public.projects add column if not exists owner_image_url text not null default '';
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check check (status in ('draft', 'published', 'hidden'));
alter table public.projects drop constraint if exists projects_lifecycle_status_check;
alter table public.projects add constraint projects_lifecycle_status_check check (lifecycle_status in ('ready_to_use', 'in_development', 'idea'));
update public.projects set published_at = created_at where published_at is null and status = 'published';
update public.projects set owner_name = participant_name where owner_name = '';

create table if not exists public.project_votes (
  project_id uuid not null references public.projects(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  primary key (project_id, voter_id)
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_user_id text not null,
  author_name text not null,
  author_image_url text not null default '',
  body text not null check (char_length(trim(body)) between 3 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_comments add column if not exists author_image_url text not null default '';

create table if not exists public.project_comment_votes (
  comment_id uuid not null references public.project_comments(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, voter_id)
);

create table if not exists public.project_publication_events (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null check (event_type in ('published', 'updated')),
  slug text not null,
  name text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.project_vote_events (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null check (event_type in ('insert', 'delete')),
  created_at timestamptz not null default now()
);

create table if not exists public.project_comment_events (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  comment_id uuid not null,
  event_type text not null check (event_type in ('insert', 'update', 'delete')),
  created_at timestamptz not null default now()
);

create table if not exists public.project_comment_vote_events (
  id bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  comment_id uuid not null,
  event_type text not null check (event_type in ('insert', 'delete')),
  created_at timestamptz not null default now()
);

create index if not exists projects_slug_idx on public.projects(slug);
create index if not exists projects_created_at_idx on public.projects(created_at desc);
create index if not exists projects_published_at_idx on public.projects(published_at desc) where status = 'published';
create index if not exists projects_owner_user_id_idx on public.projects(owner_user_id);
create index if not exists project_votes_project_id_idx on public.project_votes(project_id);
create index if not exists project_comments_project_id_created_at_idx on public.project_comments(project_id, created_at);
create index if not exists project_comment_votes_comment_id_idx on public.project_comment_votes(comment_id);
create index if not exists project_publication_events_created_at_idx on public.project_publication_events(created_at desc);
create index if not exists project_vote_events_project_id_created_at_idx on public.project_vote_events(project_id, created_at desc);
create index if not exists project_comment_events_project_id_created_at_idx on public.project_comment_events(project_id, created_at desc);
create index if not exists project_comment_vote_events_project_id_created_at_idx on public.project_comment_vote_events(project_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row
  execute function public.touch_updated_at();

drop trigger if exists project_comments_touch_updated_at on public.project_comments;
create trigger project_comments_touch_updated_at
  before update on public.project_comments
  for each row
  execute function public.touch_updated_at();

create or replace function public.ensure_project_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists projects_ensure_published_at on public.projects;
create trigger projects_ensure_published_at
  before insert or update on public.projects
  for each row
  execute function public.ensure_project_published_at();

create or replace function public.enqueue_project_publication_event()
returns trigger
language plpgsql
as $$
declare
  changed boolean := false;
  publication_event_type text := 'updated';
begin
  if tg_op = 'INSERT' then
    changed := true;
    publication_event_type := 'published';
  elsif old.status is distinct from new.status then
    changed := true;
    publication_event_type := 'published';
  elsif old.slug is distinct from new.slug or old.name is distinct from new.name then
    changed := true;
  end if;

  if new.status = 'published' and changed then
    insert into public.project_publication_events (
      project_id,
      event_type,
      slug,
      name,
      published_at
    ) values (
      new.id,
      publication_event_type,
      new.slug,
      new.name,
      new.published_at
    );
  end if;

  return new;
end;
$$;

drop trigger if exists projects_enqueue_publication_event on public.projects;
create trigger projects_enqueue_publication_event
  after insert or update on public.projects
  for each row
  execute function public.enqueue_project_publication_event();

create or replace function public.enqueue_project_vote_event()
returns trigger
language plpgsql
as $$
declare
  affected_project_id uuid;
begin
  if tg_op = 'INSERT' then
    affected_project_id := new.project_id;
  else
    affected_project_id := old.project_id;
  end if;

  insert into public.project_vote_events (project_id, event_type)
  values (affected_project_id, lower(tg_op));

  return null;
end;
$$;

drop trigger if exists project_votes_enqueue_event on public.project_votes;
create trigger project_votes_enqueue_event
  after insert or delete on public.project_votes
  for each row
  execute function public.enqueue_project_vote_event();

create or replace function public.enqueue_project_comment_event()
returns trigger
language plpgsql
as $$
declare
  affected_project_id uuid;
  affected_comment_id uuid;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    affected_project_id := new.project_id;
    affected_comment_id := new.id;
  else
    affected_project_id := old.project_id;
    affected_comment_id := old.id;
  end if;

  insert into public.project_comment_events (project_id, comment_id, event_type)
  values (affected_project_id, affected_comment_id, lower(tg_op));

  return null;
end;
$$;

drop trigger if exists project_comments_enqueue_event on public.project_comments;
create trigger project_comments_enqueue_event
  after insert or update or delete on public.project_comments
  for each row
  execute function public.enqueue_project_comment_event();

create or replace function public.enqueue_project_comment_vote_event()
returns trigger
language plpgsql
as $$
declare
  affected_comment_id uuid;
  affected_project_id uuid;
begin
  if tg_op = 'INSERT' then
    affected_comment_id := new.comment_id;
  else
    affected_comment_id := old.comment_id;
  end if;

  select project_id into affected_project_id
  from public.project_comments
  where id = affected_comment_id;

  if affected_project_id is null then
    return null;
  end if;

  insert into public.project_comment_vote_events (
    project_id,
    comment_id,
    event_type
  ) values (
    affected_project_id,
    affected_comment_id,
    lower(tg_op)
  );

  return null;
end;
$$;

drop trigger if exists project_comment_votes_enqueue_event on public.project_comment_votes;
create trigger project_comment_votes_enqueue_event
  after insert or delete on public.project_comment_votes
  for each row
  execute function public.enqueue_project_comment_vote_event();

alter table public.projects enable row level security;
alter table public.project_votes enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_comment_votes enable row level security;
alter table public.project_publication_events enable row level security;
alter table public.project_vote_events enable row level security;
alter table public.project_comment_events enable row level security;
alter table public.project_comment_vote_events enable row level security;

drop policy if exists "Project votes are readable" on public.project_votes;
drop policy if exists "Project comments are readable" on public.project_comments;
drop policy if exists "Project comment votes are readable" on public.project_comment_votes;

drop policy if exists "Project publication events are readable" on public.project_publication_events;
create policy "Project publication events are readable"
  on public.project_publication_events for select
  using (true);

drop policy if exists "Project vote events are readable" on public.project_vote_events;
create policy "Project vote events are readable"
  on public.project_vote_events for select
  using (true);

drop policy if exists "Project comment events are readable" on public.project_comment_events;
create policy "Project comment events are readable"
  on public.project_comment_events for select
  using (true);

drop policy if exists "Project comment vote events are readable" on public.project_comment_vote_events;
create policy "Project comment vote events are readable"
  on public.project_comment_vote_events for select
  using (true);

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_votes'
  ) then
    alter publication supabase_realtime drop table public.project_votes;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_comments'
  ) then
    alter publication supabase_realtime drop table public.project_comments;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_comment_votes'
  ) then
    alter publication supabase_realtime drop table public.project_comment_votes;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_publication_events'
  ) then
    alter publication supabase_realtime add table public.project_publication_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_vote_events'
  ) then
    alter publication supabase_realtime add table public.project_vote_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_comment_events'
  ) then
    alter publication supabase_realtime add table public.project_comment_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_comment_vote_events'
  ) then
    alter publication supabase_realtime add table public.project_comment_vote_events;
  end if;
end $$;

create table if not exists public.solution_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 140),
  description_markdown text not null default '' check (char_length(description_markdown) <= 8000),
  author_user_id text not null,
  author_name text not null,
  author_image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


alter table public.solution_requests add column if not exists author_image_url text not null default '';

create table if not exists public.solution_request_votes (
  request_id uuid not null references public.solution_requests(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  primary key (request_id, voter_id)
);

create table if not exists public.solution_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.solution_requests(id) on delete cascade,
  author_user_id text not null,
  author_name text not null,
  author_image_url text not null default '',
  body text not null check (char_length(trim(body)) between 3 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.solution_request_comments add column if not exists author_image_url text not null default '';

create table if not exists public.solution_request_comment_votes (
  comment_id uuid not null references public.solution_request_comments(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, voter_id)
);

create table if not exists public.solution_request_events (
  id bigserial primary key,
  request_id uuid not null,
  event_type text not null check (event_type in ('insert', 'update', 'delete')),
  created_at timestamptz not null default now()
);

create table if not exists public.solution_request_vote_events (
  id bigserial primary key,
  request_id uuid not null,
  event_type text not null check (event_type in ('insert', 'delete')),
  created_at timestamptz not null default now()
);

create table if not exists public.solution_request_comment_events (
  id bigserial primary key,
  request_id uuid not null,
  comment_id uuid not null,
  event_type text not null check (event_type in ('insert', 'update', 'delete')),
  created_at timestamptz not null default now()
);

create table if not exists public.solution_request_comment_vote_events (
  id bigserial primary key,
  request_id uuid not null,
  comment_id uuid not null,
  event_type text not null check (event_type in ('insert', 'delete')),
  created_at timestamptz not null default now()
);

alter table public.solution_request_events
  drop constraint if exists solution_request_events_request_id_fkey;
alter table public.solution_request_vote_events
  drop constraint if exists solution_request_vote_events_request_id_fkey;
alter table public.solution_request_comment_events
  drop constraint if exists solution_request_comment_events_request_id_fkey;
alter table public.solution_request_comment_vote_events
  drop constraint if exists solution_request_comment_vote_events_request_id_fkey;

create index if not exists solution_requests_created_at_idx on public.solution_requests(created_at desc);
create index if not exists solution_request_votes_request_id_idx on public.solution_request_votes(request_id);
create index if not exists solution_request_comments_request_id_created_at_idx on public.solution_request_comments(request_id, created_at);
create index if not exists solution_request_comment_votes_comment_id_idx on public.solution_request_comment_votes(comment_id);
create index if not exists solution_request_events_request_id_created_at_idx on public.solution_request_events(request_id, created_at desc);
create index if not exists solution_request_vote_events_request_id_created_at_idx on public.solution_request_vote_events(request_id, created_at desc);
create index if not exists solution_request_comment_events_request_id_created_at_idx on public.solution_request_comment_events(request_id, created_at desc);
create index if not exists solution_request_comment_vote_events_request_id_created_at_idx on public.solution_request_comment_vote_events(request_id, created_at desc);

drop trigger if exists solution_requests_touch_updated_at on public.solution_requests;
create trigger solution_requests_touch_updated_at
  before update on public.solution_requests
  for each row
  execute function public.touch_updated_at();

drop trigger if exists solution_request_comments_touch_updated_at on public.solution_request_comments;
create trigger solution_request_comments_touch_updated_at
  before update on public.solution_request_comments
  for each row
  execute function public.touch_updated_at();

create or replace function public.enqueue_solution_request_event()
returns trigger
language plpgsql
as $$
declare
  affected_request_id uuid;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    affected_request_id := new.id;
  else
    affected_request_id := old.id;
  end if;

  insert into public.solution_request_events (request_id, event_type)
  values (affected_request_id, lower(tg_op));

  return null;
end;
$$;

drop trigger if exists solution_requests_enqueue_event on public.solution_requests;
create trigger solution_requests_enqueue_event
  after insert or update or delete on public.solution_requests
  for each row
  execute function public.enqueue_solution_request_event();

create or replace function public.enqueue_solution_request_vote_event()
returns trigger
language plpgsql
as $$
declare
  affected_request_id uuid;
begin
  if tg_op = 'INSERT' then
    affected_request_id := new.request_id;
  else
    affected_request_id := old.request_id;
  end if;

  insert into public.solution_request_vote_events (request_id, event_type)
  values (affected_request_id, lower(tg_op));

  return null;
end;
$$;

drop trigger if exists solution_request_votes_enqueue_event on public.solution_request_votes;
create trigger solution_request_votes_enqueue_event
  after insert or delete on public.solution_request_votes
  for each row
  execute function public.enqueue_solution_request_vote_event();

create or replace function public.enqueue_solution_request_comment_event()
returns trigger
language plpgsql
as $$
declare
  affected_request_id uuid;
  affected_comment_id uuid;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    affected_request_id := new.request_id;
    affected_comment_id := new.id;
  else
    affected_request_id := old.request_id;
    affected_comment_id := old.id;
  end if;

  insert into public.solution_request_comment_events (request_id, comment_id, event_type)
  values (affected_request_id, affected_comment_id, lower(tg_op));

  return null;
end;
$$;

drop trigger if exists solution_request_comments_enqueue_event on public.solution_request_comments;
create trigger solution_request_comments_enqueue_event
  after insert or update or delete on public.solution_request_comments
  for each row
  execute function public.enqueue_solution_request_comment_event();

create or replace function public.enqueue_solution_request_comment_vote_event()
returns trigger
language plpgsql
as $$
declare
  affected_comment_id uuid;
  affected_request_id uuid;
begin
  if tg_op = 'INSERT' then
    affected_comment_id := new.comment_id;
  else
    affected_comment_id := old.comment_id;
  end if;

  select request_id into affected_request_id
  from public.solution_request_comments
  where id = affected_comment_id;

  if affected_request_id is null then
    return null;
  end if;

  insert into public.solution_request_comment_vote_events (
    request_id,
    comment_id,
    event_type
  ) values (
    affected_request_id,
    affected_comment_id,
    lower(tg_op)
  );

  return null;
end;
$$;

drop trigger if exists solution_request_comment_votes_enqueue_event on public.solution_request_comment_votes;
create trigger solution_request_comment_votes_enqueue_event
  after insert or delete on public.solution_request_comment_votes
  for each row
  execute function public.enqueue_solution_request_comment_vote_event();

alter table public.solution_requests enable row level security;
alter table public.solution_request_votes enable row level security;
alter table public.solution_request_comments enable row level security;
alter table public.solution_request_comment_votes enable row level security;
alter table public.solution_request_events enable row level security;
alter table public.solution_request_vote_events enable row level security;
alter table public.solution_request_comment_events enable row level security;
alter table public.solution_request_comment_vote_events enable row level security;

drop policy if exists "Solution request events are readable" on public.solution_request_events;
create policy "Solution request events are readable"
  on public.solution_request_events for select
  using (true);

drop policy if exists "Solution request vote events are readable" on public.solution_request_vote_events;
create policy "Solution request vote events are readable"
  on public.solution_request_vote_events for select
  using (true);

drop policy if exists "Solution request comment events are readable" on public.solution_request_comment_events;
create policy "Solution request comment events are readable"
  on public.solution_request_comment_events for select
  using (true);

drop policy if exists "Solution request comment vote events are readable" on public.solution_request_comment_vote_events;
create policy "Solution request comment vote events are readable"
  on public.solution_request_comment_vote_events for select
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'solution_request_events'
  ) then
    alter publication supabase_realtime add table public.solution_request_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'solution_request_vote_events'
  ) then
    alter publication supabase_realtime add table public.solution_request_vote_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'solution_request_comment_events'
  ) then
    alter publication supabase_realtime add table public.solution_request_comment_events;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'solution_request_comment_vote_events'
  ) then
    alter publication supabase_realtime add table public.solution_request_comment_vote_events;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Project clustering (AI-assisted categorization). Fully additive.
-- `category_proposals` holds AI-proposed new clusters; a proposal "graduates"
-- into a visible cluster once enough projects reference it (threshold enforced
-- in app code). `project_categories` stores one assignment per project so the
-- LLM classifier runs once at submit time, not on every read.
-- ---------------------------------------------------------------------------

create table if not exists public.category_proposals (
  id text primary key,
  label text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.project_categories (
  project_id uuid primary key references public.projects(id) on delete cascade,
  category_id text not null,
  status text not null default 'assigned' check (status in ('assigned', 'proposed')),
  confidence numeric,
  reasoning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_categories_category_id_idx on public.project_categories(category_id);

drop trigger if exists project_categories_touch_updated_at on public.project_categories;
create trigger project_categories_touch_updated_at
  before update on public.project_categories
  for each row
  execute function public.touch_updated_at();

alter table public.category_proposals enable row level security;
alter table public.project_categories enable row level security;

drop policy if exists "Category proposals are readable" on public.category_proposals;
create policy "Category proposals are readable"
  on public.category_proposals for select
  using (true);

drop policy if exists "Project categories are readable" on public.project_categories;
create policy "Project categories are readable"
  on public.project_categories for select
  using (true);

-- ---------------------------------------------------------------------------
-- Builder network. Public directory reads are served through app APIs that
-- sanitize hidden availability and never expose requester contact details.
-- These tables intentionally have RLS enabled without public select policies.
-- ---------------------------------------------------------------------------

create table if not exists public.builder_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  name text not null,
  role text not null check (role in (
    'frontend_engineer',
    'backend_engineer',
    'fullstack_engineer',
    'ai_engineer',
    'designer',
    'product_manager',
    'devops_engineer',
    'data_engineer',
    'other'
  )),
  custom_role text not null default '' check (
    role <> 'other' or char_length(trim(custom_role)) between 2 and 80
  ),
  description text not null check (char_length(trim(description)) between 40 and 2000),
  linkedin_url text not null default '',
  portfolio_url text not null default '',
  availability_visible boolean not null default false,
  availability jsonb not null default '{}'::jsonb,
  weekly_hours integer not null default 0 check (weekly_hours between 0 and 84),
  status text not null default 'available' check (status in ('available', 'busy', 'hidden')),
  directory_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.builder_contact_requests (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builder_profiles(id) on delete cascade,
  requester_user_id text not null,
  requester_name text not null default '',
  requester_image_url text not null default '',
  project_name text not null,
  cover_letter text not null check (char_length(trim(cover_letter)) between 40 and 2000),
  contact_email text not null default '',
  contact_phone text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  spam_score numeric,
  spam_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists builder_profiles_role_idx on public.builder_profiles(role);
create index if not exists builder_profiles_status_idx on public.builder_profiles(status);
create index if not exists builder_profiles_weekly_hours_idx on public.builder_profiles(weekly_hours);
create index if not exists builder_profiles_directory_idx
  on public.builder_profiles(status, directory_visible);
create index if not exists builder_contact_requests_builder_id_idx
  on public.builder_contact_requests(builder_id);
create index if not exists builder_contact_requests_requester_user_id_idx
  on public.builder_contact_requests(requester_user_id);
create index if not exists builder_contact_requests_status_idx
  on public.builder_contact_requests(status);

drop trigger if exists builder_profiles_touch_updated_at on public.builder_profiles;
create trigger builder_profiles_touch_updated_at
  before update on public.builder_profiles
  for each row
  execute function public.touch_updated_at();

drop trigger if exists builder_contact_requests_touch_updated_at on public.builder_contact_requests;
create trigger builder_contact_requests_touch_updated_at
  before update on public.builder_contact_requests
  for each row
  execute function public.touch_updated_at();

alter table public.builder_profiles enable row level security;
alter table public.builder_contact_requests enable row level security;
