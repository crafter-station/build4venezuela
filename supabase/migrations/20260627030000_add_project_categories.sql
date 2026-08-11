-- Project clustering (AI-assisted categorization). Fully additive.
-- `category_proposals` holds AI-proposed new clusters; a proposal "graduates"
-- into a visible cluster once enough projects reference it (threshold enforced
-- in app code). `project_categories` stores one assignment per project so the
-- LLM classifier runs once at submit time, not on every read.

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
