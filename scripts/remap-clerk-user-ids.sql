-- One-off Clerk dev-to-prod user ID remap for alternative 2.
-- Run this against the production Supabase database after importing users into
-- the production Clerk instance and building the dev_user_id -> prod_user_id map.
--
-- Keep this wrapped in a transaction. Inspect the returned counts before COMMIT.

begin;

create temp table clerk_user_id_map (
  dev_user_id text primary key,
  prod_user_id text not null unique,
  check (length(trim(dev_user_id)) > 0),
  check (length(trim(prod_user_id)) > 0),
  check (dev_user_id <> prod_user_id)
) on commit drop;

-- Replace these sample rows with the real mapping from Clerk import logs.
-- Keep the values quoted as SQL string literals.
insert into clerk_user_id_map (dev_user_id, prod_user_id) values
  ('user_dev_example', 'user_prod_example');

-- Prevent accidental execution with the placeholder row still present.
do $$
begin
  if exists (
    select 1
    from clerk_user_id_map
    where dev_user_id = 'user_dev_example'
       or prod_user_id = 'user_prod_example'
  ) then
    raise exception 'Replace the sample clerk_user_id_map row before running this migration.';
  end if;
end $$;

-- If both dev and prod users voted for the same item, keep the prod vote and
-- delete the dev duplicate before updating IDs to avoid primary key conflicts.
delete from public.project_votes dev_vote
using clerk_user_id_map map
where dev_vote.voter_id = map.dev_user_id
  and exists (
    select 1
    from public.project_votes prod_vote
    where prod_vote.project_id = dev_vote.project_id
      and prod_vote.voter_id = map.prod_user_id
  );

delete from public.project_comment_votes dev_vote
using clerk_user_id_map map
where dev_vote.voter_id = map.dev_user_id
  and exists (
    select 1
    from public.project_comment_votes prod_vote
    where prod_vote.comment_id = dev_vote.comment_id
      and prod_vote.voter_id = map.prod_user_id
  );

update public.projects p
set owner_user_id = map.prod_user_id
from clerk_user_id_map map
where p.owner_user_id = map.dev_user_id;

update public.project_votes pv
set voter_id = map.prod_user_id
from clerk_user_id_map map
where pv.voter_id = map.dev_user_id;

update public.project_comments c
set author_user_id = map.prod_user_id
from clerk_user_id_map map
where c.author_user_id = map.dev_user_id;

update public.project_comment_votes cv
set voter_id = map.prod_user_id
from clerk_user_id_map map
where cv.voter_id = map.dev_user_id;

-- Verification. All remaining_* counts should be 0 before committing.
select
  (select count(*) from clerk_user_id_map) as mapped_users,
  (
    select count(*)
    from public.projects p
    join clerk_user_id_map map on map.dev_user_id = p.owner_user_id
  ) as remaining_project_owners,
  (
    select count(*)
    from public.project_votes pv
    join clerk_user_id_map map on map.dev_user_id = pv.voter_id
  ) as remaining_project_votes,
  (
    select count(*)
    from public.project_comments c
    join clerk_user_id_map map on map.dev_user_id = c.author_user_id
  ) as remaining_comment_authors,
  (
    select count(*)
    from public.project_comment_votes cv
    join clerk_user_id_map map on map.dev_user_id = cv.voter_id
  ) as remaining_comment_votes;

-- Change to COMMIT after reviewing the verification output.
rollback;
