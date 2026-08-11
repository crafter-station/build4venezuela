-- Repository insights (AI-assisted code + product evaluation). Fully additive.
-- One row per project, keyed by project_id. Populated by an offline analysis
-- pipeline that clones each project's GitHub repo, extracts raw signals
-- (stars/commits/LOC/languages), runs a deep architecture + production-readiness
-- review, and a product evaluation (real-problem fit, quality, diffusion
-- readiness). Scalar score columns are denormalized out of the jsonb blobs so
-- ranking/overlap queries stay cheap; `domain_tags` is a text[] with a GIN index
-- so "find all people-finder projects" is a single indexed lookup.

create table if not exists public.project_insights (
  project_id uuid primary key references public.projects(id) on delete cascade,

  -- repo identity
  repo_url text not null,
  repo_source_field text,                 -- which project field the repo URL came from
  repo_accessible boolean not null default true,

  -- raw git/github signals
  stars integer,
  forks integer,
  contributors integer,
  commit_count integer,
  code_loc integer,
  license text,
  repo_created_at timestamptz,
  repo_pushed_at timestamptz,
  languages jsonb,                        -- { "TypeScript": 12345, ... } bytes

  -- technical analysis (denormalized scores + full blob)
  summary text,
  project_type text,
  domain_tags text[] not null default '{}',
  uses_orm boolean,
  orm_or_db_layer text,
  maturity_score integer check (maturity_score between 1 and 5),
  production_readiness_score integer check (production_readiness_score between 1 and 5),
  code_organization_score integer check (code_organization_score between 1 and 5),
  viability_score integer check (viability_score between 1 and 5),
  stack jsonb,
  architecture jsonb,
  red_flags text[] not null default '{}',
  analysis jsonb,                         -- full technical analysis object

  -- product evaluation (denormalized scores + full blob)
  solves_real_problem text,               -- yes | partial | no | unclear
  problem_severity text,                  -- critical | high | medium | low
  impact_potential integer check (impact_potential between 1 and 5),
  product_quality integer check (product_quality between 1 and 5),
  diffusion_score integer check (diffusion_score between 1 and 5),
  diffusion_ready boolean,
  live_demo_status text,                  -- working | partial | broken | no-public-demo | unknown
  overall_recommendation text,            -- spotlight | promote | improve-first | merge-candidate | deprioritize
  one_line_pitch text,
  evaluation jsonb,                       -- full evaluation object

  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_insights_domain_tags_idx on public.project_insights using gin (domain_tags);
create index if not exists project_insights_recommendation_idx on public.project_insights(overall_recommendation);
create index if not exists project_insights_viability_idx on public.project_insights(viability_score desc);

drop trigger if exists project_insights_touch_updated_at on public.project_insights;
create trigger project_insights_touch_updated_at
  before update on public.project_insights
  for each row
  execute function public.touch_updated_at();

alter table public.project_insights enable row level security;

drop policy if exists "Project insights are readable" on public.project_insights;
create policy "Project insights are readable"
  on public.project_insights for select
  using (true);
