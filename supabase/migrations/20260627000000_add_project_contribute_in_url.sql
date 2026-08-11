alter table public.projects
  add column if not exists contribute_in_url text not null default '';
