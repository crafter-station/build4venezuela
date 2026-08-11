alter table public.projects
  add column if not exists owner_name text not null default '',
  add column if not exists owner_image_url text not null default '';

alter table public.project_comments
  add column if not exists author_image_url text not null default '';

alter table public.solution_requests
  add column if not exists author_image_url text not null default '';

alter table public.solution_request_comments
  add column if not exists author_image_url text not null default '';

update public.projects
set owner_name = participant_name
where owner_name = '';
