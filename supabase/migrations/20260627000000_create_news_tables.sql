-- ─── VERIVE News Tables ─────────────────────────────────────────────
-- Migration for the VERIVE news section of Build4Venezuela.
-- Supports: breaking news, fact-checks, verified media whitelist,
-- and an admin panel with 3 role levels.

-- ─── Admin Roles ────────────────────────────────────────────────────
-- Three permission levels:
--   staff          → Full access. Can manage roles, approve/reject all content, manage whitelist.
--   editor         → Can create/edit/publish breaking news, fact-checks, and media entries.
--   fact_checker   → Can create fact-checks and flag media. Cannot publish breaking news.

create table if not exists public.news_admins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  display_name text not null,
  role text not null default 'fact_checker'
    check (role in ('staff', 'editor', 'fact_checker')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_admins_user_id_idx
  on public.news_admins(user_id);

create index if not exists news_admins_role_idx
  on public.news_admins(role);

-- ─── Breaking News ──────────────────────────────────────────────────

create table if not exists public.news_breaking (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(trim(text)) between 5 and 500),
  confidence text not null default 'unverified'
    check (confidence in ('verified', 'unverified', 'debunked')),
  pinned boolean not null default false,
  author_user_id text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_breaking_published_at_idx
  on public.news_breaking(published_at desc)
  where published = true;

-- ─── Fact-Checks ────────────────────────────────────────────────────

create table if not exists public.news_factchecks (
  id uuid primary key default gen_random_uuid(),
  claim text not null check (char_length(trim(claim)) between 5 and 1000),
  verdict text not null default 'unverified'
    check (verdict in ('false', 'misleading', 'unverified')),
  explanation text not null check (char_length(trim(explanation)) between 5 and 2000),
  source_url text not null default '',
  source_name text not null default '',
  author_user_id text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_factchecks_published_at_idx
  on public.news_factchecks(published_at desc)
  where published = true;

-- ─── Verified Media Whitelist ───────────────────────────────────────

create table if not exists public.news_verified_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_handle text not null default '',
  source_url text not null default '',
  category text not null default 'media'
    check (category in ('official', 'media', 'ngo', 'international')),
  active boolean not null default true,
  added_by_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_verified_sources_active_idx
  on public.news_verified_sources(active)
  where active = true;

-- ─── Verified Media Entries ─────────────────────────────────────────

create table if not exists public.news_media_entries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.news_verified_sources(id) on delete set null,
  source_name text not null,
  source_handle text not null default '',
  content text not null check (char_length(trim(content)) between 3 and 2000),
  url text not null default '',
  confidence text not null default 'verified'
    check (confidence in ('verified', 'unverified', 'debunked')),
  author_user_id text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_media_entries_published_at_idx
  on public.news_media_entries(published_at desc)
  where published = true;

-- ─── Triggers: auto-update updated_at ───────────────────────────────

drop trigger if exists news_admins_touch_updated_at on public.news_admins;
create trigger news_admins_touch_updated_at
  before update on public.news_admins
  for each row
  execute function public.touch_updated_at();

drop trigger if exists news_breaking_touch_updated_at on public.news_breaking;
create trigger news_breaking_touch_updated_at
  before update on public.news_breaking
  for each row
  execute function public.touch_updated_at();

drop trigger if exists news_factchecks_touch_updated_at on public.news_factchecks;
create trigger news_factchecks_touch_updated_at
  before update on public.news_factchecks
  for each row
  execute function public.touch_updated_at();

drop trigger if exists news_verified_sources_touch_updated_at on public.news_verified_sources;
create trigger news_verified_sources_touch_updated_at
  before update on public.news_verified_sources
  for each row
  execute function public.touch_updated_at();

drop trigger if exists news_media_entries_touch_updated_at on public.news_media_entries;
create trigger news_media_entries_touch_updated_at
  before update on public.news_media_entries
  for each row
  execute function public.touch_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────

alter table public.news_admins enable row level security;
alter table public.news_breaking enable row level security;
alter table public.news_factchecks enable row level security;
alter table public.news_verified_sources enable row level security;
alter table public.news_media_entries enable row level security;

-- Public read for published content
drop policy if exists "Published breaking news are readable" on public.news_breaking;
create policy "Published breaking news are readable"
  on public.news_breaking for select
  using (published = true);

drop policy if exists "Published factchecks are readable" on public.news_factchecks;
create policy "Published factchecks are readable"
  on public.news_factchecks for select
  using (published = true);

drop policy if exists "Active verified sources are readable" on public.news_verified_sources;
create policy "Active verified sources are readable"
  on public.news_verified_sources for select
  using (active = true);

drop policy if exists "Published media entries are readable" on public.news_media_entries;
create policy "Published media entries are readable"
  on public.news_media_entries for select
  using (published = true);

-- Admin table is NOT publicly readable (service role only)
