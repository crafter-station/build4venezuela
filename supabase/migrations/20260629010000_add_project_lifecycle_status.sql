alter table public.projects
  add column if not exists lifecycle_status text not null default 'ready_to_use';

alter table public.projects
  drop constraint if exists projects_lifecycle_status_check;

alter table public.projects
  add constraint projects_lifecycle_status_check
  check (lifecycle_status in ('ready_to_use', 'in_development', 'idea'));
