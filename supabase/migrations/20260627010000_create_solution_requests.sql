create table if not exists public.solution_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 140),
  description_markdown text not null default '' check (char_length(description_markdown) <= 8000),
  author_user_id text not null,
  author_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  body text not null check (char_length(trim(body)) between 3 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
